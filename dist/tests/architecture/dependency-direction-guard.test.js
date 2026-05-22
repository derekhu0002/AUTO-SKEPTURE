import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
test("dependency direction guard: bridge stays below mediator", async () => {
    const controlPoint = "Read src/blender-bridge/index.ts and src/avatar-mediator/index.ts import surfaces.";
    const observationPoint = "Bridge has no reverse import to runtime or mediator, and mediator imports the bridge contract only.";
    const bridgeSource = await readFile(new URL("../../src/blender-bridge/index.ts", import.meta.url), "utf8");
    const mediatorSource = await readFile(new URL("../../src/avatar-mediator/index.ts", import.meta.url), "utf8");
    assert.doesNotMatch(bridgeSource, /from\s+["']\.\.\/agent-runtime|from\s+["']\.\.\/avatar-mediator/, `${controlPoint} Observation point: ${observationPoint}`);
    assert.match(mediatorSource, /\.\.\/blender-bridge\/index\.js/, `${controlPoint} Observation point: ${observationPoint}`);
});
