"use client";

import { useState } from "react";
import { IncidentForm } from "@/components/IncidentForm";
import { IncidentList } from "@/components/IncidentList";
import { IncidentSummaryPanel } from "@/components/IncidentSummary";

type Tab = "register" | "list" | "summary";

/**
 * The three panels the brief asks for, behind tabs so a warehouse
 * terminal shows one task at a time rather than a long scroll.
 *
 * `reloadKey` bumps after a successful registration so the list and
 * summary refetch instead of showing stale data.
 */
export function IncidentManager() {
  const [tab, setTab] = useState<Tab>("register");
  const [reloadKey, setReloadKey] = useState(0);

  const tabs: [Tab, string][] = [
    ["register", "Register"],
    ["list", "Incidents"],
    ["summary", "Summary"],
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          Incident manager
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">
          Log operational incidents from any TrackFlow facility, track them
          through their lifecycle, and see the totals leadership asks for.
        </p>
      </div>

      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            aria-current={tab === key ? "page" : undefined}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
              tab === key
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "register" && (
        <IncidentForm onCreated={() => setReloadKey((k) => k + 1)} />
      )}
      {tab === "list" && <IncidentList reloadKey={reloadKey} />}
      {tab === "summary" && <IncidentSummaryPanel reloadKey={reloadKey} />}
    </div>
  );
}
