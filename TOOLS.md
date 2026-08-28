# Coursework Steward tools

## Repository tools

- `git` — inspect history, branches, diffs, and working-tree state.
- `gh` — read repository, pull-request, and branch metadata. GitHub writes
  require explicit user approval in the current session.
- `npm` — run the root typecheck, test, build, and workspace commands.
- `uv` — run and test the FastAPI backend under `services/api`.

## Coursework checks

- `node skills/coursework-repository-audit/scripts/audit.mjs` verifies the
  milestone snapshot branches and their required deliverables.
- `node scripts/verify-4geeks-session.mjs` checks whether the local 4Geeks
  token is valid without printing profile fields.
- `node scripts/query-4geeks-projects.mjs` lists project statuses.
- `node scripts/query-4geeks-pending.mjs` lists pending course tasks.
- `node scripts/query-4geeks-progress.mjs` summarizes course completion.

The 4Geeks scripts are read-only. They require `TOKEN_4GEEKS` in the
environment or an ignored root `.env` copied from `.env.example`.
