export class AvatarEmbodimentMediator {
    bridge;
    muted = false;
    executionTail = Promise.resolve();
    constructor(bridge) {
        this.bridge = bridge;
    }
    setMuted(muted) {
        this.muted = muted;
    }
    async handleLifecycleEvent(event) {
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
    async executeAction(action, requestId) {
        const runAction = async () => {
            const command = {
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
            }
            catch (error) {
                const detail = error instanceof Error ? error.message : String(error);
                return {
                    status: "degraded",
                    surfacedStatus: `Avatar degraded: ${detail}`,
                    feedback: null,
                    recoveryAction: "neutral_idle",
                };
            }
        };
        const previousExecution = this.executionTail;
        const nextExecution = previousExecution.then(runAction, runAction);
        this.executionTail = nextExecution.then(() => undefined, () => undefined);
        return nextExecution;
    }
}
function mapLifecycleEventToAction(event) {
    switch (event.type) {
        case "response_start":
            return "thinking";
        case "response_complete":
            return "confirming";
        default: {
            const exhaustiveCheck = event.type;
            throw new Error(`Unsupported lifecycle event: ${exhaustiveCheck}`);
        }
    }
}
