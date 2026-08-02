export interface TemplateRegistryEntry {
  id: string;
  displayName: string;
  status: "available" | "metadata-only";
}

export const TEMPLATE_REGISTRY: TemplateRegistryEntry[] = [
  { id: "albatross", displayName: "Albatross", status: "metadata-only" },
  { id: "gn-aspen", displayName: "Aspen", status: "available" },
  { id: "austin", displayName: "Austin", status: "metadata-only" },
  { id: "gn-dogwood", displayName: "Dogwood", status: "available" },
  { id: "eagleton", displayName: "Eagleton", status: "metadata-only" },
  { id: "cet-wp-theme-indigo", displayName: "Indigo", status: "available" },
  { id: "gn-mulberry", displayName: "Mulberry", status: "available" },
  { id: "gn-pine", displayName: "Pine", status: "available" },
  { id: "quantum", displayName: "Quantum", status: "metadata-only" },
  { id: "redmond", displayName: "Redmond", status: "metadata-only" },
  { id: "sequoia", displayName: "Sequoia", status: "metadata-only" },
  { id: "sunrise", displayName: "Sunrise", status: "metadata-only" },
  { id: "sunstone-pro", displayName: "Sunstone Pro", status: "available" },
  { id: "willow", displayName: "Willow", status: "metadata-only" },
  { id: "cet-wp-theme-troon-2", displayName: "Troon 2", status: "available" },
  { id: "diamond", displayName: "Diamond", status: "available" },
  { id: "tillinghast-theme", displayName: "Tillinghast", status: "available" },
  { id: "topaz", displayName: "Topaz", status: "available" },
  { id: "troon", displayName: "Troon", status: "available" },
  { id: "zilker", displayName: "Zilker", status: "available" },
];

export function getTemplateDisplayName(id: string): string {
  if (!id) return "Not selected";
  const t = TEMPLATE_REGISTRY.find((x) => x.id === id);
  return t ? t.displayName : id;
}

export function getTemplateById(id: string): TemplateRegistryEntry | undefined {
  return TEMPLATE_REGISTRY.find((x) => x.id === id);
}

export function normalizeTemplateId(idOrName: string): string {
  if (!idOrName) return "";
  const clean = idOrName.trim();
  // Check direct match
  if (TEMPLATE_REGISTRY.some((t) => t.id === clean)) {
    return clean;
  }
  // Match display name (case-insensitive) or lowercase ID
  const found = TEMPLATE_REGISTRY.find(
    (t) =>
      t.displayName.toLowerCase() === clean.toLowerCase() ||
      t.id.toLowerCase() === clean.toLowerCase()
  );
  if (found) return found.id;
  return clean;
}
