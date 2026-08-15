import { API_BASE_URL } from "@/lib/api";

// Mirrors CONTEXT.md § Supplier model. Keep these unions in step with
// services/api/models.py — they are the same closed value sets.
export type Country = "USA" | "Spain";
export type Currency = "USD" | "EUR";
export type SupplierStatus = "active" | "suspended";

export const CATEGORIES = [
  "carrier_last_mile",
  "carrier_international",
  "warehouse_supplies",
  "packaging_materials",
  "reverse_logistics",
  "fleet_maintenance",
  "it_and_wms_software",
  "cleaning_and_facilities",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const COUNTRIES: Country[] = ["USA", "Spain"];

/** CONTEXT § Business constraints: USA → USD, Spain → EUR. */
export const CURRENCY_FOR_COUNTRY: Record<Country, Currency> = {
  USA: "USD",
  Spain: "EUR",
};

export interface Supplier {
  id: number;
  name: string;
  country: Country;
  categories: Category[];
  rate_per_shipment: number;
  currency: Currency;
  updated_at: string;
  status: SupplierStatus;
  service_zone: string | null;
  contact_email: string | null;
  notes: string | null;
}

export interface SupplierCreate {
  name: string;
  country: Country;
  categories: Category[];
  rate_per_shipment: number;
  currency: Currency;
  status: SupplierStatus;
  service_zone?: string | null;
  contact_email?: string | null;
  notes?: string | null;
}

/** Turn a FastAPI error body into one readable line for the user. */
export async function readApiError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    const detail = body?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      // Pydantic 422: [{loc: [...], msg: "..."}]
      return detail
        .map((d: { loc?: unknown[]; msg?: string }) => {
          const field = Array.isArray(d.loc)
            ? d.loc.filter((p) => p !== "body").join(".")
            : "";
          return field ? `${field}: ${d.msg}` : String(d.msg ?? "");
        })
        .join(" · ");
    }
    return JSON.stringify(body);
  } catch {
    return `Request failed (${res.status}).`;
  }
}

export function humanCategory(category: string): string {
  return category.replace(/_/g, " ");
}

export function formatRate(supplier: Supplier): string {
  return new Intl.NumberFormat(supplier.currency === "EUR" ? "es-ES" : "en-US", {
    style: "currency",
    currency: supplier.currency,
    maximumFractionDigits: 2,
  }).format(supplier.rate_per_shipment);
}

export interface SupplierFilters {
  country?: Country | "";
  category?: Category | "";
}

export async function fetchSuppliers(
  filters: SupplierFilters = {},
): Promise<Supplier[]> {
  const params = new URLSearchParams();
  if (filters.country) params.set("country", filters.country);
  if (filters.category) params.set("category", filters.category);
  const qs = params.toString();

  const res = await fetch(`${API_BASE_URL}/suppliers${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error(await readApiError(res));
  return res.json();
}

export async function createSupplier(payload: SupplierCreate): Promise<Supplier> {
  const res = await fetch(`${API_BASE_URL}/suppliers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return res.json();
}

export async function updateRate(id: number, rate: number): Promise<Supplier> {
  const res = await fetch(`${API_BASE_URL}/suppliers/${id}/rate`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rate_per_shipment: rate }),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return res.json();
}

export async function updateStatus(
  id: number,
  status: SupplierStatus,
): Promise<Supplier> {
  const res = await fetch(`${API_BASE_URL}/suppliers/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return res.json();
}
