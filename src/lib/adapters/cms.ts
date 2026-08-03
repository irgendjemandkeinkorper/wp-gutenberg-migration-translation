import type { AdapterExtraction, DetectionSignal, SourceAdapter } from "./interface";

interface CmsDefinition {
  id: "drupal" | "joomla";
  patterns: RegExp[];
  rootSelectors: string[];
}

const DEFINITIONS: CmsDefinition[] = [
  { id: "drupal", patterns: [/name=["']generator["'][^>]+Drupal/i, /data-drupal-selector|drupalSettings|sites\/default/i], rootSelectors: ["main", ".region-content", "article", ".node__content"] },
  { id: "joomla", patterns: [/name=["']generator["'][^>]+Joomla/i, /com_content|option=com_|media\/system/i], rootSelectors: ["main", ".item-page", ".article-body", "article"] },
];

export function createDrupalSourceAdapter(): SourceAdapter {
  return createCmsAdapter(DEFINITIONS[0]);
}

export function createJoomlaSourceAdapter(): SourceAdapter {
  return createCmsAdapter(DEFINITIONS[1]);
}

function createCmsAdapter(definition: CmsDefinition): SourceAdapter {
  return {
    id: definition.id,
    version: "1.0.0",
    detect(input): DetectionSignal {
      const evidence = definition.patterns.flatMap((pattern) => pattern.test(input.html) ? [pattern.source] : []);
      return {
        adapterId: definition.id,
        cms: definition.id,
        confidence: evidence.length >= 2 ? 0.95 : evidence.length && evidence[0].includes("generator") ? 0.92 : evidence.length ? 0.75 : 0,
        evidence,
        diagnostics: [],
      };
    },
    extract(input, detection): AdapterExtraction {
      const document = new DOMParser().parseFromString(input.html, "text/html");
      const contentRoot = definition.rootSelectors.find((selector) => document.querySelector(selector)) ?? "body";
      return {
        contentRoot,
        boilerplateSelectors: ["nav", "footer", ".breadcrumb", ".menu", ".region-sidebar-first", ".region-sidebar-second"],
        mediaExpansions: [
          { selector: "img[data-src], img[data-lazy-src], img[srcset]", attributes: ["data-src", "data-lazy-src", "srcset"] },
        ],
        structuredPageHints: { cms: definition.id, contentRoot },
        evidence: [...detection.evidence, `content-root:${contentRoot}`],
        diagnostics: [],
      };
    },
  };
}
