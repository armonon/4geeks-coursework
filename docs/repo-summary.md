# Repository Summary

This is an AI-assisted summary of the handover repository. Every claim below
was validated against the actual code — file paths and line numbers are given
so it can be re-verified.

## What this project is

A **financial-metrics dashboard** made of two services orchestrated by Docker
Compose: a **FastAPI** backend that serves mock financial movements and derived
analytics, and a **React 19 + Vite + TypeScript** frontend that renders KPIs
and monthly charts. It ships as a teaching / demo project — there is no
persistent database and no authentication.

- `docker-compose.yml` wires `frontend` → `backend` on ports `5173` and `8000`.
- Both services run in **development mode** inside their containers
  (`uvicorn ... --reload` and `vite --host 0.0.0.0`); neither Dockerfile
  produces a production build.

## Backend (`backend/`)

- **Framework**: FastAPI, Python 3.13-slim base image
  (`backend/Dockerfile:1`).
- **Entrypoint**: `backend/app/main.py` — creates the `FastAPI(title="Financial
  Metrics API")` app, installs a permissive CORS middleware
  (`allow_origins=["*"]`, `allow_credentials=True`, `allow_methods=["*"]`)
  and mounts a single router from `app.routes`.
- **All domain logic lives in one module**: `backend/app/routes.py` (392 lines).
  It contains:
  - Pydantic models: `FinancialMovement`, `MetricsFacets`,
    `MetricsSummaryItem`, `TopCategoryItem`, `MetricsComparison`,
    `MetricsAlert` (`routes.py:22-63`).
  - Type aliases via `Literal`: `OperationType`, `Category`, `BusinessType`,
    `GroupBy` (`routes.py:11-15`).
  - Mock-data generator `generate_mock_movements(seed=42)` that builds
    12 × 30 = 360 movements per call using `random` seeded with `42`
    (`routes.py:94-104`).
  - Pure helper functions: `filter_movements_by_date`, `filter_movements`,
    `ensure_chronological_order`, `build_metrics_facets`,
    `summarize_movements`, `build_top_categories`, `calculate_net_value`,
    `detect_outcome_alerts` (`routes.py:107-240`).
  - 9 endpoints, all `GET`, all prefixed under `/api/metrics` except
    `/health` (`routes.py:243-391`):
    - `GET /health`
    - `GET /api/metrics` (raw movements, filterable)
    - `GET /api/metrics/facets` (available filter options + date range)
    - `GET /api/metrics/summary` (aggregated by day/week/month)
    - `GET /api/metrics/categories/top` (ranked totals per category)
    - `GET /api/metrics/comparison` (period vs. previous period)
    - `GET /api/metrics/alerts` (outcome spikes vs. baseline average)
    - `GET /api/metrics/b2b` and `GET /api/metrics/b2c` (segment shortcuts)
- **Tests**: `backend/tests/test_routes.py` covers 14 cases via
  `fastapi.testclient.TestClient` — endpoints, filters, helper functions.
  `conftest.py` prepends the backend root to `sys.path` so `app.*`
  imports work without an installed package.
- **Runtime dependencies** (`backend/requirements.txt`): `fastapi`,
  `uvicorn[standard]`, `debugpy`, `pytest`, `pytest-cov`, `httpx`. No pinned
  versions; test dependencies are mixed into the runtime list.

## Frontend (`frontend/`)

- **Stack**: React 19, TypeScript ~6.0, Vite 8, Tailwind CSS 4, Recharts,
  `lucide-react`, `clsx` + `tailwind-merge`, `class-variance-authority`
  (`frontend/package.json`).
- **Entrypoints**: `src/main.tsx` mounts `<App />`; `src/App.tsx` is the
  entire page — it fetches once from `${VITE_API_BASE_URL ?? ""}/api/metrics`
  and renders a header, a KPI row, and two charts. All state is local
  `useState`; no router, no state library.
- **Component layout**:
  - `components/dashboard/` — `dashboard-header.tsx`, `kpi-row.tsx`,
    `kpi-card.tsx`, `income-outcome-chart.tsx`, `profit-percent-chart.tsx`.
  - `components/ui/` — `card.tsx`, `skeleton.tsx` (shadcn/ui-style
    primitives, configured via `components.json`).
  - `lib/` — `financial-types.ts` (mirrors the backend Pydantic shapes),
    `financial-utils.ts` (`computeKPIs`, `computeMonthlyData`,
    `formatCurrency`, `formatPercent`), `financial-utils.test.ts` (Vitest),
    `mock-data.ts` (unused static movements), `utils.ts` (`cn` helper).
- **Networking**: `vite.config.ts` proxies `/api` to `http://backend:8000`,
  so the frontend never needs a base URL in local dev / Codespaces. The
  optional `VITE_API_BASE_URL` in `.env.example` is only for pointing at a
  different origin.
- **Tests**: only `financial-utils.test.ts` (Vitest); no component or
  integration tests.

## Cross-cutting notes verified from the code

- **Frontend uses only `GET /api/metrics`** (`App.tsx:15-21`). The richer
  endpoints (`/summary`, `/comparison`, `/alerts`, `/categories/top`,
  `/facets`, `/b2b`, `/b2c`) are implemented and tested but currently
  unused — the UI recomputes monthly aggregates client-side in
  `computeMonthlyData` (`financial-utils.ts:37-66`).
- **Types are duplicated by hand** between backend `routes.py:11-14` and
  frontend `financial-types.ts:1-3`. There is no code generation to keep
  them in sync.
- **Mock data is timestamped relative to `date.today()`** — the year is
  chosen dynamically (`_year_for_month`, `routes.py:65-68`). Anything that
  hard-codes a year against these payloads will drift.
- **CORS is fully open** (`main.py:8-13`) and combined with
  `allow_credentials=True`, which browsers reject; effectively a
  code smell that only works because no credentialed requests are made.
- **No CI, no linter/formatter for the backend, no production Docker
  target, no auth.** These are absences confirmed by inspection, not
  guesses.

## Suggested reading order for a new contributor

1. `README.md`, `AGENTS.md` — intent and agent conventions.
2. `docker-compose.yml`, both `Dockerfile`s — how it runs.
3. `backend/app/main.py` → `backend/app/routes.py` — every backend behavior.
4. `frontend/src/App.tsx` → `lib/financial-types.ts` →
   `lib/financial-utils.ts` → the two chart components — every frontend
   behavior.
5. `backend/tests/test_routes.py` — the closest thing to a behavioral spec.

## Validation notes

Every path, function name, and line number above was checked directly
against the working tree. Two claims were revised after inspection:

- Initial read suggested the frontend consumed multiple endpoints; it does
  not. Confirmed by grepping `App.tsx` and all files under `src/` — the
  only network call is to `/api/metrics`.
- Initial read suggested the mock data was 2024-scoped (as hinted by
  `frontend/src/lib/mock-data.ts`). The backend's live generator computes
  years from `date.today()` and is unrelated to that static array, which
  is currently unused.
