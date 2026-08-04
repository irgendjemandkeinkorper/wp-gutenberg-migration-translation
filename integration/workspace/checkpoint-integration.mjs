import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const directory = await mkdtemp(join(tmpdir(), "blockify-process-checkpoint-"));
const worker = resolve("integration/workspace/checkpoint-worker.ts");

try {
  const interrupted = spawn(process.execPath, ["--experimental-strip-types", worker, "interrupt", directory], {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
  });
  const stoppedPromise = waitForExit(interrupted);
  const ready = await waitForOutput(interrupted, "ready-to-interrupt");
  assert.match(ready, /ready-to-interrupt/);
  interrupted.kill("SIGKILL");
  const stopped = await stoppedPromise;
  assert.equal(stopped.signal, "SIGKILL");

  const resumed = spawn(process.execPath, ["--experimental-strip-types", worker, "resume", directory], {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
  });
  const resumedOutput = await waitForClose(resumed);
  assert.equal(resumedOutput.code, 0, resumedOutput.stderr);
  const summary = JSON.parse(resumedOutput.stdout.trim());
  assert.equal(summary.recoveredEvents, 1);
  assert.match(summary.integrityHash, /^[a-f0-9]{64}$/);
  assert.deepEqual(summary.statuses, Array.from({ length: 100 }, () => "committed"));
  assert.equal(new Set(summary.outputEntityIds).size, 100);
  assert.equal(summary.outputEntityIds.length, 100);
  console.log("CHECKPOINT INTEGRATION PASS: forced interruption recovered 100 unique deliveries");
} finally {
  await rm(directory, { recursive: true, force: true });
}

function waitForOutput(child, needle) {
  return new Promise((resolveOutput, reject) => {
    let output = "";
    let stderr = "";
    const timeout = setTimeout(() => reject(new Error(`Worker did not emit ${needle}: stdout=${output} stderr=${stderr}`)), 10_000);
    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
      if (output.includes(needle)) {
        clearTimeout(timeout);
        resolveOutput(output);
      }
    });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.once("error", reject);
    child.once("close", (code, signal) => {
      clearTimeout(timeout);
      reject(new Error(`Worker exited before ${needle}: code=${code} signal=${signal} stderr=${stderr}`));
    });
  });
}

function waitForClose(child) {
  return new Promise((resolveClose, reject) => {
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.once("error", reject);
    child.once("close", (code, signal) => resolveClose({ code, signal, stdout, stderr }));
  });
}

function waitForExit(child) {
  return new Promise((resolveExit, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => resolveExit({ code, signal }));
  });
}
