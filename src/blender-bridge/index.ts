import { spawn } from "node:child_process";

export type AvatarActionName =
  | "thinking"
  | "confirming"
  | "neutral_idle"
  | "restrained_apology";

export interface BlenderActionCommand {
  readonly action: AvatarActionName;
  readonly requestId: string;
  readonly source: "agent-runtime" | "avatar-mediator";
}

export interface BlenderFeedback {
  readonly acknowledged: boolean;
  readonly status: "ok" | "degraded";
  readonly observedState: AvatarActionName | "unknown";
  readonly detail: string;
}

export interface BlenderBridge {
  sendAction(command: BlenderActionCommand): Promise<BlenderFeedback>;
}

export interface StdioBridgeOptions {
  readonly command: string;
  readonly args?: readonly string[];
  readonly cwd?: string;
  readonly timeoutMs?: number;
}

interface WireRequest {
  readonly action: AvatarActionName;
  readonly requestId: string;
  readonly source: "agent-runtime" | "avatar-mediator";
}

interface WireResponse {
  readonly acknowledged: boolean;
  readonly status: "ok" | "degraded";
  readonly observedState: AvatarActionName | "unknown";
  readonly detail: string;
}

export class StdioBlenderBridge implements BlenderBridge {
  public constructor(private readonly options: StdioBridgeOptions) {}

  async sendAction(command: BlenderActionCommand): Promise<BlenderFeedback> {
    const timeoutMs = this.options.timeoutMs ?? 10_000;

    return new Promise<BlenderFeedback>((resolve, reject) => {
      const child = spawn(this.options.command, this.options.args ?? [], {
        cwd: this.options.cwd,
        stdio: ["pipe", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";
      let settled = false;

      const finish = (callback: () => void): void => {
        if (settled) {
          return;
        }

        settled = true;
        clearTimeout(timeoutHandle);
        callback();
      };

      const timeoutHandle = setTimeout(() => {
        child.kill();
        finish(() => {
          reject(
            new Error(
              `Blender adapter timed out after ${timeoutMs}ms while handling ${command.requestId}.`,
            ),
          );
        });
      }, timeoutMs);

      child.stdout.setEncoding("utf8");
      child.stderr.setEncoding("utf8");
      child.stdout.on("data", (chunk: string) => {
        stdout += chunk;
      });
      child.stderr.on("data", (chunk: string) => {
        stderr += chunk;
      });
      child.on("error", (error) => {
        finish(() => {
          reject(error);
        });
      });
      child.on("close", (code) => {
        finish(() => {
          if (code !== 0) {
            const trimmedStderr = stderr.trim();
            if (trimmedStderr.includes("Blender adapter unavailable")) {
              reject(new Error("Blender adapter unavailable."));
              return;
            }

            reject(
              new Error(
                `Blender adapter exited with code ${code}. ${trimmedStderr || "No stderr output."}`,
              ),
            );
            return;
          }

          try {
            const response = parseWireResponse(stdout);
            resolve(response);
          } catch (error) {
            reject(error);
          }
        });
      });

      const payload: WireRequest = {
        action: command.action,
        requestId: command.requestId,
        source: command.source,
      };

      child.stdin.write(`${JSON.stringify(payload)}\n`);
      child.stdin.end();
    });
  }
}

function parseWireResponse(stdout: string): BlenderFeedback {
  const trimmed = stdout.trim();
  if (!trimmed) {
    throw new Error("Blender adapter produced no stdout feedback.");
  }

  const firstLine = trimmed.split(/\r?\n/)[0];
  const parsed = JSON.parse(firstLine) as Partial<WireResponse>;

  if (
    parsed.acknowledged === undefined ||
    parsed.status === undefined ||
    parsed.observedState === undefined ||
    parsed.detail === undefined
  ) {
    throw new Error("Blender adapter returned malformed structured feedback.");
  }

  return {
    acknowledged: parsed.acknowledged,
    status: parsed.status,
    observedState: parsed.observedState,
    detail: parsed.detail,
  };
}