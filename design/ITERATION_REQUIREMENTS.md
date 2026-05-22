# Iteration Requirements: Sprite Avatar Integration

## Stage

Coding/Repair handoff input for the next implementation iteration.

## Purpose

This document summarizes the next executable iteration scope for AUTO-SKEPTURE after the repository proved three things:

- the VS Code-side runtime, mediator, and Blender bridge are working end-to-end;
- the explicit real-environment baselines can run against local Blender;
- a fixed Blender scene at `assets/sprite.blend` can now be loaded by the repository-local visual observation path.

The goal of this iteration is to replace the current generic visual demo behavior with Sprite-specific action and expression playback while preserving the existing intent baseline and explicit testcase boundaries.

## Repository-Confirmed Baseline

- Intent baseline remains defined by `design/KG/SystemArchitecture.json`.
- The semantic action vocabulary remains bounded to `thinking`, `confirming`, `neutral_idle`, and related restrained states.
- Explicit testcase entrypoints remain frozen under `tests/explicit` and wrapper scripts under `scripts/run-tc-ex-001.mjs`, `scripts/run-tc-ex-002.mjs`, and `scripts/run-tc-ex-003.mjs`.
- `npm run test:real` remains the real-environment acceptance path and must not be repurposed into a human-observation-only path.
- `npm run observe:blender` is already available as a parallel observation path.
- `assets/sprite.blend` was loaded successfully through the visual observation path.
- Scene inspection identified a likely main production rig `RIG-Sprite`, a secondary rig `META-Sprite`, multiple face-related meshes with shape keys, and a set of reusable Sprite-specific actions.

## Iteration Objective

Implement a first Sprite-specific embodiment path so the agent's semantic lifecycle states drive visible Sprite character behavior rather than generic text and default-object transforms.

## In Scope

### 1. Fixed character binding

- Treat `assets/sprite.blend` as the fixed avatar scene for this iteration.
- Prefer `RIG-Sprite` as the main controllable avatar rig unless implementation evidence proves `META-Sprite` is the correct runtime control point.
- Keep the binding local-machine-first and Blender-local only.

### 2. Semantic-to-Sprite mapping

- Map `neutral_idle` to a stable idle presentation using existing Sprite assets.
- Map `thinking` to a truthful focus or pondering presentation using existing Sprite actions and/or face controls.
- Map `confirming` to a truthful positive completion presentation using existing Sprite actions and/or face controls.
- Keep mappings within the approved semantic vocabulary from the intent graph.
- Prefer reuse of pre-authored Sprite actions before inventing low-level rig manipulation.

### 3. Face and pose control usage

- Use existing discovered Sprite resources where practical, including actions such as:
  - `ANI-Sprite_Idle_Standing`
  - `ANI-Sprite_Idle_Chillin`
  - `Sprite_eyemask_focus`
  - `Sprite_eyemask_happy`
  - `Sprite_eyemask_squint`
  - `Sprite_mouth_smileclosed`
  - `Sprite_eyes_closed`
- Use discovered face-related meshes and shape keys only when action playback alone is insufficient.
- Keep all control logic behind the Blender-side driver boundary rather than leaking Sprite rig details into the mediator or runtime.

### 4. Observation and structured feedback

- Preserve structured feedback output so observation remains machine-checkable and not dependent on human viewing alone.
- Extend feedback detail if needed to include which Sprite action or face preset was applied.
- Keep `npm run observe:blender` usable as the human-visible debug and review entrypoint for Sprite behavior.

### 5. Inspection and repeatability

- Keep `npm run inspect:blender -- <path-to-blend>` as a reusable scene inspection tool for later avatars.
- Allow future iterations to reuse the same inspection path for other fixed characters without redesigning the bridge protocol.

## Out Of Scope

- No intent graph redesign.
- No changes to the explicit testcase target semantics.
- No general Blender scene automation baseline.
- No voice sync, lip sync from audio, camera choreography, lighting choreography, or scene direction.
- No multi-avatar support.
- No networked or remote Blender execution.
- No manual puppeteering interface.
- No requirement in this iteration to support arbitrary third-party rigs beyond `assets/sprite.blend`.

## Functional Requirements

### FR-1 Sprite idle behavior

When the system receives semantic action `neutral_idle`, the visual driver shall apply a stable Sprite idle state that reads as neutral and non-degraded.

### FR-2 Sprite thinking behavior

When the system receives semantic action `thinking`, the visual driver shall apply a visible Sprite state that reads as focused, pondering, or attentive without overstating certainty.

### FR-3 Sprite confirming behavior

When the system receives semantic action `confirming`, the visual driver shall apply a visible Sprite state that reads as confirming, settling, or lightly positive completion.

### FR-4 Truthful embodiment

The visual state chosen for each semantic action shall remain semantically truthful to the assistant state and shall not exaggerate confidence, intensity, or emotional affect beyond the intent constraints.

### FR-5 Existing architecture preservation

Sprite-specific control logic shall remain inside Blender adapter or Blender driver assets and shall not violate the stable dependency direction:

`src/agent-runtime` -> `src/avatar-mediator` -> `src/blender-bridge`

### FR-6 Fallback compatibility

If the Sprite-specific binding cannot be applied in a given run, the system shall degrade in a diagnosable way without breaking the assistant control loop or the explicit degradation baseline.

### FR-7 Observable application result

For each semantic action applied during visual observation, the Blender-side response shall state enough detail to confirm what Sprite-specific behavior was selected.

## Non-Functional Requirements

### NFR-1 Local performance envelope

The Sprite-specific visual path should remain responsive enough for interactive observation on the local machine and should not introduce avoidable Blender startup or adapter stalls beyond the current local model.

### NFR-2 Minimal surface-area change

The iteration should prefer the smallest credible implementation change that upgrades the visible behavior from generic demo output to Sprite-specific output.

### NFR-3 Maintainability

Sprite rig details should be isolated so later replacement of the fixed avatar scene affects the Blender-side mapping layer more than the runtime or mediator.

### NFR-4 Reproducibility

The same local commands should keep working on the same machine:

- `npm run build`
- `npm test`
- `npm run test:real`
- `npm run observe:blender`
- `npm run inspect:blender -- assets/sprite.blend`

## Constraints

- Respect the intent-side principle `TruthfulEmbodimentPrinciple`.
- Respect the intent-side constraint `GracefulAvatarDegradationConstraint`.
- Respect the intent-side constraint `UserAvatarOverrideConstraint`.
- Keep the semantic action vocabulary bounded; do not expose raw bone or shape-key names outside Blender-side implementation assets.
- Do not weaken or rewrite the frozen explicit acceptance baselines.
- Preserve structured feedback as an observation boundary.

## Candidate Control Points Confirmed From Scene Inspection

### Likely main rig

- `RIG-Sprite`

### Secondary rig

- `META-Sprite`

### Face-related meshes with shape keys

- `GEO-sprite_eye.L`
- `GEO-sprite_eye.R`
- `GEO-sprite_teeth_top`
- `GEO-sprite_teeth_btm`
- `GEO-sprite_body_head_rig_helper`
- `GEO-sprite_cap`

### Candidate pre-authored actions

- `ANI-Sprite_Idle_Standing`
- `ANI-Sprite_Idle_Chillin`
- `Sprite_eyemask_focus`
- `Sprite_eyemask_happy`
- `Sprite_eyemask_squint`
- `Sprite_eyes_closed`
- `Sprite_mouth_smileclosed`
- `Sprite_mouth_frownclosed`
- `RIG.Sprite_LipsUp`
- `RIG.Sprite_LipsWide`

## Acceptance For This Iteration

This iteration is complete when all of the following are true:

1. `npm run observe:blender` with `assets/sprite.blend` visibly drives Sprite-specific behavior for `thinking`, `confirming`, and `neutral_idle`.
2. The chosen behaviors are semantically truthful and visibly distinct.
3. Structured feedback still reports successful action acknowledgement and meaningful observed state detail.
4. `npm run build` still passes.
5. `npm test` still passes.
6. Existing explicit real-environment baselines are not weakened or redefined.

## Recommended Iteration Order

1. Replace generic visual-state demo behavior in `scripts/blender-visual-driver.py` with Sprite-specific action selection.
2. Keep the mapping internal to Blender-side assets and avoid bridge protocol expansion unless observation detail requires it.
3. Re-run `npm run observe:blender` against `assets/sprite.blend` until the three semantic states are visually distinct and stable.
4. Re-run `npm run build` and `npm test` to confirm no architectural regression.
5. Only after the visual path is stable, consider whether the headless real-environment path should share the same Sprite mapping logic.

## Open Decisions For The Next Coding Pass

- Whether `RIG-Sprite` can be driven reliably through action playback alone, or whether some states should mix action playback with targeted shape-key changes.
- Whether `neutral_idle` should use `ANI-Sprite_Idle_Standing` or `ANI-Sprite_Idle_Chillin` as the default baseline.
- Whether `thinking` is better expressed through `Sprite_eyemask_focus` plus eyelid control, or through a dedicated idle-plus-face combination.
- Whether `confirming` should prefer `Sprite_eyemask_happy`, `Sprite_mouth_smileclosed`, or a blended preset.