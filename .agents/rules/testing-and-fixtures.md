# testing-and-fixtures

Scope: `backend/tests/`, `frontend/src/**/*.test.ts(x)`.

## TEST-1 — No hard-coded absolute dates against generated fixtures

`generate_mock_movements` builds dates from `date.today()`
(`backend/app/routes.py:65-68`), yet
`test_metrics_comparison_returns_delta_fields`
(`backend/tests/test_routes.py:135-137`) uses `"2025-03-01"` /
`"2025-03-31"`. Once the calendar rolls past that window the assertions
still pass (they only check keys) while the request effectively returns
nothing.

Rule: date parameters in tests must be derived from
`generate_mock_movements(seed=42)` (min/max), from
`date.today()`, or from the `/api/metrics/facets` response — never
literals.

## TEST-2 — Endpoint tests must assert content, not just shape

Several tests only assert `response.status_code == 200` and dict keys
(e.g. TEST-1's example). New tests must also assert one non-trivial
invariant of the payload — a value bound, an ordering, or a
cross-field relationship (e.g. `net == income - outcome`).

## TEST-3 — One process-owned RNG in fixtures

If a test needs randomness, it must create `random.Random(seed)`
locally. `random.seed(...)` at module scope is banned (mirrors BE-2).

## TEST-4 — Frontend tests cover pure utilities and rendered output

Today only `financial-utils.test.ts` exists. Any new component under
`frontend/src/components/` that renders backend data must ship with a
Vitest + `@testing-library/react` test that covers at minimum:

- the loading state (skeleton visible),
- the success state (a number or label from the payload rendered),
- the error state (fallback text visible when the promise rejects).

## TEST-5 — Tests must run in the containers they will run in CI

`docker compose run --rm backend pytest` and
`docker compose run --rm frontend npm test` must both pass locally
before the branch is pushed. If they don't, the failure mode is either
a real bug or a Dockerfile drift — investigate rather than skipping.
