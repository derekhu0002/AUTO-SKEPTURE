import test from "node:test";
import assert from "node:assert/strict";
import { AvatarEmbodimentMediator } from "../../src/avatar-mediator/index.js";
export const CONTROL_POINT = "Deliver two rapid lifecycle events to the mediator before the earlier avatar motion completes.";
export const OBSERVATION_POINT = "The newest semantic action wins and stale motion does not remain the visible outcome.";
test("support guardrail: newest-state preemption is implemented behind the frozen mediator boundary", async () => {
    const bridge = new DelayedVisibleStateBridge({
        thinking: 25,
        confirming: 1,
    });
    const mediator = new AvatarEmbodimentMediator(bridge);
    const firstOutcomePromise = mediator.handleLifecycleEvent({
        type: "response_start",
        requestId: "preemption-start",
    });
    const secondOutcomePromise = mediator.handleLifecycleEvent({
        type: "response_complete",
        requestId: "preemption-complete",
    });
    const [firstOutcome, secondOutcome] = await Promise.all([
        firstOutcomePromise,
        secondOutcomePromise,
    ]);
    assert.equal(firstOutcome.status, "executed", `Control point: ${CONTROL_POINT}`);
    assert.equal(secondOutcome.status, "executed", `Control point: ${CONTROL_POINT}`);
    assert.deepEqual(bridge.commands.map((command) => command.action), ["thinking", "confirming"], `Control point: ${CONTROL_POINT}`);
    assert.equal(bridge.visibleState, "confirming", `Observation point: ${OBSERVATION_POINT}`);
    assert.equal(secondOutcome.feedback?.observedState, "confirming", `Observation point: ${OBSERVATION_POINT}`);
});
class DelayedVisibleStateBridge {
    delays;
    commands = [];
    visibleState = "unknown";
    constructor(delays) {
        this.delays = delays;
    }
    async sendAction(command) {
        this.commands.push(command);
        await delay(this.delays[command.action] ?? 0);
        this.visibleState = command.action;
        return {
            acknowledged: true,
            status: "ok",
            observedState: command.action,
            detail: `Observed ${command.action}.`,
        };
    }
}
function delay(milliseconds) {
    return new Promise((resolve) => {
        setTimeout(resolve, milliseconds);
    });
}
