import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "../../..");

const snapshots = [
  {
    milestone: 1,
    branch: "milestone-1-web-fundamentals",
    sha: "c1212feb8e62cab094c4cfd2c060d8c4c9e7591a",
    paths: ["uis/website"],
  },
  {
    milestone: 2,
    branch: "milestone-2-fold-in",
    sha: "136b1443d947f9913303cd17c12add36391a2419",
    paths: ["packages/programming-fundamentals"],
  },
  {
    milestone: 3,
    branch: "milestone-3-talent-pipeline",
    sha: "f769eded95aeb6f57c3d01100baf2ad7d91fc0ce",
    paths: ["uis/talent-pipeline-tracker"],
  },
  {
    milestone: 4,
    branch: "milestone-4",
    sha: "d4af1285f208a175b19aa6255279af5781c5750b",
    paths: ["AGENTS.md", "memory-bank", ".agents/skills/freight-quote-invariants"],
  },
  {
    milestone: 5,
    branch: "milestone-5-strengthening",
    sha: "d0d7a3880b406087b1e382ef470ca8631081f574",
    paths: ["docs/ARCHITECTURE_PROPOSAL.md"],
  },
  {
    milestone: 5,
    branch: "milestone-5-inventory-orm",
    sha: "28caa9dcebc0cdaad442c1635e527374973520a5",
    paths: [
      "docs/CONTEXT-inventory-trackflow.md",
      "services/api/routers/inventory.py",
      "services/api/tests/test_inventory.py",
    ],
  },
  {
    milestone: 6,
    branch: "milestone-6-incident-analyzer",
    sha: "a3965340cb1344f44eeffffa7a39fef17f2c70cd",
    paths: ["packages/incident_analyzer", "scripts/analyze.py"],
  },
  {
    milestone: 9,
    branch: "milestone-9-supplier-directory",
    sha: "dcfb896d15050f0be1d172b02e0511b8ba5691f1",
    paths: ["services/api", "uis/backoffice"],
  },
];

function git(args) {
  return execFileSync("git", args, {
    cwd: repositoryRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

const errors = [];
const warnings = [];
const results = [];

let remoteReferences = new Map();

try {
  const output = git(["ls-remote", "--heads", "origin"]);
  remoteReferences = new Map(
    output
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [sha, ref] = line.split(/\s+/);
        return [ref.replace("refs/heads/", ""), sha];
      }),
  );
} catch (error) {
  errors.push(`Unable to read origin branches: ${error.message}`);
}

for (const snapshot of snapshots) {
  const remoteSha = remoteReferences.get(snapshot.branch);
  const check = {
    milestone: snapshot.milestone,
    branch: snapshot.branch,
    expectedSha: snapshot.sha,
    actualSha: remoteSha ?? null,
    paths: {},
  };

  if (!remoteSha) {
    errors.push(`Missing remote branch: ${snapshot.branch}`);
  } else if (remoteSha !== snapshot.sha) {
    errors.push(
      `${snapshot.branch} moved from ${snapshot.sha.slice(0, 7)} to ${remoteSha.slice(0, 7)}`,
    );
  }

  for (const path of snapshot.paths) {
    let present = false;
    try {
      git(["cat-file", "-e", `${snapshot.sha}:${path}`]);
      present = true;
    } catch {
      errors.push(`${snapshot.branch} is missing ${path}`);
    }
    check.paths[path] = present;
  }

  results.push(check);
}

const status = git(["status", "--porcelain"]);
if (status) {
  warnings.push("The local working tree has uncommitted changes.");
}

warnings.push(
  "Milestones 7 and 8 have no proven milestone branches; confirm their assignment mapping before creating them.",
);

const report = {
  repository: git(["config", "--get", "remote.origin.url"]),
  branch: git(["branch", "--show-current"]),
  clean: !status,
  ok: errors.length === 0,
  errors,
  warnings,
  snapshots: results,
};

console.log(JSON.stringify(report, null, 2));
process.exitCode = report.ok ? 0 : 1;
