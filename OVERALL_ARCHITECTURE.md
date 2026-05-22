# OVERALL_ARCHITECTURE

## Stage

Implementation Design

## Scope

This contract realizes the intent graph in `design/KG/SystemArchitecture.json` for the first embodied-agent baseline: a VS Code-local agent runtime drives a bounded avatar embodiment mediator, which in turn drives a local Blender bridge over a stdio JSON boundary.

## Stable Elements

### `src/agent-runtime`

- Responsibility: own the VS Code-side control loop boundary and convert runtime lifecycle changes into mediator calls.
- Directly implements: `InteractionStateDrivenEmbodiment`, `AgentResponseLifecycleState`.
- Indirectly carries: `EmbodiedAgentInteraction` through `src/avatar-mediator`.
- May depend on: `src/avatar-mediator` only.
- Must not depend on: `src/blender-bridge` concrete transport internals.

### `src/avatar-mediator`

- Responsibility: own truthful, policy-bounded mapping from agent lifecycle state to semantic avatar actions and graceful degradation semantics.
- Directly implements: `AvatarEmbodimentMediator`, `ApprovedAvatarActionVocabulary`, `TruthfulEmbodimentPrinciple`, `GracefulAvatarDegradationConstraint`, `UserAvatarOverrideConstraint`.
- Indirectly carries: `EmbodiedAgentInteraction` via the runtime control loop.
- May depend on: `src/blender-bridge` contract surface only.
- Must not depend on: Blender process details outside the bridge contract.

### `src/blender-bridge`

- Responsibility: own the local stdio JSON integration boundary and structured execution feedback contract for Blender.
- Directly implements: `LocalBlenderAvatarEndpoint`, `StructuredAvatarExecutionFeedback`.
- May depend on: Node runtime/process primitives.
- Must not depend on: `src/agent-runtime` or `src/avatar-mediator`.

### `tests`

- Responsibility: own explicit acceptance entrypoints, frozen critical non-explicit guardrails, and supporting fixtures.
- Explicit testcase entrypoints live under `tests/explicit` and are read-only acceptance baselines for later coding work.
- Critical non-explicit tests live under `tests/architecture`.
- Supporting non-explicit tests live under `tests/support`.

## Dependency Direction

`src/agent-runtime` -> `src/avatar-mediator` -> `src/blender-bridge`

The dependency direction is stable and one-way. Reverse imports are architectural drift.

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

## Critical Non-Explicit Guardrails

### Architecture boundary guards

- Entry point: `tests/architecture/boundary-guard.test.ts`
- Protects: stable directory import boundaries.

### Dependency direction guards

- Entry point: `tests/architecture/dependency-direction-guard.test.ts`
- Protects: one-way dependency direction and bridge abstraction use.

### Explicit entrypoint correctness guards

- Entry point: `tests/architecture/explicit-entrypoint-guard.test.ts`
- Protects: presence of frozen explicit entrypoints and baseline fixture keys.

### Key implementation traceability guards

- Entry point: `tests/architecture/traceability-guard.test.ts`
- Protects: contract-to-intent mappings and testcase ownership references.

## Supporting Non-Explicit Guardrails

- Entry point: `tests/support/structured-feedback-fixture.test.ts`
- Purpose: keep the structured feedback fixture shape stable for later coding-stage tests.

- Entry point: `tests/support/avatar-mute-override.test.ts`
- Purpose: keep user mute or disable independent from the runtime control-loop entrypoint.

- Entry point: `tests/support/lifecycle-mapping-contract.test.ts`
- Purpose: keep response-start and response-complete semantic mapping fast to validate without requiring Blender.

- Entry point: `tests/support/preemption-policy.test.ts`
- Purpose: reserve the newest-state-wins guardrail at the mediator boundary for later coding work.

## Current Expected Execution State

- `npm test` runs architecture guards and support guardrails locally; the three explicit acceptance baselines skip unless the Blender adapter environment variables are configured.
- `npm run test:real` is the dedicated entrypoint for the real-environment explicit baselines and now launches the repository-local Blender and disconnect adapter scripts automatically.
- `npm run observe:blender` is a parallel human-observation entrypoint that opens Blender with a visible scene annotation path and replays a short state sequence without changing the frozen explicit baselines.
- Positive real-environment baselines currently pass against the local Blender installation discovered on this machine.
- The explicit graceful-degradation baseline now passes through the repository-local disconnect adapter without additional manual setup.
- Optional override environment for positive real-environment baselines: `BLENDER_EXECUTABLE`, `BLENDER_ADAPTER_TIMEOUT_MS`, and `BLENDER_WORKING_DIRECTORY`.
- Optional environment for visual observation: `BLENDER_VISUAL_BLEND_FILE`, `BLENDER_VISUAL_TIMEOUT_MS`, `AUTO_SKEPTURE_VISUAL_HOLD_SECONDS`, and `BLENDER_VISUAL_FACTORY_STARTUP=0` when the chosen `.blend` file should remain untouched by factory startup.
- Advanced adapter override environment remains available: `BLENDER_ADAPTER_COMMAND`, with optional `BLENDER_ADAPTER_ARGS`, `BLENDER_ADAPTER_CWD`, and `BLENDER_ADAPTER_TIMEOUT_MS`.
- Optional environment for the explicit degradation baseline: `BLENDER_ADAPTER_DISCONNECT_COMMAND`, `BLENDER_ADAPTER_DISCONNECT_ARGS`, and `BLENDER_ADAPTER_DISCONNECT_CWD`.