import json
import sys

import bpy


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

    response = {
        "acknowledged": True,
        "status": "ok",
        "observedState": action,
        "detail": f"Blender {bpy.app.version_string} acknowledged {action} for {request_id}.",
    }

    with open(response_path, "w", encoding="utf-8") as response_file:
        json.dump(response, response_file)

    return 0


def write_error(message: str) -> None:
    sys.stderr.write(message + "\n")


if __name__ == "__main__":
    raise SystemExit(main())