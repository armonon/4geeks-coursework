"use client";

import { toUserMessage } from "@/lib/errors";
import { useCallback, useEffect, useState } from "react";
import {
  ALLOWED_TRANSITIONS,
  BRANCHES,
  BRANCH_LABELS,
  CATEGORIES,
  CATEGORY_LABELS,
  ORIGINS,
  ORIGIN_LABELS,
  STATUSES,
  STATUS_LABELS,
  fetchIncidents,
  formatDate,
  updateIncidentStatus,
  type Incident,
  type IncidentBranch,
  type IncidentCategory,
  type IncidentFilters,
  type IncidentOrigin,
  type IncidentStatus,
} from "@/lib/incidents";

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; incidents: Incident[] };

export function IncidentList({ reloadKey = 0 }: { reloadKey?: number }) {
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [filters, setFilters] = useState<IncidentFilters>({});
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      setState({ kind: "ready", incidents: await fetchIncidents(filters) });
    } catch (err) {
      setState({
        kind: "error",
        message:
          err instanceof Error
            ? "We couldn't load the incident list."
            : "We couldn't load the incident list.",
      });
    }
  }, [filters]);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load, reloadKey]);

  /**
   * Optimistic status change.
   *
   * The row updates immediately so the floor staff see instant feedback,
   * and reverts to its previous value if the API rejects it — which the
   * brief calls out explicitly.
   */
  const changeStatus = useCallback(
    async (incident: Incident, next: IncidentStatus) => {
      if (state.kind !== "ready") return;
      const previous = incident.status;

      setBusyId(incident.id);
      setRowError(null);
      setState({
        kind: "ready",
        incidents: state.incidents.map((i) =>
          i.id === incident.id ? { ...i, status: next } : i,
        ),
      });

      try {
        const updated = await updateIncidentStatus(incident.id, next);
        setState((current) =>
          current.kind === "ready"
            ? {
                kind: "ready",
                incidents: current.incidents.map((i) =>
                  i.id === incident.id ? updated : i,
                ),
              }
            : current,
        );
      } catch (err) {
        // Revert the visual state and say why.
        setState((current) =>
          current.kind === "ready"
            ? {
                kind: "ready",
                incidents: current.incidents.map((i) =>
                  i.id === incident.id ? { ...i, status: previous } : i,
                ),
              }
            : current,
        );
        setRowError(
          toUserMessage(err, "That status change was rejected."),
        );
      } finally {
        setBusyId(null);
      }
    },
    [state],
  );

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <FilterSelect
          label="Status"
          value={filters.status ?? ""}
          onChange={(v) => setFilters((f) => ({ ...f, status: v as IncidentStatus }))}
          options={STATUSES.map((s) => [s, STATUS_LABELS[s]])}
          allLabel="All statuses"
        />
        <FilterSelect
          label="Origin"
          value={filters.origin ?? ""}
          onChange={(v) => setFilters((f) => ({ ...f, origin: v as IncidentOrigin }))}
          options={ORIGINS.map((o) => [o, ORIGIN_LABELS[o]])}
          allLabel="All origins"
        />
        <FilterSelect
          label="Branch"
          value={filters.branch ?? ""}
          onChange={(v) => setFilters((f) => ({ ...f, branch: v as IncidentBranch }))}
          options={BRANCHES.map((b) => [b, BRANCH_LABELS[b]])}
          allLabel="All branches"
        />
        <FilterSelect
          label="Category"
          value={filters.category ?? ""}
          onChange={(v) =>
            setFilters((f) => ({ ...f, category: v as IncidentCategory }))
          }
          options={CATEGORIES.map((c) => [c, CATEGORY_LABELS[c]])}
          allLabel="All categories"
        />
        {hasFilters && (
          <button
            type="button"
            onClick={() => setFilters({})}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Clear filters
          </button>
        )}
      </div>

      {rowError && (
        <div
          role="alert"
          className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
        >
          {rowError}
        </div>
      )}

      {/* Three states: loading, error, data (incl. empty) */}
      {state.kind === "loading" && (
        <div
          role="status"
          className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500"
        >
          Loading incidents…
        </div>
      )}

      {state.kind === "error" && (
        <div
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 p-6 text-sm text-red-800"
        >
          <p className="font-medium">{state.message}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-3 rounded-md border border-red-400 bg-white px-3 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100"
          >
            Try again
          </button>
        </div>
      )}

      {state.kind === "ready" && state.incidents.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
          {hasFilters
            ? "No incidents match these filters. Try widening them."
            : "No incidents registered yet. Use the form above to log the first one."}
        </div>
      )}

      {state.kind === "ready" && state.incidents.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-600">
            {state.incidents.length} incident
            {state.incidents.length === 1 ? "" : "s"}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Incident</th>
                  <th className="px-4 py-2 font-medium">Category</th>
                  <th className="px-4 py-2 font-medium">Origin</th>
                  <th className="px-4 py-2 font-medium">Branch</th>
                  <th className="px-4 py-2 font-medium">Reported</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.incidents.map((incident) => (
                  <tr key={incident.id} className="align-top hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {incident.title}
                      </div>
                      <div className="mt-0.5 line-clamp-2 max-w-md text-xs text-slate-500">
                        {incident.description}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {CATEGORY_LABELS[incident.category] ?? incident.category}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {ORIGIN_LABELS[incident.origin] ?? incident.origin}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {BRANCH_LABELS[incident.branch] ?? incident.branch}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {formatDate(incident.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusControl
                        incident={incident}
                        busy={busyId === incident.id}
                        onChange={(next) => changeStatus(incident, next)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusControl({
  incident,
  busy,
  onChange,
}: {
  incident: Incident;
  busy: boolean;
  onChange: (next: IncidentStatus) => void;
}) {
  const nextOptions = ALLOWED_TRANSITIONS[incident.status] ?? [];

  return (
    <div className="flex flex-col gap-1">
      <StatusBadge status={incident.status} />
      {nextOptions.length > 0 ? (
        <select
          aria-label={`Change status of ${incident.title}`}
          value=""
          disabled={busy}
          onChange={(e) => {
            const next = e.target.value as IncidentStatus;
            if (next) onChange(next);
          }}
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50"
        >
          <option value="">{busy ? "Saving…" : "Advance to…"}</option>
          {nextOptions.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      ) : (
        <span className="text-xs text-slate-400">Final state</span>
      )}
    </div>
  );
}

export function StatusBadge({ status }: { status: IncidentStatus }) {
  const styles: Record<IncidentStatus, string> = {
    open: "border-blue-300 bg-blue-100 text-blue-800",
    in_progress: "border-amber-300 bg-amber-100 text-amber-900",
    resolved: "border-emerald-300 bg-emerald-100 text-emerald-800",
    discarded: "border-slate-300 bg-slate-100 text-slate-600",
  };
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
  allLabel: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      {/* Explicit aria-label: a <label>-wrapped <select> otherwise takes
          its accessible name from the label text PLUS the selected
          option ("Branch All branches"), which is ambiguous to announce
          and to target. */}
      <select
        aria-label={`Filter by ${label.toLowerCase()}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-48 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
      >
        <option value="">{allLabel}</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}
