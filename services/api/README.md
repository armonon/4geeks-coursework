# `services/api`

TrackFlow's backend. One FastAPI service, routes grouped by domain —
the modular-monolith shape proposed in
[`../../docs/ARCHITECTURE_PROPOSAL.md`](../../docs/ARCHITECTURE_PROPOSAL.md).

```
services/api/
├── main.py               FastAPI app: CORS + router mounting
├── models.py             Pydantic models (supplier directory)
├── database.py           TinyDB initialisation
├── seed.py               initial-data loader  →  uv run seed
├── routes/
│   ├── suppliers.py      supplier directory endpoints
│   └── incidents.py      incident-report analysis endpoints
└── tests/                46 tests
```

## Quick start

```bash
cd services/api
uv sync            # installs deps + the local incident-analyzer package
uv run seed        # load the CONTEXT suppliers into TinyDB
uv run uvicorn main:app --reload
```

Swagger UI: <http://127.0.0.1:8000/docs>

## Supplier directory

Data model, valid categories, allowed statuses, and the seed data all
come from [`../../CONTEXT.md`](../../CONTEXT.md). Field names are not
paraphrased anywhere.

| Method   | Endpoint                       | Purpose                                                       |
| -------- | ------------------------------ | ------------------------------------------------------------- |
| `POST`   | `/suppliers`                   | Register a supplier. Returns it with its TinyDB id. → `201`    |
| `GET`    | `/suppliers`                   | List all. Optional `?country=` and `?category=` filters.       |
| `GET`    | `/suppliers/{id}`              | Detail. → `404` if unknown.                                    |
| `PATCH`  | `/suppliers/{id}/rate`         | Update the rate and stamp `updated_at`. Rejects `<= 0`.        |
| `PATCH`  | `/suppliers/{id}/status`       | Activate / suspend. Only the two CONTEXT statuses.             |
| `DELETE` | `/suppliers/{id}`              | Remove. → `404` if unknown.                                    |

Filters combine with AND, so
`/suppliers?country=Spain&category=carrier_last_mile` answers *"what
last-mile carriers do we have in Spain?"*.

### Validation

Everything is rejected by Pydantic **before it reaches TinyDB**:

| Rule | Result |
| ---- | ------ |
| `status` outside `{active, suspended}` | `422` |
| `rate_per_shipment` zero or negative | `422` |
| `categories` empty, or a value outside the eight CONTEXT categories | `422` |
| `currency` disagreeing with `country` (USA→USD, Spain→EUR) | `422` |
| Missing a required field | `422` |

`updated_at` is system-generated — it is absent from the input models,
so a client cannot set it. It is written on create and re-stamped on
every rate change, which is the audit trail Carlos needs.

### Storage

TinyDB, a JSON file at `services/api/data/trackflow.json`. It is
git-ignored because the seeder regenerates it; run `uv run seed` after
cloning. Data persists across restarts — covered by
`test_data_survives_a_server_restart`.

## Seeder

```bash
uv run seed
```

Loads the 15 suppliers from CONTEXT.md and reports what it did:

```
  inserted ......... 15
  already present .. 0
  total in database  15
```

Idempotent — it matches on supplier name, so running it twice inserts
nothing the second time. Every seed row is pushed through the same
`SupplierCreate` model an API request uses, so if the CONTEXT data ever
drifts from the model the seeder fails loudly instead of writing junk.

## Incident analysis

Carried over from the previous milestone, now mounted as a router:

| Method | Endpoint                            |
| ------ | ----------------------------------- |
| `POST` | `/api/incidents/analyze`            |
| `GET`  | `/api/incidents/results/export`     |

## Tests

```bash
uv run pytest
```

46 tests — 39 for the supplier directory (model validation, every
endpoint and status code, the seeder including idempotency, filters,
and restart persistence) and 7 for incident analysis.

## CORS

Explicit origins for the two `uis/*` dev servers, never `"*"`. See
`main.py`.
