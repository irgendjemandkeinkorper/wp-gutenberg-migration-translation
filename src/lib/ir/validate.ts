import { IR_NODE_KINDS, type JsonObject, type JsonValue, type SemanticDocument } from "./types";

const LOCATOR_KINDS = ["css", "xpath", "structural-path"] as const;
const CONTENT_KINDS = ["decoded-html", "raw-bytes"] as const;
const METHODS = ["rule", "adapter", "model", "operator"] as const;
const EVENT_TYPES = [
  "extracted",
  "classified",
  "normalized",
  "preserved",
  "migrated",
  "operator-override",
  "warning",
] as const;

export interface IrValidationIssue {
  path: string;
  code:
    | "type"
    | "required"
    | "version"
    | "range"
    | "enum"
    | "ordering"
    | "duplicate-id"
    | "asset-url"
    | "unknown-content"
    | "cycle";
  message: string;
}

export interface IrValidationResult {
  valid: boolean;
  errors: IrValidationIssue[];
}

export function validateSemanticDocument(input: unknown): IrValidationResult {
  const errors: IrValidationIssue[] = [];
  if (!isRecord(input)) {
    return { valid: false, errors: [issue("$", "type", "IR document must be an object.")] };
  }

  if (typeof input.schemaVersion !== "string") {
    errors.push(issue("$.schemaVersion", "required", "schemaVersion is required."));
  } else if (!isSupportedVersion(input.schemaVersion)) {
    errors.push(
      issue(
        "$.schemaVersion",
        "version",
        `Unsupported IR schema ${input.schemaVersion}; supported major version is 1.x.y.`,
      ),
    );
  }
  requireString(input, "documentId", "$.documentId", errors);
  requireStringOrNull(input, "title", "$.title", errors);
  validateSource(input.source, "$.source", errors);
  validateCompatibility(input.compatibility, "$.compatibility", errors);
  validateJsonObject(input.extensions, "$.extensions", errors);

  if (!isRecord(input.root)) {
    errors.push(issue("$.root", "required", "root must be a document node."));
  } else {
    const ids = new Set<string>();
    validateNode(input.root, "$.root", ids, errors, new Set<object>());
    if (input.root.kind !== "document") {
      errors.push(issue("$.root.kind", "enum", "The root node must have kind document."));
    }
  }

  return { valid: errors.length === 0, errors };
}

export function isSemanticDocument(input: unknown): input is SemanticDocument {
  return validateSemanticDocument(input).valid;
}

export function assertValidSemanticDocument(input: unknown): asserts input is SemanticDocument {
  const result = validateSemanticDocument(input);
  if (!result.valid) {
    throw new Error(
      `Invalid semantic IR:\n${result.errors
        .map((error) => `${error.path} [${error.code}] ${error.message}`)
        .join("\n")}`,
    );
  }
}

export function serializeSemanticDocument(document: SemanticDocument): string {
  assertValidSemanticDocument(document);
  return JSON.stringify(document, null, 2);
}

export function parseSemanticDocument(serialized: string): SemanticDocument {
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized) as unknown;
  } catch (error) {
    throw new Error(`Invalid semantic IR JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  assertValidSemanticDocument(parsed);
  return parsed;
}

export function isSupportedVersion(value: string): value is `${number}.${number}.${number}` {
  return /^1\.\d+\.\d+$/.test(value);
}

function validateNode(
  input: Record<string, unknown>,
  path: string,
  ids: Set<string>,
  errors: IrValidationIssue[],
  ancestors: Set<object>,
): void {
  if (ancestors.has(input)) {
    errors.push(issue(path, "cycle", "IR nodes must not contain cyclic child references."));
    return;
  }
  ancestors.add(input);

  requireString(input, "id", `${path}.id`, errors);
  if (typeof input.id === "string") {
    if (ids.has(input.id)) {
      errors.push(issue(`${path}.id`, "duplicate-id", `Duplicate node ID ${input.id}.`));
    }
    ids.add(input.id);
  }
  if (!isNodeKind(input.kind)) {
    errors.push(issue(`${path}.kind`, "enum", `Unknown node kind ${String(input.kind)}.`));
  }
  validateSource(input.source, `${path}.source`, errors);
  requireStringOrNull(input, "text", `${path}.text`, errors);
  validateStringMap(input.attributes, `${path}.attributes`, errors);
  validateAssets(input.assetRefs, `${path}.assetRefs`, errors);
  validateClassification(input.classification, `${path}.classification`, errors);
  validateEvents(input.auditEvents, `${path}.auditEvents`, errors);
  validateJsonObject(input.extensions, `${path}.extensions`, errors);

  if (!Array.isArray(input.children)) {
    errors.push(issue(`${path}.children`, "ordering", "children must be an ordered array."));
  } else {
    input.children.forEach((child, index) => {
      if (!isRecord(child)) {
        errors.push(issue(`${path}.children[${index}]`, "type", "Child must be an object."));
      } else {
        validateNode(child, `${path}.children[${index}]`, ids, errors, ancestors);
      }
    });
  }

  if (input.kind === "unknown") validateUnknownContent(input.unknown, `${path}.unknown`, errors);
  ancestors.delete(input);
}

function validateSource(input: unknown, path: string, errors: IrValidationIssue[]): void {
  if (!isRecord(input)) {
    errors.push(issue(path, "required", "source evidence is required."));
    return;
  }
  requireString(input, "snapshotId", `${path}.snapshotId`, errors);
  if (!isRecord(input.locator)) {
    errors.push(issue(`${path}.locator`, "required", "source locator is required."));
  } else {
    if (!includes(LOCATOR_KINDS, input.locator.kind)) {
      errors.push(issue(`${path}.locator.kind`, "enum", "Invalid source locator kind."));
    }
    requireString(input.locator, "value", `${path}.locator.value`, errors);
  }
  if (!isRecord(input.htmlExcerpt)) {
    errors.push(issue(`${path}.htmlExcerpt`, "required", "HTML excerpt reference is required."));
    return;
  }
  if (!includes(CONTENT_KINDS, input.htmlExcerpt.contentKind)) {
    errors.push(issue(`${path}.htmlExcerpt.contentKind`, "enum", "Invalid source content kind."));
  }
  requireString(input.htmlExcerpt, "contentSha256", `${path}.htmlExcerpt.contentSha256`, errors);
  requireString(input.htmlExcerpt, "storageKey", `${path}.htmlExcerpt.storageKey`, errors);
  requireInteger(input.htmlExcerpt, "startOffset", `${path}.htmlExcerpt.startOffset`, errors);
  requireInteger(input.htmlExcerpt, "endOffset", `${path}.htmlExcerpt.endOffset`, errors);
  if (
    typeof input.htmlExcerpt.startOffset === "number" &&
    typeof input.htmlExcerpt.endOffset === "number" &&
    (input.htmlExcerpt.startOffset < 0 || input.htmlExcerpt.endOffset < input.htmlExcerpt.startOffset)
  ) {
    errors.push(issue(`${path}.htmlExcerpt`, "range", "Excerpt offsets must be ordered and non-negative."));
  }
  if (input.htmlExcerpt.excerpt !== undefined && typeof input.htmlExcerpt.excerpt !== "string") {
    errors.push(issue(`${path}.htmlExcerpt.excerpt`, "type", "Inline excerpt must be a string."));
  }
  if (typeof input.snapshotId === "string" && input.htmlExcerpt.snapshotId !== undefined) {
    errors.push(
      issue(`${path}.htmlExcerpt.snapshotId`, "type", "Use source.snapshotId, not a second excerpt snapshot ID."),
    );
  }
}

function validateCompatibility(input: unknown, path: string, errors: IrValidationIssue[]): void {
  if (!isRecord(input)) {
    errors.push(issue(path, "required", "compatibility policy is required."));
    return;
  }
  if (input.reader !== "forward-compatible")
    errors.push(issue(`${path}.reader`, "enum", "reader must be forward-compatible."));
  if (typeof input.minimumReaderVersion !== "string" || !isSupportedVersion(input.minimumReaderVersion)) {
    errors.push(
      issue(`${path}.minimumReaderVersion`, "version", "minimumReaderVersion must be a supported 1.x.y version."),
    );
  }
  if (input.unknownFields !== "preserve")
    errors.push(issue(`${path}.unknownFields`, "enum", "unknownFields must be preserve."));
}

function validateAssets(input: unknown, path: string, errors: IrValidationIssue[]): void {
  if (!Array.isArray(input)) {
    errors.push(issue(path, "required", "assetRefs must be an array."));
    return;
  }
  input.forEach((asset, index) => {
    const assetPath = `${path}[${index}]`;
    if (!isRecord(asset)) {
      errors.push(issue(assetPath, "type", "Asset reference must be an object."));
      return;
    }
    requireString(asset, "assetId", `${assetPath}.assetId`, errors);
    requireString(asset, "role", `${assetPath}.role`, errors);
    requireInteger(asset, "ordinal", `${assetPath}.ordinal`, errors);
    validateJsonObject(asset.extensions, `${assetPath}.extensions`, errors);
    if ("url" in asset || "src" in asset) {
      errors.push(issue(assetPath, "asset-url", "Asset references must use asset IDs, not transient URLs."));
    }
  });
}

function validateClassification(input: unknown, path: string, errors: IrValidationIssue[]): void {
  if (!isRecord(input)) {
    errors.push(issue(path, "required", "classification is required."));
    return;
  }
  if (typeof input.confidence !== "number" || !Number.isFinite(input.confidence)) {
    errors.push(issue(`${path}.confidence`, "type", "confidence must be a finite number."));
  } else if (input.confidence < 0 || input.confidence > 1) {
    errors.push(issue(`${path}.confidence`, "range", "confidence must be between 0 and 1."));
  }
  if (!includes(METHODS, input.method)) errors.push(issue(`${path}.method`, "enum", "Invalid classification method."));
  if (input.rationale !== undefined && typeof input.rationale !== "string") {
    errors.push(issue(`${path}.rationale`, "type", "classification rationale must be a string."));
  }
}

function validateEvents(input: unknown, path: string, errors: IrValidationIssue[]): void {
  if (!Array.isArray(input)) {
    errors.push(issue(path, "required", "auditEvents must be an array."));
    return;
  }
  input.forEach((event, index) => {
    const eventPath = `${path}[${index}]`;
    if (!isRecord(event)) {
      errors.push(issue(eventPath, "type", "Audit event must be an object."));
      return;
    }
    if (!includes(EVENT_TYPES, event.type))
      errors.push(issue(`${eventPath}.type`, "enum", "Invalid audit event type."));
    requireString(event, "code", `${eventPath}.code`, errors);
    requireString(event, "message", `${eventPath}.message`, errors);
    requireString(event, "at", `${eventPath}.at`, errors);
    if (event.data !== undefined) validateJsonObject(event.data, `${eventPath}.data`, errors);
  });
}

function validateUnknownContent(input: unknown, path: string, errors: IrValidationIssue[]): void {
  if (!isRecord(input)) {
    errors.push(issue(path, "unknown-content", "Unknown nodes must preserve their content payload."));
    return;
  }
  if (input.originalKind !== null && typeof input.originalKind !== "string") {
    errors.push(issue(`${path}.originalKind`, "type", "originalKind must be a string or null."));
  }
  if (typeof input.rawHtml !== "string" || input.rawHtml.length === 0) {
    errors.push(issue(`${path}.rawHtml`, "unknown-content", "Unknown nodes require non-empty rawHtml."));
  }
  requireString(input, "reason", `${path}.reason`, errors);
  validateStringMap(input.rawAttributes, `${path}.rawAttributes`, errors);
}

function validateStringMap(input: unknown, path: string, errors: IrValidationIssue[]): void {
  if (!isRecord(input)) {
    errors.push(issue(path, "required", "Expected a string map."));
    return;
  }
  for (const [key, value] of Object.entries(input)) {
    if (typeof value !== "string") errors.push(issue(`${path}.${key}`, "type", "String map values must be strings."));
  }
}

function validateJsonObject(input: unknown, path: string, errors: IrValidationIssue[]): void {
  if (!isRecord(input) || !isJsonObject(input)) errors.push(issue(path, "type", "Expected a JSON object."));
}

function isJsonObject(input: Record<string, unknown>): input is JsonObject {
  return Object.values(input).every((value) => isJsonValue(value));
}

function isJsonValue(input: unknown, seen = new Set<object>()): input is JsonValue {
  if (input === null || typeof input === "string" || typeof input === "boolean") return true;
  if (typeof input === "number") return Number.isFinite(input);
  if (!isRecord(input) && !Array.isArray(input)) return false;
  if (seen.has(input)) return false;
  seen.add(input);
  const valid = Array.isArray(input)
    ? input.every((value) => isJsonValue(value, seen))
    : Object.values(input).every((value) => isJsonValue(value, seen));
  seen.delete(input);
  return valid;
}

function requireString(input: Record<string, unknown>, key: string, path: string, errors: IrValidationIssue[]): void {
  if (typeof input[key] !== "string" || input[key].length === 0)
    errors.push(issue(path, "required", `${key} must be a non-empty string.`));
}

function requireStringOrNull(
  input: Record<string, unknown>,
  key: string,
  path: string,
  errors: IrValidationIssue[],
): void {
  if (input[key] !== null && typeof input[key] !== "string")
    errors.push(issue(path, "type", `${key} must be a string or null.`));
}

function requireInteger(input: Record<string, unknown>, key: string, path: string, errors: IrValidationIssue[]): void {
  if (typeof input[key] !== "number" || !Number.isInteger(input[key]))
    errors.push(issue(path, "type", `${key} must be an integer.`));
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function isNodeKind(input: unknown): input is (typeof IR_NODE_KINDS)[number] {
  return includes(IR_NODE_KINDS, input);
}

function includes<const T extends readonly string[]>(values: T, value: unknown): value is T[number] {
  return typeof value === "string" && values.includes(value);
}

function issue(path: string, code: IrValidationIssue["code"], message: string): IrValidationIssue {
  return { path, code, message };
}
