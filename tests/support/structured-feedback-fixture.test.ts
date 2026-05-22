import test from "node:test";
import assert from "node:assert/strict";

import { createOkFeedback } from "../fixtures/fakes.js";

test("support guardrail: structured feedback fixture shape stays stable", () => {
  const controlPoint = "Create the shared structured feedback fixture.";
  const observationPoint =
    "The fixture exposes acknowledgement, status, observedState, and detail fields.";
  const feedback = createOkFeedback("thinking");

  assert.equal(feedback.acknowledged, true, controlPoint);
  assert.equal(feedback.status, "ok", observationPoint);
  assert.equal(feedback.observedState, "thinking", observationPoint);
  assert.match(feedback.detail, /Observed thinking\./, observationPoint);
});