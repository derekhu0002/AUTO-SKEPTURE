import json
import math
import os
import sys
import time

import bpy


STATE_COLORS = {
    "thinking": (0.2, 0.5, 1.0, 1.0),
    "confirming": (0.1, 0.8, 0.3, 1.0),
    "neutral_idle": (0.75, 0.75, 0.75, 1.0),
    "restrained_apology": (1.0, 0.55, 0.2, 1.0),
}

STATE_ROTATIONS = {
    "thinking": (0.0, 0.0, math.radians(30.0)),
    "confirming": (0.0, math.radians(18.0), 0.0),
    "neutral_idle": (0.0, 0.0, 0.0),
    "restrained_apology": (math.radians(-12.0), 0.0, 0.0),
}


def main() -> int:
    try:
        separator_index = sys.argv.index("--")
    except ValueError:
        write_error("Missing '--' separator for Blender adapter arguments.")
        return 1

    args = sys.argv[separator_index + 1 :]
    if len(args) != 2:
        write_error("Expected request and response file paths.")
        return 1

    request_path, response_path = args

    with open(request_path, "r", encoding="utf-8-sig") as request_file:
        request = json.load(request_file)

    action = request.get("action", "unknown")
    request_id = request.get("requestId", "unknown-request")

    scene = bpy.context.scene
    scene["auto_skepture_last_action"] = action
    scene["auto_skepture_last_request_id"] = request_id
    scene["auto_skepture_last_detail"] = build_detail(action, request_id)

    ensure_scene_defaults(scene)
    status_object = ensure_status_text_object()
    status_material = ensure_status_material()
    apply_visual_state(status_object, status_material, action, request_id)

    dwell_seconds = parse_dwell_seconds(os.environ.get("AUTO_SKEPTURE_VISUAL_HOLD_SECONDS"))
    if dwell_seconds > 0:
        bpy.ops.wm.redraw_timer(type="DRAW_WIN_SWAP", iterations=1)
        time.sleep(dwell_seconds)

    response = {
        "acknowledged": True,
        "status": "ok",
        "observedState": action,
        "detail": build_detail(action, request_id),
    }

    with open(response_path, "w", encoding="utf-8") as response_file:
        json.dump(response, response_file)

    return 0


def ensure_scene_defaults(scene: bpy.types.Scene) -> None:
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    if scene.camera is not None:
        scene.camera.location = (0.0, -9.5, 2.8)
        scene.camera.rotation_euler = (math.radians(78.0), 0.0, 0.0)


def ensure_status_text_object() -> bpy.types.Object:
    object_name = "AUTO_SKEPTURE_STATUS"
    existing = bpy.data.objects.get(object_name)
    if existing is not None:
      return existing

    bpy.ops.object.text_add(location=(-2.8, 0.0, 1.2), rotation=(math.radians(90.0), 0.0, math.radians(90.0)))
    status_object = bpy.context.object
    status_object.name = object_name
    status_object.data.name = f"{object_name}_CURVE"
    status_object.scale = (0.45, 0.45, 0.45)
    status_object.data.align_x = "CENTER"
    status_object.data.align_y = "CENTER"
    status_object.data.extrude = 0.06
    status_object.data.bevel_depth = 0.015
    return status_object


def ensure_status_material() -> bpy.types.Material:
    material_name = "AUTO_SKEPTURE_STATUS_MATERIAL"
    material = bpy.data.materials.get(material_name)
    if material is None:
        material = bpy.data.materials.new(material_name)
        material.use_nodes = True

    node_tree = material.node_tree
    principled = node_tree.nodes.get("Principled BSDF")
    if principled is None:
        principled = node_tree.nodes.new("ShaderNodeBsdfPrincipled")
    principled.inputs["Emission Color"].default_value = STATE_COLORS["neutral_idle"]
    principled.inputs["Emission Strength"].default_value = 2.5
    principled.inputs["Base Color"].default_value = STATE_COLORS["neutral_idle"]
    return material


def apply_visual_state(
    status_object: bpy.types.Object,
    status_material: bpy.types.Material,
    action: str,
    request_id: str,
) -> None:
    color = STATE_COLORS.get(action, STATE_COLORS["neutral_idle"])
    rotation = STATE_ROTATIONS.get(action, STATE_ROTATIONS["neutral_idle"])
    status_object.data.body = f"AUTO-SKEPTURE\n{action}\n{request_id}"
    status_object.rotation_euler = rotation

    if status_object.data.materials:
        status_object.data.materials[0] = status_material
    else:
        status_object.data.materials.append(status_material)

    principled = status_material.node_tree.nodes.get("Principled BSDF")
    if principled is not None:
        principled.inputs["Base Color"].default_value = color
        principled.inputs["Emission Color"].default_value = color

    default_cube = bpy.data.objects.get("Cube")
    if default_cube is not None:
        default_cube.rotation_euler = rotation
        default_cube.scale = select_cube_scale(action)


def select_cube_scale(action: str):
    if action == "thinking":
        return (1.0, 1.0, 1.4)
    if action == "confirming":
        return (1.3, 1.3, 1.3)
    if action == "restrained_apology":
        return (0.85, 0.85, 0.85)
    return (1.0, 1.0, 1.0)


def parse_dwell_seconds(raw_value: str | None) -> float:
    if raw_value is None or raw_value == "":
        return 8.0

    try:
        value = float(raw_value)
    except ValueError as error:
        raise RuntimeError("AUTO_SKEPTURE_VISUAL_HOLD_SECONDS must be numeric when set.") from error

    if value < 0:
        raise RuntimeError("AUTO_SKEPTURE_VISUAL_HOLD_SECONDS must not be negative.")

    return value


def build_detail(action: str, request_id: str) -> str:
    return f"Blender {bpy.app.version_string} visually rendered {action} for {request_id}."


def write_error(message: str) -> None:
    sys.stderr.write(message + "\n")


if __name__ == "__main__":
    raise SystemExit(main())