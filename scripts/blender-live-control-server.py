import json
import os
import queue
import runpy
import socketserver
import threading
from dataclasses import dataclass, field

import bpy


HOST = os.environ.get("BLENDER_LIVE_HOST", "127.0.0.1")
PORT = int(os.environ.get("BLENDER_LIVE_PORT", "41741"))
REQUEST_TIMEOUT_SECONDS = float(os.environ.get("BLENDER_LIVE_REQUEST_TIMEOUT_SECONDS", "10"))
SERVER_KEY = "auto_skepture_live_server"
QUEUE_KEY = "auto_skepture_live_queue"
TIMER_KEY = "auto_skepture_live_timer_registered"


@dataclass
class PendingRequest:
    request: dict[str, object]
    event: threading.Event = field(default_factory=threading.Event)
    response: dict[str, object] | None = None
    error: str | None = None


class LiveRequestHandler(socketserver.StreamRequestHandler):
    def handle(self) -> None:
        payload = self.rfile.readline().decode("utf-8").strip()
        if not payload:
            self.wfile.write(b'{"acknowledged": false, "status": "degraded", "observedState": "unknown", "detail": "Live control request was empty."}\n')
            return

        try:
            request = json.loads(payload)
        except json.JSONDecodeError as error:
            detail = f"Live control request was not valid JSON: {error.msg}."
            self.wfile.write(build_error_response(detail))
            return

        pending = PendingRequest(request=request)
        get_request_queue().put(pending)

        if not pending.event.wait(timeout=REQUEST_TIMEOUT_SECONDS):
            self.wfile.write(build_error_response("Live control request timed out inside Blender."))
            return

        if pending.error is not None:
            self.wfile.write(build_error_response(pending.error))
            return

        self.wfile.write(f"{json.dumps(pending.response)}\n".encode("utf-8"))


class ThreadedTcpServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


def resolve_visual_driver_path() -> str:
    candidates = []

    file_path = globals().get("__file__")
    if isinstance(file_path, str) and file_path:
        script_dir = os.path.dirname(os.path.abspath(file_path))
        candidates.append(os.path.join(script_dir, "blender-visual-driver.py"))

    blend_path = bpy.data.filepath
    if blend_path:
        blend_dir = os.path.dirname(os.path.abspath(blend_path))
        candidates.append(os.path.join(blend_dir, "blender-visual-driver.py"))
        candidates.append(os.path.join(os.path.dirname(blend_dir), "scripts", "blender-visual-driver.py"))

    current_working_directory = os.getcwd()
    candidates.append(os.path.join(current_working_directory, "scripts", "blender-visual-driver.py"))
    candidates.append(os.path.join(current_working_directory, "blender-visual-driver.py"))

    seen = set()
    for candidate in candidates:
        normalized = os.path.abspath(candidate)
        if normalized in seen:
            continue

        seen.add(normalized)
        if os.path.exists(normalized):
            return normalized

    searched = ", ".join(seen)
    raise FileNotFoundError(
        "Unable to locate blender-visual-driver.py for live control server. "
        f"Checked: {searched}"
    )


VISUAL_DRIVER = runpy.run_path(
    resolve_visual_driver_path(),
    run_name="auto_skepture_visual_driver",
)


def main() -> int:
    existing = bpy.app.driver_namespace.get(SERVER_KEY)
    if existing is not None:
        shutdown_server(existing)

    server = ThreadedTcpServer((HOST, PORT), LiveRequestHandler)
    worker = threading.Thread(target=server.serve_forever, name="auto-skepture-live-server", daemon=True)
    worker.start()

    bpy.app.driver_namespace[SERVER_KEY] = server
    bpy.app.driver_namespace[QUEUE_KEY] = queue.Queue()

    if not bpy.app.driver_namespace.get(TIMER_KEY):
        bpy.app.timers.register(process_request_queue, first_interval=0.1, persistent=True)
        bpy.app.driver_namespace[TIMER_KEY] = True

    publish_server_status(scene=bpy.context.scene, host=HOST, port=PORT)
    print(f"AUTO-SKEPTURE live control server listening on {HOST}:{PORT}")
    return 0


def process_request_queue() -> float:
    request_queue = get_request_queue()

    while True:
        try:
            pending = request_queue.get_nowait()
        except queue.Empty:
            break

        try:
            pending.response = execute_request(pending.request)
        except Exception as error:  # noqa: BLE001
            pending.error = str(error)
        finally:
            pending.event.set()

    return 0.1


def execute_request(request: dict[str, object]) -> dict[str, object]:
    action = str(request.get("action", "unknown"))
    request_id = str(request.get("requestId", "unknown-request"))
    sprite_selection = VISUAL_DRIVER["select_sprite_selection"](action)

    scene = bpy.context.scene
    scene["auto_skepture_last_action"] = action
    scene["auto_skepture_last_request_id"] = request_id
    scene["auto_skepture_last_sprite_preset"] = sprite_selection["preset"]
    scene["auto_skepture_last_sprite_action_family"] = sprite_selection["action_family"]

    VISUAL_DRIVER["ensure_scene_defaults"](scene)
    status_object = VISUAL_DRIVER["ensure_status_text_object"]()
    status_material = VISUAL_DRIVER["ensure_status_material"]()
    applied_assets = VISUAL_DRIVER["apply_visual_state"](
        status_object,
        status_material,
        action,
        request_id,
        sprite_selection,
    )

    scene["auto_skepture_last_applied_assets"] = ", ".join(applied_assets)
    detail = VISUAL_DRIVER["build_detail"](action, request_id, sprite_selection, applied_assets)
    scene["auto_skepture_last_detail"] = detail
    bpy.ops.wm.redraw_timer(type="DRAW_WIN_SWAP", iterations=1)
    bpy.context.view_layer.update()

    return {
        "acknowledged": True,
        "status": "ok",
        "observedState": action,
        "detail": detail,
    }


def get_request_queue() -> queue.Queue[PendingRequest]:
    request_queue = bpy.app.driver_namespace.get(QUEUE_KEY)
    if request_queue is None:
        request_queue = queue.Queue()
        bpy.app.driver_namespace[QUEUE_KEY] = request_queue
    return request_queue


def shutdown_server(server: ThreadedTcpServer) -> None:
    server.shutdown()
    server.server_close()


def build_error_response(detail: str) -> bytes:
    response = {
        "acknowledged": False,
        "status": "degraded",
        "observedState": "unknown",
        "detail": detail,
    }
    return f"{json.dumps(response)}\n".encode("utf-8")


def publish_server_status(scene: bpy.types.Scene, host: str, port: int) -> None:
    detail = f"AUTO-SKEPTURE live control server listening on {host}:{port}"
    scene["auto_skepture_live_server_host"] = host
    scene["auto_skepture_live_server_port"] = port
    scene["auto_skepture_live_server_detail"] = detail

    try:
        VISUAL_DRIVER["ensure_scene_defaults"](scene)
        status_object = VISUAL_DRIVER["ensure_status_text_object"]()
        status_material = VISUAL_DRIVER["ensure_status_material"]()
        status_object.data.body = f"AUTO-SKEPTURE\nLIVE SERVER\n{host}:{port}"
        if status_object.data.materials:
            status_object.data.materials[0] = status_material
        else:
            status_object.data.materials.append(status_material)

        principled = status_material.node_tree.nodes.get("Principled BSDF")
        if principled is not None:
            live_color = (0.15, 0.85, 0.45, 1.0)
            principled.inputs["Base Color"].default_value = live_color
            principled.inputs["Emission Color"].default_value = live_color

        bpy.ops.wm.redraw_timer(type="DRAW_WIN_SWAP", iterations=1)
        bpy.context.view_layer.update()
    except Exception:
        pass

    try:
        def draw_popup(self, _context):
            self.layout.label(text="AUTO-SKEPTURE live control server is running.")
            self.layout.label(text=f"Host: {host}")
            self.layout.label(text=f"Port: {port}")

        bpy.context.window_manager.popup_menu(
            draw_popup,
            title="AUTO-SKEPTURE Live Server",
            icon="CHECKMARK",
        )
    except Exception:
        pass


def run_entrypoint() -> None:
    exit_code = main()
    if bpy.app.background:
        raise SystemExit(exit_code)


if __name__ == "__main__":
    run_entrypoint()