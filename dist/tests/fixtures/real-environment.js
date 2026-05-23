import { getBridgeOptionsFromEnvironment, } from "../../src/blender-bridge/index.js";
import { resolve } from "node:path";
export function shouldRunRealEnvironmentTests() {
    return Boolean(process.env.BLENDER_ADAPTER_COMMAND || process.env.AUTO_SKEPTURE_USE_REPO_ADAPTER === "1");
}
export function shouldRunRealEnvironmentDisconnectTest() {
    return Boolean(process.env.BLENDER_ADAPTER_DISCONNECT_COMMAND ||
        process.env.AUTO_SKEPTURE_USE_REPO_ADAPTER === "1");
}
export function getRealEnvironmentBridgeOptions() {
    return getBridgeOptionsFromEnvironment();
}
export function getRealEnvironmentDisconnectBridgeOptions() {
    if (process.env.BLENDER_ADAPTER_DISCONNECT_COMMAND) {
        return {
            command: process.env.BLENDER_ADAPTER_DISCONNECT_COMMAND,
            args: splitArgs(process.env.BLENDER_ADAPTER_DISCONNECT_ARGS),
            cwd: process.env.BLENDER_ADAPTER_DISCONNECT_CWD,
            timeoutMs: parseTimeout(process.env.BLENDER_ADAPTER_TIMEOUT_MS),
        };
    }
    if (process.env.AUTO_SKEPTURE_USE_REPO_ADAPTER === "1") {
        return {
            command: process.execPath,
            args: [resolve("scripts", "blender-disconnect-adapter.mjs")],
            cwd: process.env.BLENDER_ADAPTER_DISCONNECT_CWD,
            timeoutMs: parseTimeout(process.env.BLENDER_ADAPTER_TIMEOUT_MS),
        };
    }
    return {
        ...getRealEnvironmentBridgeOptions(),
        timeoutMs: parseTimeout(process.env.BLENDER_ADAPTER_TIMEOUT_MS),
    };
}
function splitArgs(rawArgs) {
    if (!rawArgs) {
        return undefined;
    }
    return rawArgs
        .split(" ")
        .map((part) => part.trim())
        .filter((part) => part.length > 0);
}
function parseTimeout(rawTimeout) {
    if (!rawTimeout) {
        return undefined;
    }
    const parsed = Number(rawTimeout);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error("BLENDER_ADAPTER_TIMEOUT_MS must be a positive number when set.");
    }
    return parsed;
}
