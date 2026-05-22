import test from "node:test";
import assert from "node:assert/strict";
import { AvatarEmbodimentMediator } from "../../src/avatar-mediator/index.js";
import { StdioBlenderBridge } from "../../src/blender-bridge/index.js";
import { explicitBaselines } from "../fixtures/explicit-baselines.js";
import { getRealEnvironmentDisconnectBridgeOptions, shouldRunRealEnvironmentDisconnectTest } from "../fixtures/real-environment.js";
export const TESTCASE_ID = "TC-EX-003";
export const CONTROL_POINT = "AvatarEmbodimentMediator.executeAction(action, requestId) against a failing bridge.";
export const OBSERVATION_POINT = "Mediator outcome surfaces degradation and neutral-idle recovery.";
test(`${TESTCASE_ID} BlenderDisconnectGracefulDegradation`, async (t) => {
    if (!shouldRunRealEnvironmentDisconnectTest()) {
        t.skip("Real disconnect environment is not configured. Set BLENDER_ADAPTER_DISCONNECT_COMMAND or BLENDER_ADAPTER_COMMAND.");
        return;
    }
    const baseline = explicitBaselines.gracefulDegradation;
    const mediator = new AvatarEmbodimentMediator(new StdioBlenderBridge(getRealEnvironmentDisconnectBridgeOptions()));
    const outcome = await mediator.executeAction("confirming", baseline.testcaseId);
    assert.equal(outcome.status, "degraded", `Control point: ${CONTROL_POINT}`);
    assert.match(outcome.surfacedStatus, /Avatar degraded: Blender adapter unavailable/, `Observation point: ${OBSERVATION_POINT}`);
    assert.equal(outcome.recoveryAction, baseline.expectedAction);
});
