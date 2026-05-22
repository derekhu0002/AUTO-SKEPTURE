import { readFile } from "node:fs/promises";

const payload = await readStdIn();
const request = JSON.parse(payload);
const requestId = request?.requestId ?? "unknown-request";

console.error(`Blender adapter unavailable for ${requestId}.`);
process.exit(1);

async function readStdIn() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks).toString("utf8").trim();
}