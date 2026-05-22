import test from "node:test";
import assert from "node:assert/strict";

import { AgentRuntime } from "../../src/agent-runtime/index.js";
import { AvatarEmbodimentMediator } from "../../src/avatar-mediator/index.js";
import { RecordingBridge, createOkFeedback } from "../fixtures/fakes.js";

test("support guardrail: response_start maps to thinking and executes against the bridge", async () => {
  const bridge = new RecordingBridge(createOkFeedback("thinking"));
  const runtime = new AgentRuntime(new AvatarEmbodimentMediator(bridge));

  const outcome = await runtime.handleResponseLifecycle({
    type: "response_start",
    requestId: "support-response-start",
  });

  assert.equal(outcome.status, "executed");
  assert.equal(outcome.feedback?.observedState, "thinking");
  assert.equal(bridge.commands[0]?.action, "thinking");
});

test("support guardrail: response_complete maps to confirming and executes against the bridge", async () => {
  const bridge = new RecordingBridge(createOkFeedback("confirming"));
  const runtime = new AgentRuntime(new AvatarEmbodimentMediator(bridge));

  const outcome = await runtime.handleResponseLifecycle({
    type: "response_complete",
    requestId: "support-response-complete",
  });

  assert.equal(outcome.status, "executed");
  assert.equal(outcome.feedback?.observedState, "confirming");
  assert.equal(bridge.commands[0]?.action, "confirming");
});