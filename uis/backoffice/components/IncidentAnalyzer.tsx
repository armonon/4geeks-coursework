"use client";

import { readJson, toUserMessage } from "@/lib/errors";
import { useCallback, useEffect, useState } from "react";
import { type AnalysisResponse } from "@/lib/api";
import { authFetch, readApiError } from "@/lib/auth";

// Public URL of the sample CSV in the syllabus repo. Used by ?sample=1
// for repro-friendly demos and screenshots — never called otherwise.
const SAMPLE_CSV_URL =
  "https://raw.githubusercontent.com/4GeeksAcademy/ai-engineering-syllabus/main/content/contexts/incidents-file-analysis/incidents-trackflow.csv";

interface Outcome {
  ok: true;
  data: AnalysisResponse;
  filename: string;
}
interface Failure {
  ok: false;
  message: string;
}
type UiState =
  | { kind: "idle" }
  | { kind: "loading"; filename: string }
  | { kind: "result"; outcome: Outcome | Failure };

export function IncidentAnalyzer() {
  const [state, setState] = useState<UiState>({ kind: "idle" });
  const [dragOver, setDragOver] = useState(false);
  // Kept so the error panel can offer a real retry rather than asking
  // the user to find the file again.
  const [lastFile, setLastFile] = useState<File | null>(null);

  const upload = useCallback(async (file: File) => {
    setLastFile(file);
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setState({
        kind: "result",
        outcome: {
          ok: false,
          message: `"${file.name}" isn't a .csv file. Pick the CSV export from your incident system and try again.`,
        },
      });
      return;
    }

    setState({ kind: "loading", filename: file.name });

    try {
      const body = new FormData();
      body.append("file", file);
      // authFetch attaches the bearer token and turns a 401 into a
      // session clear + redirect, handled centrally in AuthProvider.
      const res = await authFetch("/api/incidents/analyze", {
        method: "POST",
        body,
      });
      if (!res.ok) {
        // readApiError handles every detail shape the API produces —
        // string, Pydantic array, and the {field, message} object that
        // `String(err.detail)` used to render as "[object Object]".
        setState({
          kind: "result",
          outcome: { ok: false, message: await readApiError(res) },
        });
        return;
      }
      const data = await readJson<AnalysisResponse>(res);
      setState({
        kind: "result",
        outcome: { ok: true, data, filename: file.name },
      });
    } catch (err: unknown) {
      setState({
        kind: "result",
        outcome: {
          ok: false,
          message: toUserMessage(
            err,
            "We couldn't analyse that file. Please try again.",
          ),
        },
      });
    }
  }, []);

  // Load the syllabus sample CSV when the URL contains ?sample=1.
  // Runs once per mount and is a no-op without the query param.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("sample") !== "1") return;
    (async () => {
      // Best-effort, but not silent: leaving the user on an empty page
      // with no explanation was its own small failure.
      const explain = (message: string) =>
        setState({ kind: "result", outcome: { ok: false, message } });
      try {
        const r = await fetch(SAMPLE_CSV_URL);
        if (!r.ok) {
          explain(
            "The sample CSV couldn't be downloaded. Upload your own export instead.",
          );
          return;
        }
        const bytes = await r.arrayBuffer();
        void upload(
          new File([bytes], "incidents-trackflow.csv", { type: "text/csv" }),
        );
      } catch (err) {
        explain(
          toUserMessage(
            err,
            "The sample CSV couldn't be downloaded. Upload your own export instead.",
          ),
        );
      }
    })();
  }, [upload]);

  return (
    <div className="space-y-6">
      <UploadArea
        dragOver={dragOver}
        setDragOver={setDragOver}
        loading={state.kind === "loading"}
        loadingFilename={state.kind === "loading" ? state.filename : undefined}
        onFile={upload}
      />

      {state.kind === "result" && !state.outcome.ok && (
        <div
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-800"
        >
          <p className="font-medium">We couldn&apos;t analyse that file</p>
          <p className="mt-1">{state.outcome.message}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {lastFile && (
              <button
                type="button"
                onClick={() => void upload(lastFile)}
                className="rounded-md border border-red-400 bg-white px-3 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100"
              >
                Try again
              </button>
            )}
            <button
              type="button"
              onClick={() => setState({ kind: "idle" })}
              className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100"
            >
              Choose a different file
            </button>
          </div>
        </div>
      )}

      {state.kind === "result" && state.outcome.ok && (
        <ResultView
          filename={state.outcome.filename}
          data={state.outcome.data}
        />
      )}
    </div>
  );
}

function UploadArea({
  dragOver,
  setDragOver,
  loading,
  loadingFilename,
  onFile,
}: {
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  loading: boolean;
  loadingFilename?: string;
  onFile: (file: File) => void;
}) {
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
      className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 text-center transition-colors ${
        dragOver
          ? "border-slate-900 bg-slate-100"
          : "border-slate-300 bg-white"
      }`}
    >
      <p className="text-sm text-slate-700">
        Drag & drop the incidents CSV here, or
      </p>
      <label className="cursor-pointer rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
        Choose file
        <input
          type="file"
          accept=".csv"
          className="hidden"
          disabled={loading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = ""; // allow re-selecting the same file
          }}
        />
      </label>
      <p className="text-xs text-slate-500">
        Never uploaded to any AI tool — analysis runs on the TrackFlow
        backend under <code>services/api</code>.
      </p>
      {loading && (
        <p className="text-xs text-slate-500">
          Analysing <strong>{loadingFilename}</strong>…
        </p>
      )}
    </div>
  );
}

function ResultView({
  filename,
  data,
}: {
  filename: string;
  data: AnalysisResponse;
}) {
  const invalidWithCounts = data.invalid_breakdown.filter((r) => r.count > 0);
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Source
            </h2>
            <p className="mt-1 font-mono text-sm">{filename}</p>
          </div>
          <DownloadCsvButton />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Total records" value={data.totals.total_rows} />
          <StatCard
            label="Valid records"
            value={data.totals.valid_records}
            tone="ok"
          />
          <StatCard
            label="Invalid records"
            value={data.totals.invalid_records}
            tone={data.totals.invalid_records ? "warn" : "ok"}
          />
        </div>
      </div>

      {data.totals.invalid_records > 0 && (
        <Panel title="Invalid records breakdown">
          {invalidWithCounts.length === 0 ? (
            <p className="text-sm text-slate-500">No invalid records.</p>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {invalidWithCounts.map((row) => (
                <li key={row.rule} className="flex justify-between py-2">
                  <span className="text-slate-700">{row.label}</span>
                  <span className="font-mono">{row.count}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-slate-500">
            Invalid rows are excluded from the metrics below.
          </p>
        </Panel>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Category breakdown (valid records)">
          <BreakdownList entries={data.category_breakdown} total={data.totals.valid_records} />
        </Panel>
        <Panel title="Status breakdown (valid records)">
          <BreakdownList entries={data.status_breakdown} total={data.totals.valid_records} />
        </Panel>
        <Panel title="Country breakdown (valid records)">
          <BreakdownList entries={data.country_breakdown} total={data.totals.valid_records} />
        </Panel>
        <Panel title="Satisfaction (closed incidents)">
          <div className="mb-3 flex items-baseline gap-3">
            <span className="text-3xl font-semibold">
              {data.satisfaction.average_score.toFixed(2)}
            </span>
            <span className="text-sm text-slate-500">/ 5.00 average</span>
          </div>
          <p className="mb-3 text-xs text-slate-500">
            {data.satisfaction.scored_incidents} scored of{" "}
            {data.satisfaction.closed_incidents} closed incidents
          </p>
          <ul className="space-y-1 text-sm">
            {[1, 2, 3, 4, 5].map((score) => (
              <li key={score} className="flex justify-between">
                <span className="text-slate-700">Score {score}</span>
                <span className="font-mono">
                  {data.satisfaction.per_score[String(score)] ?? 0}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "ok" | "warn";
}) {
  const toneCls =
    tone === "ok"
      ? "text-emerald-700"
      : tone === "warn"
        ? "text-amber-700"
        : "text-slate-900";
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 text-3xl font-semibold tracking-tight ${toneCls}`}>
        {value}
      </p>
    </div>
  );
}

function BreakdownList({
  entries,
  total,
}: {
  entries: Record<string, number>;
  total: number;
}) {
  const items = Object.entries(entries);
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">No data.</p>;
  }
  return (
    <ul className="space-y-1 text-sm">
      {items.map(([label, count]) => {
        const pct = total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";
        return (
          <li key={label} className="flex justify-between gap-4">
            <span className="text-slate-700">{label}</span>
            <span className="font-mono text-slate-800">
              {count}{" "}
              <span className="text-slate-500">({pct}%)</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function DownloadCsvButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * The export endpoint is protected, and a plain <a href> cannot send
   * an Authorization header — it would just 401. So fetch the CSV with
   * the token attached and hand the browser a blob URL instead.
   */
  async function download() {
    setBusy(true);
    setError(null);
    try {
      const res = await authFetch("/api/incidents/results/export");
      if (!res.ok) {
        setError(`Export failed (${res.status}).`);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "trackflow-incidents-results.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(toUserMessage(err, "Export failed."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={download}
        disabled={busy}
        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-60"
      >
        {busy ? "Preparing…" : "Download results CSV"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
