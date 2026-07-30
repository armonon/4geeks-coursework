"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { candidatesService } from "@/services/candidates";
import type {
  Candidate,
  CandidateStage,
  CandidateStatus,
} from "@/types";
import { StageBadge, StatusBadge } from "./StatusBadge";

export function CandidateList() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status") ?? "";
  const stage = searchParams.get("stage") ?? "";
  const search = searchParams.get("search") ?? "";

  const [data, setData] = useState<Candidate[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    candidatesService
      .list({
        status: (status as CandidateStatus) || "",
        stage: (stage as CandidateStage) || "",
        search,
        limit: 100,
      })
      .then((res) => {
        if (cancelled) return;
        setData(res.data);
        setTotal(res.total);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message || "Failed to load candidates");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [status, stage, search]);

  if (loading) {
    return (
      <div className="rounded-md border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Loading candidates…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <strong>Couldn&apos;t load candidates.</strong> {error}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-md border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        No candidates match the current filters.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-600">
        Showing {data.length} of {total} candidates
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Position</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Pipeline stage</th>
              <th className="px-4 py-2 font-medium">Applied</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">
                    {c.full_name}
                  </div>
                  <div className="text-xs text-slate-500">{c.email}</div>
                </td>
                <td className="px-4 py-3 text-slate-700">{c.position}</td>
                <td className="px-4 py-3">
                  <StatusBadge value={c.status} />
                </td>
                <td className="px-4 py-3">
                  <StageBadge value={c.stage} />
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {formatDate(c.applied_at)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/candidates/${c.id}`}
                    className="text-sm font-medium text-slate-900 hover:underline"
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
