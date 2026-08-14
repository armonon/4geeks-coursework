import { Suspense } from "react";
import { CandidateList } from "@/components/CandidateList";
import { Filters } from "@/components/Filters";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Candidate pipeline
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          All applicants across TrackFlow&apos;s open roles. Filter, search, and
          open a candidate to update their status or add notes.
        </p>
      </div>

      <Suspense fallback={<div className="h-16 rounded-md bg-white" />}>
        <Filters />
      </Suspense>

      <Suspense
        fallback={
          <div className="rounded-md border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Loading candidates…
          </div>
        }
      >
        <CandidateList />
      </Suspense>
    </div>
  );
}
