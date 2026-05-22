import { spawn } from "node:child_process";
export class StdioBlenderBridge {
    options;
    constructor(options) {
        this.options = options;
    }
    async sendAction(command) {
        const timeoutMs = this.options.timeoutMs ?? 10_000;
        return new Promise((resolve, reject) => {
            const child = spawn(this.options.command, this.options.args ?? [], {
                cwd: this.options.cwd,
                stdio: ["pipe", "pipe", "pipe"],
            });
            let stdout = "";
            let stderr = "";
            let settled = false;
            const finish = (callback) => {
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
                    reject(new Error(`Blender adapter timed out after ${timeoutMs}ms while handling ${command.requestId}.`));
                });
            }, timeoutMs);
            child.stdout.setEncoding("utf8");
            child.stderr.setEncoding("utf8");
            child.stdout.on("data", (chunk) => {
                stdout += chunk;
            });
            child.stderr.on("data", (chunk) => {
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
                        reject(new Error(`Blender adapter exited with code ${code}. ${trimmedStderr || "No stderr output."}`));
                        return;
                    }
                    try {
                        const response = parseWireResponse(stdout);
                        resolve(response);
                    }
                    catch (error) {
                        reject(error);
                    }
                });
            });
            const payload = {
                action: command.action,
                requestId: command.requestId,
                source: command.source,
            };
            child.stdin.write(`${JSON.stringify(payload)}\n`);
            child.stdin.end();
        });
    }
}
function parseWireResponse(stdout) {
    const trimmed = stdout.trim();
    if (!trimmed) {
        throw new Error("Blender adapter produced no stdout feedback.");
    }
    const firstLine = trimmed.split(/\r?\n/)[0];
    const parsed = JSON.parse(firstLine);
    if (parsed.acknowledged === undefined ||
        parsed.status === undefined ||
        parsed.observedState === undefined ||
        parsed.detail === undefined) {
        throw new Error("Blender adapter returned malformed structured feedback.");
    }
    return {
        acknowledged: parsed.acknowledged,
        status: parsed.status,
        observedState: parsed.observedState,
        detail: parsed.detail,
    };
}
