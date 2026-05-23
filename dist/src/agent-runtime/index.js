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
    async handleSemanticAvatarAction(action, requestId) {
        return this.mediator.executeAction(action, requestId);
    }
}
