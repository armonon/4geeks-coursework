import { authFetch, readApiError } from "@/lib/auth";
import { readJson } from "@/lib/errors";

/**
 * Incident manager client.
 *
 * Every value set below is transcribed from CONTEXT.md and must stay in
 * step with `packages/shared/trackflow_shared/incidents/model.py`.
 */

export type IncidentStatus = "open" | "in_progress" | "resolved" | "discarded";
export type IncidentOrigin = "customer" | "branch" | "internal";
export type IncidentBranch =
  | "central"
  | "la_warehouse"
  | "la_office"
  | "zaragoza_warehouse"
  | "zaragoza_office";
export type IncidentCategory =
  | "lost_parcel"
  | "delivery_failure"
  | "inventory_discrepancy"
  | "carrier_issue"
  | "returns_issue"
  | "warehouse_incident"
  | "system_failure"
  | "client_complaint"
  | "other";

/** CONTEXT § TrackFlow Warehouses and Offices — display names verbatim. */
export const BRANCH_LABELS: Record<IncidentBranch, string> = {
  central: "Central",
  la_warehouse: "Los Angeles — Warehouse",
  la_office: "Los Angeles — Office",
  zaragoza_warehouse: "Zaragoza — Warehouse",
  zaragoza_office: "Zaragoza — Office",
};

export const CATEGORY_LABELS: Record<IncidentCategory, string> = {
  lost_parcel: "Lost parcel",
  delivery_failure: "Delivery failure",
  inventory_discrepancy: "Inventory discrepancy",
  carrier_issue: "Carrier issue",
  returns_issue: "Returns issue",
  warehouse_incident: "Warehouse incident",
  system_failure: "System failure",
  client_complaint: "Client complaint",
  other: "Other",
};

export const STATUS_LABELS: Record<IncidentStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  discarded: "Discarded",
};

export const ORIGIN_LABELS: Record<IncidentOrigin, string> = {
  customer: "Customer",
  branch: "Branch",
  internal: "Internal",
};

export const BRANCHES = Object.keys(BRANCH_LABELS) as IncidentBranch[];
export const CATEGORIES = Object.keys(CATEGORY_LABELS) as IncidentCategory[];
export const STATUSES = Object.keys(STATUS_LABELS) as IncidentStatus[];
export const ORIGINS = Object.keys(ORIGIN_LABELS) as IncidentOrigin[];

/**
 * CONTEXT § Status and Lifecycle. Mirrored here so the UI only offers
 * transitions the API will accept — the API remains the authority and
 * rejects anything else with a 400.
 */
export const ALLOWED_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  open: ["in_progress", "discarded"],
  in_progress: ["resolved", "discarded"],
  resolved: [],
  discarded: [],
};

export interface Incident {
  id: number;
  title: string;
  description: string;
  category: IncidentCategory;
  status: IncidentStatus;
  origin: IncidentOrigin;
  branch: IncidentBranch;
  created_at: string;
  updated_at: string;
}

export interface IncidentSummary {
  total: number;
  by_status: Record<string, number>;
  by_category: Record<string, number>;
  by_origin: Record<string, number>;
  by_branch: Record<string, number>;
}

export interface IncidentCreate {
  title: string;
  description: string;
  category: IncidentCategory;
  origin: IncidentOrigin;
  branch: IncidentBranch;
}

/**
 * A field-scoped API error.
 *
 * The API answers a validation failure with
 * `{detail: {field, message}}`, so the form can put the message next to
 * the offending input instead of dumping it at the top.
 */
export class IncidentFieldError extends Error {
  field: string;
  constructor(field: string, message: string) {
    super(message);
    this.name = "IncidentFieldError";
    this.field = field;
  }
}

async function raise(res: Response): Promise<never> {
  try {
    const body = await res.clone().json();
    const detail = body?.detail;
    if (detail && typeof detail === "object" && "field" in detail) {
      throw new IncidentFieldError(
        String(detail.field),
        String(detail.message ?? "That value is not valid."),
      );
    }
  } catch (err) {
    if (err instanceof IncidentFieldError) throw err;
    // fall through to the generic reader
  }
  throw new Error(await readApiError(res));
}

export interface IncidentFilters {
  status?: IncidentStatus | "";
  origin?: IncidentOrigin | "";
  branch?: IncidentBranch | "";
  category?: IncidentCategory | "";
}

export async function fetchIncidents(
  filters: IncidentFilters = {},
): Promise<Incident[]> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  const res = await authFetch(`/api/incidents${qs ? `?${qs}` : ""}`);
  if (!res.ok) await raise(res);
  return readJson(res);
}

export async function fetchSummary(): Promise<IncidentSummary> {
  const res = await authFetch("/api/incidents/summary");
  if (!res.ok) await raise(res);
  return readJson(res);
}

export async function createIncident(
  payload: IncidentCreate,
): Promise<Incident> {
  const res = await authFetch("/api/incidents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) await raise(res);
  return readJson(res);
}

export async function updateIncidentStatus(
  id: number,
  status: IncidentStatus,
): Promise<Incident> {
  const res = await authFetch(`/api/incidents/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) await raise(res);
  return readJson(res);
}

export function formatDate(iso: string): string {
  // The try/catch this replaces never fired. `new Date("nonsense")` does
  // not throw — it returns an Invalid Date, and calling
  // toLocaleDateString on that returns the literal string "Invalid Date",
  // which is what the incident list was showing. The date has to be
  // checked explicitly.
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
