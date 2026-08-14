"""TrackFlow backend — first API surface, hosts the incident analyser.

Follows the architecture proposal in docs/ARCHITECTURE_PROPOSAL.md:
one modular monolith, package-by-feature. Incidents is the first
feature to land; more (shipments, routes, ...) will follow.

Analysis + validation is imported wholesale from
`incident_analyzer` (packages/incident_analyzer). This service does
NOT re-implement any rule — that is the whole point of shipping the
package. See docs/ARCHITECTURE_PROPOSAL.md § MONO-1.
"""

from __future__ import annotations

from typing import Any

from fastapi import FastAPI, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from incident_analyzer import (
    AnalysisResult,
    analyse,
)
from incident_analyzer.csv_io import read_csv_bytes, result_to_csv_rows, write_csv_bytes
from incident_analyzer.analyzer import RULE_LABELS

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="TrackFlow API",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Match ARCHITECTURE_PROPOSAL.md § 6.2 — explicit origins, never "*".
_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3100",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3100",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# In-memory cache of the most recent analysis result — used by /export.
# Not persistent by design; the exercise doesn't ask for a DB.
# ---------------------------------------------------------------------------

_LAST_RESULT: AnalysisResult | None = None


def _serialize(result: AnalysisResult) -> dict[str, Any]:
    """Frontend-friendly JSON representation of the analysis.

    Keeps every value the console version shows, plus the rule
    labels so the UI does not have to keep its own copy of them
    (and so a future rule rename ripples cleanly to the UI).
    """
    return {
        "totals": {
            "total_rows": result.total_rows,
            "valid_records": result.valid_count,
            "invalid_records": result.invalid_count,
        },
        "invalid_breakdown": [
            {
                "rule": rule,
                "label": RULE_LABELS[rule],
                "count": count,
            }
            for rule, count in result.invalid_breakdown.counts.items()
        ],
        "category_breakdown": result.category_breakdown.counts,
        "status_breakdown": result.status_breakdown.counts,
        "country_breakdown": result.country_breakdown,
        "satisfaction": {
            "scored_incidents": result.satisfaction.scored_count,
            "closed_incidents": result.satisfaction.total_closed,
            "average_score": result.satisfaction.average,
            "per_score": result.satisfaction.per_score,
        },
    }


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok", "service": "trackflow-api"}


@app.post(
    "/api/incidents/analyze",
    tags=["incidents"],
    summary="Analyse an incidents CSV upload",
)
async def analyze_incidents(file: UploadFile = File(...)) -> dict[str, Any]:
    """Accept a multipart CSV upload, validate + analyse, cache the
    result for a later /export call, and return the summary as JSON."""
    global _LAST_RESULT

    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Upload must be a .csv file.",
        )

    payload = await file.read()
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    try:
        rows = read_csv_bytes(payload)
    except UnicodeDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"CSV must be UTF-8 encoded: {exc}",
        ) from exc

    if not rows:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="CSV had a header but no data rows.",
        )

    result = analyse(rows)
    _LAST_RESULT = result
    return _serialize(result)


@app.get(
    "/api/incidents/results/export",
    tags=["incidents"],
    summary="Download the last analysis as a CSV (one row per metric)",
)
def export_last_results() -> Response:
    if _LAST_RESULT is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No analysis has been run yet — POST /api/incidents/analyze first.",
        )
    body = write_csv_bytes(result_to_csv_rows(_LAST_RESULT))
    return Response(
        content=body,
        media_type="text/csv",
        headers={
            "Content-Disposition": 'attachment; filename="trackflow-incidents-results.csv"'
        },
    )
