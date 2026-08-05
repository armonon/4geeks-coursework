# Product Overview

## What the product does today

A single-page **executive financial dashboard**. When the user opens the
app, the frontend fetches one year of mock financial movements from the
backend and renders:

1. A header with a static period label ("2024 - Full Year") and a
   "Financial Overview" title (`frontend/src/components/dashboard/dashboard-header.tsx`).
2. A four-card KPI row: Total Income, Total Outcome, Profit, Profit
   Margin (`frontend/src/components/dashboard/kpi-row.tsx`).
3. Two Recharts panels: monthly income vs. outcome, and monthly profit
   margin (`frontend/src/components/dashboard/income-outcome-chart.tsx`,
   `profit-percent-chart.tsx`).

All values are derived client-side in `frontend/src/lib/financial-utils.ts`
from the raw movement list returned by `GET /api/metrics`.

## What a "movement" is

A movement (see `FinancialMovement` in `backend/app/routes.py:22-27`) has:

- `create_date` — ISO date, generated relative to `date.today()`.
- `amount` — float in the range that the mock generator emits
  (~$500–$12k depending on operation type).
- `operation_type` — `"income"` or `"outcome"`.
- `category` — `"suppliers"`, `"sales"`, `"operational"`,
  `"administrative"`, or `"others"`.
- `business_type` — `"B2B"` or `"B2C"`.

There are 360 movements per year (12 months × 30 rows), deterministic
under seed `42`.

## Backend surface (implemented, partially unused)

| Endpoint                          | Consumed by UI? | Purpose                              |
| --------------------------------- | --------------- | ------------------------------------ |
| `GET /health`                     | no              | Liveness probe                       |
| `GET /api/metrics`                | **yes**         | Raw movements, filterable            |
| `GET /api/metrics/facets`         | no              | Filter options + `min_date/max_date` |
| `GET /api/metrics/summary`        | no              | Aggregate by day/week/month          |
| `GET /api/metrics/categories/top` | no              | Ranked totals per category           |
| `GET /api/metrics/comparison`     | no              | Period vs. previous period net       |
| `GET /api/metrics/alerts`         | no              | Outcome-spike anomalies              |
| `GET /api/metrics/b2b`            | no              | B2B-only movements                   |
| `GET /api/metrics/b2c`            | no              | B2C-only movements                   |

Seven of nine endpoints are effectively dead code from the product's
perspective — see rule `API-1`.

## Explicit non-goals (as of this handover)

- No persistence — every request rebuilds the dataset in-memory.
- No authentication or authorization — the API is fully open (see
  rule `SEC-1`).
- No multi-tenant / user-scoped data.
- No mutation endpoints — everything is read-only.
- No production Docker target (see rule `SEC-3`).

## Intended audience

Internal demo / teaching artifact for the 4Geeks AI-Engineering
curriculum. Not intended to be shipped to end-users as-is.
