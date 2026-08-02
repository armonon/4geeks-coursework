# api-contract

Scope: the boundary between `backend/app/` and `frontend/src/lib/`.

## API-1 — Prefer server aggregates over client recomputation

`frontend/src/App.tsx` currently fetches raw `/api/metrics` and re-derives
KPIs and monthly totals in `frontend/src/lib/financial-utils.ts`
(`computeKPIs`, `computeMonthlyData`). The backend already exposes
`/api/metrics/summary`, `/api/metrics/comparison`, `/api/metrics/alerts`,
`/api/metrics/categories/top`, `/api/metrics/facets`, `/api/metrics/b2b`,
`/api/metrics/b2c` — none of which the frontend calls.

Rule: new dashboard features must reuse an existing endpoint when one
covers the aggregate. Only fall back to client-side computation when the
backend cannot express it, and document that decision in a comment or
PR note.

## API-2 — Keep type parity or delete the duplicated type

`backend/app/routes.py:11-14` and `frontend/src/lib/financial-types.ts:1-9`
declare the same enums by hand. Until an OpenAPI-driven generator exists:

- Any change to a `Literal` or Pydantic field in the backend must be
  mirrored in `financial-types.ts` in the same PR.
- Adding a new enum value that only exists on one side is not allowed
  without an explicit temporary marker
  (`// TODO(API-2): mirror in <other side>`).

A future rule update (API-2b) should replace this manual discipline with
`openapi-typescript` generation into `frontend/src/lib/api-types.ts`.

## API-3 — Feature-flag experimental endpoints

New endpoints under `/api/metrics/*` that are not yet consumed by the
frontend must still ship with:

1. A `response_model=` type.
2. At least one test in `backend/tests/test_routes.py` asserting shape
   and status.
3. A short note added to `docs/repo-summary.md` under the endpoint list.

An endpoint that violates any of the three is considered private and
must be removed before merge — otherwise the "unused endpoint" backlog
grows (already seven such endpoints today).
