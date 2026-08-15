"""TrackFlow backend API.

One FastAPI service, routes grouped by domain — the modular-monolith
shape proposed in docs/ARCHITECTURE_PROPOSAL.md.

    routes/suppliers.py   supplier directory (TinyDB)
    routes/incidents.py   incident-report analysis (CSV upload)

Run it:
    uv run uvicorn main:app --reload        # from services/api/
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.incidents import router as incidents_router
from routes.suppliers import router as suppliers_router

app = FastAPI(
    title="TrackFlow API",
    description=(
        "Supplier directory (TinyDB) and incident-report analysis for "
        "TrackFlow's Los Angeles and Zaragoza operations."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Explicit origins for the two uis/* dev servers — never "*".
# See docs/ARCHITECTURE_PROPOSAL.md § 6.2.
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3100",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3100",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(suppliers_router)
app.include_router(incidents_router)


@app.get("/", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok", "service": "trackflow-api"}
