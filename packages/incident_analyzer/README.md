# `@incident-analyzer` (Python)

TrackFlow's incident-report CSV analyser — shared between
[`scripts/analyze.py`](../../scripts/analyze.py) and
[`services/api`](../../services/api). The single authoritative
implementation of the CONTEXT-defined validation rules and metric
calculations; no other module in the monorepo is allowed to
re-implement them.

## Public API

```python
from incident_analyzer import analyse, read_csv, render_console, result_to_csv_rows

rows = read_csv("scripts/incidents-trackflow.csv")
result = analyse(rows)
print(render_console(result, "incidents-trackflow.csv"))
csv_rows = result_to_csv_rows(result)  # one row per metric
```

## What it enforces

- All rules from [`CONTEXT.md`](../../CONTEXT.md) § "Rules for
  Invalid Records", in declaration order (first failing rule wins).
- **No customer emails** are ever printed, logged, or exported.
  Tests assert this.

## Tests

```bash
pip install -e packages/incident_analyzer pytest
pytest packages/incident_analyzer/tests -q
```

Every number the tests assert comes from CONTEXT.md — 100/95/5,
14/38/19/17/7, 29/52/14, 50/45, 3.06 average, 6/11/15/14/6. If a
rule drifts, at least one of these assertions fails loud.
