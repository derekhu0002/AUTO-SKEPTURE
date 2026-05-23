import test from "node:test";
import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { explicitBaselines } from "../fixtures/explicit-baselines.js";
test("explicit entrypoint guard: frozen entrypoints and baselines exist", async () => {
    const controlPoint = "Resolve explicit testcase files and protected baseline fixture keys.";
    const observationPoint = "All four explicit test entrypoints and their baseline metadata exist in the repository.";
    await Promise.all([
        access(new URL("../explicit/response-start-embodiment.test.ts", import.meta.url)),
        access(new URL("../explicit/response-complete-embodiment.test.ts", import.meta.url)),
        access(new URL("../explicit/blender-disconnect-graceful-degradation.test.ts", import.meta.url)),
        access(new URL("../explicit/user-semantic-avatar-request-embodiment.test.ts", import.meta.url)),
        access(new URL("../../scripts/run-tc-ex-004.mjs", import.meta.url)),
    ]);
    assert.equal(explicitBaselines.responseStart.testcaseId, "TC-EX-001");
    assert.equal(explicitBaselines.responseComplete.testcaseId, "TC-EX-002");
    assert.equal(explicitBaselines.gracefulDegradation.testcaseId, "TC-EX-003");
    assert.equal(explicitBaselines.userSemanticRequest.testcaseId, "TC-EX-004");
    assert.ok(controlPoint.length > 0 && observationPoint.length > 0);
});
