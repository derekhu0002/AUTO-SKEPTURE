import { spawn } from "node:child_process";
import { resolve } from "node:path";
const tsxCli = resolve("node_modules", "tsx", "dist", "cli.mjs");
const testFile = resolve("tests", "explicit", "response-start-embodiment.test.ts");
runExplicitTest(testFile);
function runExplicitTest(filePath) {
    const child = spawn(process.execPath, [tsxCli, "--test", filePath], {
        stdio: "inherit",
        env: {
            ...process.env,
            AUTO_SKEPTURE_USE_REPO_ADAPTER: "1",
        },
    });
    child.on("exit", (code, signal) => {
        if (signal) {
            process.kill(process.pid, signal);
            return;
        }
        process.exit(code ?? 1);
    });
    child.on("error", (error) => {
        console.error(error);
        process.exit(1);
    });
}
