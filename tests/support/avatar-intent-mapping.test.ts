import test from "node:test";
import assert from "node:assert/strict";

type SupportedAvatarAction =
  | "thinking"
  | "confirming"
  | "neutral_idle"
  | "restrained_apology";

type AvatarIntentResolution =
  | {
      kind: "resolved";
      action: SupportedAvatarAction;
      reason: string;
    }
  | {
      kind: "unsupported";
      message: string;
      suggestedAction?: SupportedAvatarAction;
    }
  | {
      kind: "error";
      message: string;
    };

const { resolveAvatarIntent } = await import("../../scripts/avatar-intent-mapping.mjs") as {
  resolveAvatarIntent: (intent: string) => AvatarIntentResolution;
};

test("support guardrail: Chinese thinking intent resolves to thinking", () => {
  const result = resolveAvatarIntent("让数字人进入思考状态");

  assert.equal(result.kind, "resolved");
  assert.equal(result.action, "thinking");
});

test("support guardrail: Chinese nod-confirm intent resolves to confirming", () => {
  const result = resolveAvatarIntent("让角色点头确认一下");

  assert.equal(result.kind, "resolved");
  assert.equal(result.action, "confirming");
});

test("support guardrail: Chinese standby intent resolves to neutral_idle", () => {
  const result = resolveAvatarIntent("让角色回到待机");

  assert.equal(result.kind, "resolved");
  assert.equal(result.action, "neutral_idle");
});

test("support guardrail: Chinese restrained apology intent resolves to restrained_apology", () => {
  const result = resolveAvatarIntent("让角色轻微抱歉一下");

  assert.equal(result.kind, "resolved");
  assert.equal(result.action, "restrained_apology");
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