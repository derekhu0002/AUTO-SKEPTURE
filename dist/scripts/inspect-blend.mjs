import { spawn } from "node:child_process";
import { access, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { tmpdir } from "node:os";
import { basename, delimiter, join, resolve } from "node:path";
const blendFile = process.argv[2] ?? process.env.BLENDER_INSPECT_BLEND_FILE;
if (!blendFile) {
    throw new Error("Provide a .blend path as the first argument or set BLENDER_INSPECT_BLEND_FILE.");
}
const pythonDriver = resolve("scripts", "inspect-blend.py");
const tempDir = await mkdtemp(join(tmpdir(), "auto-skepture-blend-inspect-"));
const outputPath = join(tempDir, "inspection.json");
try {
    const blenderExecutable = await resolveBlenderExecutable();
    await runProcess(blenderExecutable, [
        blendFile,
        "--background",
        "--python-exit-code",
        "1",
        "--python",
        pythonDriver,
        "--",
        outputPath,
    ]);
    const report = await readFile(outputPath, "utf8");
    process.stdout.write(report);
    if (!report.endsWith("\n")) {
        process.stdout.write("\n");
    }
}
finally {
    await rm(tempDir, { recursive: true, force: true });
}
async function resolveBlenderExecutable() {
    const explicitPath = process.env.BLENDER_EXECUTABLE;
    if (explicitPath) {
        await assertExecutable(explicitPath, "BLENDER_EXECUTABLE");
        return explicitPath;
    }
    const pathResolved = await tryResolveFromPath("blender.exe");
    if (pathResolved) {
        return pathResolved;
    }
    const registryResolved = await tryResolveViaWindowsRegistry();
    if (registryResolved) {
        return registryResolved;
    }
    for (const candidate of await getWindowsCandidates()) {
        if (await exists(candidate)) {
            return candidate;
        }
    }
    throw new Error("Unable to locate Blender. Set BLENDER_EXECUTABLE to your local blender.exe path.");
}
async function assertExecutable(path, variableName) {
    if (!(await exists(path))) {
        throw new Error(`${variableName} does not exist: ${path}`);
    }
}
async function tryResolveFromPath(executableName) {
    const pathValue = process.env.PATH;
    if (!pathValue) {
        return null;
    }
    for (const entry of pathValue.split(delimiter)) {
        if (!entry) {
            continue;
        }
        const candidate = join(entry, executableName);
        if (await exists(candidate)) {
            return candidate;
        }
    }
    return null;
}
async function tryResolveViaWindowsRegistry() {
    if (process.platform !== "win32") {
        return null;
    }
    const script = [
        "Get-ItemProperty 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*','HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*','HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*' -ErrorAction SilentlyContinue",
        "| Where-Object { $_.DisplayName -like 'Blender*' -and $_.InstallLocation }",
        "| Sort-Object DisplayVersion -Descending",
        "| Select-Object -First 1 -ExpandProperty InstallLocation",
    ].join(" ");
    try {
        const powershellPath = process.env.SystemRoot !== undefined
            ? join(process.env.SystemRoot, "System32", "WindowsPowerShell", "v1.0", "powershell.exe")
            : "powershell.exe";
        const { stdout } = await runProcess(powershellPath, ["-NoProfile", "-Command", script]);
        const installLocation = stdout.trim().split(/\r?\n/)[0]?.trim();
        if (!installLocation) {
            return null;
        }
        const candidate = join(installLocation, "blender.exe");
        return (await exists(candidate)) ? candidate : null;
    }
    catch {
        return null;
    }
}
async function getWindowsCandidates() {
    const candidates = [];
    for (const base of [
        process.env["ProgramFiles"],
        process.env["ProgramFiles(x86)"],
        process.env.LOCALAPPDATA ? join(process.env.LOCALAPPDATA, "Programs") : undefined,
    ]) {
        if (!base) {
            continue;
        }
        const blenderRoot = join(base, "Blender Foundation");
        if (!(await exists(blenderRoot))) {
            continue;
        }
        const entries = await readdir(blenderRoot, { withFileTypes: true });
        const versionDirs = entries
            .filter((entry) => entry.isDirectory())
            .map((entry) => join(blenderRoot, entry.name))
            .sort((left, right) => basename(right).localeCompare(basename(left), undefined, { numeric: true }));
        for (const versionDir of versionDirs) {
            candidates.push(join(versionDir, "blender.exe"));
        }
    }
    return candidates;
}
async function exists(path) {
    try {
        await access(path, fsConstants.F_OK);
        return true;
    }
    catch {
        return false;
    }
}
function runProcess(command, args) {
    return new Promise((resolvePromise, reject) => {
        const child = spawn(command, args, {
            stdio: ["ignore", "pipe", "pipe"],
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
                reject(new Error(stderr.trim() || stdout.trim() || `Blender exited with code ${code}.`));
                return;
            }
            resolvePromise({ stdout, stderr });
        });
    });
}
