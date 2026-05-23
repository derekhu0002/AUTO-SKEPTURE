import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolve } from "node:path";
const execFileAsync = promisify(execFile);
test("user semantic entrypoint guard: low-level rig requests are rejected", async () => {
    const controlPoint = 'Invoke scripts/control-avatar.mjs --intent "rotate the right hand bone 30 degrees".';
    const observationPoint = "The semantic control entrypoint exits non-zero and rejects low-level rig control instead of coercing the request into Blender automation.";
    await assert.rejects(execFileAsync(process.execPath, [
        resolve("scripts", "control-avatar.mjs"),
        "--intent",
        "rotate the right hand bone 30 degrees",
    ]), (error) => {
        assert.match(error.stderr ?? "", /Low-level rig control/i);
        assert.ok(controlPoint.length > 0 && observationPoint.length > 0);
        return true;
    });
});
