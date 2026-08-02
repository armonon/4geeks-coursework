# Current Status

Snapshot of the repository as of the phase-4 commit of this handover.

## Implemented and working

- **Local dev bring-up** via `docker compose up --build` produces a
  working frontend at `localhost:5173` and API docs at
  `localhost:8000/docs`.
- **Backend**: 9 endpoints in `backend/app/routes.py`, all covered by at
  least one test in `backend/tests/test_routes.py` (14 tests total).
  Pydantic response models on every route.
- **Frontend**: dashboard shell with header, KPI row, and two Recharts
  panels. Skeleton loading states on every card and chart. Single fetch
  in `App.tsx` to `GET /api/metrics`.
- **Utilities**: `computeKPIs`, `computeMonthlyData`, `formatCurrency`,
  `formatPercent` are unit-tested in `frontend/src/lib/financial-utils.test.ts`.

## Known gaps

Confirmed by direct inspection of the repository (references in
parentheses point at the rule that will address each item):

- **UI shows a fraction of the backend's capabilities.** Seven of the
  nine endpoints are unused; `/api/metrics/summary`, `/comparison`,
  `/alerts`, `/categories/top`, and `/facets` are prime candidates
  for the next iteration. *(rule `API-1`)*
- **CORS is misconfigured** — wildcard origin combined with
  `allow_credentials=True` in `backend/app/main.py`. *(rule `SEC-1`)*
- **`backend/app/routes.py` is a god-module** (392 lines mixing
  schemas, services, mocks, and handlers). *(rule `BE-1`)*
- **Mock generator recomputes 360 rows on every request** and mutates
  the global RNG. *(rules `BE-3`, `BE-4`, `BE-2`)*
- **API types are duplicated by hand** across backend and frontend
  with no drift detection. *(rule `API-2`)*
- **No frontend request cancellation** (`App.tsx` `useEffect`) and
  errors are swallowed. *(rules `FE-1`, `FE-2`)*
- **Hard-coded period label** in the dashboard header
  (`"2024 - Full Year"`) that doesn't reflect the actual data.
  *(rule `FE-3`)*
- **Test suite hard-codes an absolute month** (`"2025-03-01"` /
  `"2025-03-31"` in `test_metrics_comparison_returns_delta_fields`)
  against generator output that shifts with the calendar. *(rule
  `TEST-1`)*
- **No linter/formatter/type-checker for the backend**; no CI at all.
  *(rules `TOOL-1`, `TOOL-3`)*
- **Dockerfiles are development-only** — no production stage, no
  non-root user, no healthchecks. *(rule `SEC-3`)*

## Next priorities (suggested order)

1. `SEC-1` — restrict CORS. One-line risk, one-line fix.
2. `FE-1` + `FE-2` — abortable, logged fetches in `App.tsx`.
3. `API-1` — replace `computeMonthlyData` with a call to
   `GET /api/metrics/summary`; this alone eliminates the duplication
   flagged by `API-2` for those two functions.
4. `BE-1` + `BE-3` — split `routes.py` and cache the mock dataset.
   Do them together; the split is what makes caching easy to test.
5. `TOOL-1` + `TOOL-3` — add `ruff` and a minimal GitHub Actions
   workflow. Everything above becomes safer to ship afterwards.
6. `SEC-3` — production Docker target, only once the app is closer
   to being deployed.

## What is *not* changing in this handover

Per the milestone brief, this delivery adds:

- `docs/repo-summary.md`
- `docs/engineering-practices.md`
- `.agents/rules/*`
- `memory-bank/*` (this file included)

No source code was modified. All observations are anchored to unchanged
files so they can be re-verified.
