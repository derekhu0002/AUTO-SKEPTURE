import test from "node:test";
import assert from "node:assert/strict";
import { AgentRuntime } from "../../src/agent-runtime/index.js";
import { AvatarEmbodimentMediator } from "../../src/avatar-mediator/index.js";
import { StdioBlenderBridge } from "../../src/blender-bridge/index.js";
import { explicitBaselines } from "../fixtures/explicit-baselines.js";
import { getRealEnvironmentBridgeOptions, shouldRunRealEnvironmentTests } from "../fixtures/real-environment.js";
export const TESTCASE_ID = "TC-EX-002";
export const CONTROL_POINT = 'AgentRuntime.handleResponseLifecycle({ type: "response_complete" })';
export const OBSERVATION_POINT = "Mediator outcome and structured Blender feedback expose a confirming-compatible state.";
test(`${TESTCASE_ID} ResponseCompleteEmbodiment`, async (t) => {
    if (!shouldRunRealEnvironmentTests()) {
        t.skip("Real Blender environment is not configured. Set BLENDER_ADAPTER_COMMAND.");
        return;
    }
    const baseline = explicitBaselines.responseComplete;
    const bridge = new StdioBlenderBridge(getRealEnvironmentBridgeOptions());
    const mediator = new AvatarEmbodimentMediator(bridge);
    const runtime = new AgentRuntime(mediator);
    const outcome = await runtime.handleResponseLifecycle({
        type: "response_complete",
        requestId: baseline.testcaseId,
    });
    assert.equal(outcome.status, "executed", `Control point: ${CONTROL_POINT}`);
    assert.equal(outcome.feedback?.observedState, baseline.expectedAction, `Observation point: ${OBSERVATION_POINT}`);
    assert.equal(outcome.feedback?.acknowledged, true);
});
