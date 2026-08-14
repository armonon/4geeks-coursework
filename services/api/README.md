# `services/api`

TrackFlow's first backend API. FastAPI, in-memory state only, one
Uvicorn process. Follows the layout proposed in
[`../../docs/ARCHITECTURE_PROPOSAL.md`](../../docs/ARCHITECTURE_PROPOSAL.md).

## Endpoints (current)

| Method | Path                                | Purpose                                                             |
| ------ | ----------------------------------- | ------------------------------------------------------------------- |
| GET    | `/`                                 | Health.                                                             |
| POST   | `/api/incidents/analyze`            | Multipart CSV upload. Validates + analyses via `incident_analyzer`, caches the result, returns the summary as JSON. |
| GET    | `/api/incidents/results/export`     | Downloads the last analysis as a CSV (one row per metric).          |

Error paths:
- 400 — file not `.csv`, empty upload, non-UTF-8 bytes.
- 404 — export before any analysis has been run.
- 422 — CSV with header but no data rows.

## Run

Two-step install: the API depends on the local `incident_analyzer`
package (`packages/incident_analyzer/`).

```bash
# from the monorepo root
python3 -m venv .venv && source .venv/bin/activate
pip install -e packages/incident_analyzer
pip install -e services/api

uvicorn incident_api.main:app --reload --port 8000
```

`GET /docs` opens FastAPI Swagger UI. `GET /redoc` opens ReDoc.

## Tests

7 pytest cases:

```bash
pytest services/api/tests -q
```

Coverage: happy path (all CONTEXT numbers), invalid uploads (400 /
422), export before any analysis (404), export CSV shape + no-email
invariant.

## CORS

Explicit origins for the two `uis/*` dev servers only:

- `http://localhost:3000` (public website)
- `http://localhost:3100` (backoffice)

No `"*"`. If the origins need to change, they live in
`src/incident_api/main.py`; a follow-up should pull them into a
Pydantic Settings class per the architecture proposal.
