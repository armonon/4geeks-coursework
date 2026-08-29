import { IncidentAnalyzer } from "@/components/IncidentAnalyzer";

export const metadata = {
  title: "Incident analysis",
};

export default function IncidentsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          Incident analysis
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">
          Upload the CX team&apos;s exported incidents CSV. The TrackFlow
          backend validates each row against the CONTEXT rules (categories,
          statuses, carrier/country pairs, satisfaction requirements) and
          returns a summary you can download as CSV. Customer emails are
          never displayed or exported.
        </p>
      </div>
      <IncidentAnalyzer />
    </div>
  );
}
