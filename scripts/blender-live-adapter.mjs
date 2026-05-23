import net from "node:net";

const input = await readStdIn();
const request = JSON.parse(input);
const host = process.env.BLENDER_LIVE_HOST ?? "127.0.0.1";
const port = parsePort(process.env.BLENDER_LIVE_PORT);
const timeoutMs = parseTimeout(process.env.BLENDER_ADAPTER_TIMEOUT_MS) ?? 10_000;

if (port === undefined) {
  throw new Error("BLENDER_LIVE_PORT is required for blender-live-adapter.mjs.");
}

const response = await sendLiveCommand({ host, port, timeoutMs, request });
process.stdout.write(`${JSON.stringify(response)}\n`);

async function readStdIn() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks).toString("utf8").trim();
}

function parsePort(rawPort) {
  if (!rawPort) {
    return undefined;
  }

  const parsed = Number(rawPort);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
    throw new Error("BLENDER_LIVE_PORT must be an integer between 1 and 65535.");
  }

  return parsed;
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

function sendLiveCommand({ host, port, timeoutMs, request }) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port });
    let settled = false;
    let responseBuffer = "";

    const finish = (callback) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeoutHandle);
      socket.destroy();
      callback();
    };

    const timeoutHandle = setTimeout(() => {
      finish(() => {
        reject(new Error(`Live Blender adapter timed out after ${timeoutMs}ms.`));
      });
    }, timeoutMs);

    socket.setEncoding("utf8");
    socket.on("connect", () => {
      socket.write(`${JSON.stringify(request)}\n`);
    });
    socket.on("data", (chunk) => {
      responseBuffer += chunk;
      const newlineIndex = responseBuffer.indexOf("\n");
      if (newlineIndex === -1) {
        return;
      }

      const rawResponse = responseBuffer.slice(0, newlineIndex).trim();
      finish(() => {
        if (!rawResponse) {
          reject(new Error("Live Blender adapter returned an empty response."));
          return;
        }

        try {
          resolve(JSON.parse(rawResponse));
        } catch (error) {
          reject(error);
        }
      });
    });
    socket.on("error", (error) => {
      finish(() => {
        reject(new Error(`Unable to reach live Blender control server at ${host}:${port}. ${error.message}`));
      });
    });
    socket.on("end", () => {
      if (!settled) {
        finish(() => {
          reject(new Error("Live Blender control server closed the connection before replying."));
        });
      }
    });
  });
}