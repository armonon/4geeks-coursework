"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BRANCH_LABELS,
  CATEGORY_LABELS,
  ORIGIN_LABELS,
  STATUS_LABELS,
  fetchSummary,
  type IncidentSummary as Summary,
} from "@/lib/incidents";

type State =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; summary: Summary };

/**
 * Summary panel.
 *
 * Self-contained failure: if this request fails the panel shows its own
 * error and the rest of the page keeps working — the brief is explicit
 * that a slow or broken summary must not take the page down.
 */
export function IncidentSummaryPanel({ reloadKey = 0 }: { reloadKey?: number }) {
  const [state, setState] = useState<State>({ kind: "loading" });

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      setState({ kind: "ready", summary: await fetchSummary() });
    } catch {
      setState({ kind: "error" });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, reloadKey]);

  if (state.kind === "loading") {
    return (
      <div
        role="status"
        className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500"
      >
        Loading summary…
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div
        role="alert"
        className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
      >
        <p className="font-medium">The summary is unavailable right now.</p>
        <p className="mt-1">
          The incident list below is unaffected.
        </p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-3 rounded-md border border-amber-400 bg-white px-3 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-100"
        >
          Retry
        </button>
      </div>
    );
  }

  const { summary } = state;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Total incidents
        </h3>
        <p
          className="mt-1 text-4xl font-semibold tracking-tight text-slate-900"
          data-testid="summary-total"
        >
          {summary.total}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Breakdown
          title="By status"
          counts={summary.by_status}
          labels={STATUS_LABELS}
          total={summary.total}
          testId="summary-by-status"
        />
        <Breakdown
          title="By origin"
          counts={summary.by_origin}
          labels={ORIGIN_LABELS}
          total={summary.total}
          testId="summary-by-origin"
        />
        <Breakdown
          title="By category"
          counts={summary.by_category}
          labels={CATEGORY_LABELS}
          total={summary.total}
          testId="summary-by-category"
        />
        <Breakdown
          title="By branch"
          counts={summary.by_branch}
          labels={BRANCH_LABELS}
          total={summary.total}
          testId="summary-by-branch"
        />
      </div>
    </div>
  );
}

function Breakdown({
  title,
  counts,
  labels,
  total,
  testId,
}: {
  title: string;
  counts: Record<string, number>;
  labels: Record<string, string>;
  total: number;
  testId: string;
}) {
  const entries = Object.entries(counts);

  return (
    <div
      className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      data-testid={testId}
    >
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </h3>
      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">No data.</p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm">
          {entries.map(([key, count]) => {
            const pct = total > 0 ? (count / total) * 100 : 0;
            return (
              <li key={key}>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-700">{labels[key] ?? key}</span>
                  <span className="font-mono text-slate-800">
                    {count}
                    <span className="ml-2 text-slate-400">
                      {pct.toFixed(0)}%
                    </span>
                  </span>
                </div>
                {/* A bar makes the distribution readable at a glance,
                    which is what the CEO wants from this panel. */}
                <div
                  aria-hidden="true"
                  className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
                >
                  <div
                    className="h-full rounded-full bg-slate-800"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
