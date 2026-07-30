"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { CandidateForm } from "@/components/CandidateForm";
import { Toast, ToastMessage } from "@/components/Toast";
import { candidatesService } from "@/services/candidates";
import type { Candidate } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditCandidatePage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

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

  return (
    <div className="space-y-6">
      <Link
        href={`/candidates/${id}`}
        className="text-sm text-slate-600 hover:underline"
      >
        ← Back to candidate
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Edit candidate
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Correct or update this candidate&apos;s information.
        </p>
      </div>

      {loading && (
        <div className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Loading candidate…
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {candidate && (
        <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <CandidateForm
            initial={candidate}
            submitLabel="Save changes"
            onCancel={() => router.push(`/candidates/${id}`)}
            onSubmit={async (data) => {
              try {
                const updated = await candidatesService.replace(id, data);
                setCandidate(updated);
                setToast({ kind: "success", text: "Candidate updated" });
                router.push(`/candidates/${id}`);
              } catch (e) {
                setToast({
                  kind: "error",
                  text: e instanceof Error ? e.message : "Failed to update",
                });
              }
            }}
          />
        </div>
      )}

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
