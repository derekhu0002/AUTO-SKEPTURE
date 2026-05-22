import test from "node:test";
import assert from "node:assert/strict";
import { AgentRuntime } from "../../src/agent-runtime/index.js";
import { AvatarEmbodimentMediator } from "../../src/avatar-mediator/index.js";
import { RecordingBridge, createOkFeedback } from "../fixtures/fakes.js";
export const CONTROL_POINT = "AgentRuntime.setAvatarMuted(true) followed by response_start.";
export const OBSERVATION_POINT = "The mediator suppresses avatar execution while keeping the runtime control-loop callable.";
test("support guardrail: mute override suppresses avatar execution without removing runtime control", async () => {
    const bridge = new RecordingBridge(createOkFeedback("thinking"));
    const runtime = new AgentRuntime(new AvatarEmbodimentMediator(bridge));
    runtime.setAvatarMuted(true);
    const outcome = await runtime.handleResponseLifecycle({
        type: "response_start",
        requestId: "mute-support-guardrail",
    });
    assert.equal(outcome.status, "suppressed", `Control point: ${CONTROL_POINT}`);
    assert.equal(outcome.feedback, null, `Observation point: ${OBSERVATION_POINT}`);
    assert.deepEqual(bridge.commands, []);
});
