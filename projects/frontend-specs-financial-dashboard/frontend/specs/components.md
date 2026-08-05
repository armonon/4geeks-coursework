# Component Specifications

This document is the source of truth for the three new features. A
developer (or coding agent) should be able to implement any component
below without asking for clarification. All TypeScript names refer to
declarations in [`./api-types.ts`](./api-types.ts) and
[`./param-types.ts`](./param-types.ts).

Placement of every file assumes the existing frontend layout
(`frontend/src/components/dashboard/*` for feature components,
`frontend/src/components/ui/*` for primitives).

---

## Feature 1 — Date range filter on the home dashboard

### `DateRangeFilterBar`

- **File**: `frontend/src/components/dashboard/date-range-filter-bar.tsx`
- **Purpose**: two date inputs plus a reference label; the single
  source of truth for the date range applied to every home-dashboard
  data query.
- **Props**:

  | Prop           | Type                                            | Required | Description |
  | -------------- | ----------------------------------------------- | -------- | ----------- |
  | `value`        | `DateRangeFilter`                               | yes      | Currently applied range. Passed back on every change. |
  | `onChange`     | `(next: DateRangeFilter) => void`               | yes      | Fires on blur / commit, not on every keystroke. |
  | `available`    | `{ min: IsoDateString; max: IsoDateString }`    | yes      | Reference range shown next to inputs. Sourced from `FacetsResponse.min_date` / `max_date`. |
  | `loading`      | `boolean`                                       | no       | When `true`, inputs are disabled and the reference label shows a skeleton. |

- **Layout**: horizontal on `md+`, stacked on mobile. Two `<input type="date">`
  fields (start left, end right), separated by an en dash, followed by a
  muted-foreground line: *"Available range: {min} – {max}"*.
- **Interaction**:
  - Inputs are HTML `date` inputs (`YYYY-MM-DD` in every browser).
  - Both fields default to empty strings. Clearing an input sends the
    corresponding field as `undefined` in the next `onChange`.
  - No client-side re-fetching happens inside this component. The
    parent (`HomeDashboardPage`) owns the fetch.
- **Conditional rendering**:
  - Reference label renders a `<Skeleton>` when `loading` is `true`.
  - When `value.start_date > value.end_date` (both set), the component
    renders an inline warning below the inputs: *"End date must be on
    or after start date."* The `onChange` still fires; validation is
    non-blocking so the user can correct either side.
  - When only one input is filled, no warning renders — the request
    still goes out (see edge case E1.2 in `README.md`).

### `HomeDashboardPage` (existing, updated)

- **File**: `frontend/src/App.tsx` (or a new `pages/home.tsx` when
  routing lands with Feature 3).
- **New state**:
  - `dateRange: DateRangeFilter` — starts as `{}`.
  - `facets: FacetsResponse | null` — fetched once on mount.
- **New behavior**: `DateRangeFilterBar` renders above the existing
  `<KPIRow>`. Its `onChange` sets `dateRange`; that state is passed
  into every home-dashboard fetch (KPI row, charts, `AnomalyAlertsTable`).
- **Loading states**: while `facets === null`, `DateRangeFilterBar`
  renders in its `loading` state; existing skeletons on KPI cards and
  charts continue to reflect their own fetch state.

---

## Feature 2 — Anomaly alerts table on the home dashboard

### `AnomalyAlertsTable`

- **File**: `frontend/src/components/dashboard/anomaly-alerts-table.tsx`
- **Purpose**: renders the outcome-spike table below the existing charts.
- **Props**:

  | Prop         | Type                                       | Required | Description |
  | ------------ | ------------------------------------------ | -------- | ----------- |
  | `entries`    | `AlertsResponse`                           | yes      | Rows to render. Empty array triggers the empty state. |
  | `threshold`  | `number`                                   | yes      | Current threshold ratio, shown in the header and used in the empty-state copy. |
  | `onThresholdChange` | `(next: number) => void`            | yes      | Called on commit (blur / Enter), not on every keystroke. |
  | `loading`    | `boolean`                                  | no       | When `true`, replaces the tbody with 3 skeleton rows. |
  | `error`      | `string \| null`                           | no       | When non-null, replaces the tbody with an error banner (see below). |

- **Layout**:
  - Header row with title *"Anomaly alerts"* on the left and a
    numeric input on the right labelled *"Threshold"* (step `0.05`,
    min `0.01`, max `1.0`, default `0.3`).
  - `<table>` with four columns, in order:
    1. **Period** (raw `AlertEntry.period` string).
    2. **Recorded outcome** (`AlertEntry.outcome_total`, `formatCurrency`).
    3. **Rolling average (prev. periods)** (`AlertEntry.baseline_average`,
       `formatCurrency`).
    4. **Increase** (`AlertEntry.increase_ratio * 100`, formatted with
       one decimal and a `%` suffix, coloured red when `> 0.5`, amber
       otherwise).
- **Conditional rendering**:
  - `loading`: skeleton rows in the tbody, inputs remain enabled.
  - `error`: replaces the tbody with a single-cell row containing
    *"Couldn't load anomaly alerts. {error}"* and a *Retry* button
    that re-triggers the parent's fetch.
  - `entries.length === 0` (and not loading, not error): the tbody
    shows one row spanning all four columns with the text: *"No
    anomalies detected for a threshold of {threshold * 100 with one
    decimal}%. Try lowering the threshold to see more periods."*
    (See evaluation criterion "the empty state of the anomaly alerts
    table is explicitly specified".)
- **Threshold input constraints**: the input clamps to `[0.01, 1.0]`
  on commit. If the user types `0` or a negative number, the value
  snaps to `0.01`; anything above `1` snaps to `1.0`.

### `HomeDashboardPage` (existing, updated further)

- Adds an `AnomalyAlertsTable` below the charts row.
- Owns `threshold: number` (default `0.3`) and refetches
  `GET /api/metrics/alerts` whenever `threshold` or `dateRange` change.
- Request params come from `AlertsParams`:
  `{ threshold, start_date: dateRange.start_date,
     end_date: dateRange.end_date }` (fields omitted when undefined).

---

## Feature 3 — B2B vs B2C comparison view

This is a new page. Routing library is not prescribed; add whatever the
existing app uses (or a minimal state-based switch in `App.tsx` if
routing isn't in place yet). The new page's URL should be `/compare`.

### `BusinessComparisonPage`

- **File**: `frontend/src/pages/business-comparison.tsx`
- **Purpose**: shell for the comparison view. Owns `dateRange` state,
  fetches facets once and top-categories twice, and hands data down.
- **Layout** (top to bottom):
  1. Page header with title *"B2B vs B2C revenue"* and a compact
     `DateRangeFilterBar` (reused from Feature 1).
  2. Two-column grid of `BusinessLinePanel`s on `md+`, stacked on
     mobile. Order: B2B on the left, B2C on the right.
  3. A single `BusinessComparisonChart` below the panels.
- **Fetches**:
  - `GET /api/metrics/facets` — once on mount; supplies the reference
    range to `DateRangeFilterBar`.
  - `GET /api/metrics/categories/top` — one call per side:
    `{ operation_type: "income", limit: 5, business_type: "B2B",
       start_date, end_date }` and the same with `"B2C"`.
    Fires again whenever `dateRange` changes.

### `BusinessLinePanel`

- **File**: `frontend/src/components/dashboard/business-line-panel.tsx`
- **Props**:

  | Prop           | Type                    | Required | Description |
  | -------------- | ----------------------- | -------- | ----------- |
  | `line`         | `BusinessType`          | yes      | `"B2B"` or `"B2C"`; used for the panel heading. |
  | `entries`      | `TopCategoriesResponse` | yes      | Backend rows (already limited to 5 server-side). |
  | `loading`      | `boolean`               | no       | Renders skeleton rows in the tbody. |
  | `error`        | `string \| null`        | no       | Renders an error banner in place of the table body. |

- **Layout**: card containing:
  - A heading (`"B2B revenue"` / `"B2C revenue"` derived from `line`).
  - A total-income line — sum of `entries[i].total_amount`, formatted
    with `formatCurrency`.
  - A three-column table:
    1. **Category** (`CategoryEntry.category`).
    2. **Total income** (`CategoryEntry.total_amount`, `formatCurrency`).
    3. **% of {line}** (`total_amount / sum(entries.total_amount) * 100`,
       one decimal, `%` suffix). When the total is `0`, render `"—"`.
- **Empty state** (`entries.length === 0`, not loading, not error):
  a centered muted-foreground message inside the card body: *"No
  {line} income in this date range."* The table header still renders
  so the layout height matches the other panel.

### `BusinessComparisonChart`

- **File**: `frontend/src/components/dashboard/business-comparison-chart.tsx`
- **Props**:

  | Prop           | Type                          | Required | Description |
  | -------------- | ----------------------------- | -------- | ----------- |
  | `b2bTotal`     | `number`                      | yes      | Sum of the B2B panel's `total_amount`s (0 when panel empty). |
  | `b2cTotal`     | `number`                      | yes      | Sum of the B2C panel's `total_amount`s (0 when panel empty). |
  | `loading`      | `boolean`                     | no       | Renders a full-width `<Skeleton className="h-64" />`. |

- **Chart**: a single Recharts `<BarChart>` with two vertical bars
  (categories `"B2B"` and `"B2C"`) sharing one linear y-axis in
  currency. Colours use the existing `--chart-income` (B2B) and
  `--chart-outcome` (B2C) tokens for consistency with the other
  charts.
- **Empty state**: when both totals are `0`, render the chart with
  both axes visible and a centered overlay label: *"No income in this
  date range for either business line."*

---

## Conditional rendering summary (per feature)

| Feature | Loading                | Error                          | Empty                                                          |
| ------- | ---------------------- | ------------------------------ | -------------------------------------------------------------- |
| F1      | Inputs disabled, reference label skeleton | Inline warning under inputs (validation only; the fetch owner surfaces network errors elsewhere) | N/A — an empty range is a valid state |
| F2      | Skeleton rows in tbody | Error row with *Retry* button  | Explicit "No anomalies detected for a threshold of X%…" row    |
| F3      | Skeleton rows per side, chart skeleton | Error banner replaces panel body | Per-side "No {line} income in this date range." + chart overlay |
