# ARCHITECTURE

## Stable Element

`src/agent-runtime`

## Responsibility

- Own the VS Code agent runtime/control-loop boundary.
- Accept lifecycle events from the outer host and hand them to the embodiment mediator.
- Own host-side semantic control assets that accept bounded natural-language avatar requests and reduce them to approved semantic actions before execution.
- Preserve assistant continuity when avatar behavior is muted, degraded, or unavailable.

## Implements

- Direct: `InteractionStateDrivenEmbodiment`
- Direct: `AgentResponseLifecycleState`
- Direct: `UserDirectedSemanticEmbodiment`
- Direct: `UserSemanticAvatarControlInterface`
- Direct: `UserSemanticAvatarActionRequest`
- Indirect: `EmbodiedAgentInteraction` via `src/avatar-mediator`

## Interfaces

- Inbound control point: `AgentRuntime.handleResponseLifecycle(event)`
- Inbound control point: `AgentRuntime.setAvatarMuted(muted)`
- Inbound control point: host semantic control assets submit a bounded semantic avatar request through `scripts/control-avatar.mjs -- --intent "<request>"` for the current workspace channel.
- Outbound dependency: `AvatarEmbodimentMediator.handleLifecycleEvent(event)`
- Outbound dependency: approved user semantic requests must ultimately cross the runtime boundary as mediator-owned semantic actions rather than calling the bridge adapter directly.

## Dependency Rules

- May import `src/avatar-mediator` only.
- Must not import `src/blender-bridge`.
- Host-owned semantic control assets attached to this boundary must not treat `scripts/blender-adapter.mjs` as their primary execution API.

## Test Ownership

- Shares ownership of explicit testcase control points with `tests/explicit/response-start-embodiment.test.ts` and `tests/explicit/response-complete-embodiment.test.ts`.
- Shares ownership of the current semantic-control control point with `tests/explicit/user-semantic-avatar-request-embodiment.test.ts`.
- Covered by `tests/architecture/boundary-guard.test.ts`, `tests/architecture/dependency-direction-guard.test.ts`, `tests/architecture/semantic-control-boundary-guard.test.ts`, and `tests/architecture/user-semantic-entrypoint-guard.test.ts`.