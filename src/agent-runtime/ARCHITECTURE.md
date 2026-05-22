# ARCHITECTURE

## Stable Element

`src/agent-runtime`

## Responsibility

- Own the VS Code agent runtime/control-loop boundary.
- Accept lifecycle events from the outer host and hand them to the embodiment mediator.
- Preserve assistant continuity when avatar behavior is muted, degraded, or unavailable.

## Implements

- Direct: `InteractionStateDrivenEmbodiment`
- Direct: `AgentResponseLifecycleState`
- Indirect: `EmbodiedAgentInteraction` via `src/avatar-mediator`

## Interfaces

- Inbound control point: `AgentRuntime.handleResponseLifecycle(event)`
- Inbound control point: `AgentRuntime.setAvatarMuted(muted)`
- Outbound dependency: `AvatarEmbodimentMediator.handleLifecycleEvent(event)`

## Dependency Rules

- May import `src/avatar-mediator` only.
- Must not import `src/blender-bridge`.

## Test Ownership

- Shares ownership of explicit testcase control points with `tests/explicit/response-start-embodiment.test.ts` and `tests/explicit/response-complete-embodiment.test.ts`.
- Covered by `tests/architecture/boundary-guard.test.ts` and `tests/architecture/dependency-direction-guard.test.ts`.