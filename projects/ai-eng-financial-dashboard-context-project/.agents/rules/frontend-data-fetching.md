# frontend-data-fetching

Scope: `frontend/src/App.tsx`, any new component that touches `fetch`,
`useEffect`, or user-visible text tied to backend data.

## FE-1 — Every fetch effect must be cancellable

`App.tsx:29-42` calls `fetchFinancialData()` in `useEffect` with no
cleanup. Under `<StrictMode>` the effect runs twice; a slow first
response resolving after the second overwrites fresh state.

Rule: any component that fetches in `useEffect` must:

1. Create an `AbortController` in the effect body.
2. Pass `signal: controller.signal` to `fetch`.
3. Return `() => controller.abort()` from the effect.
4. Use a captured `cancelled` boolean or check `signal.aborted` before
   calling `setState` in the resolved-promise path.

## FE-2 — Errors must be logged, not swallowed

`App.tsx:36-40` catches without binding the error
(`.catch(() => setError(...))`). Debugging a 500 in production would be
impossible.

Rule: `catch` must accept the error and `console.error` it (or send it to
a real reporter when one exists) *before* mapping it to a user-facing
string. User strings stay in Spanish where the surrounding UI is
Spanish, English otherwise.

## FE-3 — User-visible copy must reflect the data

`DashboardHeader period="2024 - Full Year"` is hard-coded in
`App.tsx:53`. The header lies once the underlying data is not from 2024.

Rule: any UI string that names a period, date range, currency, or count
must be derived from data returned by the backend
(e.g. `/api/metrics/facets` gives `min_date` / `max_date`). If a static
string is genuinely required, wrap it in a `// FE-3 exception:` comment
naming why.

## FE-4 — One fetch per concern; no ad-hoc endpoints in components

Route calls must be centralized in a service module
(`frontend/src/lib/api.ts` — to be added when the second endpoint is
consumed) rather than inlined in components. This keeps FE-1 and FE-2
enforceable in one place and prepares the ground for a generated client
under API-2.
