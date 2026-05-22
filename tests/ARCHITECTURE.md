# ARCHITECTURE

## Stable Element

`tests`

## Responsibility

- Freeze read-only explicit acceptance entrypoints under `tests/explicit`.
- Freeze critical non-explicit architecture guardrails under `tests/architecture`.
- Host supporting fixtures and support tests under `tests/fixtures` and `tests/support`.
- Carry expected-failing support tests that define the Coding/Repair queue when implementation architecture is complete but Sprite behavior is not yet implemented.

## Protected Baselines

- `tests/fixtures/explicit-baselines.ts`
- `tests/explicit/response-start-embodiment.test.ts`
- `tests/explicit/response-complete-embodiment.test.ts`
- `tests/explicit/blender-disconnect-graceful-degradation.test.ts`
- `scripts/run-tc-ex-001.mjs`
- `scripts/run-tc-ex-002.mjs`
- `scripts/run-tc-ex-003.mjs`

## Critical Guardrails

- Boundary guard
- Dependency direction guard
- Explicit entrypoint correctness guard
- Traceability guard

Critical traceability scope for the current iteration also protects bridge ownership of Sprite observation binding, the `assets/sprite.blend` contract reference, and the rule that richer Sprite feedback stays inside the existing `detail` field.

## Supporting Guardrails

- Structured feedback fixture shape test
- Fake-driven lifecycle mapping and mute tests as fast support guardrails
- Executable acceptanceCriteria path guard for intent testcase launchers
- Real-environment explicit tests launched through `npm run test:real` and the repository-local Blender and disconnect adapters
- `tests/support/sprite-visual-scene-binding.test.ts` to drive fixed-scene binding on the observation path; expected to fail until Coding/Repair updates the visual adapter.
- `tests/support/sprite-feedback-detail-contract.test.ts` to drive richer Sprite preset detail on the observation path; expected to fail until Coding/Repair updates the visual driver.