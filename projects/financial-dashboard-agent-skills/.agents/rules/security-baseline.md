# security-baseline

Scope: `backend/app/main.py`, both `Dockerfile`s, `docker-compose.yml`,
`.env*` handling.

## SEC-1 — CORS must be explicit and non-credentialed by default

`backend/app/main.py:8-13` sets
`allow_origins=["*"]` **with** `allow_credentials=True`. That combination
is rejected by every browser CORS implementation and mis-signals the
policy the project is willing to grant.

Rule:

- `allow_origins` must be an explicit list read from an environment
  variable (default: `["http://localhost:5173"]`).
- `allow_credentials` may only be `True` when `allow_origins` does not
  contain `"*"`.
- Adding `"*"` back requires a comment naming the reason and the ticket
  that will remove it.

## SEC-2 — No secrets in the repo; document required env vars

Today the only env var is `VITE_API_BASE_URL`
(`frontend/.env.example`) and it is safe to publish. Rule going forward:

- Any new env var must be added to `frontend/.env.example` or a new
  `backend/.env.example` with a placeholder value and a one-line
  description.
- `.env` files stay ignored (they already are — verify with
  `git check-ignore -v .env` before adding one).

## SEC-3 — Dockerfiles must reach a production target before deploy

Both current `Dockerfile`s (`backend/Dockerfile`, `frontend/Dockerfile`)
run development servers (`uvicorn --reload`, `vite --host`) and install
dev tooling into the runtime image. Any change that ships an image
outside this repo must first:

1. Add a multi-stage build with a `production` target.
2. Drop the `--reload` / dev-server command in that stage.
3. Add a `USER` directive that runs as a non-root UID.
4. Add a `HEALTHCHECK` (backend: `GET /health`, frontend: static
   `curl -f http://localhost/`).

Until such a stage exists, the images are development-only and must not
be pushed to any registry.

## SEC-4 — Never widen dependency surface in a "just add it" commit

`backend/requirements.txt` currently mixes runtime and test deps
(`pytest`, `pytest-cov`, `httpx`) with no pins. Rule:

- Every new dependency must be added with a lower bound
  (e.g. `fastapi>=0.115`).
- Runtime deps live in `requirements.txt`; dev/test deps in a new
  `requirements-dev.txt` when this rule is next applied.
- Frontend equivalents: keep runtime vs. dev separation in
  `package.json` (already correct); do not add unknown transitive
  authors without a security check.
