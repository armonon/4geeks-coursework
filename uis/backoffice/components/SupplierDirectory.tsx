"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CATEGORIES,
  COUNTRIES,
  CURRENCY_FOR_COUNTRY,
  createSupplier,
  fetchSuppliers,
  formatRate,
  humanCategory,
  updateRate,
  updateStatus,
  type Category,
  type Country,
  type Supplier,
} from "@/lib/suppliers";

export function SupplierDirectory() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [country, setCountry] = useState<Country | "">("");
  const [category, setCategory] = useState<Category | "">("");
  const [rowBusy, setRowBusy] = useState<number | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setSuppliers(await fetchSuppliers({ country, category }));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load suppliers.");
    } finally {
      setLoading(false);
    }
  }, [country, category]);

  // Re-runs whenever a filter changes — no page reload.
  useEffect(() => {
    void load();
  }, [load]);

  /** Swap one row in place so a rate/status change shows immediately. */
  const replaceRow = useCallback((updated: Supplier) => {
    setSuppliers((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s)),
    );
  }, []);

  const handleRate = useCallback(
    async (supplier: Supplier) => {
      const input = window.prompt(
        `New rate for ${supplier.name} (${supplier.currency}):`,
        String(supplier.rate_per_shipment),
      );
      if (input === null) return;

      const value = Number(input);
      if (!Number.isFinite(value) || value <= 0) {
        setRowError("Rate must be a number greater than zero.");
        return;
      }

      setRowBusy(supplier.id);
      setRowError(null);
      try {
        replaceRow(await updateRate(supplier.id, value));
      } catch (err) {
        setRowError(err instanceof Error ? err.message : "Rate update failed.");
      } finally {
        setRowBusy(null);
      }
    },
    [replaceRow],
  );

  const handleStatus = useCallback(
    async (supplier: Supplier) => {
      const next = supplier.status === "active" ? "suspended" : "active";
      setRowBusy(supplier.id);
      setRowError(null);
      try {
        replaceRow(await updateStatus(supplier.id, next));
      } catch (err) {
        setRowError(err instanceof Error ? err.message : "Status change failed.");
      } finally {
        setRowBusy(null);
      }
    },
    [replaceRow],
  );

  const counts = useMemo(
    () => ({
      total: suppliers.length,
      active: suppliers.filter((s) => s.status === "active").length,
      suspended: suppliers.filter((s) => s.status === "suspended").length,
    }),
    [suppliers],
  );

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Country</span>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value as Country | "")}
            className="w-48 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <option value="">All countries</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category | "")}
            className="w-64 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {humanCategory(c)}
              </option>
            ))}
          </select>
        </label>

        {(country || category) && (
          <button
            type="button"
            onClick={() => {
              setCountry("");
              setCategory("");
            }}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Clear filters
          </button>
        )}

        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-slate-500">
            {counts.total} shown · {counts.active} active ·{" "}
            {counts.suspended} suspended
          </span>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            {showForm ? "Close form" : "Register supplier"}
          </button>
        </div>
      </div>

      {showForm && (
        <RegisterSupplierForm
          onCreated={(created) => {
            setSuppliers((prev) => [...prev, created]);
            setShowForm(false);
            void load();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {rowError && (
        <div
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800"
        >
          {rowError}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Loading suppliers…
        </div>
      ) : loadError ? (
        <div
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-800"
        >
          <p className="font-medium">Couldn&apos;t load the directory</p>
          <p className="mt-1">{loadError}</p>
        </div>
      ) : suppliers.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          No suppliers match these filters.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Supplier</th>
                  <th className="px-4 py-2 font-medium">Country</th>
                  <th className="px-4 py-2 font-medium">Categories</th>
                  <th className="px-4 py-2 font-medium text-right">Rate</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suppliers.map((s) => {
                  const suspended = s.status === "suspended";
                  return (
                    <tr
                      key={s.id}
                      className={
                        suspended
                          ? "bg-amber-50/60 text-slate-500"
                          : "hover:bg-slate-50"
                      }
                    >
                      <td className="px-4 py-3">
                        <div
                          className={
                            suspended
                              ? "font-medium text-slate-600 line-through decoration-slate-400"
                              : "font-medium text-slate-900"
                          }
                        >
                          {s.name}
                        </div>
                        {s.service_zone && (
                          <div className="text-xs text-slate-500">
                            {s.service_zone}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">{s.country}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {s.categories.map((c) => (
                            <span
                              key={c}
                              className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                            >
                              {humanCategory(c)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {formatRate(s)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            disabled={rowBusy === s.id}
                            onClick={() => handleRate(s)}
                            className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                          >
                            Edit rate
                          </button>
                          <button
                            type="button"
                            disabled={rowBusy === s.id}
                            onClick={() => handleStatus(s)}
                            className={`rounded-md px-2.5 py-1 text-xs font-medium text-white disabled:opacity-50 ${
                              suspended
                                ? "bg-emerald-600 hover:bg-emerald-700"
                                : "bg-amber-600 hover:bg-amber-700"
                            }`}
                          >
                            {suspended ? "Activate" : "Suspend"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const active = status === "active";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        active
          ? "border-emerald-300 bg-emerald-100 text-emerald-800"
          : "border-amber-300 bg-amber-100 text-amber-900"
      }`}
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-600" : "bg-amber-600"
        }`}
      />
      {status}
    </span>
  );
}

function RegisterSupplierForm({
  onCreated,
  onCancel,
}: {
  onCreated: (s: Supplier) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [country, setCountry] = useState<Country>("USA");
  const [selected, setSelected] = useState<Category[]>([]);
  const [rate, setRate] = useState("");
  const [serviceZone, setServiceZone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [notes, setNotes] = useState("");

  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Currency is derived, never typed — it is a function of country.
  const currency = CURRENCY_FOR_COUNTRY[country];

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required.";
    if (selected.length === 0) errs.categories = "Pick at least one category.";
    const value = Number(rate);
    if (rate.trim() === "" || !Number.isFinite(value) || value <= 0) {
      errs.rate = "Rate must be a number greater than zero.";
    }
    return errs;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);

    const errs = validate();
    setClientErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const created = await createSupplier({
        name: name.trim(),
        country,
        categories: selected,
        rate_per_shipment: Number(rate),
        currency,
        status: "active",
        service_zone: serviceZone.trim() || null,
        contact_email: contactEmail.trim() || null,
        notes: notes.trim() || null,
      });
      onCreated(created);
    } catch (err) {
      // Surface exactly what the API said — e.g. the 422 detail.
      setApiError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
        Register a new supplier
      </h3>

      {apiError && (
        <div
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800"
        >
          <p className="font-medium">The API rejected this supplier</p>
          <p className="mt-1 font-mono text-xs">{apiError}</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name *" error={clientErrors.name}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls(!!clientErrors.name)}
            placeholder="e.g. Correos Express"
          />
        </Field>

        <Field label="Country *">
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value as Country)}
            className={inputCls(false)}
          >
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        <Field label={`Rate per shipment * (${currency})`} error={clientErrors.rate}>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className={inputCls(!!clientErrors.rate)}
            placeholder="4.90"
          />
        </Field>

        <Field label="Currency (set by country)">
          <input
            value={currency}
            readOnly
            aria-readonly="true"
            className="w-full cursor-not-allowed rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-600"
          />
        </Field>

        <Field label="Service zone">
          <input
            value={serviceZone}
            onChange={(e) => setServiceZone(e.target.value)}
            className={inputCls(false)}
            placeholder="e.g. West Coast"
          />
        </Field>

        <Field label="Contact email">
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className={inputCls(false)}
            placeholder="business@example.com"
          />
        </Field>
      </div>

      <Field label="Categories * (at least one)" error={clientErrors.categories}>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const on = selected.includes(c);
            return (
              <button
                key={c}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  setSelected((prev) =>
                    prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
                  )
                }
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  on
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {humanCategory(c)}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Notes">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className={inputCls(false)}
        />
      </Field>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Register supplier"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

function inputCls(hasError: boolean): string {
  return `w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 ${
    hasError
      ? "border-red-400 focus:ring-red-300"
      : "border-slate-300 focus:ring-slate-400"
  }`;
}
