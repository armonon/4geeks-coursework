"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";
import { useDebounced } from "@/hooks/useDebounced";
import {
  CandidateStage,
  CandidateStatus,
  STAGE_LABELS,
  STAGE_OPTIONS,
  STATUS_LABELS,
  STATUS_OPTIONS,
} from "@/types";

export function Filters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get("status") ?? "";
  const currentStage = searchParams.get("stage") ?? "";
  const currentSearch = searchParams.get("search") ?? "";

  const [searchInput, setSearchInput] = useState(currentSearch);
  const debouncedSearch = useDebounced(searchInput, 300);

  useEffect(() => {
    if (debouncedSearch === currentSearch) return;
    updateParam("search", debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    queueMicrotask(() => setSearchInput(currentSearch));
  }, [currentSearch]);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : "/");
  }

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end">
      <div className="flex-1">
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Search by name or email
        </label>
        <input
          value={searchInput}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setSearchInput(e.target.value)
          }
          placeholder="e.g. Michael or michael@example.com"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
      </div>

      <div className="md:w-56">
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Status
        </label>
        <select
          value={currentStatus}
          onChange={(e) => updateParam("status", e.target.value)}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s as CandidateStatus]}
            </option>
          ))}
        </select>
      </div>

      <div className="md:w-56">
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Pipeline stage
        </label>
        <select
          value={currentStage}
          onChange={(e) => updateParam("stage", e.target.value)}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          <option value="">All stages</option>
          {STAGE_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABELS[s as CandidateStage]}
            </option>
          ))}
        </select>
      </div>

      {(currentStatus || currentStage || currentSearch) && (
        <button
          type="button"
          onClick={() => router.replace("/")}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          Clear
        </button>
      )}
    </div>
  );
}
