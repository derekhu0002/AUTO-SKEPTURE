# ARCHITECTURE

## Stable Element

`src/blender-bridge`

## Responsibility

- Own the local stdio JSON protocol boundary to Blender.
- Own the repository-local adapter launcher that starts Blender in background mode and executes the Blender Python driver.
- Produce structured execution feedback suitable for explicit testcase observation points.
- Hide adapter process details from the runtime and mediator layers.

## Implements

- Direct: `LocalBlenderAvatarEndpoint`
- Direct: `StructuredAvatarExecutionFeedback`

## Interfaces

- Inbound control point: `BlenderBridge.sendAction(command)`
- Observation point: `BlenderFeedback` with acknowledgement, status, observed state, and detail.

## Repository Launch Assets

- `scripts/blender-adapter.mjs`
- `scripts/blender-disconnect-adapter.mjs`
- `scripts/blender-avatar-driver.py`
- `scripts/run-real-tests.mjs`

## Dependency Rules

- Must not import `src/agent-runtime` or `src/avatar-mediator`.
- Owns Node process-facing details behind the bridge interface.

## Test Ownership

- Shares ownership of the explicit graceful degradation observation boundary.
- Covered by dependency and traceability guardrails.