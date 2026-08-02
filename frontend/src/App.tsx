import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { KPIRow } from "@/components/dashboard/kpi-row";
import { type FinancialMovement } from "@/lib/financial-types";
import { computeKPIs, computeMonthlyData } from "@/lib/financial-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// vercel-react-best-practices: bundle-dynamic-imports.
// Charts pull in Recharts (large). Load them after the main bundle is
// parsed so the KPI row + header stream in first.
const IncomeOutcomeChart = lazy(() =>
  import("@/components/dashboard/income-outcome-chart").then((m) => ({
    default: m.IncomeOutcomeChart,
  })),
);
const ProfitPercentChart = lazy(() =>
  import("@/components/dashboard/profit-percent-chart").then((m) => ({
    default: m.ProfitPercentChart,
  })),
);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

async function fetchFinancialData(
  signal: AbortSignal,
): Promise<FinancialMovement[]> {
  const response = await fetch(`${API_BASE_URL}/api/metrics`, { signal });
  if (!response.ok) {
    throw new Error(`Failed to fetch financial data: ${response.status}`);
  }
  return response.json();
}

function ChartCardFallback() {
  return (
    <Card className="border-border/60" aria-hidden="true">
      <CardHeader className="pb-4">
        <Skeleton className="h-5 w-52" />
        <Skeleton className="h-3 w-64 mt-1" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[280px] w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

function App() {
  // vercel-react-best-practices: rerender-derived-state-no-effect.
  // Keep the raw response in state; derive KPIs and monthly points during
  // render with useMemo instead of storing them in extra state variables
  // that a second effect would need to keep in sync.
  const [movements, setMovements] = useState<FinancialMovement[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetchFinancialData(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setMovements(data);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        // accessibility: log the real error so debugging is possible
        // even though we render a friendly Spanish message.
        console.error("fetchFinancialData failed", err);
        setError(
          "No se pudo cargar la informacion financiera. Revisa la API de backend.",
        );
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const metrics = useMemo(
    () => (movements ? computeKPIs(movements) : null),
    [movements],
  );
  const monthlyData = useMemo(
    () => (movements ? computeMonthlyData(movements) : []),
    [movements],
  );

  return (
    <main
      id="main"
      className="dark min-h-screen bg-background text-foreground"
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground focus:shadow-lg"
      >
        Skip to main content
      </a>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8">
          <DashboardHeader period="2024 - Full Year" />

          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
          >
            {loading
              ? "Loading financial data"
              : error
                ? "Failed to load financial data"
                : "Financial data loaded"}
          </div>

          {error ? (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive-foreground"
            >
              {error}
            </div>
          ) : null}

          <section aria-labelledby="kpi-heading">
            <h2 id="kpi-heading" className="sr-only">
              Key performance indicators
            </h2>
            <KPIRow metrics={metrics} loading={loading} />
          </section>

          <section
            aria-labelledby="charts-heading"
            className="grid grid-cols-1 gap-4 xl:grid-cols-2"
          >
            <h2 id="charts-heading" className="sr-only">
              Financial charts
            </h2>
            <Suspense fallback={<ChartCardFallback />}>
              <IncomeOutcomeChart data={monthlyData} loading={loading} />
            </Suspense>
            <Suspense fallback={<ChartCardFallback />}>
              <ProfitPercentChart data={monthlyData} loading={loading} />
            </Suspense>
          </section>
        </div>
      </div>
    </main>
  );
}

export default App;
