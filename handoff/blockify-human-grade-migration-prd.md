# Blockify: Human-Grade Website-to-Gutenberg Migration

**Product requirements document (PRD)**  
**Status:** Proposed for repository planning  
**Repository:** `irgendjemandkeinkorper/wp-gutenberg-migration-translation`  
**Priority:** Quality-first accelerated delivery  
**Primary outcome:** Reliably migrate heterogeneous websites into predetermined WordPress/Gutenberg template structures with auditable evidence and no silent content loss.

---

## 1. Executive decision

Blockify should become a **migration compiler and verification system**, not an AI-powered HTML copier.

The product must acquire and preserve the source, translate source elements into a typed semantic model, place that model into a versioned target-template profile, serialize valid Gutenberg blocks, import pages and media, and prove the imported WordPress result reconciles with the source. AI may classify ambiguous elements, but deterministic code owns assets, ordering, serialization, validation, and acceptance.

The fastest credible route is not “support every CMS.” It is:

1. Establish a source-agnostic canonical representation.
2. Establish authoritative, versioned target-template profiles.
3. Guarantee zero silent loss through blocks, media records, or visible placeholders.
4. Test against a deliberately varied migration corpus.
5. Verify the **imported WordPress state**, not merely the generated WXR string.

The current repository is a useful prototype. It already has extraction, asset tokenization, validation, Gutenberg serialization, WXR generation, crawling, placeholders, and initial QA metadata. Its most important current limitation is that template selection is metadata only and does not control placement or output structure.

---

## 2. Problem statement

Human migration teams do more than copy content. They interpret page structure, select a destination template, place content into the appropriate template regions, acquire and relink media, rebuild common structures such as galleries, flag unsupported experiences, and visually and programmatically verify the result.

Existing automated migration approaches usually fail in one or more ways:

- They preserve source HTML and source-CMS implementation debt instead of creating native Gutenberg content.
- They silently omit or reorder content.
- They cannot reliably remap shared, transformed, lazy-loaded, query-string, or CDN media.
- They treat the destination template as a label instead of a placement contract.
- They produce an export without proving that WordPress imported it correctly.
- They require recrawling the live source to investigate defects.
- They make exceptions difficult to find, understand, and resolve.

Blockify must make routine migrations largely autonomous and make exceptions faster for a human to resolve than recreating the page manually.

---

## 3. Goals

### 3.1 MVP goals

- Reliably preserve and migrate page titles, headings, paragraphs, inline formatting, links, lists, quotes, tables, separators, images, captions, alt text, and basic galleries.
- Place migrated content into an existing, predetermined Gutenberg template or pattern structure using a versioned mapping profile.
- Sideload images once, establish their final WordPress URLs and attachment IDs, and rewrite all page references deterministically.
- Convert each supported element to a valid native Gutenberg block whenever a target-supported block exists.
- Retain approved custom HTML only for elements that genuinely require it, such as permitted iframes.
- Represent every unsupported or unsafe element with a visible inline migration placeholder and a machine-readable exception record.
- Save the original acquired HTML before conversion and include it in a portable migration workspace/export.
- Produce page-level and site-level QA reports without recrawling the source.
- Resume interrupted migrations without repeating successful crawl, media, conversion, or import work.
- Verify results inside a disposable or designated WordPress target.

### 3.2 Long-term goal

For migrations inside the supported source, target-template, and content envelope, reduce human touch time by at least 80% while meeting or exceeding the content fidelity of the current human process.

### 3.3 Non-goals for MVP

- Pixel-perfect recreation of arbitrary source designs.
- Automatic reimplementation of arbitrary JavaScript applications, reservations, commerce, authentication, forms, or proprietary widgets.
- Inferring undocumented private template or custom-block schemas.
- Preserving malicious, obsolete, or invalid source behavior.
- Publishing directly to production without review and explicit operator approval.
- Supporting every CMS through bespoke adapters before the canonical pipeline is proven.

---

## 4. Users and jobs to be done

### Migration operator

“Given a source site and a target WordPress template library, create import-ready pages, see exactly what succeeded or failed, resolve only exceptions, and resume work later.”

### QA specialist

“Prove that text, images, links, structure, and exceptions reconcile with the saved source, and inspect high-risk pages first.”

### WordPress architect

“Define which target templates, patterns, slots, blocks, and attributes are allowed, then update that contract without rewriting the crawler.”

### Product/operations manager

“Measure automation rate, human time, failure classes, throughput, cost, and release quality across migration cohorts.”

### Coding agent

“Pick up an isolated issue with explicit dependencies, file ownership, fixtures, acceptance tests, and produced artifacts.”

---

## 5. Product principles

1. **No silent loss.** Every meaningful source element becomes a supported block, an acquired asset, an explicitly ignored item with a reason, or a visible placeholder.
2. **Deterministic mechanics, bounded AI judgment.** AI can classify or normalize ambiguous content, but cannot invent, drop, reorder, fetch, or relink assets.
3. **Source evidence is immutable.** Reprocessing never mutates the acquired source snapshot.
4. **Template profiles are executable contracts.** Selecting a template must change placement and output deterministically.
5. **Imported state is the final truth.** Generated files are intermediate artifacts; QA passes only against the WordPress result.
6. **Idempotent and resumable by default.** Re-running the same inputs and versions yields the same logical result and does not duplicate pages or media.
7. **Exceptions are first-class work items.** Each carries source context, destination context, severity, reason, and resolution status.
8. **Core blocks first.** Custom HTML is an escape hatch, not a default conversion strategy.

---

## 6. Success metrics and release gates

Metrics are evaluated against a versioned golden corpus that includes multiple CMSs, page types, markup quality levels, media strategies, and template profiles.

| Metric | Pilot gate | Human-replacement gate |
|---|---:|---:|
| Meaningful text recall, normalized and order-aware | >= 99.5% | >= 99.8% |
| Source image accountability | 100% | 100% |
| Supported image successfully local in WordPress | >= 99% | >= 99.5% |
| Silent-loss defects | 0 | 0 |
| Placeholder manifest-to-block reconciliation | 100% | 100% |
| Gutenberg parser-valid pages | 100% | 100% |
| Template slot/constraint conformance | 100% | 100% |
| Unapproved source-host media references after import | 0 | 0 |
| Broken internal links after rewrite | < 0.5% | < 0.1% |
| Pages auto-passing all blocking QA checks | >= 85% | >= 95% in supported envelope |
| Median human QA/remediation time reduction | >= 60% | >= 80% |
| Migration jobs resumable after forced interruption | 100% | 100% |

“Meaningful” excludes documented boilerplate intentionally removed by policy. Every exclusion must still be present in the audit record.

---

## 7. Supported content policy

### 7.1 Native-block requirement

The converter must prefer this order:

1. Target-profile custom block or pattern explicitly approved for the semantic element.
2. WordPress core block.
3. Sanitized `core/html` block from an allowlisted embed policy.
4. Migration placeholder block.

Raw source HTML must never be used simply because classification was uncertain.

### 7.2 MVP element mapping

| Source semantic element | Default Gutenberg target | Notes |
|---|---|---|
| Paragraph/rich text | `core/paragraph` | Preserve safe inline marks and links |
| H1-H6 | `core/heading` | Page-title/H1 policy is profile-controlled; do not blindly clamp |
| Ordered/unordered list | `core/list` + list items | Preserve nesting and start values where supported |
| Blockquote | `core/quote` | Preserve citation when identifiable |
| Pre/code | `core/code` or `core/preformatted` | Policy-controlled escaping |
| Table | `core/table` | Preserve header/body, captions, simple spans where possible |
| Standalone image | `core/image` | Attachment ID, final URL, caption, alt, link behavior |
| Image group/gallery | `core/gallery` with inner `core/image` | Preserve order; profile controls columns/crop/link behavior |
| Separator | `core/separator` | Style comes from target profile |
| Buttons/CTAs | `core/buttons` + `core/button` | Only when confidently classified |
| Columns/feature rows | Target profile pattern/group/columns | Use structural inference with confidence and constraints |
| Google Maps or approved iframe | sanitized `core/html` | Allowlist hosts/attributes; also record exception/audit entry |
| Video/audio/player | Native embed/media block if supported; otherwise placeholder | Never silently drop poster, caption, transcript, or source URL |
| Forms/widgets/apps | Approved integration block if configured; otherwise placeholder | Preserve original HTML excerpt and URLs in the manifest |

---

## 8. End-to-end user workflow

1. Create a migration workspace.
2. Define source domains, crawl rules, authentication method if applicable, and privacy policy.
3. Connect to or import the authoritative target WordPress capability/profile package.
4. Select default page-type-to-template mappings.
5. Crawl or ingest URLs and save immutable raw snapshots.
6. Classify page types and extract semantic content.
7. Review low-confidence page classification and mapping exceptions.
8. Acquire/deduplicate media and build the destination media registry.
9. Compile semantic content through the selected template profile into blocks.
10. Run pre-import validation.
11. Import to disposable/staging WordPress.
12. Reconcile the actual WordPress pages, blocks, attachments, URLs, and placeholders.
13. Review the risk-ranked QA queue and remediate exceptions.
14. Re-run only affected stages/pages.
15. Approve and export a complete evidence package or promote the verified content.

---

## 9. Functional requirements

### FR-1: Migration workspace and manifests

The app must store a versioned workspace outside browser `localStorage` for production-sized jobs.

Required logical entities:

- `workspace`
- `source_site`
- `page_snapshot`
- `asset`
- `semantic_document`
- `template_profile`
- `conversion_run`
- `delivery_record`
- `qa_finding`
- `exception`

Each artifact must include schema version, content hash, provenance, timestamps, producer version, and dependency hashes. A stage reruns only when its inputs or implementation version changed.

### FR-2: Source acquisition and raw HTML archive

For every attempted page, store:

- Requested URL and canonical/final URL.
- Redirect chain.
- Retrieval timestamp, HTTP status, content type, encoding, and selected response headers.
- Original response bytes where permitted.
- Decoded original HTML exactly as used by the pipeline.
- Content hash.
- Crawl parent/discovery source.
- Robots and operator-policy decision.
- Acquisition errors and retry history.

The exported workspace must permit conversion and QA without recrawling. Dynamic-page browser rendering can be added later, but its rendered DOM snapshot must be stored separately from the original response and clearly labeled.

### FR-3: Extraction and canonical semantic representation

Replace direct “cleaned HTML to blocks” coupling with a typed intermediate representation (IR).

Minimum node types:

- document, section, heading, paragraph, rich-text span
- list/list-item, quote, code, table
- image, gallery, figure/caption
- CTA/button group
- columns/group
- embed/media/form/widget
- unknown/unsupported

Every IR node must retain:

- Stable node ID.
- Source DOM locator or structural path.
- Original HTML excerpt reference.
- Ordered child relationship.
- Extracted text and attributes.
- Asset references by asset ID, never transient URL alone.
- Classification confidence and method (`rule`, `adapter`, `model`, `operator`).
- Transformation/audit events.

### FR-4: Source adapters without pipeline forks

Adapters may improve discovery or extraction for WordPress Classic/Gutenberg, Drupal, Joomla, Squarespace, Wix, Sitecore, Adobe Experience Manager, and common static sites. They must emit the same IR and never own Gutenberg serialization.

Adapter interface:

- detect source/CMS signals
- suggest content root and boilerplate selectors
- expand lazy-loaded or CMS-specific media attributes
- identify structured content/page type
- provide confidence and evidence

Generic standards-based extraction remains the fallback.

### FR-5: Authoritative target capability discovery

A target-profile generator must inspect an authoritative theme/package or designated WordPress installation and record:

- WordPress and Gutenberg versions.
- Active theme and version.
- Registered core/custom block names and schemas.
- Allowed block types and supported attributes.
- Registered patterns and their serialized block trees.
- Available templates, template parts, and custom templates.
- `theme.json` settings/styles relevant to content generation.
- Required plugins and versions.

Private schemas must not be guessed from screenshots or template marketing names.

### FR-6: Versioned template profiles

A template profile is an executable placement contract, not presentation metadata.

Each profile defines:

- Stable profile ID and semantic version.
- Target capability fingerprint.
- Supported page types.
- Template/pattern seed block tree.
- Named content slots such as `hero.title`, `hero.media`, `main.sections`, `sidebar`, `cta`, `gallery`.
- Allowed node/block types per slot.
- Cardinality, required/optional status, ordering, nesting, and fallback behavior.
- Default block attributes and style tokens.
- Rules for locked blocks and operator-editable regions.
- Unsupported conditions and validation rules.

Selecting a different profile must produce a predictably different block tree while preserving the same semantic document.

### FR-7: Page classification and placement planning

The system must classify page type (home, landing, course, tee-times, events, dining, contact, general content, etc.), choose the configured profile, and produce a placement plan before serialization.

The plan must show:

- Semantic nodes assigned to each slot.
- Nodes not placed and why.
- Confidence and rule/model evidence.
- Required fallbacks/placeholders.
- Constraint violations.

Low-confidence or invalid plans enter the QA queue; they do not silently fall back to one large content slot.

### FR-8: Gutenberg compiler

The compiler must translate a valid placement plan into deterministic Gutenberg block markup.

Requirements:

- Use registered block schemas where possible.
- Preserve nested block structure.
- Escape and sanitize attributes and inner HTML correctly.
- Keep serializer output stable for identical inputs/profile/compiler version.
- Parse the output using WordPress-compatible block parsing and reject invalid blocks.
- Track `source_node_id -> block_path` for reconciliation.
- Isolate custom block serializers behind profile/capability adapters.

### FR-9: Media registry, sideloading, and URL reconciliation

Create a bundle-wide media registry keyed primarily by acquired content hash, with normalized source URL as secondary identity.

For each media item, record:

- All observed source URLs and page/node references.
- Acquisition URL, redirects, status, MIME, byte size, dimensions, hash, and filename.
- Alt text, caption, title, credit, link target, and their provenance.
- WordPress attachment ID, final URL, generated sizes, and import status.
- Failure class, attempts, and placeholder reference if unresolved.

Required behaviors:

- Support `src`, `srcset`, lazy-load attributes, `<picture>`, query strings, common CDN transformations, and relative/protocol-relative URLs.
- Download once and import once even when used on many pages.
- Rewrite blocks using actual destination attachment IDs/URLs after import.
- Verify no unapproved source-host references remain.
- Never guess a final WordPress URL from upload conventions when the target can report the canonical value.

### FR-10: Galleries and slideshows

The IR must preserve an ordered media collection even when the source slideshow implementation cannot be reproduced.

Policy:

- If the target profile supports a gallery/slideshow block, map the ordered assets and approved settings to it.
- Otherwise generate a `core/gallery` where semantically acceptable.
- If behavior or captions cannot be represented without loss, create a visible placeholder adjacent to an optional static gallery and mark it “manual interactive rebuild required.”
- A gallery QA record reconciles item count, order, captions, links, and local attachment IDs.

### FR-11: Embeds and safe HTML

Use an allowlist of providers, iframe hosts, tags, and attributes. Google Maps and comparable known embeds may be retained in sanitized `core/html` if policy permits. Scripts, inline event handlers, unknown iframes, and unsafe URLs must not pass through.

Every retained HTML block must include an audit record with provider, source node, sanitization changes, and review policy. Unsupported content becomes a placeholder.

### FR-12: Migration placeholders and exception lifecycle

Placeholders must be visible in the editor and front-end preview, easy to search, and backed by a manifest.

Each exception includes:

- Stable exception ID.
- Page, source node, original source URL, and HTML excerpt reference.
- Type (`video`, `audio`, `form`, `widget`, `unsafe-html`, `unmapped`, `media-failure`, etc.).
- Severity and blocking status.
- Human-readable remediation instruction.
- Suggested destination block/integration when known.
- Resolution state, owner, notes, and resolved artifact reference.

Placeholder blocks embed only the safe minimal ID/context; full source HTML stays in the workspace.

### FR-13: Link and URL rewriting

Build a site-wide URL map before final delivery.

- Rewrite internal page links to final destination permalinks.
- Preserve fragments when the destination anchor exists; flag otherwise.
- Classify mailto, tel, downloads, external links, redirects, and malformed URLs.
- Preserve intentional external links.
- Report broken or unresolved internal links after import.
- Make redirect export available as CSV/JSON for deployment teams.

### FR-14: Delivery modes

Support two delivery mechanisms behind one delivery interface:

1. **WXR package** for portable bulk import and backup.
2. **Authenticated WordPress adapter** using REST/WP-CLI for staged import, attachment reconciliation, updates, and QA.

WXR remains a deliverable, but the authenticated adapter is preferred for verified migrations because it can obtain actual attachment IDs/URLs and query imported content. Imports default to draft status and are idempotent using stable migration IDs in protected metadata.

### FR-15: Pre-import QA

Blocking checks:

- Every meaningful source node has an allowed disposition.
- Token/asset/placeholder counts reconcile.
- All generated blocks parse without invalid-block recovery.
- Template constraints pass.
- Required slots are populated or explicitly excepted.
- URLs are syntactically safe and internal mappings are known.
- Media acquisition policy is satisfied.

### FR-16: Post-import QA

The verifier must query WordPress after import and produce page/site JSON plus a human-readable report.

Checks include:

- Page exists with expected type, status, slug, template, parent, and migration ID.
- Gutenberg blocks parse cleanly in WordPress.
- Text sequence/counts reconcile with IR using normalization rules.
- Image/gallery references resolve to local attachments and counts/order reconcile.
- Alt text/captions reconcile according to policy.
- Placeholders and exception manifest counts match exactly.
- Internal links resolve; source-host media references are absent unless allowlisted.
- Target-profile block/slot constraints still hold after WordPress filters/import.
- Optional rendered checks: HTTP status, screenshot/visual diff, responsive smoke test, accessibility scan.

### FR-17: QA workbench

The UI must prioritize operator attention by risk rather than URL order.

Filters:

- blocking failure/warning/pass
- page type/template profile
- confidence threshold
- unsupported content type
- media or link failure
- changed since last run
- needs human review/resolved

Each page view shows saved source evidence, IR/placement plan, destination preview or screenshot, findings, and rerun controls.

### FR-18: Batch operations and recovery

- Configurable concurrency, rate limits, retries, and backoff.
- Per-stage/page status and progress.
- Pause, resume, cancel safely.
- Retry failed/warned pages or a selected stage without rerunning successful work.
- Crash-safe writes and workspace integrity checks.
- Export diagnostic bundle without secrets.

### FR-19: Security, privacy, and content safety

- No production API keys in browser storage or source control.
- Server-side provider credentials and rate limits for hosted operation.
- SSRF protections for crawler and media fetcher: protocol allowlist, DNS/IP validation, redirect revalidation, size/time limits, and blocked private/link-local ranges unless explicitly configured for an internal deployment.
- Sanitize all imported HTML and URLs.
- Treat source content and model output as untrusted data.
- Redact secrets and private HTML from logs; workspace access is authenticated and auditable.
- Configurable retention/deletion and export policies.
- Respect robots and legal/operator policy, with explicit overrides recorded.

### FR-20: Observability and product analytics

Track without storing raw customer content in telemetry:

- pages/assets by stage and status
- duration, retries, and cost by stage/provider
- auto-pass rate and failure taxonomy
- placeholder rate by content/source type
- human review/remediation minutes
- rework and escaped-defect rate
- profile/adapter/compiler versions

---

## 10. Proposed architecture

```text
Acquisition -> Immutable source archive -> Extraction/adapters -> Semantic IR
                                                           |
Target WP capability snapshot -> Versioned template profile -> Placement plan
                                                           |
Media acquisition/dedupe -> Media registry -----------------+
                                                           |
                    Gutenberg compiler -> Preflight -> Delivery
                                                           |
                         Target WordPress -> Reconciliation -> QA workbench
```

### 10.1 Component boundaries

1. **Acquisition service/CLI** — crawl, fetch, snapshot, hash, provenance.
2. **Extraction engine** — generic DOM rules plus source adapters.
3. **Semantic IR package** — versioned types, validators, migrations.
4. **Target introspector** — capabilities, patterns, templates, block schemas.
5. **Profile compiler** — validates human-authored profile packages.
6. **Placement planner** — semantic nodes to named slots.
7. **Media service** — acquire, dedupe, inspect, sideload, reconcile.
8. **Gutenberg compiler** — IR/profile plan to serialized block tree.
9. **Delivery adapters** — WXR and authenticated WordPress/WP-CLI.
10. **QA engine** — preflight, post-import reconciliation, rendered checks.
11. **Workspace store** — filesystem/SQLite initially; service DB/object storage later.
12. **Operator UI** — configuration, progress, exceptions, reports, approval.

### 10.2 Recommended near-term technical direction

- Keep TypeScript and the existing React UI.
- Move batch execution and durable workspaces to a local Node CLI/service first; a hosted worker system can follow.
- Use a filesystem workspace with SQLite indexes and content-addressed blob storage for the fastest reliable pilot implementation.
- Add official WordPress parser/serializer compatibility checks in JavaScript and final PHP/WordPress validation in the integration harness.
- Use `wp-env`, Docker Compose, or another disposable WordPress fixture plus WP-CLI for end-to-end tests.
- Retain WXR output but add an authenticated target adapter for reconciliation and incremental updates.

---

## 11. Portable workspace/export format

Suggested structure:

```text
migration-workspace/
  manifest.json
  config/
    source-policy.json
    target-capabilities.json
    template-profiles/
  source/
    pages/<page-id>/response.bin
    pages/<page-id>/source.html
    pages/<page-id>/acquisition.json
  assets/
    blobs/<sha256>
    media-manifest.json
  semantic/
    pages/<page-id>.json
  plans/
    pages/<page-id>.json
  output/
    blocks/<page-id>.html
    migration.wxr
    redirects.csv
  delivery/
    pages.json
    attachments.json
  qa/
    findings.json
    reconciliation.json
    report.html
  logs/
    events.ndjson
```

The original HTML export requested by users is `source/pages/<page-id>/source.html`, accompanied by the acquisition record so it is evidentiary rather than an unlabeled copy.

---

## 12. Golden corpus and test strategy

### 12.1 Corpus dimensions

Maintain legally usable, immutable fixtures spanning:

- Source systems: WordPress Classic/Gutenberg, Drupal, Joomla, Squarespace/Wix-like exports, static HTML, and malformed legacy markup.
- Page types: home, landing, general content, contact, events, dining, galleries, course/product detail.
- Media: duplicate assets, CDN/query strings, lazy loading, `srcset`, picture, missing images, SVG/GIF/WebP, captions/credits, linked images.
- Structure: nested lists, tables, columns, accordions, CTA groups, repeated components.
- Unsupported content: maps, videos, audio, forms, booking widgets, unknown iframes.
- Failure cases: redirects, 404s, timeouts, oversized files, invalid MIME, unsafe HTML, encoding issues.

### 12.2 Test pyramid

- Unit tests for URL normalization, extraction rules, IR validators, placement rules, serializers, sanitization, and reconciliation.
- Golden snapshot tests for semantic IR and block trees.
- Property/fuzz tests for malformed HTML, nesting, encoding, and serializer/parser round trips.
- Contract tests for profile packages, custom blocks, LLM/provider adapters, WXR, REST, and WP-CLI.
- Integration tests against disposable WordPress with official importer and target theme/plugins.
- End-to-end corpus runs with machine-readable scorecards.
- Manual adversarial review before promotion of a new adapter/profile/compiler version.

No issue affecting conversion mechanics is complete with only a UI test or string snapshot.

---

## 13. Milestone plan aligned to the existing repository

Do not create a second competing roadmap. Keep the existing M1-M3 milestones, edit their descriptions where needed, and use the stabilization milestones as cross-cutting workstreams.

### Gate 0: Release baseline (parallel, 2-4 days)

Pull only critical work from existing stabilization milestones:

- Pull-request CI, lint/typecheck/test, branch protection.
- Pin runtime and lockfile policy.
- Security boundary/SSRF threat model.
- Minimal `App.tsx` decomposition necessary for parallel feature work.
- Golden fixture convention and CI artifact upload.

**Exit:** agents cannot merge code that fails deterministic checks; critical architecture files have owners.

### M1: Verified WordPress Import (existing; highest priority)

Complete existing issues #7, #10, #11, and #13, plus the raw source archive and core reconciliation requirements.

**Exit:** a fixture site is crawled from saved fixtures, converted, imported through the official path, and verified inside disposable WordPress with zero silent loss and local media.

### M2: Resumable Migration Workspace (existing)

Deliver versioned manifests, content-addressed source/media storage, incremental persistence, resumability, selective reruns, and portable export.

**Exit:** a forced interruption during a 100-page fixture run resumes without duplicate delivery or repeated successful work.

### M3: Template-Aware Delivery (existing)

Deliver target capability discovery, versioned template profiles, typed IR, placement plans, template-controlled compiler output, and profile conformance QA.

**Exit:** the same semantic page compiles correctly into at least two materially different authoritative target profiles; selection is no longer metadata-only.

### M4: Heterogeneous Source Reliability (new)

Deliver generic adapter contracts, priority CMS adapters, gallery/slideshow handling, link maps, corpus expansion, risk scoring, and exception workbench.

**Exit:** agreed corpus meets pilot thresholds across at least five source families and all priority page types.

### M5: Human-Replacement Pilot and Hardening (new)

Run real migrations in shadow mode against human-team results, measure time/fidelity, close dominant failure classes, add operational controls, and define the supported envelope.

**Exit:** at least three representative full-site pilots meet the human-replacement gates, with no severity-1 escaped fidelity defects.

---

## 14. Build-ready issue map

Issues below are epics or implementation-sized tickets. Each issue must state dependencies, exclusive primary file/package scope, fixtures, acceptance tests, and artifacts produced.

### Lane A — Quality and integration gate

| ID | Issue | Depends on | Parallel notes |
|---|---|---|---|
| A1 | Complete disposable WordPress import harness (existing #11) | Gate 0 CI | Foundation for A2-A5 |
| A2 | Verify Gutenberg parsing and invalid-block absence inside WordPress | A1 | Parallel with A3/A4 |
| A3 | Reconcile pages/text/placeholders after import | A1 | Extend existing #13 |
| A4 | Reconcile attachment IDs, URLs, counts, and source-host references | A1, B3 | Extend #10/#13 |
| A5 | Publish JSON/HTML migration scorecard as CI artifact | A2-A4 | Final M1 gate |

### Lane B — Source and media evidence

| ID | Issue | Depends on | Parallel notes |
|---|---|---|---|
| B1 | Define versioned acquisition/page snapshot schema | none | Can start immediately |
| B2 | Save raw response bytes, decoded HTML, metadata, and hashes during crawl | B1 | Own crawler/source archive |
| B3 | Build content-addressed bundle-wide media registry (existing #10) | B1 | Can run beside B2 |
| B4 | Support lazy/CDN/picture/srcset asset discovery and acquisition fixtures | B3 | Media-specific |
| B5 | Export portable raw HTML/source evidence package | B2 | Small, agent-ready |

### Lane C — Semantic IR and Gutenberg compiler

| ID | Issue | Depends on | Parallel notes |
|---|---|---|---|
| C1 | Define IR v1 schema, validator, and migration policy | B1 | Architecture owner only |
| C2 | Convert current extraction/tokenization output to IR | C1 | Preserve audit/source refs |
| C3 | Compile core text/list/quote/code/table nodes to blocks | C1 | Parallel with C4/C5 |
| C4 | Compile image/gallery nodes using media IDs | C1, B3 | Own media block serializers |
| C5 | Compile embed/unknown nodes to safe HTML or placeholders | C1 | Own sanitizer/placeholder policy |
| C6 | Add WordPress parser round-trip and deterministic snapshot tests | C3-C5 | M1/M3 blocking |

### Lane D — Target profiles and placement

| ID | Issue | Depends on | Parallel notes |
|---|---|---|---|
| D1 | Define target capability snapshot and template profile v1 schemas | C1 | Architecture owner only |
| D2 | Build WordPress target introspector for blocks/patterns/templates/theme.json | D1, A1 | Target plugin/CLI scope |
| D3 | Build profile validator and seed-pattern slot annotation format | D1 | Parallel with D2 |
| D4 | Build deterministic page classification and placement-plan engine | C1, D3 | No serializer ownership |
| D5 | Compile placement plans into seeded target block trees | C3-C5, D4 | Integration point |
| D6 | Add template conformance QA and two-profile golden fixtures | D2-D5 | M3 exit gate |

### Lane E — Workspace and resumability

| ID | Issue | Depends on | Parallel notes |
|---|---|---|---|
| E1 | Define workspace manifest and stage dependency graph | B1, C1, D1 | M2 architecture |
| E2 | Implement filesystem/SQLite workspace store and blob store | E1 | Isolated package |
| E3 | Add incremental checkpoints, pause/resume, and crash recovery | E2 | Worker/CLI scope |
| E4 | Add selective retry/invalidation by changed input/version | E2 | Parallel with E3 |
| E5 | Add portable workspace export/import and schema compatibility tests | E2-E4 | M2 gate |

### Lane F — URLs, exceptions, and QA UX

| ID | Issue | Depends on | Parallel notes |
|---|---|---|---|
| F1 | Build site-wide canonical URL and redirect map | B1 | Independent library |
| F2 | Rewrite/verify internal links and anchors after delivery | F1, A1 | Parallel with F3 |
| F3 | Define exception lifecycle and reconcile placeholders 1:1 | C5 | Manifest/UI split possible |
| F4 | Build risk score and QA queue filters | A3-A4, F2-F3 | UI after report schemas stabilize |
| F5 | Add page evidence view and targeted stage rerun controls | E4, F4 | UI integration |

### Lane G — Source coverage and product proof

| ID | Issue | Depends on | Parallel notes |
|---|---|---|---|
| G1 | Define adapter interface and CMS detection evidence | C1 | M4 foundation |
| G2 | Add WordPress source adapter and fixtures | G1 | Parallel adapter team |
| G3 | Add Drupal/Joomla adapter and fixtures | G1 | Parallel adapter team |
| G4 | Add hosted-builder/static legacy adapter fixtures | G1 | Parallel adapter team |
| G5 | Implement gallery/slideshow semantic collection detection | C1, B4 | Cross-CMS rules |
| G6 | Create corpus scorecard and supported-envelope report | A5, D6, G2-G5 | M4 gate |
| G7 | Prepare representative pilot cohorts and human-team baselines | G6 | Product/ops handoff to M5 |

### Lane H — Human-replacement pilot and operations

| ID | Issue | Depends on | Parallel notes |
|---|---|---|---|
| H1 | Define the supported production envelope and pilot go/no-go scorecard | G6-G7 | Product/architecture decision |
| H2 | Run three full-site shadow migrations and capture time, interventions, and defects | H1 | One child issue per pilot site |
| H3 | Build operator runbooks, recovery controls, and privacy/retention procedures | E5, F5, H1 | Parallel with H2 |
| H4 | Close the dominant pilot failure classes and rerun the corpus | H2 | Create child bugs from evidence |
| H5 | Produce release-candidate evidence and human-replacement readiness decision | H2-H4 | M5 exit gate |

### Critical path

`Gate 0 -> A1/B1/B3 -> A2-A4 -> A5 (M1)`  
`M1 -> E1-E5 (M2)`  
`B1 + A1 -> C1-C6 + D1-D6 (M3, partly parallel with M2 after schemas stabilize)`  
`M3 -> F1-F5 + G1-G7 (M4) -> H1-H5 (M5)`

---

## 15. Instructions for creating milestones and GitHub issues

### 15.1 Milestone setup

1. Preserve and prioritize existing `M1: Verified WordPress Import`, `M2: Resumable Migration Workspace`, and `M3: Template-Aware GolfNow Delivery`.
2. Add `M4: Heterogeneous Source Reliability` and `M5: Human-Replacement Pilot and Hardening` only after M1-M3 descriptions are updated.
3. Keep stabilization milestones, but do not let non-blocking design or repo cleanup delay M1. Label critical stabilization tickets `release-blocker` and link them to the milestone they unblock.
4. Add an exit-criteria checklist and scorecard artifact to every milestone description.
5. Assign each issue to exactly one outcome milestone. Use labels/projects for cross-cutting lanes.

### 15.2 Recommended labels

- Priority: `P0`, `P1`, `P2`
- Type: `epic`, `feature`, `bug`, `test`, `security`, `documentation`, `spike`
- Area: `acquisition`, `ir`, `media`, `profiles`, `compiler`, `delivery`, `qa`, `workspace`, `ui`, `adapter`
- Coordination: `agent-ready`, `blocked`, `needs-contract`, `exclusive-file-scope`, `human-decision`
- Risk: `fidelity-risk`, `data-loss-risk`, `security-risk`, `release-blocker`

### 15.3 Required issue template

```markdown
## Outcome
One user- or system-observable result.

## Context
Why this is needed; links to PRD requirements and existing issues.

## Scope
- Included behavior
- Explicitly excluded behavior

## Contract first
- Inputs and schemas
- Outputs/artifacts
- Versioning/backward compatibility

## Dependencies
- Blocks on: #...
- Enables: #...

## Primary ownership
- Files/packages this issue may change
- Files/packages it must not change without coordination

## Acceptance criteria
- [ ] Given/when/then behavior
- [ ] No-silent-loss/reconciliation invariant where applicable
- [ ] Failure and retry behavior
- [ ] Telemetry/audit behavior

## Tests and fixtures
- Unit/golden/contract/integration tests required
- Exact fixture IDs or new fixture to add

## Produced artifacts
- Schema/report/package/UI/CLI output

## Agent handoff
- Commands to verify
- Known decisions not to revisit
```

### 15.4 Parallel-agent rules

1. Land schemas/contracts before implementations that consume them.
2. Give each agent exclusive primary file/package ownership; avoid concurrent edits to `App.tsx`, shared types, or central pipeline orchestration.
3. Use one integration owner for contract merges and end-to-end gates.
4. Require every PR to add or update fixtures and tests proportional to fidelity risk.
5. Make agents return machine-readable artifacts and verification commands, not just code.
6. Do not merge parallel serializer/profile/media changes until the integration harness passes against imported WordPress.
7. Use draft PRs early for contract visibility; rebase/merge sequentially at integration points.
8. Any change that can drop, reorder, duplicate, or mislink content is `P0 fidelity-risk` until reconciliation proves otherwise.

### 15.5 Suggested first parallel wave

- Agent 1: Gate 0 pull-request CI and branch protection prerequisites.
- Agent 2: A1 disposable WordPress harness, building from existing issue #11.
- Agent 3: B1/B2 acquisition schema and raw HTML archive.
- Agent 4: B3 media registry, building from existing issue #10.

Second wave begins when B1 and A1 contracts are merged:

- IR schema/extraction.
- Post-import page/text/placeholder reconciliation.
- Media acquisition edge cases and reconciliation.
- Workspace manifest design.

Do not start target-template placement implementation until an authoritative target capability/profile schema and at least one real target export are available.

---

## 16. Product acceptance scenarios

### Scenario A: clean content page

Given a legacy page with headings, paragraphs, nested lists, links, and three images, the system saves raw HTML, produces native blocks in order, imports each unique image once, rewrites all references to local attachment URLs, and reports a pass with no placeholders.

### Scenario B: gallery/slideshow

Given a JavaScript slideshow with eight ordered images and captions, the system preserves all eight assets and order in IR. If the selected profile supports the target slideshow block, it compiles that block. Otherwise it creates an approved gallery plus a visible interactive-rebuild placeholder. Counts, order, captions, and destination attachment IDs reconcile.

### Scenario C: map and booking widget

Given an allowlisted Google Maps iframe and an unsupported booking widget, the map becomes sanitized HTML with an audit record. The booking widget becomes a visible placeholder linked to an exception record containing safe source context and remediation instructions. Nothing disappears.

### Scenario D: predetermined template

Given one semantic page and two different target profiles, the placement plan and block output differ according to named slots, defaults, and constraints, while text and asset accountability remain identical. Missing required hero media produces a blocking finding rather than a malformed page.

### Scenario E: interrupted migration

Given a 100-page job interrupted after 63 pages, restarting loads the same workspace, validates its integrity, and continues without recrawling successful pages, reacquiring successful assets, or duplicating WordPress records.

### Scenario F: no live source available

Given an exported workspace after the source site is offline, an operator can inspect original HTML, rerun extraction/conversion under a new compiler/profile version, and perform QA without accessing the original domain.

---

## 17. Risks and mitigations

| Risk | Mitigation |
|---|---|
| “Every CMS” creates endless bespoke logic | Canonical IR, small adapter contract, generic fallback, measured supported envelope |
| AI drops/reorders/hallucinates content | Asset/node tokens, deterministic mechanics, reconciliation, low-temperature bounded classification, retry/fallback |
| Template profiles drift from target | Capability fingerprint, semantic versions, contract tests against target installation |
| WXR does not reveal final media truth | Authenticated/WP-CLI adapter and post-import query/reconciliation |
| Browser-only architecture fails at scale | Node worker/CLI plus durable workspace; UI becomes controller/reviewer |
| Source HTML introduces security problems | Treat as untrusted, sanitize, isolate storage, SSRF controls, allowlists |
| Visual similarity conflicts with target templates | Content/structure fidelity is blocking; visual QA checks target conformity, not arbitrary source cloning |
| Parallel agents create integration churn | Contract-first issues, exclusive ownership, integration owner, mandatory end-to-end gate |

---

## 18. Open decisions requiring product/architecture confirmation

These do not block M1 foundation work but must be resolved before M3/M5 completion:

1. What authoritative GolfNow theme/plugin packages or staging installations can be inspected to build real target profiles?
2. Is delivery limited to WXR/manual import, or can the product authenticate to staging WordPress via Application Password/OAuth/WP-CLI?
3. Which page types and target templates constitute the first supported commercial envelope?
4. Which source sites may contain private/authenticated content, and what retention rules apply to raw HTML archives?
5. Is translation actually in product scope, or should the repository/product be renamed as existing issue #52 suggests?
6. Which human-team baseline metrics exist today: pages/day, QA minutes/page, defect rate, and common exception types?
7. Who has final authority to approve template profiles, unsafe/embed policies, and publication readiness?

---

## 19. Definition of “viable replacement for a human migration team”

The product is viable only when all of the following are true within a clearly documented supported envelope:

- It accounts for 100% of meaningful source content.
- It produces native, editable Gutenberg structures that conform to approved templates.
- It imports and locally reconciles media, links, and pages reliably.
- It exposes every unsupported item as actionable work rather than hiding it.
- It can prove fidelity using preserved source evidence and imported WordPress state.
- It survives interruption and supports efficient selective remediation.
- It reduces median human effort by at least 80% across representative full-site pilots.
- Operations can explain every failure, retry it safely, and measure whether a release improved or regressed quality.

Until those conditions are met, Blockify should be positioned as a migration acceleration and QA system—not a full human-team replacement.

---

## 20. WordPress implementation references

- WordPress stores serialized block structures in `post_content`, and its parser reconstructs the block tree from block delimiters: <https://developer.wordpress.org/block-editor/reference-guides/filters/parser-filters/>
- The official default block parser package provides WordPress-compatible JavaScript parsing behavior: <https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-serialization-default-parser/>
- `serialize_block()` is the server-side reference for preparing parsed blocks for saved content: <https://developer.wordpress.org/reference/functions/serialize_block/>
- WordPress REST exposes media creation and canonical attachment fields, including alt text and captions: <https://developer.wordpress.org/rest-api/reference/media/>
- WP-CLI supports WXR import through the official importer path: <https://developer.wordpress.org/cli/commands/import/>
- Block themes formally separate templates, template parts, patterns, and `theme.json`, which should inform target capability discovery: <https://developer.wordpress.org/themes/core-concepts/theme-structure/>
