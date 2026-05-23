# OVERALL_ARCHITECTURE

## Stage

Implementation Design

## Scope

This contract realizes the intent graph in `design/KG/SystemArchitecture.json` for the first embodied-agent baseline, the current Sprite observation iteration, and the new bounded user semantic control path: a VS Code-local runtime boundary owns both lifecycle-driven embodiment and host-owned semantic control assets, hands approved semantic actions to a bounded avatar embodiment mediator, and uses a local Blender bridge over a stdio JSON boundary.

## Stable Elements

### `src/agent-runtime`

- Responsibility: own the VS Code-side control loop boundary and convert runtime lifecycle changes into mediator calls.
- Responsibility: own the host-side semantic control boundary assets for bounded user avatar requests, including the current workspace channel materialized by `.github/agents/blender-avatar-controller.agent.md`, `scripts/control-avatar.mjs`, and `scripts/avatar-intent-mapping.mjs`.
- Responsibility: keep host-owned semantic control assets routed through the runtime/mediator semantic boundary rather than treating the bridge adapter as a first-class host API.
- Directly implements: `InteractionStateDrivenEmbodiment`, `AgentResponseLifecycleState`.
- Directly implements: `UserDirectedSemanticEmbodiment`, `UserSemanticAvatarControlInterface`, `UserSemanticAvatarActionRequest` through host-owned semantic control assets attached to this boundary.
- Indirectly carries: `EmbodiedAgentInteraction` through `src/avatar-mediator`.
- May depend on: `src/avatar-mediator` only.
- Must not depend on: `src/blender-bridge` concrete transport internals.

### `src/avatar-mediator`

- Responsibility: own truthful, policy-bounded mapping from agent lifecycle state to semantic avatar actions and graceful degradation semantics.
- Responsibility: own execution of approved user-requested semantic avatar actions once the host-side control boundary has reduced a request to the bounded semantic vocabulary.
- Responsibility: keep Sprite asset names, rig names, and preset selection out of the runtime-facing semantic contract.
- Directly implements: `AvatarEmbodimentMediator`, `ApprovedAvatarActionVocabulary`, `TruthfulEmbodimentPrinciple`, `GracefulAvatarDegradationConstraint`, `UserAvatarOverrideConstraint`.
- Indirectly carries: `EmbodiedAgentInteraction` via the runtime control loop.
- May depend on: `src/blender-bridge` contract surface only.
- Must not depend on: Blender process details outside the bridge contract.

### `src/blender-bridge`

- Responsibility: own the local stdio JSON integration boundary and structured execution feedback contract for Blender.
- Responsibility: own fixed-scene Sprite observation binding for `npm run observe:blender`, including the current iteration's `assets/sprite.blend` default target.
- Responsibility: own Sprite preset selection and rig-specific control logic inside Blender-side assets while preserving the existing `BlenderFeedback` field shape.
- Directly implements: `LocalBlenderAvatarEndpoint`, `StructuredAvatarExecutionFeedback`.
- May depend on: Node runtime/process primitives.
- Must not depend on: `src/agent-runtime` or `src/avatar-mediator`.

### `tests`

- Responsibility: own explicit acceptance entrypoints, frozen critical non-explicit guardrails, and supporting fixtures.
- Explicit testcase entrypoints live under `tests/explicit` and are read-only acceptance baselines for later coding work.
- Critical non-explicit tests live under `tests/architecture`.
- Supporting non-explicit tests live under `tests/support`.
- Responsibility: freeze the new user-semantic-control acceptance entrypoint and the critical guardrails that keep that entrypoint bounded to approved semantic actions and stable ownership.

## Dependency Direction

`src/agent-runtime` -> `src/avatar-mediator` -> `src/blender-bridge`

The dependency direction is stable and one-way. Reverse imports are architectural drift.

For the current Sprite iteration, ownership is additionally frozen as follows:

- `src/agent-runtime` owns lifecycle triggers only.
- `src/agent-runtime` owns host semantic control intake only.
- `src/avatar-mediator` owns semantic action selection only.
- `src/blender-bridge` and its Blender-side assets own fixed-scene binding, Sprite preset selection, and richer observation detail formatting.
- The headless explicit acceptance path remains semantically equivalent and read-only; Sprite-specific visual work lands on the observation path first.
- The current workspace custom-agent channel remains a host-owned asset under the runtime boundary, not a separate fourth architecture layer.

## Explicit Testcase Ownership

### `TC-EX-001 ResponseStartEmbodiment`

- Baseline entry point: `tests/explicit/response-start-embodiment.test.ts`
- Executable entry point: `scripts/run-tc-ex-001.mjs`
- Control point: `AgentRuntime.handleResponseLifecycle({ type: "response_start" })`
- Observation point: returned mediator outcome plus structured feedback from the configured Blender adapter command.
- Protected baseline: `tests/fixtures/explicit-baselines.ts`

### `TC-EX-002 ResponseCompleteEmbodiment`

- Baseline entry point: `tests/explicit/response-complete-embodiment.test.ts`
- Executable entry point: `scripts/run-tc-ex-002.mjs`
- Control point: `AgentRuntime.handleResponseLifecycle({ type: "response_complete" })`
- Observation point: returned mediator outcome plus structured feedback from the configured Blender adapter command.
- Protected baseline: `tests/fixtures/explicit-baselines.ts`

### `TC-EX-003 BlenderDisconnectGracefulDegradation`

- Baseline entry point: `tests/explicit/blender-disconnect-graceful-degradation.test.ts`
- Executable entry point: `scripts/run-tc-ex-003.mjs`
- Control point: `AvatarEmbodimentMediator.executeAction(...)` against a real stdio bridge configured to be unavailable or disconnected.
- Observation point: degraded surfaced status, neutral-idle recovery target, and continued runtime-safe outcome.
- Protected baseline: `tests/fixtures/explicit-baselines.ts`

### `TC-EX-004 UserSemanticAvatarRequestEmbodiment`

- Baseline entry point: `tests/explicit/user-semantic-avatar-request-embodiment.test.ts`
- Executable entry point: `scripts/run-tc-ex-004.mjs`
- Control point: `scripts/control-avatar.mjs --intent "show a thinking state" --request-id <testcase-id>` as the current concrete host-owned semantic control command.
- Observation point: the returned semantic control result exposes `action: "thinking"` and structured Blender feedback with an acknowledged thinking-compatible state transition.
- Protected baseline: `tests/fixtures/explicit-baselines.ts`

## Critical Non-Explicit Guardrails

### Architecture boundary guards

- Entry point: `tests/architecture/boundary-guard.test.ts`
- Protects: stable directory import boundaries.

- Entry point: `tests/architecture/semantic-control-boundary-guard.test.ts`
- Protects: the host-owned semantic control asset boundary from bypassing runtime and mediator ownership by calling the bridge adapter directly.

### Dependency direction guards

- Entry point: `tests/architecture/dependency-direction-guard.test.ts`
- Protects: one-way dependency direction and bridge abstraction use.

### Explicit entrypoint correctness guards

- Entry point: `tests/architecture/explicit-entrypoint-guard.test.ts`
- Protects: presence of frozen explicit entrypoints and baseline fixture keys.

- Entry point: `tests/architecture/user-semantic-entrypoint-guard.test.ts`
- Protects: the user semantic control entrypoint rejects unsupported low-level rig requests instead of coercing them into Blender automation.

### Key implementation traceability guards

- Entry point: `tests/architecture/traceability-guard.test.ts`
- Protects: contract-to-intent mappings, testcase ownership references, and bridge ownership of Sprite observation binding under `assets/sprite.blend`.

## Supporting Non-Explicit Guardrails

- Entry point: `tests/support/structured-feedback-fixture.test.ts`
- Purpose: keep the structured feedback fixture shape stable for later coding-stage tests.

- Entry point: `tests/support/avatar-mute-override.test.ts`
- Purpose: keep user mute or disable independent from the runtime control-loop entrypoint.

- Entry point: `tests/support/lifecycle-mapping-contract.test.ts`
- Purpose: keep response-start and response-complete semantic mapping fast to validate without requiring Blender.

- Entry point: `tests/support/avatar-intent-mapping.test.ts`
- Purpose: keep representative natural-language semantic mapping coverage fast to validate without requiring Blender.

- Entry point: `tests/support/preemption-policy.test.ts`
- Purpose: reserve the newest-state-wins guardrail at the mediator boundary for later coding work.

- Entry point: `tests/support/sprite-visual-scene-binding.test.ts`
- Purpose: intentionally fail until the visual observation path defaults to `assets/sprite.blend` while still allowing explicit override.

- Entry point: `tests/support/sprite-feedback-detail-contract.test.ts`
- Purpose: intentionally fail until the visual Blender feedback detail reports which Sprite preset or action family was selected without expanding the bridge protocol shape.

## Current Expected Execution State

- `npm test` runs architecture guards and support guardrails locally; the four explicit acceptance baselines skip unless the Blender adapter environment variables are configured.
- `npm run test:real` is the dedicated entrypoint for the real-environment explicit baselines and now launches the repository-local Blender and disconnect adapter scripts automatically.
- `npm run observe:blender` is a parallel human-observation entrypoint that opens Blender with a visible scene annotation path and replays a short state sequence without changing the frozen explicit baselines.
- `npm run test:real` currently passes all four explicit baselines against the repository-local Blender and disconnect adapters on this machine.
- The explicit graceful-degradation baseline now passes through the repository-local disconnect adapter without additional manual setup.
- The explicit semantic-control baseline is executable through `scripts/run-tc-ex-004.mjs` and currently demonstrates the bounded host-owned semantic control path.
- `tests/architecture/semantic-control-boundary-guard.test.ts` currently passes because `scripts/control-avatar.mjs` delegates semantic execution through the runtime/mediator boundary instead of spawning the bridge adapter directly.
- `tests/support/sprite-visual-scene-binding.test.ts` and `tests/support/sprite-feedback-detail-contract.test.ts` currently pass, confirming that the observation path defaults to `assets/sprite.blend` and that Sprite-specific detail remains inside `BlenderFeedback.detail`.
- The remaining Coding/Repair queue is now limited to unfinished support work such as the mediator preemption guardrail recorded in `tests/support/preemption-policy.test.ts` and tooling defects such as the `npm run validate:system-architecture` module-format mismatch.
- Optional override environment for positive real-environment baselines: `BLENDER_EXECUTABLE`, `BLENDER_ADAPTER_TIMEOUT_MS`, and `BLENDER_WORKING_DIRECTORY`.
- Optional environment for visual observation: `BLENDER_VISUAL_BLEND_FILE`, `BLENDER_VISUAL_TIMEOUT_MS`, `AUTO_SKEPTURE_VISUAL_HOLD_SECONDS`, and `BLENDER_VISUAL_FACTORY_STARTUP=0` when the chosen `.blend` file should remain untouched by factory startup.
- Advanced adapter override environment remains available: `BLENDER_ADAPTER_COMMAND`, with optional `BLENDER_ADAPTER_ARGS`, `BLENDER_ADAPTER_CWD`, and `BLENDER_ADAPTER_TIMEOUT_MS`.
- Optional environment for the explicit degradation baseline: `BLENDER_ADAPTER_DISCONNECT_COMMAND`, `BLENDER_ADAPTER_DISCONNECT_ARGS`, and `BLENDER_ADAPTER_DISCONNECT_CWD`.