export interface ExplicitBaseline {
  readonly testcaseId: string;
  readonly controlPoint: string;
  readonly observationPoint: string;
  readonly expectedAction: string;
}

export const explicitBaselines = {
  responseStart: {
    testcaseId: "TC-EX-001",
    controlPoint:
      'AgentRuntime.handleResponseLifecycle({ type: "response_start" })',
    observationPoint:
      "Mediator outcome and structured Blender feedback expose thinking-compatible state.",
    expectedAction: "thinking",
  },
  responseComplete: {
    testcaseId: "TC-EX-002",
    controlPoint:
      'AgentRuntime.handleResponseLifecycle({ type: "response_complete" })',
    observationPoint:
      "Mediator outcome and structured Blender feedback expose confirming-compatible state.",
    expectedAction: "confirming",
  },
  gracefulDegradation: {
    testcaseId: "TC-EX-003",
    controlPoint:
      "AvatarEmbodimentMediator.executeAction(action, requestId) against a failing bridge.",
    observationPoint:
      "Mediator outcome surfaces degradation and neutral-idle recovery.",
    expectedAction: "neutral_idle",
  },
  userSemanticRequest: {
    testcaseId: "TC-EX-004",
    controlPoint:
      'scripts/control-avatar.mjs --intent "show a thinking state" --request-id <testcase-id>',
    observationPoint:
      "The semantic control result exposes action 'thinking' and structured Blender feedback with a thinking-compatible state.",
    expectedAction: "thinking",
  },
} satisfies Record<string, ExplicitBaseline>;