import test from "node:test";
import assert from "node:assert/strict";
import { getBridgeOptionsFromEnvironment } from "../../src/blender-bridge/index.js";
const CONTROL_POINT = "Set BLENDER_LIVE_PORT without BLENDER_ADAPTER_COMMAND and resolve bridge options.";
const OBSERVATION_POINT = "The bridge resolves to the repository-local live adapter command so control requests can target an already-open Blender instance through the existing bridge boundary.";
test("support guardrail: bridge options can target a live Blender control server", () => {
    const previousPort = process.env.BLENDER_LIVE_PORT;
    const previousCommand = process.env.BLENDER_ADAPTER_COMMAND;
    const previousRepoAdapter = process.env.AUTO_SKEPTURE_USE_REPO_ADAPTER;
    delete process.env.BLENDER_ADAPTER_COMMAND;
    delete process.env.AUTO_SKEPTURE_USE_REPO_ADAPTER;
    process.env.BLENDER_LIVE_PORT = "41741";
    try {
        const options = getBridgeOptionsFromEnvironment();
        assert.equal(options.command, process.execPath, `Control point: ${CONTROL_POINT}`);
        assert.match(options.args?.[0] ?? "", /scripts[\\/]blender-live-adapter\.mjs$/, `Observation point: ${OBSERVATION_POINT}`);
    }
    finally {
        restoreEnv("BLENDER_LIVE_PORT", previousPort);
        restoreEnv("BLENDER_ADAPTER_COMMAND", previousCommand);
        restoreEnv("AUTO_SKEPTURE_USE_REPO_ADAPTER", previousRepoAdapter);
    }
});
function restoreEnv(name, value) {
    if (value === undefined) {
        delete process.env[name];
        return;
    }
    process.env[name] = value;
}
