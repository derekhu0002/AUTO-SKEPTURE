import json
import sys

import bpy


def main() -> int:
    try:
        separator_index = sys.argv.index("--")
    except ValueError:
        write_error("Missing '--' separator for Blender inspect arguments.")
        return 1

    args = sys.argv[separator_index + 1 :]
    if len(args) != 1:
        write_error("Expected a single output file path.")
        return 1

    output_path = args[0]
    scene = bpy.context.scene

    payload = {
        "file": bpy.data.filepath,
        "scene": scene.name,
        "objects": collect_objects(),
        "armatures": collect_armatures(),
        "meshes_with_shape_keys": collect_mesh_shape_keys(),
        "actions": collect_actions(),
        "collections": sorted(collection.name for collection in bpy.data.collections),
    }

    with open(output_path, "w", encoding="utf-8") as output_file:
        json.dump(payload, output_file, indent=2)

    return 0


def collect_objects():
    objects = []
    for obj in bpy.data.objects:
        entry = {
            "name": obj.name,
            "type": obj.type,
            "parent": obj.parent.name if obj.parent is not None else None,
            "collections": sorted(collection.name for collection in obj.users_collection),
        }

        if obj.type == "ARMATURE":
            entry["bone_count"] = len(obj.data.bones)

        if obj.type == "MESH":
            entry["vertex_groups"] = sorted(group.name for group in obj.vertex_groups)
            if obj.data.shape_keys is not None:
                entry["shape_keys"] = [key.name for key in obj.data.shape_keys.key_blocks]

        objects.append(entry)

    return sorted(objects, key=lambda item: (item["type"], item["name"]))


def collect_armatures():
    armatures = []
    for obj in bpy.data.objects:
        if obj.type != "ARMATURE":
            continue

        armatures.append(
            {
                "name": obj.name,
                "bones": sorted(bone.name for bone in obj.data.bones),
            }
        )

    return sorted(armatures, key=lambda item: item["name"])


def collect_mesh_shape_keys():
    result = []
    for obj in bpy.data.objects:
        if obj.type != "MESH" or obj.data.shape_keys is None:
            continue

        result.append(
            {
                "name": obj.name,
                "shape_keys": [key.name for key in obj.data.shape_keys.key_blocks],
            }
        )

    return sorted(result, key=lambda item: item["name"])


def collect_actions():
    actions = []
    for action in bpy.data.actions:
        fcurves = getattr(action, "fcurves", None)
        actions.append(
            {
                "name": action.name,
                "frame_range": [float(action.frame_range[0]), float(action.frame_range[1])],
                "fcurve_count": len(fcurves) if fcurves is not None else 0,
            }
        )

    return sorted(actions, key=lambda item: item["name"])


def write_error(message: str) -> None:
    sys.stderr.write(message + "\n")


if __name__ == "__main__":
    raise SystemExit(main())