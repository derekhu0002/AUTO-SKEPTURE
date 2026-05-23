# ARCHITECTURE

## Stable Element

`src/blender-bridge`

## Responsibility

- Own the local stdio JSON protocol boundary to Blender.
- Own the repository-local adapter launcher that starts Blender in background mode and executes the Blender Python driver.
- Produce structured execution feedback suitable for explicit testcase observation points.
- Hide adapter process details from the runtime and mediator layers.
- Own the current iteration's fixed Sprite observation scene binding at `assets/sprite.blend`.
- Own Sprite rig selection, Sprite preset selection, and any low-level face or pose controls behind Blender-side assets only.
- Keep richer Sprite observation detail inside the existing `BlenderFeedback.detail` field instead of introducing a wider runtime-facing protocol.

## Implements

- Direct: `LocalBlenderAvatarEndpoint`
- Direct: `StructuredAvatarExecutionFeedback`

## Interfaces

- Inbound control point: `BlenderBridge.sendAction(command)`
- Observation point: `BlenderFeedback` with acknowledgement, status, observed state, and detail.
- Observation detail contract: for the Sprite observation path, `BlenderFeedback.detail` must describe the selected Sprite preset, action family, or equivalent bridge-owned selection detail while preserving the existing four-field shape.
- Observation-path control point: `npm run observe:blender` through `scripts/observe-in-blender.mjs` -> `scripts/blender-visual-adapter.mjs` -> `scripts/blender-visual-driver.py`.

## Repository Launch Assets

- `scripts/blender-adapter.mjs`
- `scripts/blender-visual-adapter.mjs`
- `scripts/blender-disconnect-adapter.mjs`
- `scripts/blender-avatar-driver.py`
- `scripts/blender-visual-driver.py`
- `scripts/run-real-tests.mjs`
- `scripts/observe-in-blender.mjs`
- `assets/sprite.blend`

## Dependency Rules

- Must not import `src/agent-runtime` or `src/avatar-mediator`.
- Owns Node process-facing details behind the bridge interface.

## Test Ownership

- Shares ownership of the explicit graceful degradation observation boundary.
- Shares ownership of the explicit user semantic control observation boundary once a bounded semantic request reaches the bridge-owned execution path.
- Owns the visual-path-first Sprite binding queue for the current iteration.
- Covered by dependency and traceability guardrails.
- Supported by frozen support tests for fixed-scene binding and richer Sprite observation detail.