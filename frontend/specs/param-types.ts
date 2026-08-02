/**
 * Query-parameter types for the endpoints consumed by the three new
 * frontend features. Every field mirrors a query parameter documented
 * in the backend's OpenAPI spec (`/docs`).
 *
 * All fields describe values as they exist on the client *before*
 * URL-encoding — numeric fields are `number`, dates are `string`
 * in `YYYY-MM-DD` format.
 */

import type { OperationType, BusinessType } from "./api-types";

// ---------------------------------------------------------------------------
// Shared filter — inherited by every feature-specific parameter type.
// ---------------------------------------------------------------------------

/**
 * Optional start / end date filter shared by the three features.
 *
 * When both fields are omitted, the endpoint returns the full window.
 * When only one is present, the other side of the range is unbounded:
 * `start_date` alone means "from this date to `max_date`", and
 * `end_date` alone means "from `min_date` up to this date". Callers
 * must not send an empty string for a "no filter" case — omit the
 * field entirely.
 *
 * Callers are responsible for validating that `start_date <= end_date`
 * before sending the request; the backend does not currently reject
 * inverted ranges but will return an empty result set.
 */
export interface DateRangeFilter {
  /**
   * Inclusive lower bound of the date range, `YYYY-MM-DD` (e.g.
   * `"2026-01-01"`). Optional. Must be `<= end_date` when both are set.
   */
  start_date?: string;

  /**
   * Inclusive upper bound of the date range, `YYYY-MM-DD` (e.g.
   * `"2026-03-31"`). Optional. Must be `>= start_date` when both are set.
   */
  end_date?: string;
}

// ---------------------------------------------------------------------------
// GET /api/metrics/alerts
// ---------------------------------------------------------------------------

/**
 * Query parameters for `GET /api/metrics/alerts`, used by Feature 2
 * (anomaly alerts table on the home dashboard).
 *
 * Only fields Feature 2 needs are exposed here. The backend also
 * accepts `group_by` and `business_type`; those default server-side
 * to `"month"` and "all business types" respectively, which is what
 * Feature 2 wants, so the UI omits them.
 */
export interface AlertsParams extends DateRangeFilter {
  /**
   * Spike threshold as a ratio (not a percentage). The backend flags a
   * period whenever `(outcome - baseline) / baseline > threshold`.
   *
   * - Default (server-side, if the field is omitted): `0.3`.
   * - Feature 2 constraint: numeric input clamped to `[0.01, 1.0]`.
   * - The backend accepts any value `>= 0`; the UI clamp is stricter
   *   than the API's own validation, on purpose.
   */
  threshold?: number;
}

// ---------------------------------------------------------------------------
// GET /api/metrics/categories/top
// ---------------------------------------------------------------------------

/**
 * Query parameters for `GET /api/metrics/categories/top`, used by
 * Feature 3 (B2B vs B2C comparison).
 *
 * Feature 3 issues this request twice per date-range change: once with
 * `business_type: "B2B"` and once with `business_type: "B2C"`. Both
 * requests use `operation_type: "income"` and `limit: 5`.
 */
export interface TopCategoriesParams extends DateRangeFilter {
  /**
   * Which side of the ledger to rank. Feature 3 always sends `"income"`.
   * Default (server-side, if omitted): `"outcome"`.
   */
  operation_type: OperationType;

  /**
   * How many rows to return, `1..20` inclusive. Feature 3 always sends
   * `5`. Default (server-side, if omitted): `5`.
   */
  limit: number;

  /**
   * Which business line to scope the ranking to. Feature 3 requires
   * this field to be set (one call per side). If omitted, the endpoint
   * ranks across both B2B and B2C combined.
   */
  business_type: BusinessType;
}
