import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
test("semantic control boundary guard: host semantic control assets do not launch the bridge adapter directly", async () => {
    const controlPoint = "Read scripts/control-avatar.mjs as the current host-owned semantic control asset.";
    const observationPoint = "The control asset delegates semantic execution through the runtime/mediator boundary instead of launching scripts/blender-adapter.mjs directly.";
    const controlAsset = await readFile(new URL("../../scripts/control-avatar.mjs", import.meta.url), "utf8");
    assert.doesNotMatch(controlAsset, /blender-adapter\.mjs/, `Control point: ${controlPoint}`);
    assert.match(controlAsset, /AgentRuntime|AvatarEmbodimentMediator/, `Observation point: ${observationPoint}`);
});
