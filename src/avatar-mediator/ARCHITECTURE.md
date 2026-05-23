# ARCHITECTURE

## Stable Element

`src/avatar-mediator`

## Responsibility

- Convert runtime lifecycle state into truthful semantic avatar actions.
- Execute approved user-requested semantic avatar actions after the host boundary reduces natural-language requests to the bounded semantic vocabulary.
- Enforce mute/disable, graceful degradation, and preemption policy.
- Isolate agent semantics from Blender transport details.
- Preserve the existing bridge feedback shape and treat Sprite preset names as opaque bridge-owned detail.

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
- Observation boundary rule: `MediatorOutcome.feedback.detail` remains an opaque string supplied by the bridge; the mediator must not parse or depend on Sprite preset identifiers.
- Outbound dependency: `BlenderBridge.sendAction(command)`

## Dependency Rules

- May import only the bridge contract surface from `src/blender-bridge`.
- Must not import runtime control-loop code from `src/agent-runtime`.
- Must not import Blender-side asset paths, rig identifiers, or Sprite preset names.

## Test Ownership

- Owns the core observation boundary for all four explicit testcases.
- Owns critical guardrails for mute/disable, graceful degradation, and preemption policy.
- Does not own concrete Sprite preset-selection assertions; those stay below the mediator boundary.