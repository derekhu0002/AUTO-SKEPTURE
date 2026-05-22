import { spawn } from "node:child_process";
import { resolve } from "node:path";

const visualAdapter = resolve("scripts", "blender-visual-adapter.mjs");
const sequence = [
  { action: "thinking", requestId: "visual-demo-start", source: "agent-runtime" },
  { action: "confirming", requestId: "visual-demo-complete", source: "agent-runtime" },
  { action: "neutral_idle", requestId: "visual-demo-reset", source: "avatar-mediator" },
];

for (const command of sequence) {
  const response = await runVisualCommand(command);
  process.stdout.write(`${response.detail}\n`);
}

async function runVisualCommand(command) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [visualAdapter], {
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
        reject(new Error(stderr.trim() || `Visual adapter exited with code ${code}.`));
        return;
      }

      try {
        resolvePromise(JSON.parse(stdout.trim()));
      } catch (error) {
        reject(error);
      }
    });

    child.stdin.write(`${JSON.stringify(command)}\n`);
    child.stdin.end();
  });
}