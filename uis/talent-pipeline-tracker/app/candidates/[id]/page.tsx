"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { NotesPanel } from "@/components/NotesPanel";
import { StageBadge, StatusBadge } from "@/components/StatusBadge";
import { StatusStageControls } from "@/components/StatusStageControls";
import { Toast, ToastMessage } from "@/components/Toast";
import { candidatesService } from "@/services/candidates";
import type { Candidate } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CandidateDetailPage({ params }: PageProps) {
  const { id } = use(params);

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    candidatesService
      .get(id)
      .then((c) => {
        if (!cancelled) setCandidate(c);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message || "Failed to load candidate");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const onSuccess = useCallback(
    (text: string) => setToast({ kind: "success", text }),
    []
  );
  const onError = useCallback(
    (text: string) => setToast({ kind: "error", text }),
    []
  );

  if (loading) {
    return (
      <div className="rounded-md border border-slate-200 bg-white p-8 text-sm text-slate-500">
        Loading candidate…
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="space-y-4">
        <Link href="/" className="text-sm text-slate-600 hover:underline">
          ← Back to candidates
        </Link>
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error ?? "Candidate not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-slate-600 hover:underline">
          ← Back to candidates
        </Link>
        <Link
          href={`/candidates/${candidate.id}/edit`}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Edit candidate
        </Link>
      </div>

      <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {candidate.full_name}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Applied for{" "}
              <span className="font-medium text-slate-800">
                {candidate.position}
              </span>{" "}
              on {formatDate(candidate.applied_at)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge value={candidate.status} />
            <StageBadge value={candidate.stage} />
          </div>
        </div>

        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
          <Info label="Email" value={candidate.email} />
          <Info label="Phone" value={candidate.phone} />
          <Info
            label="Years of experience"
            value={String(candidate.experience_years)}
          />
          <Info
            label="Last updated"
            value={formatDate(candidate.updated_at)}
          />
          <Info
            label="LinkedIn"
            value={
              candidate.linkedin_url ? (
                <a
                  href={candidate.linkedin_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-900 underline hover:no-underline"
                >
                  {candidate.linkedin_url}
                </a>
              ) : (
                <span className="text-slate-400">—</span>
              )
            }
          />
          <Info
            label="CV"
            value={
              candidate.cv_url ? (
                <a
                  href={candidate.cv_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-900 underline hover:no-underline"
                >
                  Download CV
                </a>
              ) : (
                <span className="text-slate-400">—</span>
              )
            }
          />
        </dl>
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Update pipeline
        </h2>
        <StatusStageControls
          candidateId={candidate.id}
          status={candidate.status}
          stage={candidate.stage}
          onUpdated={(patch) =>
            setCandidate((c) => (c ? { ...c, ...patch } : c))
          }
          onError={onError}
          onSuccess={onSuccess}
        />
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Internal notes
        </h2>
        <NotesPanel
          candidateId={candidate.id}
          onError={onError}
          onSuccess={onSuccess}
        />
      </section>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-0.5 text-slate-800">{value}</dd>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}
