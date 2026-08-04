import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoDir = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const generator = join(repoDir, "scripts", "generate-knowledge-vault.mjs");

describe("migration knowledge vault", () => {
  it("keeps the checked-in Obsidian projection synchronized", () => {
    const output = execFileSync(process.execPath, [generator, "--check"], {
      cwd: repoDir,
      encoding: "utf8",
    });

    expect(output).toMatch(/CHECKED \d+ knowledge-vault files/);
  });

  it("projects translation outcomes and resolving links into an external vault", () => {
    const externalVault = mkdtempSync(join(tmpdir(), "blockify-observation-vault-"));
    try {
      const output = execFileSync(process.execPath, [generator, "--write", "--vault", externalVault], {
        cwd: repoDir,
        encoding: "utf8",
      });
      const observations = JSON.parse(
        readFileSync(join(repoDir, "knowledge", "catalog", "translation-observations.json"), "utf8"),
      );
      const index = readFileSync(join(externalVault, "Translation Observations.md"), "utf8");
      const project = readFileSync(join(externalVault, "Projects", "Blockify migration.md"), "utf8");

      expect(output).toMatch(/WROTE \d+ knowledge-vault files/);
      expect(observations.length).toBeGreaterThanOrEqual(5);
      expect(index).toContain("<code>pass</code>");
      expect(index).toContain("<code>placeholder</code>");
      expect(index).toContain("<code>fail</code>");
      for (const observation of observations) {
        expect(index).toContain(`[[Translation Observations/${observation.id}|${observation.label}]]`);
        expect(readFileSync(join(externalVault, "Translation Observations", `${observation.id}.md`), "utf8")).toContain(
          `id: "${observation.id}"`,
        );
      }
      expect(project).toContain("[[Block Capabilities]]");
      expect(project).toContain("[[Failure Classes]]");
      expect(project).toContain("[[Translation Observations]]");
    } finally {
      rmSync(externalVault, { recursive: true, force: true });
    }
  });
});
