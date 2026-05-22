import {
  type AgentLifecycleEvent,
  type MediatorOutcome,
  AvatarEmbodimentMediator,
} from "../avatar-mediator/index.js";

export class AgentRuntime {
  public constructor(
    private readonly mediator: AvatarEmbodimentMediator
  ) {}

  public setAvatarMuted(muted: boolean): void {
    this.mediator.setMuted(muted);
  }

  public async handleResponseLifecycle(
    event: AgentLifecycleEvent
  ): Promise<MediatorOutcome> {
    return this.mediator.handleLifecycleEvent(event);
  }
}