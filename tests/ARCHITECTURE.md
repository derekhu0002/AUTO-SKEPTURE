# ARCHITECTURE

## Stable Element

`tests`

## Responsibility

- Freeze read-only explicit acceptance entrypoints under `tests/explicit`.
- Freeze critical non-explicit architecture guardrails under `tests/architecture`.
- Host supporting fixtures and support tests under `tests/fixtures` and `tests/support`.
- Carry supporting guardrails that either validate the current implementation state or define the remaining Coding/Repair queue when executable coverage is not yet complete.

## Protected Baselines

- `tests/fixtures/explicit-baselines.ts`
- `tests/explicit/response-start-embodiment.test.ts`
- `tests/explicit/response-complete-embodiment.test.ts`
- `tests/explicit/blender-disconnect-graceful-degradation.test.ts`
- `tests/explicit/user-semantic-avatar-request-embodiment.test.ts`
- `scripts/run-tc-ex-001.mjs`
- `scripts/run-tc-ex-002.mjs`
- `scripts/run-tc-ex-003.mjs`
- `scripts/run-tc-ex-004.mjs`

## Critical Guardrails

- Boundary guard
- Semantic control boundary guard
- Dependency direction guard
- Explicit entrypoint correctness guard
- User semantic entrypoint correctness guard
- Traceability guard

Critical traceability scope for the current iteration also protects bridge ownership of Sprite observation binding, the `assets/sprite.blend` contract reference, and the rule that richer Sprite feedback stays inside the existing `detail` field.

Critical explicit-entry correctness scope for the current iteration also protects the rule that unsupported low-level rig requests are rejected at the semantic control entrypoint instead of being coerced into Blender automation.

## Supporting Guardrails

- Structured feedback fixture shape test
- Fake-driven lifecycle mapping and mute tests as fast support guardrails
- Natural-language intent mapping support coverage in `tests/support/avatar-intent-mapping.test.ts`
- Executable acceptanceCriteria path guard for intent testcase launchers
- Real-environment explicit tests launched through `npm run test:real` and the repository-local Blender and disconnect adapters
- `tests/support/sprite-visual-scene-binding.test.ts` to freeze fixed-scene binding on the observation path and keep `assets/sprite.blend` as the default visual target unless explicitly overridden.
- `tests/support/sprite-feedback-detail-contract.test.ts` to freeze the rule that Sprite-specific observation detail remains inside the existing `detail` field.
- `tests/support/preemption-policy.test.ts` to reserve the newest-state-wins mediator guardrail as the remaining support-test coding queue; it is currently materialized as `test.todo` and not yet executable.