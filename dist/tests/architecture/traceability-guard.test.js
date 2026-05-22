import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
test("traceability guard: contracts map stable elements to intent and tests", async () => {
    const controlPoint = "Read OVERALL_ARCHITECTURE.md and local ARCHITECTURE.md contracts.";
    const observationPoint = "Contracts mention the intended stable elements, explicit testcase entrypoints, and intent element mappings.";
    const overall = await readFile(new URL("../../OVERALL_ARCHITECTURE.md", import.meta.url), "utf8");
    const runtime = await readFile(new URL("../../src/agent-runtime/ARCHITECTURE.md", import.meta.url), "utf8");
    const mediator = await readFile(new URL("../../src/avatar-mediator/ARCHITECTURE.md", import.meta.url), "utf8");
    const bridge = await readFile(new URL("../../src/blender-bridge/ARCHITECTURE.md", import.meta.url), "utf8");
    assert.match(overall, /TC-EX-001/);
    assert.match(overall, /TC-EX-002/);
    assert.match(overall, /TC-EX-003/);
    assert.match(runtime, /InteractionStateDrivenEmbodiment/);
    assert.match(mediator, /TruthfulEmbodimentPrinciple/);
    assert.match(bridge, /StructuredAvatarExecutionFeedback/);
    assert.ok(controlPoint.length > 0 && observationPoint.length > 0);
});
