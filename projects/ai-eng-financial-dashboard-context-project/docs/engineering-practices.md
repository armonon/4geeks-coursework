# Engineering Practices — Audit and Proposed Rules

Purpose: catalogue what the current codebase does well, what puts it at
risk, and translate the risk items into rules a future contributor (or AI
agent) can follow. Every finding cites the file it was observed in so the
next reader can go verify it.

---

## Good practices worth preserving

### G1 — Strongly typed API contracts on the backend  *(architecture)*
`backend/app/routes.py:11-63` declares every enum via `typing.Literal` and
every payload via a Pydantic model, and every endpoint is decorated with
`response_model=...`. That means FastAPI validates both the request query
parameters and the response body — the schema shown at `/docs` is always
in sync with the code.

### G2 — Deterministic, reproducible mock data  *(testing)*
`generate_mock_movements(seed=42)` (`routes.py:94-104`) is called with a
fixed seed in every endpoint. That makes tests such as
`test_top_categories_returns_limited_sorted_categories` deterministic
without needing snapshots.

### G3 — One-command local environment  *(DX)*
`docker-compose.yml` spins up both services (with a `depends_on` link) and
the frontend's Vite dev server proxies `/api` to the backend
(`frontend/vite.config.ts:9-14`). New contributors need only
`docker compose up --build` and a browser.

### G4 — Endpoint-level tests using the real FastAPI app  *(testing)*
`backend/tests/test_routes.py` exercises the actual `FastAPI` instance via
`TestClient` (`test_routes.py:1-9`) rather than mocking. That catches
routing, CORS-order, and Pydantic validation regressions.

### G5 — Clear frontend project shape  *(architecture / naming)*
`frontend/src/` cleanly separates `components/dashboard/*` (feature),
`components/ui/*` (design-system primitives), and `lib/*` (types +
pure functions). `components.json` documents the shadcn/ui conventions,
and the `@/*` path alias in `vite.config.ts` + `tsconfig.app.json` keeps
imports readable.

### G6 — Loading states are first-class in the UI  *(product quality)*
The KPI cards render `<Skeleton />` placeholders while `loading` is true
(`kpi-card.tsx:34-49`); the chart components do the same. That prevents
the "flash of empty data" that dashboards commonly ship with.

### G7 — Agent-friendly conventions declared up front  *(DX)*
`AGENTS.md` tells any AI (or human) collaborator exactly where to find
work rules and skills before acting. That is the foundation this
Phase 3 delivery is meant to fill in.

---

## Bad or risky practices to address

### B1 — CORS is fully open **and** credentialed  *(security / correctness)*
`backend/app/main.py:8-13` sets `allow_origins=["*"]`,
`allow_credentials=True`, `allow_methods=["*"]`. Browsers reject the
combination (spec: wildcard origin cannot be paired with credentials);
worse, it advertises a permissive policy that a future auth-enabled build
would inherit unchanged.

### B2 — All backend concerns in one 392-line module  *(architecture)*
`backend/app/routes.py` mixes route handlers, Pydantic schemas, business
logic, and a mock-data generator. As soon as a second router or real
data source appears, edits will fight for the same file.

### B3 — Mock data is regenerated on every request  *(efficiency)*
Every endpoint calls `generate_mock_movements(seed=42)` (e.g.
`routes.py:255, 264, 277, 295, 311, 350, 370, 385`). That's 360 objects
rebuilt per call. A single module-level cache would be constant-time.

### B4 — `random.seed` mutates global RNG state  *(correctness)*
`generate_mock_movements` calls `random.seed(seed)` (`routes.py:95-96`),
poisoning any other consumer of `random` in the process. `random.Random(seed)`
gives a local generator with no such side effect.

### B5 — Backend logic is duplicated in the frontend  *(architecture / DRY)*
`computeKPIs` and `computeMonthlyData` (`frontend/src/lib/financial-utils.ts`)
recompute what `GET /api/metrics/summary` already returns. The result is
two implementations that must agree — a classic drift trap. The richer
backend endpoints (`/summary`, `/comparison`, `/alerts`,
`/categories/top`, `/facets`, `/b2b`, `/b2c`) are not called from the
UI at all.

### B6 — API types are hand-mirrored, not generated  *(architecture)*
`backend/app/routes.py:11-14` and `frontend/src/lib/financial-types.ts:1-9`
declare the same enums and payload shape twice. Any rename or new field
must be applied in both places; there is no compile-time check that
catches drift.

### B7 — No request cancellation or race handling in the UI  *(correctness)*
`App.tsx:29-42` fires `fetchFinancialData()` in `useEffect` with no
`AbortController`, no cleanup, and swallows the error object entirely
(`.catch(() => setError(...))`). Under `<StrictMode>` the effect runs
twice; a slow first request that resolves after the second can overwrite
fresh state.

### B8 — Dockerfiles are dev-only  *(DX / production readiness)*
Both `Dockerfile`s run development servers (`uvicorn --reload`,
`vite --host`), install without `--production`, run as root, and have no
`HEALTHCHECK`. There is no path to build a shippable image today.

### B9 — Backend has no linter, formatter, or CI  *(DX)*
`requirements.txt` pins nothing (`fastapi`, `uvicorn[standard]`, ...) and
lacks `ruff`, `black`, or `mypy`. There is no `.github/workflows/`
directory. The frontend has ESLint but no CI wiring either.

### B10 — Date-sensitive fixtures  *(testing)*
`generate_mock_movements` timestamps rows relative to `date.today()`
(`routes.py:65-68`), yet `test_metrics_comparison_returns_delta_fields`
hard-codes `"2025-03-01"`/`"2025-03-31"` (`test_routes.py:135-137`). The
assertions only check that keys exist — the request will silently return
zero-length windows once the calendar drifts, and no one will notice.

### B11 — Hard-coded UI copy that misrepresents the data  *(product quality)*
`DashboardHeader period="2024 - Full Year"` is passed from `App.tsx:53`
regardless of what dates the backend returns. Users see "2024 - Full
Year" even when looking at 2026 data.

---

## From findings to rules

Each risk item above maps to one or more rules under `.agents/rules/`.
The mapping is:

| Rule file                                | Addresses                |
| ---------------------------------------- | ------------------------ |
| `backend-structure.md`                   | B2, B3, B4               |
| `api-contract.md`                        | B5, B6, G1               |
| `security-baseline.md`                   | B1, B8                   |
| `frontend-data-fetching.md`              | B7, B11                  |
| `testing-and-fixtures.md`                | B10, G2, G4              |
| `tooling-and-ci.md`                      | B9, B8                   |
| `documentation-and-memory.md`            | (keeps `memory-bank` + this audit accurate) |

Rules were checked against the existing repo before being written down —
if a rule could not be applied to a real file that lives in this project
today, it was dropped or narrowed.
