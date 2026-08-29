#!/usr/bin/env node

import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const apiDirectory = join(repositoryRoot, "services", "api");

function isAvailable(command) {
  const result = spawnSync(command, ["--version"], { stdio: "ignore" });
  return result.status === 0;
}

let command;
let args;

if (isAvailable("uv")) {
  command = "uv";
  args = ["run", "pytest"];
} else {
  const virtualEnvironmentPython =
    process.platform === "win32"
      ? join(apiDirectory, ".venv", "Scripts", "python.exe")
      : join(apiDirectory, ".venv", "bin", "python");

  if (!existsSync(virtualEnvironmentPython)) {
    console.error(
      "Backend tests need uv or services/api/.venv. Install uv and run " +
        "`cd services/api && uv sync`, then retry.",
    );
    process.exit(1);
  }

  command = virtualEnvironmentPython;
  args = ["-m", "pytest"];
}

const result = spawnSync(command, args, {
  cwd: apiDirectory,
  stdio: "inherit",
});

if (result.error) {
  console.error(`Unable to start backend tests: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
