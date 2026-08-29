# `scripts/`

Standalone scripts for TrackFlow runtime work and read-only coursework checks.

## `analyze.py` — Incident Report Analyser (Phase 1)

```bash
python scripts/analyze.py scripts/incidents-trackflow.csv
```

Reads the CSV, validates every row against the rules in
[`CONTEXT.md`](../CONTEXT.md), prints the summary, and offers to
export a CSV with one row per metric.

Uses the shared `incident_analyzer` package (under
[`../packages/incident_analyzer`](../packages/incident_analyzer)),
which is the same module the API imports — analysis and validation
logic is not duplicated.

Flags:
- `--out results.csv` — where to write the exported CSV
  (default `results.csv`).
- `--no-prompt` — skip the y/n export prompt (used by CI).

The bundled `incidents-trackflow.csv` is the 100-row sample from the
syllabus. Expected values are documented in `CONTEXT.md`
(§ Data Distribution).

## Read-only 4Geeks status scripts

Copy `.env.example` to the ignored `.env` file and add the student token,
then run any of these from the repository root:

```bash
node scripts/verify-4geeks-session.mjs
node scripts/query-4geeks-projects.mjs
node scripts/query-4geeks-pending.mjs
node scripts/query-4geeks-progress.mjs
```

The shared `4geeks-client.mjs` performs authenticated GET requests only and
does not print the token or personal profile fields.
