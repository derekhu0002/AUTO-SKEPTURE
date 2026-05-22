import {
  type BlenderActionCommand,
  type BlenderBridge,
  type BlenderFeedback,
} from "../../src/blender-bridge/index.js";

export class RecordingBridge implements BlenderBridge {
  public readonly commands: BlenderActionCommand[] = [];

  public constructor(private readonly feedback: BlenderFeedback) {}

  public async sendAction(
    command: BlenderActionCommand
  ): Promise<BlenderFeedback> {
    this.commands.push(command);
    return this.feedback;
  }
}

export class FailingBridge implements BlenderBridge {
  public readonly commands: BlenderActionCommand[] = [];

  public constructor(private readonly message: string) {}

  public async sendAction(
    command: BlenderActionCommand
  ): Promise<BlenderFeedback> {
    this.commands.push(command);
    throw new Error(this.message);
  }
}

export function createOkFeedback(
  observedState: BlenderFeedback["observedState"]
): BlenderFeedback {
  return {
    acknowledged: true,
    status: "ok",
    observedState,
    detail: `Observed ${observedState}.`,
  };
}