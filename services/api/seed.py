"""Seed the supplier directory with TrackFlow's existing suppliers.

This is the spreadsheet-to-database migration the tech lead asked for:
Carlos's and Ana's combined directory, loaded so the demo never starts
from an empty database.

Run it:
    uv run seed          # from services/api/

Idempotent: suppliers are matched by name, so running it twice does
not create duplicates. It reports exactly what it did.
"""

from __future__ import annotations

import sys
from typing import Any

from tinydb import Query

from database import db_path, suppliers_table
from models import SupplierCreate, utcnow

# Transcribed verbatim from CONTEXT.md § "Seeder initial data".
SUPPLIERS_SEED: list[dict[str, Any]] = [
    {
        "name": "UPS Ground",
        "country": "USA",
        "categories": ["carrier_last_mile"],
        "rate_per_shipment": 7.45,
        "currency": "USD",
        "status": "active",
        "service_zone": "West Coast",
        "contact_email": "business@ups.com",
        "notes": "Primary carrier for local deliveries in Los Angeles and surrounding areas.",
    },
    {
        "name": "FedEx Ground",
        "country": "USA",
        "categories": ["carrier_last_mile"],
        "rate_per_shipment": 7.90,
        "currency": "USD",
        "status": "active",
        "service_zone": "Continental USA",
        "contact_email": "business.solutions@fedex.com",
    },
    {
        "name": "DHL Express USA",
        "country": "USA",
        "categories": ["carrier_last_mile", "carrier_international"],
        "rate_per_shipment": 14.20,
        "currency": "USD",
        "status": "active",
        "service_zone": "Continental USA + International",
        "contact_email": "business.us@dhl.com",
        "notes": "Used for urgent shipments and exports to Europe.",
    },
    {
        "name": "OnTrac",
        "country": "USA",
        "categories": ["carrier_last_mile"],
        "rate_per_shipment": 6.10,
        "currency": "USD",
        "status": "active",
        "service_zone": "West Coast",
        "contact_email": "solutions@ontrac.com",
        "notes": "Regional carrier. Best rate in the Los Angeles area.",
    },
    {
        "name": "Laser Ship",
        "country": "USA",
        "categories": ["carrier_last_mile"],
        "rate_per_shipment": 5.80,
        "currency": "USD",
        "status": "suspended",
        "service_zone": "East Coast",
        "contact_email": "business@lasership.com",
        "notes": "Suspended. Incident rate above 8% in Q3.",
    },
    {
        "name": "PackSource LA",
        "country": "USA",
        "categories": ["packaging_materials"],
        "rate_per_shipment": 0.42,
        "currency": "USD",
        "status": "active",
        "contact_email": "orders@packsource.com",
        "notes": "Boxes, filler, and tape for the Los Angeles warehouse.",
    },
    {
        "name": "CleanTeam West",
        "country": "USA",
        "categories": ["cleaning_and_facilities"],
        "rate_per_shipment": 1800.0,
        "currency": "USD",
        "status": "active",
        "contact_email": "accounts@cleanteamwest.com",
        "notes": "Monthly rate for LA warehouse cleaning service.",
    },
    {
        "name": "MRW España",
        "country": "Spain",
        "categories": ["carrier_last_mile"],
        "rate_per_shipment": 4.90,
        "currency": "EUR",
        "status": "active",
        "service_zone": "Península Ibérica",
        "contact_email": "clientes.empresa@mrw.es",
        "notes": "Primary carrier for deliveries in Spain. Volume-negotiated contract.",
    },
    {
        "name": "SEUR",
        "country": "Spain",
        "categories": ["carrier_last_mile"],
        "rate_per_shipment": 5.20,
        "currency": "EUR",
        "status": "active",
        "service_zone": "Península Ibérica + Baleares",
        "contact_email": "grandes.cuentas@seur.com",
    },
    {
        "name": "DHL Express España",
        "country": "Spain",
        "categories": ["carrier_last_mile", "carrier_international"],
        "rate_per_shipment": 12.80,
        "currency": "EUR",
        "status": "active",
        "service_zone": "España + Internacional",
        "contact_email": "business.es@dhl.com",
        "notes": "Urgent shipments and exports from Zaragoza.",
    },
    {
        "name": "Nacex",
        "country": "Spain",
        "categories": ["carrier_last_mile"],
        "rate_per_shipment": 4.60,
        "currency": "EUR",
        "status": "active",
        "service_zone": "Aragón y zona norte",
        "contact_email": "empresas@nacex.es",
        "notes": "Regional carrier with good coverage in Aragón.",
    },
    {
        "name": "Logística Inversa Iberia",
        "country": "Spain",
        "categories": ["reverse_logistics"],
        "rate_per_shipment": 6.30,
        "currency": "EUR",
        "status": "active",
        "contact_email": "operaciones@liiberia.es",
        "notes": "Returns management for the Zaragoza warehouse.",
    },
    {
        "name": "Embalajes Zaragoza S.L.",
        "country": "Spain",
        "categories": ["packaging_materials"],
        "rate_per_shipment": 0.28,
        "currency": "EUR",
        "status": "active",
        "contact_email": "pedidos@embalajeszgz.es",
    },
    {
        "name": "SAP WM Cloud",
        "country": "USA",
        "categories": ["it_and_wms_software"],
        "rate_per_shipment": 2200.0,
        "currency": "USD",
        "status": "suspended",
        "contact_email": "enterprise@sap.com",
        "notes": "Suspended. Andrés is evaluating lighter alternatives for the LA warehouse.",
    },
    {
        "name": "ReturnBear",
        "country": "USA",
        "categories": ["reverse_logistics"],
        "rate_per_shipment": 4.15,
        "currency": "USD",
        "status": "active",
        "service_zone": "West Coast",
        "contact_email": "partnerships@returnbear.com",
        "notes": "Returns management for Los Angeles customers.",
    },
]


def seed() -> tuple[int, int]:
    """Insert any missing suppliers. Returns (inserted, skipped).

    Every row is pushed through SupplierCreate first, so the seed data
    is held to exactly the same validation as an API request — if the
    CONTEXT data ever drifts from the model, seeding fails loudly
    instead of writing junk into the database.
    """
    table = suppliers_table()
    query = Query()

    inserted = 0
    skipped = 0

    for raw in SUPPLIERS_SEED:
        supplier = SupplierCreate(**raw)  # validates; raises on bad data

        if table.search(query.name == supplier.name):
            skipped += 1
            continue

        record = supplier.model_dump(mode="json")
        record["updated_at"] = utcnow().isoformat()
        table.insert(record)
        inserted += 1

    return inserted, skipped


def main() -> int:
    print("TrackFlow — supplier directory seeder")
    print(f"  database: {db_path()}")

    try:
        inserted, skipped = seed()
    except Exception as exc:
        print(f"\n  FAILED: {exc}", file=sys.stderr)
        return 1

    total = len(suppliers_table())
    print()
    print(f"  inserted ......... {inserted}")
    print(f"  already present .. {skipped}")
    print(f"  total in database  {total}")
    print()
    if inserted:
        print(f"Seeded {inserted} supplier(s).")
    else:
        print("Nothing to do — the directory was already seeded.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
