import { describe, expect, it } from "vitest";
import { TEMPLATE_REGISTRY, getTemplateDisplayName, getTemplateById, normalizeTemplateId } from "../lib/templates";

describe("templates registry", () => {
  it("should contain known stable templates and handle them properly", () => {
    // Known templates
    const aspen = getTemplateById("gn-aspen");
    expect(aspen).toBeDefined();
    expect(aspen?.displayName).toBe("Aspen");
    expect(aspen?.status).toBe("available");

    const indigo = getTemplateById("cet-wp-theme-indigo");
    expect(indigo).toBeDefined();
    expect(indigo?.displayName).toBe("Indigo");
    expect(indigo?.status).toBe("available");

    const albatross = getTemplateById("albatross");
    expect(albatross).toBeDefined();
    expect(albatross?.displayName).toBe("Albatross");
    expect(albatross?.status).toBe("metadata-only");
  });

  it("handles empty or unknown template IDs for display name", () => {
    // Empty
    expect(getTemplateDisplayName("")).toBe("Not selected");

    // Unknown
    expect(getTemplateDisplayName("unknown-template-id")).toBe("unknown-template-id");
  });

  it("handles normalization from old names / IDs", () => {
    // Empty/nil values
    expect(normalizeTemplateId("")).toBe("");

    // Known ID directly
    expect(normalizeTemplateId("gn-aspen")).toBe("gn-aspen");

    // Old display name case-insensitively
    expect(normalizeTemplateId("Aspen")).toBe("gn-aspen");
    expect(normalizeTemplateId("aspen")).toBe("gn-aspen");

    // Metadata-only display name or ID
    expect(normalizeTemplateId("Albatross")).toBe("albatross");
    expect(normalizeTemplateId("albatross")).toBe("albatross");

    // Completely unknown template
    expect(normalizeTemplateId("SuperGolfTheme")).toBe("SuperGolfTheme");
  });

  it("verifies that all selectable options in the registry have display names and status", () => {
    TEMPLATE_REGISTRY.forEach((entry) => {
      expect(entry.id).toBeTruthy();
      expect(entry.displayName).toBeTruthy();
      expect(["available", "metadata-only"]).toContain(entry.status);
    });
  });
});
