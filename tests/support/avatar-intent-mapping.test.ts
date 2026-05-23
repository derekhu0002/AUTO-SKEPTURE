import test from "node:test";
import assert from "node:assert/strict";

import { resolveAvatarIntent } from "../../scripts/avatar-intent-mapping.mjs";

test("support guardrail: Chinese thinking intent resolves to thinking", () => {
  const result = resolveAvatarIntent("让数字人进入思考状态");

  assert.equal(result.kind, "resolved");
  assert.equal(result.action, "thinking");
});

test("support guardrail: English idle intent resolves to neutral_idle", () => {
  const result = resolveAvatarIntent("reset the avatar back to idle");

  assert.equal(result.kind, "resolved");
  assert.equal(result.action, "neutral_idle");
});

test("support guardrail: low-level rig request is rejected", () => {
  const result = resolveAvatarIntent("把右手骨骼旋转 30 度");

  assert.equal(result.kind, "unsupported");
  assert.match(result.message, /Low-level rig control/i);
});