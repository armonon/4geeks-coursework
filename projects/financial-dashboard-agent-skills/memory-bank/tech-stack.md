# Tech Stack

Everything below was read off the actual dependency and config files —
no versions are guessed.

## Backend

- **Language / runtime**: Python 3.13-slim (`backend/Dockerfile:1`).
- **Framework**: FastAPI + `uvicorn[standard]` (dev mode with `--reload`).
- **Data validation**: Pydantic v2-style models (bare
  `class X(BaseModel)` with type annotations, no `Config` blocks).
- **Debugging**: `debugpy` listens on `5678` in the container
  (`backend/Dockerfile:11`).
- **Testing**: `pytest` + `pytest-cov` + `httpx` (used indirectly by
  `fastapi.testclient.TestClient`).
- **Linter / formatter / typer**: **none configured** — see rule `TOOL-1`.
- **Persistence**: none; data comes from `random`-driven mock generator.

`backend/requirements.txt` (verbatim, unpinned):

```
fastapi
uvicorn[standard]
debugpy
pytest
pytest-cov
httpx
```

## Frontend

- **Framework**: React 19 (`react`, `react-dom` `^19.2.4`).
- **Language**: TypeScript `~6.0.2` (per `frontend/package.json`; note
  the leading `~` is a lower-bound constraint — treat cautiously since
  TypeScript is still at 5.x at time of writing).
- **Build tool**: Vite `^8.0.4` with `@vitejs/plugin-react`.
- **Styling**: Tailwind CSS `^4.2.2` via `@tailwindcss/vite`,
  plus shadcn/ui conventions (`frontend/components.json`,
  `frontend/src/components/ui/*`).
- **Icons**: `lucide-react`.
- **Charts**: `recharts` `^3.8.1`.
- **Utility helpers**: `clsx`, `tailwind-merge`,
  `class-variance-authority`.
- **Testing**: `vitest` `^4.1.4` (+ `@vitest/coverage-v8`); only
  `src/lib/financial-utils.test.ts` exists today.
- **Linting**: ESLint 9 flat config with `typescript-eslint`,
  `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`
  (`frontend/eslint.config.js`).
- **Node runtime**: `node:24-alpine` in the container
  (`frontend/Dockerfile:1`).

## Infrastructure / tooling

- **Container orchestration**: Docker Compose (`docker-compose.yml`);
  two services, no volumes for state (only source-code bind mounts).
- **Port map**: 5173 (frontend), 8000 (backend), 5678 (`debugpy`).
- **API base URL**: Vite dev-server proxy on `/api → http://backend:8000`
  (`frontend/vite.config.ts`). Override with `VITE_API_BASE_URL` from
  `.env` if needed.
- **CI**: none. There is no `.github/workflows/` directory — see rule
  `TOOL-3`.
- **Secrets / env**: only `VITE_API_BASE_URL` is defined; documented in
  `frontend/.env.example`. Rule `SEC-2` governs future additions.

## Key dependencies to keep an eye on

| Package             | Version    | Watch                                     |
| ------------------- | ---------- | ----------------------------------------- |
| `typescript`        | `~6.0.2`   | Version does not exist as of this write-up — a `npm install` will resolve to the nearest available; verify before touching TS config. |
| `fastapi`           | unpinned   | Add a lower bound (`SEC-4`).              |
| `pytest*`, `httpx`  | unpinned   | Belongs in `requirements-dev.txt`.        |
| `vite@^8`, `vitest@^4` | latest majors | Both very new; expect fast-moving APIs. |
