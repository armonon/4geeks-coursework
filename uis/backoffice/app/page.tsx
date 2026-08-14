import { QuoteCalculator } from "@/components/QuoteCalculator";

export default function BackofficeHome() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          Live freight quote
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Run a quote for a prospective TrackFlow shipment. Numbers are
          computed by the Milestone 2 business-logic package
          (<code className="rounded bg-slate-100 px-1">@trackflow/business-logic</code>).
        </p>
      </div>
      <QuoteCalculator />
    </div>
  );
}
