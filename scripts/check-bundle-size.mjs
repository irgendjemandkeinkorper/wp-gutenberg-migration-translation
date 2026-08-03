import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const root = process.argv[2] ?? "dist/assets";
const budget = Number(process.env.BLOCKIFY_BUNDLE_BUDGET_BYTES ?? 650_000);

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const output = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await files(path));
    else output.push({ path, bytes: (await stat(path)).size });
  }
  return output;
}

const assets = await files(root);
const javascript = assets.filter((asset) => asset.path.endsWith(".js")).sort((a, b) => b.bytes - a.bytes);
const largest = javascript[0] ?? { path: "none", bytes: 0 };
console.log(JSON.stringify({ root, budgetBytes: budget, javascript: javascript.map((asset) => ({ ...asset })), largest }, null, 2));
if (largest.bytes > budget) {
  console.error(`Bundle budget exceeded: ${largest.path} is ${largest.bytes} bytes; budget is ${budget}.`);
  process.exitCode = 1;
}
