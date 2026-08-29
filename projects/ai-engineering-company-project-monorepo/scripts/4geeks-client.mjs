import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..");

function loadEnvironmentFile() {
  const environmentFile = resolve(repositoryRoot, ".env");
  if (!existsSync(environmentFile)) return;

  for (const rawLine of readFileSync(environmentFile, "utf8").split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separator = line.indexOf("=");
    if (separator < 1) continue;

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

export async function get4GeeksJson(path) {
  loadEnvironmentFile();
  const token = process.env.TOKEN_4GEEKS;

  if (!token || token === "replace_with_your_student_token") {
    throw new Error("Missing TOKEN_4GEEKS. Copy .env.example to .env and add the local token.");
  }

  const response = await fetch(`https://breathecode.herokuapp.com${path}`, {
    headers: { Authorization: `Token ${token}` },
  });

  if (!response.ok) {
    throw new Error(`4Geeks API request failed with ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export function taskList(payload) {
  return Array.isArray(payload) ? payload : payload?.results ?? [];
}

export function summarizeTask(task) {
  return {
    id: task.id ?? null,
    title: task.title ?? task.task?.title ?? task.associated_slug ?? null,
    slug: task.associated_slug ?? task.slug ?? null,
    status: task.task_status ?? task.status ?? null,
    type: task.task_type ?? task.type ?? null,
    cohort: task.cohort?.slug ?? task.cohort ?? null,
  };
}
