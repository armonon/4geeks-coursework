import { authFetch, readApiError } from "@/lib/auth";
import { readJson } from "@/lib/errors";

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

export function humanCategory(category: string): string {
  return category.replace(/_/g, " ");
}

export function formatRate(supplier: Supplier): string {
  const rate = supplier.rate_per_shipment;

  // Intl.NumberFormat renders undefined/null/NaN as the literal "NaN",
  // so a supplier row with a missing rate printed "NaN €" at the user.
  // Note the check is on finiteness, not truthiness: 0 is a legitimate
  // rate and must still format.
  if (typeof rate !== "number" || !Number.isFinite(rate)) return "—";

  return new Intl.NumberFormat(supplier.currency === "EUR" ? "es-ES" : "en-US", {
    style: "currency",
    currency: supplier.currency,
    maximumFractionDigits: 2,
  }).format(rate);
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

  const res = await authFetch(`/suppliers${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error(await readApiError(res));
  return readJson(res);
}

export async function createSupplier(payload: SupplierCreate): Promise<Supplier> {
  const res = await authFetch("/suppliers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return readJson(res);
}

export async function updateRate(id: number, rate: number): Promise<Supplier> {
  const res = await authFetch(`/suppliers/${id}/rate`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rate_per_shipment: rate }),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return readJson(res);
}

export async function updateStatus(
  id: number,
  status: SupplierStatus,
): Promise<Supplier> {
  const res = await authFetch(`/suppliers/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return readJson(res);
}
