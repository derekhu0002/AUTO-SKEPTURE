export class RecordingBridge {
    feedback;
    commands = [];
    constructor(feedback) {
        this.feedback = feedback;
    }
    async sendAction(command) {
        this.commands.push(command);
        return this.feedback;
    }
}
export class FailingBridge {
    message;
    commands = [];
    constructor(message) {
        this.message = message;
    }
    async sendAction(command) {
        this.commands.push(command);
        throw new Error(this.message);
    }
}
export function createOkFeedback(observedState) {
    return {
        acknowledged: true,
        status: "ok",
        observedState,
        detail: `Observed ${observedState}.`,
    };
}
