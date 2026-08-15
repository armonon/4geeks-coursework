import { SupplierDirectory } from "@/components/SupplierDirectory";

export const metadata = {
  title: "Supplier directory",
};

export default function SuppliersPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          Supplier directory
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">
          The single source of truth for TrackFlow&apos;s carrier, packaging,
          and services suppliers across Los Angeles and Zaragoza. Filter by
          country or category, register new suppliers, update rates, and
          suspend or reactivate a contract.
        </p>
      </div>
      <SupplierDirectory />
    </div>
  );
}
