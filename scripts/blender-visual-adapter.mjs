import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile, access, readdir } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { tmpdir } from "node:os";
import { basename, delimiter, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const input = await readStdIn();
const request = JSON.parse(input);
const scriptFilePath = fileURLToPath(import.meta.url);
const workspaceRoot = resolve(scriptFilePath, "..", "..");
const pythonDriver = resolve(workspaceRoot, "scripts", "blender-visual-driver.py");
const tempDir = await mkdtemp(join(tmpdir(), "auto-skepture-blender-visual-"));
const requestPath = join(tempDir, "request.json");
const responsePath = join(tempDir, "response.json");

try {
  const blenderExecutable = await resolveBlenderExecutable();
  await writeFile(requestPath, `${JSON.stringify(request)}\n`, "utf8");

  const args = buildBlenderArgs({ pythonDriver, requestPath, responsePath });

  const { stderr } = await runProcess(blenderExecutable, args, {
    cwd: process.env.BLENDER_WORKING_DIRECTORY,
    timeoutMs: parseTimeout(process.env.BLENDER_VISUAL_TIMEOUT_MS) ?? 90_000,
  });

  const response = await readFile(responsePath, "utf8");
  process.stdout.write(response.trim());
  if (!response.endsWith("\n")) {
    process.stdout.write("\n");
  }
  if (stderr.trim()) {
    process.stderr.write(stderr);
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
} finally {
  await rm(tempDir, { recursive: true, force: true });
}

function buildBlenderArgs({ pythonDriver, requestPath, responsePath }) {
  const blendFile = process.env.BLENDER_VISUAL_BLEND_FILE;
  const args = [];

  if (blendFile) {
    args.push(blendFile);
  } else if (process.env.BLENDER_VISUAL_FACTORY_STARTUP !== "0") {
    args.push("--factory-startup");
  }

  args.push("--python", pythonDriver, "--", requestPath, responsePath);
  return args;
}

async function readStdIn() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks).toString("utf8").trim();
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

  throw new Error(
    "Unable to locate Blender. Set BLENDER_EXECUTABLE to your local blender.exe path.",
  );
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
    const powershellPath =
      process.env.SystemRoot !== undefined
        ? join(
            process.env.SystemRoot,
            "System32",
            "WindowsPowerShell",
            "v1.0",
            "powershell.exe",
          )
        : "powershell.exe";
    const { stdout } = await runProcess(
      powershellPath,
      ["-NoProfile", "-Command", script],
      { timeoutMs: 10_000 },
    );
    const installLocation = stdout.trim().split(/\r?\n/)[0]?.trim();
    if (!installLocation) {
      return null;
    }

    const candidate = join(installLocation, "blender.exe");
    return (await exists(candidate)) ? candidate : null;
  } catch {
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
  } catch {
    return false;
  }
}

function parseTimeout(rawTimeout) {
  if (!rawTimeout) {
    return undefined;
  }

  const parsed = Number(rawTimeout);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("BLENDER_VISUAL_TIMEOUT_MS must be a positive number when set.");
  }

  return parsed;
}

function runProcess(command, args, options) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      stdio: ["ignore", "pipe", "pipe"],
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
        reject(new Error(`Blender process timed out after ${options.timeoutMs}ms.`));
      });
    }, options.timeoutMs);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      finish(() => reject(error));
    });
    child.on("close", (code) => {
      finish(() => {
        if (code !== 0) {
          reject(
            new Error(
              `Blender exited with code ${code}. ${stderr.trim() || stdout.trim() || "No output."}`,
            ),
          );
          return;
        }

        resolvePromise({ stdout, stderr });
      });
    });
  });
}