# tooling-and-ci

Scope: repo root, `.github/`, both `Dockerfile`s.

## TOOL-1 — Backend must be linted and formatted

There is currently no Python linter or formatter (`backend/requirements.txt`
holds only `fastapi`, `uvicorn[standard]`, `debugpy`, `pytest`, `pytest-cov`,
`httpx`).

Rule: before the next backend feature merges, the project must add
`ruff` (lint + format) with a config in `backend/pyproject.toml` covering
at least: `E`, `F`, `I`, `UP`, `B`. `ruff check .` and `ruff format
--check .` become the enforcement gate.

## TOOL-2 — Frontend must keep its linter green

`eslint.config.js` is already wired. Rule: `npm run lint` must exit 0
before any PR merges. Disabling a rule inline requires a comment naming
the reason.

## TOOL-3 — CI must run on every push and PR

There is no `.github/workflows/` today. When the first workflow lands,
it must at minimum:

- Install backend deps, run `ruff check .`, `pytest`.
- Install frontend deps, run `npm run lint`, `npm test`, `npm run build`.
- Fail fast; do not use `continue-on-error`.

## TOOL-4 — Docker Compose changes need a smoke-test note

`docker-compose.yml` currently mounts source directories and runs dev
servers. Any change that touches port bindings, volumes, or the
`depends_on` graph must include, in the commit body, the exact
`curl http://localhost:8000/health` (or equivalent) command that was
run against the rebuilt stack.

## TOOL-5 — Never `--no-verify` a commit

If a pre-commit hook, linter, or test blocks a commit, fix the cause.
Bypassing hooks is banned even for "documentation only" changes — those
have historically hidden lint failures that later broke CI.
