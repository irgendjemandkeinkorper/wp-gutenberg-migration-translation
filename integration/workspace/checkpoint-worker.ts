import { CheckpointStore } from "../../src/lib/workspace/checkpoint.ts";

const [mode, directory] = process.argv.slice(2);
const identities = Array.from({ length: 100 }, (_, index) => `page-${String(index).padStart(3, "0")}`);
const store = new CheckpointStore({
  directory,
  runId: "forced-process-run",
  stage: "conversion",
});

if (mode === "interrupt") {
  await store.initialize(identities);
  for (const identity of identities.slice(0, 50)) {
    await store.markRunning(identity);
    await store.commit(identity, [`delivery:${identity}`]);
  }
  await store.markRunning(identities[50]);
  process.stdout.write("ready-to-interrupt\n");
  setInterval(() => {}, 1_000);
} else if (mode === "resume") {
  const recovered = await store.recover();
  for (const identity of store.resumableIdentities) {
    await store.markRunning(identity);
    await store.commit(identity, [`delivery:${identity}`]);
  }
  const final = store.getSnapshot();
  process.stdout.write(`${JSON.stringify({
    recoveredEvents: recovered.auditEvents.filter((event) => event.type === "recovered").length,
    integrityHash: final.integrityHash,
    statuses: final.items.map((item) => item.status),
    outputEntityIds: final.items.flatMap((item) => item.outputEntityIds),
  })}\n`);
} else {
  throw new Error(`Unknown checkpoint worker mode: ${mode}`);
}
