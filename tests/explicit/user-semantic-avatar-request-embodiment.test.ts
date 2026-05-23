import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolve } from "node:path";

import { explicitBaselines } from "../fixtures/explicit-baselines.js";
import { shouldRunRealEnvironmentTests } from "../fixtures/real-environment.js";

const execFileAsync = promisify(execFile);

export const TESTCASE_ID = "TC-EX-004";
export const CONTROL_POINT =
  'scripts/control-avatar.mjs --intent "show a thinking state" --request-id TC-EX-004';
export const OBSERVATION_POINT =
  "The semantic control result exposes action 'thinking' and structured Blender feedback with an acknowledged thinking-compatible state.";

test(`${TESTCASE_ID} UserSemanticAvatarRequestEmbodiment`, async (t) => {
  if (!shouldRunRealEnvironmentTests()) {
    t.skip("Real Blender environment is not configured. Set BLENDER_ADAPTER_COMMAND.");
    return;
  }

  const baseline = explicitBaselines.userSemanticRequest;
  const { stdout } = await execFileAsync(
    process.execPath,
    [
      resolve("scripts", "control-avatar.mjs"),
      "--intent",
      "show a thinking state",
      "--request-id",
      baseline.testcaseId,
    ],
  );

  const result = JSON.parse(stdout) as {
    action?: string;
    feedback?: {
      acknowledged?: boolean;
      observedState?: string;
    };
  };

  assert.equal(result.action, baseline.expectedAction, `Control point: ${CONTROL_POINT}`);
  assert.equal(
    result.feedback?.observedState,
    baseline.expectedAction,
    `Observation point: ${OBSERVATION_POINT}`,
  );
  assert.equal(result.feedback?.acknowledged, true);
});