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

const adapterCommand = process.env.BLENDER_ADAPTER_COMMAND ?? process.execPath;
const adapterArgs =
  process.env.BLENDER_ADAPTER_COMMAND !== undefined
    ? splitArgs(process.env.BLENDER_ADAPTER_ARGS)
    : [resolve("scripts", "blender-adapter.mjs")];

const payload = {
  action: resolvedAction,
  requestId,
  source: "avatar-mediator",
};

try {
  const result = await runAdapter(adapterCommand, adapterArgs, payload);
  process.stdout.write(
    `${JSON.stringify({ action: resolvedAction, feedback: result }, null, 2)}\n`,
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

function splitArgs(rawArgs) {
  if (!rawArgs) {
    return [];
  }

  return rawArgs
    .split(" ")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function runAdapter(command, args, payload) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: process.env.BLENDER_ADAPTER_CWD,
      stdio: ["pipe", "pipe", "pipe"],
      env: process.env,
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
        reject(new Error(stderr.trim() || `Adapter exited with code ${code}.`));
        return;
      }

      try {
        resolvePromise(JSON.parse(stdout.trim()));
      } catch (error) {
        reject(error);
      }
    });

    child.stdin.write(`${JSON.stringify(payload)}\n`);
    child.stdin.end();
  });
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
      "  BLENDER_ADAPTER_COMMAND      Optional custom adapter command.",
      "  BLENDER_ADAPTER_ARGS         Optional custom adapter arguments.",
      "  BLENDER_ADAPTER_CWD          Optional adapter working directory.",
    ].join("\n"),
  );
}