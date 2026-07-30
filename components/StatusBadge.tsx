import {
  CandidateStage,
  CandidateStatus,
  STAGE_LABELS,
  STATUS_LABELS,
} from "@/types";

const STATUS_STYLES: Record<CandidateStatus, string> = {
  received: "bg-slate-100 text-slate-700 border-slate-300",
  in_progress: "bg-blue-100 text-blue-800 border-blue-300",
  selected: "bg-emerald-100 text-emerald-800 border-emerald-300",
  discarded: "bg-red-100 text-red-800 border-red-300",
};

const STAGE_STYLES: Record<CandidateStage, string> = {
  pending: "bg-slate-100 text-slate-700 border-slate-300",
  review: "bg-amber-100 text-amber-800 border-amber-300",
  personal_interview: "bg-indigo-100 text-indigo-800 border-indigo-300",
  technical_interview: "bg-purple-100 text-purple-800 border-purple-300",
  offer_presented: "bg-emerald-100 text-emerald-800 border-emerald-300",
};

export function StatusBadge({ value }: { value: CandidateStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[value] ?? ""}`}
    >
      {STATUS_LABELS[value] ?? value}
    </span>
  );
}

export function StageBadge({ value }: { value: CandidateStage }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STAGE_STYLES[value] ?? ""}`}
    >
      {STAGE_LABELS[value] ?? value}
    </span>
  );
}
