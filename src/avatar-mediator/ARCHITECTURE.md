# ARCHITECTURE

## Stable Element

`src/avatar-mediator`

## Responsibility

- Convert runtime lifecycle state into truthful semantic avatar actions.
- Enforce mute/disable, graceful degradation, and preemption policy.
- Isolate agent semantics from Blender transport details.

## Implements

- Direct: `AvatarEmbodimentMediator`
- Direct: `ApprovedAvatarActionVocabulary`
- Direct: `TruthfulEmbodimentPrinciple`
- Direct: `GracefulAvatarDegradationConstraint`
- Direct: `UserAvatarOverrideConstraint`
- Indirect: `EmbodiedAgentInteraction`

## Interfaces

- Inbound control point: `AvatarEmbodimentMediator.handleLifecycleEvent(event)`
- Inbound control point: `AvatarEmbodimentMediator.executeAction(action, context)`
- Inbound control point: `AvatarEmbodimentMediator.setMuted(muted)`
- Observation point: `MediatorOutcome.surfacedStatus`, `MediatorOutcome.feedback`, `MediatorOutcome.recoveryAction`
- Outbound dependency: `BlenderBridge.sendAction(command)`

## Dependency Rules

- May import only the bridge contract surface from `src/blender-bridge`.
- Must not import runtime control-loop code from `src/agent-runtime`.

## Test Ownership

- Owns the core observation boundary for all three explicit testcases.
- Owns critical guardrails for mute/disable, graceful degradation, and preemption policy.