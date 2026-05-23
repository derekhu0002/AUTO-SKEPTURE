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
    "thinking": (math.radians(4.0), math.radians(-8.0), math.radians(34.0)),
    "confirming": (math.radians(-6.0), math.radians(22.0), math.radians(-10.0)),
    "neutral_idle": (0.0, 0.0, 0.0),
    "restrained_apology": (math.radians(-18.0), math.radians(-6.0), math.radians(12.0)),
}

SPRITE_RIG_CANDIDATES = (
    "RIG-Sprite",
    "META-Sprite",
)

SPRITE_FACE_OBJECTS = (
    "GEO-sprite_eye.L",
    "GEO-sprite_eye.R",
    "GEO-sprite_teeth_top",
    "GEO-sprite_teeth_btm",
    "GEO-sprite_body_head_rig_helper",
    "GEO-sprite_cap",
)

SPRITE_HEAD_OBJECTS = {
    "GEO-sprite_body_head_rig_helper",
    "GEO-sprite_cap",
}

SPRITE_OBJECT_ROTATIONS = {
    "thinking": (math.radians(6.0), math.radians(-7.0), math.radians(16.0)),
    "confirming": (math.radians(-6.0), math.radians(8.0), math.radians(-14.0)),
    "neutral_idle": (0.0, 0.0, 0.0),
    "restrained_apology": (math.radians(12.0), math.radians(-5.0), math.radians(18.0)),
}

SPRITE_OBJECT_LOCATIONS = {
    "thinking": (-0.08, 0.04, 0.06),
    "confirming": (0.02, 0.0, 0.12),
    "neutral_idle": (0.0, 0.0, 0.0),
    "restrained_apology": (0.05, -0.04, -0.08),
}

SPRITE_FACE_ROTATIONS = {
    "thinking": (math.radians(2.0), math.radians(-4.0), math.radians(10.0)),
    "confirming": (math.radians(-2.0), math.radians(4.0), math.radians(-6.0)),
    "neutral_idle": (0.0, 0.0, 0.0),
    "restrained_apology": (math.radians(5.0), math.radians(-2.0), math.radians(8.0)),
}

SPRITE_FACE_SCALES = {
    "thinking": (1.0, 1.0, 1.0),
    "confirming": (1.0, 1.0, 1.015),
    "neutral_idle": (1.0, 1.0, 1.0),
    "restrained_apology": (1.0, 1.0, 0.988),
}

SPRITE_MOTION_PROFILES = {
    "thinking": {
        "body_frame_ratios": [0.48, 0.72, 0.62],
        "face_frame_ratios": [0.7, 0.84, 0.78],
        "body_pose_weights": [0.45, 1.0, 0.82],
        "face_pose_weights": [0.45, 1.0, 0.82],
        "head_pose_weights": [0.5, 1.05, 0.88],
        "head_extra_rotations": [
            (0.0, 0.0, 0.0),
            (math.radians(2.0), math.radians(-1.0), 0.0),
            (0.0, 0.0, 0.0),
        ],
        "step_hold_seconds": 0.09,
    },
    "confirming": {
        "body_frame_ratios": [0.54, 0.78, 0.66, 0.58],
        "face_frame_ratios": [0.7, 0.9, 0.82, 0.74],
        "body_pose_weights": [0.22, 0.56, 0.34, 0.18],
        "face_pose_weights": [0.14, 0.82, 0.36, 0.12],
        "head_pose_weights": [0.08, 1.28, 0.42, 0.1],
        "head_extra_rotations": [
            (math.radians(-3.0), 0.0, 0.0),
            (math.radians(12.0), math.radians(1.5), math.radians(-2.0)),
            (math.radians(3.0), 0.0, 0.0),
            (math.radians(-1.5), 0.0, 0.0),
        ],
        "step_hold_seconds": 0.08,
    },
    "neutral_idle": {
        "body_frame_ratios": [0.12, 0.18],
        "face_frame_ratios": [0.12, 0.18],
        "body_pose_weights": [0.08, 0.0],
        "face_pose_weights": [0.08, 0.0],
        "head_pose_weights": [0.08, 0.0],
        "head_extra_rotations": [
            (0.0, 0.0, 0.0),
            (0.0, 0.0, 0.0),
        ],
        "step_hold_seconds": 0.05,
    },
    "restrained_apology": {
        "body_frame_ratios": [0.36, 0.62, 0.74, 0.64],
        "face_frame_ratios": [0.7, 0.84, 0.9, 0.82],
        "body_pose_weights": [0.2, 0.62, 0.78, 0.48],
        "face_pose_weights": [0.12, 0.72, 0.88, 0.56],
        "head_pose_weights": [0.1, 0.95, 1.22, 0.62],
        "head_extra_rotations": [
            (math.radians(4.0), 0.0, 0.0),
            (math.radians(10.0), math.radians(-1.0), math.radians(1.0)),
            (math.radians(17.0), math.radians(-2.0), math.radians(2.0)),
            (math.radians(6.0), 0.0, 0.0),
        ],
        "step_hold_seconds": 0.1,
    },
}

SPRITE_SELECTIONS = {
    "thinking": {
        "preset": "Sprite focus preset",
        "action_family": "Sprite_eyemask_focus + ANI-Sprite_Idle_Standing",
        "body_actions": ["ANI-Sprite_Idle_Standing", "ANI-Sprite_Idle_Chillin"],
        "face_actions": ["Sprite_eyemask_focus"],
        "body_frame_ratio": 0.72,
        "face_frame_ratio": 0.84,
    },
    "confirming": {
        "preset": "Sprite confirm preset",
        "action_family": "Sprite_eyemask_happy + Sprite_mouth_smileclosed",
        "body_actions": ["ANI-Sprite_Idle_Chillin", "ANI-Sprite_Idle_Standing"],
        "face_actions": ["Sprite_eyemask_happy", "Sprite_mouth_smileclosed"],
        "body_frame_ratio": 0.86,
        "face_frame_ratio": 0.93,
    },
    "neutral_idle": {
        "preset": "Sprite idle preset",
        "action_family": "ANI-Sprite_Idle_Standing",
        "body_actions": ["ANI-Sprite_Idle_Standing", "ANI-Sprite_Idle_Chillin"],
        "face_actions": [],
        "body_frame_ratio": 0.18,
        "face_frame_ratio": 0.18,
    },
    "restrained_apology": {
        "preset": "Sprite apology preset",
        "action_family": "Sprite_eyemask_squint + Sprite_mouth_frownclosed",
        "body_actions": ["ANI-Sprite_Idle_Standing", "ANI-Sprite_Idle_Chillin"],
        "face_actions": ["Sprite_eyemask_squint", "Sprite_mouth_frownclosed"],
        "body_frame_ratio": 0.68,
        "face_frame_ratio": 0.88,
    },
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
    sprite_selection = select_sprite_selection(action)

    scene = bpy.context.scene
    scene["auto_skepture_last_action"] = action
    scene["auto_skepture_last_request_id"] = request_id
    scene["auto_skepture_last_sprite_preset"] = sprite_selection["preset"]
    scene["auto_skepture_last_sprite_action_family"] = sprite_selection["action_family"]

    ensure_scene_defaults(scene)
    status_object = ensure_status_text_object()
    status_material = ensure_status_material()
    applied_assets = apply_visual_state(status_object, status_material, action, request_id, sprite_selection)

    scene["auto_skepture_last_applied_assets"] = ", ".join(applied_assets)
    scene["auto_skepture_last_detail"] = build_detail(action, request_id, sprite_selection, applied_assets)

    dwell_seconds = parse_dwell_seconds(os.environ.get("AUTO_SKEPTURE_VISUAL_HOLD_SECONDS"))
    if dwell_seconds > 0:
        bpy.ops.wm.redraw_timer(type="DRAW_WIN_SWAP", iterations=1)
        time.sleep(dwell_seconds)

    response = {
        "acknowledged": True,
        "status": "ok",
        "observedState": action,
        "detail": build_detail(action, request_id, sprite_selection, applied_assets),
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

    text_curve = bpy.data.curves.new(f"{object_name}_CURVE", type="FONT")
    status_object = bpy.data.objects.new(object_name, text_curve)
    bpy.context.scene.collection.objects.link(status_object)
    status_object.name = object_name
    status_object.data.name = f"{object_name}_CURVE"
    status_object.location = (-2.8, 0.0, 1.2)
    status_object.rotation_euler = (math.radians(90.0), 0.0, math.radians(90.0))
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
    sprite_selection: dict[str, str],
) -> list[str]:
    color = STATE_COLORS.get(action, STATE_COLORS["neutral_idle"])
    rotation = STATE_ROTATIONS.get(action, STATE_ROTATIONS["neutral_idle"])
    preset_label = sprite_selection["preset"]
    status_object.data.body = f"AUTO-SKEPTURE\n{action}\n{preset_label}"
    status_object.rotation_euler = rotation

    if status_object.data.materials:
        status_object.data.materials[0] = status_material
    else:
        status_object.data.materials.append(status_material)

    principled = status_material.node_tree.nodes.get("Principled BSDF")
    if principled is not None:
        principled.inputs["Base Color"].default_value = color
        principled.inputs["Emission Color"].default_value = color

    return apply_sprite_state(action, sprite_selection)


def apply_sprite_state(action: str, sprite_selection: dict[str, object]) -> list[str]:
    rig = find_sprite_rig()
    applied_assets: list[str] = []
    body_action = find_first_action(sprite_selection.get("body_actions", []))
    face_actions = find_actions(sprite_selection.get("face_actions", []))
    body_frame_ratio = float(sprite_selection.get("body_frame_ratio", 0.25))
    face_frame_ratio = float(sprite_selection.get("face_frame_ratio", body_frame_ratio))
    face_objects = find_face_objects()
    head_objects = find_head_objects(face_objects)

    if rig is not None:
        clear_animation_action(rig)
        if body_action is not None:
            rig.animation_data_create().action = body_action
            applied_assets.append(body_action.name)

    face_targets = [obj.data.shape_keys for obj in face_objects if obj.data.shape_keys is not None]
    clear_face_animation_actions(face_targets)
    apply_face_objects_state(face_objects, head_objects, action, 0.0, 0.0, (0.0, 0.0, 0.0))
    for index, face_action in enumerate(face_actions):
        target = face_targets[index] if index < len(face_targets) else None
        if target is None:
            break

        target.animation_data_create().action = face_action
        applied_assets.append(face_action.name)

    motion_profile = select_motion_profile(action)
    animate_sprite_state(
        rig,
        face_objects,
        head_objects,
        action,
        body_action,
        face_actions[0] if face_actions else None,
        body_frame_ratio,
        face_frame_ratio,
        motion_profile,
    )

    if rig is None:
        applied_assets.append("fallback:missing-rig")
    elif body_action is None:
        applied_assets.append("fallback:missing-body-action")

    if not face_actions:
        applied_assets.append("fallback:no-face-action")

    return applied_assets


def find_sprite_rig() -> bpy.types.Object | None:
    for name in SPRITE_RIG_CANDIDATES:
        candidate = bpy.data.objects.get(name)
        if candidate is not None and candidate.type == "ARMATURE":
            return candidate

    for obj in bpy.data.objects:
        if obj.type == "ARMATURE" and "Sprite" in obj.name:
            return obj

    return None


def clear_animation_action(target: bpy.types.ID) -> None:
    animation_data = getattr(target, "animation_data", None)
    if animation_data is not None:
        animation_data.action = None


def clear_face_animation_actions(face_targets: list[bpy.types.Key]) -> None:
    for target in face_targets:
        clear_animation_action(target)


def find_face_objects() -> list[bpy.types.Object]:
    result = []
    for object_name in SPRITE_FACE_OBJECTS:
        obj = bpy.data.objects.get(object_name)
        if obj is None or obj.type != "MESH" or obj.data.shape_keys is None:
            continue

        result.append(obj)

    return result


def find_head_objects(face_objects: list[bpy.types.Object]) -> list[bpy.types.Object]:
    result = [obj for obj in face_objects if obj.name in SPRITE_HEAD_OBJECTS]
    if result:
        return result

    return face_objects


def find_first_action(candidates: object) -> bpy.types.Action | None:
    for action_name in candidates:
        action = bpy.data.actions.get(action_name)
        if action is not None:
            return action

    return None


def find_actions(candidates: object) -> list[bpy.types.Action]:
    actions = []
    for action_name in candidates:
        action = bpy.data.actions.get(action_name)
        if action is not None:
            actions.append(action)

    return actions


def select_motion_profile(action: str) -> dict[str, object]:
    return SPRITE_MOTION_PROFILES.get(action, SPRITE_MOTION_PROFILES["neutral_idle"])


def animate_sprite_state(
    rig: bpy.types.Object | None,
    face_objects: list[bpy.types.Object],
    head_objects: list[bpy.types.Object],
    action: str,
    body_action: bpy.types.Action | None,
    primary_face_action: bpy.types.Action | None,
    default_body_frame_ratio: float,
    default_face_frame_ratio: float,
    motion_profile: dict[str, object],
) -> None:
    body_frame_ratios = list(motion_profile.get("body_frame_ratios", [default_body_frame_ratio]))
    face_frame_ratios = list(motion_profile.get("face_frame_ratios", [default_face_frame_ratio]))
    body_pose_weights = list(motion_profile.get("body_pose_weights", motion_profile.get("pose_weights", [1.0])))
    face_pose_weights = list(motion_profile.get("face_pose_weights", body_pose_weights))
    head_pose_weights = list(motion_profile.get("head_pose_weights", face_pose_weights))
    head_extra_rotations = list(motion_profile.get("head_extra_rotations", [(0.0, 0.0, 0.0)]))
    step_hold_seconds = float(motion_profile.get("step_hold_seconds", 0.0))
    step_count = max(
        len(body_frame_ratios),
        len(face_frame_ratios),
        len(body_pose_weights),
        len(face_pose_weights),
        len(head_pose_weights),
        len(head_extra_rotations),
    )

    for index in range(step_count):
        body_ratio = pick_sequence_value(body_frame_ratios, index, default_body_frame_ratio)
        face_ratio = pick_sequence_value(face_frame_ratios, index, default_face_frame_ratio)
        body_pose_weight = pick_sequence_value(body_pose_weights, index, 1.0)
        face_pose_weight = pick_sequence_value(face_pose_weights, index, body_pose_weight)
        head_pose_weight = pick_sequence_value(head_pose_weights, index, face_pose_weight)
        head_extra_rotation = pick_sequence_triplet(head_extra_rotations, index, (0.0, 0.0, 0.0))
        body_frame_target = select_frame_target(body_action, body_ratio)
        face_frame_target = select_frame_target(primary_face_action, face_ratio)

        bpy.context.scene.frame_set(max(body_frame_target, face_frame_target))
        apply_rig_pose_state(rig, action, body_pose_weight)
        apply_face_objects_state(
            face_objects,
            head_objects,
            action,
            face_pose_weight,
            head_pose_weight,
            head_extra_rotation,
        )
        bpy.ops.wm.redraw_timer(type="DRAW_WIN_SWAP", iterations=1)
        bpy.context.view_layer.update()

        if step_hold_seconds > 0:
            time.sleep(step_hold_seconds)


def pick_sequence_value(values: list[float], index: int, fallback: float) -> float:
    if not values:
        return fallback

    if index < len(values):
        return float(values[index])

    return float(values[-1])


def pick_sequence_triplet(
    values: list[tuple[float, float, float]],
    index: int,
    fallback: tuple[float, float, float],
) -> tuple[float, float, float]:
    if not values:
        return fallback

    if index < len(values):
        return values[index]

    return values[-1]


def apply_rig_pose_state(rig: bpy.types.Object | None, action: str, pose_weight: float) -> None:
    if rig is None:
        return

    rig.rotation_euler = scale_triplet(
        SPRITE_OBJECT_ROTATIONS.get(action, SPRITE_OBJECT_ROTATIONS["neutral_idle"]),
        pose_weight,
    )
    rig.location = scale_triplet(
        SPRITE_OBJECT_LOCATIONS.get(action, SPRITE_OBJECT_LOCATIONS["neutral_idle"]),
        pose_weight,
    )


def apply_face_objects_state(
    face_objects: list[bpy.types.Object],
    head_objects: list[bpy.types.Object],
    action: str,
    face_pose_weight: float,
    head_pose_weight: float,
    head_extra_rotation: tuple[float, float, float],
) -> None:
    target_rotation = SPRITE_FACE_ROTATIONS.get(action, SPRITE_FACE_ROTATIONS["neutral_idle"])
    target_scale = SPRITE_FACE_SCALES.get(action, SPRITE_FACE_SCALES["neutral_idle"])

    for face_object in face_objects:
        face_object.rotation_euler = scale_triplet(target_rotation, face_pose_weight)
        face_object.scale = blend_scale(target_scale, face_pose_weight)

    for head_object in head_objects:
        head_rotation = combine_triplets(
            scale_triplet(target_rotation, head_pose_weight),
            head_extra_rotation,
        )
        head_object.rotation_euler = head_rotation
        head_object.scale = blend_scale(target_scale, head_pose_weight)


def scale_triplet(values: tuple[float, float, float], weight: float) -> tuple[float, float, float]:
    return (values[0] * weight, values[1] * weight, values[2] * weight)


def blend_scale(values: tuple[float, float, float], weight: float) -> tuple[float, float, float]:
    return (
        1.0 + ((values[0] - 1.0) * weight),
        1.0 + ((values[1] - 1.0) * weight),
        1.0 + ((values[2] - 1.0) * weight),
    )


def combine_triplets(
    first: tuple[float, float, float],
    second: tuple[float, float, float],
) -> tuple[float, float, float]:
    return (
        first[0] + second[0],
        first[1] + second[1],
        first[2] + second[2],
    )


def select_frame_target(action: bpy.types.Action | None, frame_ratio: float) -> int:
    if action is None:
        return 1

    start_frame, end_frame = action.frame_range
    if end_frame <= start_frame:
        return int(start_frame)

    return int(round(start_frame + ((end_frame - start_frame) * frame_ratio)))


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


def select_sprite_selection(action: str) -> dict[str, object]:
    return SPRITE_SELECTIONS.get(action, {
        "preset": "Sprite fallback preset",
        "action_family": "neutral_idle fallback",
        "body_actions": ["ANI-Sprite_Idle_Standing", "ANI-Sprite_Idle_Chillin"],
        "face_actions": [],
        "frame_ratio": 0.25,
    })


def build_detail(
    action: str,
    request_id: str,
    sprite_selection: dict[str, object],
    applied_assets: list[str],
) -> str:
    preset = sprite_selection["preset"]
    action_family = sprite_selection["action_family"]
    asset_detail = ", ".join(applied_assets)
    return (
        f"Blender {bpy.app.version_string} visually rendered {action} for {request_id}; "
        f"selected Sprite preset '{preset}' using Sprite action family '{action_family}' and applied assets [{asset_detail}]."
    )


def write_error(message: str) -> None:
    sys.stderr.write(message + "\n")


if __name__ == "__main__":
    raise SystemExit(main())