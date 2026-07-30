"use client";

import { useState } from "react";
import { candidatesService } from "@/services/candidates";
import {
  CandidateStage,
  CandidateStatus,
  STAGE_LABELS,
  STAGE_OPTIONS,
  STATUS_LABELS,
  STATUS_OPTIONS,
} from "@/types";

interface Props {
  candidateId: string;
  status: CandidateStatus;
  stage: CandidateStage;
  onUpdated: (patch: { status?: CandidateStatus; stage?: CandidateStage }) => void;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

export function StatusStageControls({
  candidateId,
  status,
  stage,
  onUpdated,
  onError,
  onSuccess,
}: Props) {
  const [savingField, setSavingField] = useState<null | "status" | "stage">(
    null
  );

  async function updateStatus(next: CandidateStatus) {
    if (next === status) return;
    setSavingField("status");
    try {
      const updated = await candidatesService.patch(candidateId, {
        status: next,
      });
      onUpdated({ status: updated.status });
      onSuccess("Status updated");
    } catch (e) {
      onError(e instanceof Error ? e.message : "Failed to update status");
    } finally {
      setSavingField(null);
    }
  }

  async function updateStage(next: CandidateStage) {
    if (next === stage) return;
    setSavingField("stage");
    try {
      const updated = await candidatesService.patch(candidateId, {
        stage: next,
      });
      onUpdated({ stage: updated.stage });
      onSuccess("Stage updated");
    } catch (e) {
      onError(e instanceof Error ? e.message : "Failed to update stage");
    } finally {
      setSavingField(null);
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">
          Status {savingField === "status" && <em>(saving…)</em>}
        </span>
        <select
          value={status}
          disabled={savingField !== null}
          onChange={(e) => updateStatus(e.target.value as CandidateStatus)}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-60"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">
          Pipeline stage {savingField === "stage" && <em>(saving…)</em>}
        </span>
        <select
          value={stage}
          disabled={savingField !== null}
          onChange={(e) => updateStage(e.target.value as CandidateStage)}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-60"
        >
          {STAGE_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABELS[s]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
