import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
export const CONTROL_POINT = "Read scripts/blender-visual-adapter.mjs to inspect the default visual-scene binding contract.";
export const OBSERVATION_POINT = "The observation path defaults to assets/sprite.blend for this iteration while preserving explicit override via BLENDER_VISUAL_BLEND_FILE.";
test("support guardrail: visual observation path defaults to the Sprite scene", async () => {
    const visualAdapter = await readFile(new URL("../../scripts/blender-visual-adapter.mjs", import.meta.url), "utf8");
    assert.match(visualAdapter, /BLENDER_VISUAL_BLEND_FILE/, `Control point: ${CONTROL_POINT}`);
    assert.match(visualAdapter, /assets[\\/]sprite\.blend/, `Observation point: ${OBSERVATION_POINT}`);
});
