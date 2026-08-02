/**
 * API response types used by the three new frontend features.
 *
 * Every type in this file mirrors a response body returned by the
 * financial-dashboard backend (see `backend/app/routes.py` in the
 * dashboard repo, or `/docs` on a running instance). Do not add a
 * field here that the API does not actually return.
 *
 * Related files:
 * - `./param-types.ts` — query-parameter shapes for the same endpoints.
 * - `./README.md`      — endpoint mapping, edge cases, and constraints.
 */

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

/**
 * A calendar date serialized as an ISO-8601 `YYYY-MM-DD` string
 * (e.g. `"2026-03-14"`). The backend emits this format for every
 * date field in the responses below.
 */
export type IsoDateString = string;

/**
 * High-level accounting direction of a financial movement.
 * - `"income"`  — money coming in (sales, other credits).
 * - `"outcome"` — money going out (suppliers, operations, etc.).
 */
export type OperationType = "income" | "outcome";

/**
 * Business line a movement belongs to.
 * - `"B2B"` — business-to-business.
 * - `"B2C"` — business-to-consumer.
 */
export type BusinessType = "B2B" | "B2C";

/**
 * Category of a financial movement. Values are the fixed enum returned
 * by the backend; `sales` and `others` may appear on `"income"` rows,
 * and `suppliers` / `operational` / `administrative` / `others` on
 * `"outcome"` rows.
 */
export type Category =
  | "suppliers"
  | "sales"
  | "operational"
  | "administrative"
  | "others";

// ---------------------------------------------------------------------------
// GET /api/metrics/facets  -> FacetsResponse
// Used by: Feature 1 (date range reference) and Feature 3 (B2B vs B2C view).
// ---------------------------------------------------------------------------

/**
 * Response body of `GET /api/metrics/facets`.
 *
 * Describes the full set of filter values available in the current
 * dataset and the earliest/latest movement dates. The dashboard uses
 * `min_date` / `max_date` as the reference range shown next to the
 * date inputs in Feature 1.
 */
export interface FacetsResponse {
  /** All operation types present in the dataset. Always contains both
   *  `"income"` and `"outcome"` on the current mock dataset, but the UI
   *  must not assume that — render whatever the API returns. */
  operation_types: OperationType[];

  /** All business types present in the dataset. Currently `["B2B", "B2C"]`. */
  business_types: BusinessType[];

  /** All categories present in the dataset, alphabetically sorted by
   *  the backend. Feed this into the B2B vs B2C view (Feature 3) when
   *  listing "available categories for each group". */
  categories: Category[];

  /** Earliest movement date in the dataset, `YYYY-MM-DD`.
   *  Guaranteed to be `<= max_date`. */
  min_date: IsoDateString;

  /** Latest movement date in the dataset, `YYYY-MM-DD`.
   *  Guaranteed to be `>= min_date`. */
  max_date: IsoDateString;
}

// ---------------------------------------------------------------------------
// GET /api/metrics/alerts  -> AlertsResponse
// Used by: Feature 2 (anomaly alerts table).
// ---------------------------------------------------------------------------

/**
 * A single anomaly row from the outcome-spike detector.
 *
 * The backend groups movements by `group_by` (`day` | `week` | `month`,
 * default `"month"`) and, walking chronologically, emits an entry for
 * every period where `(outcome_total - baseline_average) /
 * baseline_average > threshold`.
 */
export interface AlertEntry {
  /** Period identifier. Format depends on the `group_by` used in the
   *  request:
   *  - `"day"`   → `YYYY-MM-DD` (e.g. `"2026-03-14"`).
   *  - `"week"`  → `YYYY-Www`   (e.g. `"2026-W11"`).
   *  - `"month"` → `YYYY-MM`    (e.g. `"2026-03"`).
   *  Feature 2 uses monthly grouping. */
  period: string;

  /** Total outcome (money spent) recorded in this period, rounded to
   *  2 decimals. Always `>= 0`. */
  outcome_total: number;

  /** Rolling average of the outcome across every period strictly before
   *  this one in the response window, rounded to 2 decimals. This is
   *  the "rolling average of the previous N periods" the UI must show
   *  (with N growing as the window extends). Always `>= 0`. */
  baseline_average: number;

  /** Relative increase over `baseline_average`, expressed as a ratio
   *  (not a percentage). For example, `0.42` means "42% higher than
   *  the baseline". The UI multiplies by 100 for display. Always
   *  greater than the requested `threshold`. */
  increase_ratio: number;
}

/**
 * Response body of `GET /api/metrics/alerts`.
 *
 * The endpoint returns a bare JSON array — this alias exists so the
 * UI code can write `AlertsResponse` explicitly at call sites. When the
 * list is empty, no anomaly crossed the threshold in the requested
 * window; the UI must show the empty state defined in
 * `./components.md` (Feature 2), not simply hide the table.
 */
export type AlertsResponse = AlertEntry[];

// ---------------------------------------------------------------------------
// GET /api/metrics/categories/top  -> TopCategoriesResponse
// Used by: Feature 3 (B2B vs B2C comparison tables).
// ---------------------------------------------------------------------------

/**
 * One row in the top-N ranking of categories for a given
 * `operation_type` (and optionally a given `business_type`).
 */
export interface CategoryEntry {
  /** The category being ranked. */
  category: Category;

  /** The operation type this ranking was computed for. Feature 3
   *  requests `"income"` explicitly. */
  operation_type: OperationType;

  /** Total amount for this `(category, operation_type)` pair in the
   *  requested window, rounded to 2 decimals. Always `>= 0`. Rows
   *  are returned sorted by this field in descending order. */
  total_amount: number;
}

/**
 * Response body of `GET /api/metrics/categories/top`.
 *
 * Bare JSON array; length is bounded by the `limit` query parameter
 * (max 20). When the requested `(business_type, operation_type,
 * date range)` window contains no movements, the array can be empty —
 * the UI must show the per-panel empty state described in
 * `./components.md` (Feature 3), and the comparison chart must fall
 * back to zero for that side.
 */
export type TopCategoriesResponse = CategoryEntry[];
