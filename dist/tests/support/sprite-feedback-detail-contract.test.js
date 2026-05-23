import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
export const CONTROL_POINT = "Read scripts/blender-visual-driver.py to inspect how Sprite observation detail is emitted.";
export const OBSERVATION_POINT = "The existing response shape is preserved, and the detail string names the selected Sprite preset, action family, or equivalent bridge-owned selection detail.";
test("support guardrail: visual driver detail names the Sprite-specific selection", async () => {
    const visualDriver = await readFile(new URL("../../scripts/blender-visual-driver.py", import.meta.url), "utf8");
    assert.match(visualDriver, /"detail"/, `Control point: ${CONTROL_POINT}`);
    assert.match(visualDriver, /Sprite.*(preset|action)|selected.*Sprite/i, `Observation point: ${OBSERVATION_POINT}`);
});
