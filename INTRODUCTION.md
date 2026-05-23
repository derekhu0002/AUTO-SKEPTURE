# AUTO-SKEPTURE

AUTO-SKEPTURE is a local-machine-first VS Code embodiment prototype. A runtime layer emits bounded semantic avatar actions, a mediator keeps those actions truthful to assistant state, and a Blender bridge executes them through repository-local adapters.

## External Command Surface

- `npm test`
  Runs architecture guardrails and local support tests. The explicit real-environment tests remain skipped here unless a real Blender adapter is configured.

- `npm run test:real`
  Runs the frozen explicit acceptance entrypoints against the repository-local Blender and disconnect adapters.

- `npm run observe:blender`
  Opens the visual observation path. By default it now targets `assets/sprite.blend` unless `BLENDER_VISUAL_BLEND_FILE` overrides that scene.

- `npm run inspect:blender -- <path-to-blend>`
  Inspects a Blender scene and reports reusable rig, mesh, shape-key, and action inventory details.

- `npm run control:avatar -- --intent "<semantic request>"`
  Sends a bounded semantic avatar request through the runtime and mediator. By default this uses the repository-local adapter path; when `BLENDER_LIVE_PORT` is set, it can instead target an already-open Blender instance running the live control server script.

## Observation Feedback Contract

The Blender bridge keeps the same four-field structured feedback shape:

- `acknowledged`
- `status`
- `observedState`
- `detail`

For the Sprite observation path, `detail` now includes the selected Sprite preset or action-family description while preserving the existing payload shape.

## Local Environment Notes

- `npm test` requires only the local Node.js toolchain.
- `npm run test:real` and `npm run observe:blender` use repository-local adapter scripts that discover `blender.exe` automatically when possible, or accept `BLENDER_EXECUTABLE` when needed.
- `BLENDER_VISUAL_BLEND_FILE` remains the explicit override for observation-scene selection.
- To control an already-open Blender window, open `assets/sprite.blend`, run `scripts/blender-live-control-server.py` once from Blender's Scripting workspace, and keep Blender open after the script prints its listening message. Then set `BLENDER_LIVE_PORT` in the VS terminal before invoking `npm run control:avatar`.