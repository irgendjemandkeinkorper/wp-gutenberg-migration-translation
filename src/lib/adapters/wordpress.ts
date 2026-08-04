import type { AdapterExtraction, DetectionSignal, SourceAdapter } from "./interface";

export function createWordPressSourceAdapter(): SourceAdapter {
  return {
    id: "wordpress",
    version: "1.0.0",
    detect(input): DetectionSignal {
      const signals: string[] = [];
      if (/<meta[^>]+name=["']generator["'][^>]+content=["'][^"']*wordpress/i.test(input.html))
        signals.push("generator-meta");
      if (/wp-content|wp-includes|wp-json|wp-block-/i.test(input.html)) signals.push("wordpress-markup");
      const confidence =
        signals.length >= 2 ? 0.98 : signals.includes("generator-meta") ? 0.94 : signals.length === 1 ? 0.8 : 0;
      return { adapterId: "wordpress", cms: "wordpress", confidence, evidence: signals, diagnostics: [] };
    },
    extract(input, detection): AdapterExtraction {
      const document = new DOMParser().parseFromString(input.html, "text/html");
      const contentRoot =
        ["article", "main", ".entry-content", ".wp-block-post-content"].find((selector) =>
          document.querySelector(selector),
        ) ?? "body";
      const hasSerializedBlocks =
        /<!--\s*wp:/i.test(input.html) || document.querySelector('[class*="wp-block-"]') !== null;
      return {
        contentRoot,
        boilerplateSelectors: ["nav", "footer", ".wp-block-template-part", ".site-header", ".site-footer"],
        mediaExpansions: [
          {
            selector: "img[data-src], img[data-lazy-src], img[data-original]",
            attributes: ["data-src", "data-lazy-src", "data-original"],
          },
          { selector: "picture source[srcset], img[srcset]", attributes: ["srcset"] },
        ],
        structuredPageHints: { cms: "wordpress", serializedBlocks: String(hasSerializedBlocks), contentRoot },
        evidence: [...detection.evidence, `content-root:${contentRoot}`],
        diagnostics: [],
      };
    },
  };
}
