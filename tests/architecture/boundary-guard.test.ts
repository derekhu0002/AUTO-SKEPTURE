import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("architecture boundary guard: runtime does not import bridge", async () => {
  const controlPoint = "Read src/agent-runtime/index.ts import surface.";
  const observationPoint =
    "No direct import from src/blender-bridge appears in the runtime layer.";
  const runtimeSource = await readFile(
    new URL("../../src/agent-runtime/index.ts", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(
    runtimeSource,
    /blender-bridge/,
    `${controlPoint} Observation point: ${observationPoint}`
  );
});