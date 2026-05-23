import { spawn } from "node:child_process";
import { resolve } from "node:path";
import {
  getSupportedAvatarActions,
  resolveAvatarIntent,
} from "./avatar-intent-mapping.mjs";

const ACTIONS = new Set(getSupportedAvatarActions());

const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
  printUsage();
  process.exit(0);
}

const parsed = parseArgs(args);
const resolvedAction = resolveRequestedAction(parsed);
const requestId = parsed.requestId ?? `avatar-control-${Date.now()}`;

if (!ACTIONS.has(resolvedAction)) {
  console.error(
    `Unsupported action '${resolvedAction}'. Allowed actions: ${[...ACTIONS].join(", ")}.`,
  );
  process.exit(1);
}

try {
  // Delegate execution to the AgentRuntime-owned helper rather than launching the bridge adapter directly.
  const result = await runRuntimeHelper(resolvedAction, requestId);
  process.stdout.write(
    `${JSON.stringify({ action: resolvedAction, ...result }, null, 2)}\n`,
  );
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Avatar control failed: ${message}`);
  process.exit(1);
}

function parseArgs(rawArgs) {
  let action;
  let intent;
  let requestId;

  for (let index = 0; index < rawArgs.length; index += 1) {
    const current = rawArgs[index];

    if (!current.startsWith("--") && action === undefined) {
      action = current;
      continue;
    }

    if (current === "--request-id") {
      requestId = rawArgs[index + 1];
      index += 1;
      continue;
    }

    if (current === "--intent") {
      intent = rawArgs[index + 1];
      index += 1;
    }
  }

  if (rawArgs.includes("--request-id") && !requestId) {
    console.error("--request-id requires a value.");
    process.exit(1);
  }

  if (rawArgs.includes("--intent") && !intent) {
    console.error("--intent requires a value.");
    process.exit(1);
  }

  if (!action && !intent) {
    console.error("Provide either a supported action or --intent <text>.");
    process.exit(1);
  }

  return { action, intent, requestId };
}

function resolveRequestedAction(parsed) {
  if (parsed.action) {
    return parsed.action;
  }

  const resolution = resolveAvatarIntent(parsed.intent);

  if (resolution.kind === "resolved") {
    return resolution.action;
  }

  if (resolution.kind === "unsupported") {
    const suggestion = resolution.suggestedAction
      ? ` Closest supported action: ${resolution.suggestedAction}.`
      : "";
    console.error(`Avatar intent unsupported: ${resolution.message}${suggestion}`);
    process.exit(1);
  }

  console.error(`Avatar intent error: ${resolution.message}`);
  process.exit(1);
}

function printUsage() {
  process.stdout.write(
    [
      "Usage: npm run control:avatar -- <action> [--request-id <id>]",
      "   or: npm run control:avatar -- --intent \"<natural language request>\" [--request-id <id>]",
      "",
      "Allowed actions:",
      ...[...ACTIONS].map((action) => `  - ${action}`),
      "",
      "Environment:",
      "  BLENDER_EXECUTABLE           Optional explicit blender.exe path.",
      "  BLENDER_LIVE_PORT            Optional localhost port for an already-open Blender live control server.",
      "  BLENDER_LIVE_HOST            Optional host for the live Blender control server. Defaults to 127.0.0.1.",
      "  BLENDER_ADAPTER_COMMAND      Optional custom adapter command.",
      "  BLENDER_ADAPTER_ARGS         Optional custom adapter arguments.",
      "  BLENDER_ADAPTER_CWD          Optional adapter working directory.",
    ].join("\n"),
  );
}

function runRuntimeHelper(action, requestId) {
  return new Promise((resolvePromise, reject) => {
    const tsxCli = resolve("node_modules", "tsx", "dist", "cli.mjs");
    const runtimeHelper = resolve("scripts", "control-avatar-runtime.ts");
    const helperEnv = {
      ...process.env,
      AUTO_SKEPTURE_USE_REPO_ADAPTER:
        process.env.AUTO_SKEPTURE_USE_REPO_ADAPTER ??
        (process.env.BLENDER_ADAPTER_COMMAND || process.env.BLENDER_LIVE_PORT ? undefined : "1"),
    };
    const child = spawn(process.execPath, [tsxCli, runtimeHelper, action, requestId], {
      stdio: ["ignore", "pipe", "pipe"],
      env: helperEnv,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || `Runtime helper exited with code ${code}.`));
        return;
      }

      try {
        resolvePromise(JSON.parse(stdout.trim()));
      } catch (error) {
        reject(error);
      }
    });
  });
}