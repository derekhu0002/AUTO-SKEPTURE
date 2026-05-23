import {
  type AvatarActionName,
  type BlenderActionCommand,
  type BlenderBridge,
  type BlenderFeedback,
} from "../blender-bridge/index.js";

export type AgentLifecycleEventType =
  | "response_start"
  | "response_complete";

export type { AvatarActionName } from "../blender-bridge/index.js";

export interface AgentLifecycleEvent {
  readonly type: AgentLifecycleEventType;
  readonly requestId: string;
}

export interface MediatorOutcome {
  readonly status: "executed" | "suppressed" | "degraded";
  readonly surfacedStatus: string;
  readonly feedback: BlenderFeedback | null;
  readonly recoveryAction: AvatarActionName | null;
}

export class AvatarEmbodimentMediator {
  private muted = false;

  public constructor(private readonly bridge: BlenderBridge) {}

  public setMuted(muted: boolean): void {
    this.muted = muted;
  }

  public async handleLifecycleEvent(
    event: AgentLifecycleEvent
  ): Promise<MediatorOutcome> {
    if (this.muted) {
      return {
        status: "suppressed",
        surfacedStatus: "Avatar output muted by user override.",
        feedback: null,
        recoveryAction: null,
      };
    }

    const action = mapLifecycleEventToAction(event);

    return this.executeAction(action, event.requestId);
  }

  public async executeAction(
    action: AvatarActionName,
    requestId: string
  ): Promise<MediatorOutcome> {
    const command: BlenderActionCommand = {
      action,
      requestId,
      source: "avatar-mediator",
    };

    try {
      const feedback = await this.bridge.sendAction(command);

      return {
        status: "executed",
        surfacedStatus: `Avatar action '${action}' executed.`,
        feedback,
        recoveryAction: null,
      };
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);

      return {
        status: "degraded",
        surfacedStatus: `Avatar degraded: ${detail}`,
        feedback: null,
        recoveryAction: "neutral_idle",
      };
    }
  }
}

function mapLifecycleEventToAction(event: AgentLifecycleEvent): AvatarActionName {
  switch (event.type) {
    case "response_start":
      return "thinking";
    case "response_complete":
      return "confirming";
    default: {
      const exhaustiveCheck: never = event.type;
      throw new Error(`Unsupported lifecycle event: ${exhaustiveCheck}`);
    }
  }
}