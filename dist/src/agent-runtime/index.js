export class AgentRuntime {
    mediator;
    constructor(mediator) {
        this.mediator = mediator;
    }
    setAvatarMuted(muted) {
        this.mediator.setMuted(muted);
    }
    async handleResponseLifecycle(event) {
        return this.mediator.handleLifecycleEvent(event);
    }
}
