"""Incident-analysis endpoints (Milestone: Incident Analyser).

Analysis + validation is imported wholesale from `incident_analyzer`
(packages/incident_analyzer). This service does NOT re-implement any
rule — see docs/ARCHITECTURE_PROPOSAL.md § MONO-1.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from fastapi.responses import Response

from incident_analyzer import AnalysisResult, analyse
from incident_analyzer.analyzer import RULE_LABELS
from incident_analyzer.csv_io import (
    read_csv_bytes,
    result_to_csv_rows,
    write_csv_bytes,
)

router = APIRouter(prefix="/api/incidents", tags=["incidents"])

# In-memory cache of the most recent analysis — used by /export.
# Not persistent by design; the exercise doesn't ask for a DB here.
_LAST_RESULT: AnalysisResult | None = None


def _serialize(result: AnalysisResult) -> dict[str, Any]:
    """Frontend-friendly JSON representation of the analysis."""
    return {
        "totals": {
            "total_rows": result.total_rows,
            "valid_records": result.valid_count,
            "invalid_records": result.invalid_count,
        },
        "invalid_breakdown": [
            {"rule": rule, "label": RULE_LABELS[rule], "count": count}
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


@router.post("/analyze", summary="Analyse an incidents CSV upload")
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


@router.get(
    "/results/export",
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
