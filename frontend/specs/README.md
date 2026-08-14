# Frontend Specs — Financial Dashboard

Specification-first delivery for three new frontend features on the
financial-dashboard project. This folder is the **specification layer
only** — no React components, no `fetch` calls. Implementation happens
in a follow-up branch.

## Deliverables in this folder

| File                                | What it is                              |
| ----------------------------------- | --------------------------------------- |
| [`api-types.ts`](./api-types.ts)    | Response types (`FacetsResponse`, `AlertEntry`, `AlertsResponse`, `CategoryEntry`, `TopCategoriesResponse`) |
| [`param-types.ts`](./param-types.ts) | Query-parameter types (`DateRangeFilter`, `AlertsParams`, `TopCategoriesParams`) |
| [`components.md`](./components.md)  | Component breakdown, props, layout, and conditional rendering per feature |
| [`README.md`](./README.md)          | This document — data-contract summary, valid values, and edge cases |
| [`tsconfig.json`](./tsconfig.json)  | Strict TypeScript config so `npx tsc --noEmit` verifies the types |

## Feature ↔ endpoint map

Every path below was verified against the backend's OpenAPI document
(`/docs`) on a running instance of the financial dashboard.

| Feature                              | Endpoints                                                              | Request type(s)         | Response type(s)                  |
| ------------------------------------ | ---------------------------------------------------------------------- | ----------------------- | --------------------------------- |
| F1 · Date range filter               | `GET /api/metrics/facets` (reference range) + existing metric endpoints re-called with the new `start_date` / `end_date` params | `DateRangeFilter`       | `FacetsResponse`                  |
| F2 · Anomaly alerts table            | `GET /api/metrics/alerts?threshold=<ratio>&start_date=&end_date=`      | `AlertsParams`          | `AlertsResponse` (= `AlertEntry[]`) |
| F3 · B2B vs B2C comparison view      | `GET /api/metrics/categories/top?operation_type=income&limit=5&business_type=<B2B\|B2C>&start_date=&end_date=` + `GET /api/metrics/facets` | `TopCategoriesParams`   | `TopCategoriesResponse` (= `CategoryEntry[]`) |

## Valid values / constraints (quick reference)

The parameter types themselves carry per-field JSDoc; this table is a
cross-feature summary an implementer can eyeball without opening the
`.ts` files.

| Field                  | Type                             | Valid values / constraints                                          |
| ---------------------- | -------------------------------- | ------------------------------------------------------------------- |
| `start_date`           | `string?` (`YYYY-MM-DD`)         | Optional. `<= end_date` when both set. Omit — never send `""`.      |
| `end_date`             | `string?` (`YYYY-MM-DD`)         | Optional. `>= start_date` when both set. Omit — never send `""`.    |
| `threshold` (F2)       | `number?`                        | UI clamps to `[0.01, 1.0]`. Backend accepts any `>= 0`. Default `0.3`. |
| `operation_type` (F3)  | `"income" \| "outcome"`          | F3 always sends `"income"`.                                         |
| `limit` (F3)           | `number`                         | Backend accepts `1..20`. F3 always sends `5`.                       |
| `business_type` (F3)   | `"B2B" \| "B2C"`                 | F3 sends one call per side; if omitted, the endpoint aggregates both. |

Response invariants worth building UI logic on:

- `FacetsResponse.min_date <= max_date`.
- `AlertEntry.baseline_average >= 0`, `outcome_total >= 0`,
  `increase_ratio > threshold` (only rows above threshold are returned).
- `CategoryEntry` rows are already sorted by `total_amount` desc,
  and the array length is bounded by the request's `limit`.
- Both `AlertsResponse` and `TopCategoriesResponse` are bare JSON
  arrays — they can be empty. UI must not treat "empty array" as an
  error.

## Edge cases (≥ 2 per feature)

### Feature 1 — Date range filter

- **E1.1 · Both inputs empty.** UI must send neither `start_date`
  nor `end_date`; the dashboard shows all available data. The
  reference label still reads *"Available range: {min} – {max}"*.
- **E1.2 · Only one input filled.** Perfectly valid — the missing
  side is unbounded (start alone → up to `max_date`; end alone →
  from `min_date`). The UI must **not** auto-fill the empty side
  before sending, and must **not** block the request. No warning
  is shown.
- **E1.3 · Inverted range (`start_date > end_date`).** Non-blocking
  warning shown inline ("End date must be on or after start date.");
  the request still fires. The backend will return an empty window;
  downstream components render their existing empty states.

### Feature 2 — Anomaly alerts table

- **E2.1 · No anomalies at the current threshold.** Backend returns
  `[]`. Table renders an explicit row spanning all four columns:
  *"No anomalies detected for a threshold of {threshold*100}%. Try
  lowering the threshold to see more periods."* The table header
  and threshold input remain visible.
- **E2.2 · Threshold changed while a request is in flight.** The
  parent must ignore the stale response (either via `AbortController`
  or a monotonic request id). If the new request errors, the table
  shows the error banner even if older data is still in memory —
  do not silently show stale rows.
- **E2.3 · Date range from Feature 1 excludes every period with
  outcome data.** Backend returns `[]`. Same empty-state copy as
  E2.1 — the empty-state message does not distinguish "threshold too
  high" from "no data in window" because from the user's perspective
  both are corrected by widening one of the two controls.

### Feature 3 — B2B vs B2C comparison view

- **E3.1 · One side has no income in the date range.** Backend
  returns `[]` for that side only. The corresponding
  `BusinessLinePanel` renders the empty state (*"No {line} income
  in this date range."*); the other panel renders normally. The
  chart renders a single bar for the populated side and a zero-height
  slot for the empty side (axis still visible).
- **E3.2 · Both sides empty.** Both panels show the empty state;
  the chart renders both axes plus the centered overlay label
  described in `components.md`.
- **E3.3 · Category set differs between sides.** Nothing to do —
  each panel is a self-contained top-5 for its own business line. The
  UI does not attempt to align rows across panels.

## Verification

- Types compile cleanly under strict TS (`skipLibCheck: false`,
  `strict: true`, `noImplicitAny: true`) — run
  `npx tsc --noEmit --project frontend/specs/tsconfig.json` from the
  repo root. No `any`, no `object`, no `unknown`-as-shorthand.
- Every endpoint above was checked against the OpenAPI spec of the
  companion backend (path and query params documented at `/docs`).

## What this delivery deliberately does not include

- React components, hooks, or `fetch` calls (per rubric).
- Routing library selection (Feature 3 assumes whatever the app uses,
  or a minimal switch in `App.tsx` if none yet).
- OpenAPI code generation. Types are hand-written for now; a follow-up
  should move to `openapi-typescript` so this file becomes redundant.
