export type SupportedAvatarAction =
  | "thinking"
  | "confirming"
  | "neutral_idle"
  | "restrained_apology";

export function getSupportedAvatarActions(): SupportedAvatarAction[];

export function resolveAvatarIntent(intent: string):
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