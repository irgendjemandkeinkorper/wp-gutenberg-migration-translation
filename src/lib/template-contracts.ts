import type { TemplateContract } from "./template-contract";

// Structural contracts for the GolfNow template library
// (https://golfnowbusiness.com/template-library/).
//
// SCAFFOLDING NOTE: the baseline below encodes what every template needs to
// restyle cleanly (a heading-led page built from real blocks, not raw HTML
// fallbacks). Per-template specializations should be tightened as each
// template's section anatomy is confirmed against the live template library —
// treat entries here as the single place QA expectations live.

const BASELINE: Omit<TemplateContract, "template"> = {
  requiredBlocks: [
    { name: "heading", min: 1 },
    { name: "paragraph", min: 1 },
  ],
  leadBlock: ["heading", "image", "cover"],
  maxHtmlFallbackRatio: 0.25,
  requireImageAlt: true,
};

/** Templates whose layouts are image-forward and must carry at least one image. */
const IMAGE_FORWARD = new Set(["Albatross", "Aspen", "Sequoia", "Sunrise", "Sunstone", "Willow"]);

export const GOLFNOW_TEMPLATE_NAMES = [
  "Albatross",
  "Aspen",
  "Austin",
  "Dogwood",
  "Eagleton",
  "Indigo",
  "Mulberry",
  "Pine",
  "Quantum",
  "Redmond",
  "Sequoia",
  "Sunrise",
  "Sunstone",
  "Willow",
] as const;

export type GolfNowTemplateName = (typeof GOLFNOW_TEMPLATE_NAMES)[number];

function buildContract(template: GolfNowTemplateName): TemplateContract {
  const requiredBlocks = [...BASELINE.requiredBlocks];
  if (IMAGE_FORWARD.has(template)) requiredBlocks.push({ name: "image", min: 1 });
  return { template, ...BASELINE, requiredBlocks };
}

const CONTRACTS = new Map<string, TemplateContract>(GOLFNOW_TEMPLATE_NAMES.map((name) => [name, buildContract(name)]));

/**
 * Contract for a template name from the UI selector, or undefined when the
 * operator has not selected a template (nothing to verify against).
 */
export function contractForTemplate(template: string): TemplateContract | undefined {
  return CONTRACTS.get(template);
}
