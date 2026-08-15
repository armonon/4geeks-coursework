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


## Authentication

Stateless JWT. No sessions, no cookies. `User` and `Profile` live in
**TinyDB only** — other stores reference the TinyDB user `id` as
`user_uuid` and never hold a copy of the account.

### Setup

```bash
cp .env.example .env
python -c "import secrets; print(secrets.token_hex(32))"   # paste as SECRET_KEY
```

`SECRET_KEY` has no default on purpose: a fallback would mean tokens
signed with a publicly-known key. The app refuses to mint or verify a
token without it.

| Variable | Purpose |
| -------- | ------- |
| `SECRET_KEY` | JWT signing secret. Required. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime. Defaults to 60. |

### Endpoints

| Method | Endpoint | Access |
| ------ | -------- | ------ |
| `POST` | `/auth/login` | public — email + password, returns a JWT |
| `GET` | `/auth/me` | protected — credentials + linked profile |
| `POST` | `/users` | **public** — registration; creates the linked Profile too |
| `GET` | `/users` | protected |
| `GET` | `/users/{id}` | protected — self or admin |
| `PUT` | `/users/{id}` | protected — self or admin; `role` is admin-only |
| `DELETE` | `/users/{id}` | protected — self or admin; cascades to the Profile |
| `GET` | `/profiles/me` | protected — resolved from the token |
| `PUT` | `/profiles/me` | protected — owner only |

`POST /auth/login` accepts an OAuth2 form (so Swagger's **Authorize**
button works) or a JSON body with `email` + `password`.

### Model split

`User` holds credentials only: `id`, `email`, `hashed_password`,
`is_active`, `role`, `created_at`. Display name and contact data —
`name`, `phone`, `address` — live on `Profile`, linked one-to-one via
`user_id`. A test asserts the stored user record contains nothing else.

`role` accepts `admin`, `manager`, or `user`. Registration always
produces `user`: `role` is not a field on `UserCreate`, so it cannot be
set by the caller.

### Passwords

Hashed with bcrypt via `libpass` (a maintained drop-in fork of
`passlib`; the import path is still `passlib.hash`). Plain text never
reaches TinyDB — asserted by a test that greps the stored record.
Passwords over 72 bytes are rejected rather than silently truncated.

### Which routes are protected

Twelve endpoints require a valid token. Six of them sit outside
`/users` and `/auth`, exceeding the required five:

| Route | Why |
| ----- | --- |
| `POST /suppliers` | creates directory data |
| `PATCH /suppliers/{id}/rate` | changes commercial terms |
| `PATCH /suppliers/{id}/status` | suspends/activates a contract |
| `DELETE /suppliers/{id}` | destroys a record |
| `POST /api/incidents/analyze` | processes an uploaded incident file |
| `GET /api/incidents/results/export` | exports analysed incident data |

`GET /suppliers` and `GET /suppliers/{id}` stay public so the
backoffice list keeps working until the frontend starts sending
tokens. `GET /` is the health check.

### 401 vs 403

- **401** — no token, malformed token, bad signature, expired token, or
  a token whose account was deleted or deactivated.
- **403** — the caller is authenticated but acting on someone else's
  account, or a non-admin trying to change a `role`.

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

92 tests — 46 for auth (user CRUD, profiles, login, token validation,
401/403 separation, and route protection), 39 for the supplier
directory, and 7 for incident analysis.

## CORS

Explicit origins for the two `uis/*` dev servers, never `"*"`. See
`main.py`.
