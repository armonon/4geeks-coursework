# backend-structure

Scope: everything under `backend/app/`.

## BE-1 — Split `routes.py` before it grows

`backend/app/routes.py` currently holds route handlers, Pydantic models,
type aliases, business helpers, and the mock-data generator (392 lines).
Any change that adds ≥ 30 lines or a new endpoint group must first split
the file:

- `app/schemas.py` — every Pydantic model + `Literal` type alias.
- `app/services.py` — pure functions (`filter_movements*`,
  `summarize_movements`, `build_top_categories`,
  `calculate_net_value`, `detect_outcome_alerts`, …).
- `app/mocks.py` — `generate_mock_movements` and its helpers.
- `app/routes/*.py` (package) — one module per resource; each exports an
  `APIRouter` that `main.py` includes.

Rationale: today every backend edit touches the same file. Splitting is
cheap now; painful once a real data source lands.

## BE-2 — Use a local `random.Random` in mock generators

`generate_mock_movements` in `routes.py:95-96` calls `random.seed(seed)`,
which mutates process-wide RNG state.

Rule: any mock/fixture generator must instantiate its own
`random.Random(seed)` and thread it through the helper functions.
Never call `random.seed(...)` at module or request scope.

## BE-3 — Cache the mock dataset per process

Every endpoint currently rebuilds all 360 movements
(`routes.py:255, 264, 277, 295, 311, 350, 370, 385`).

Rule: the mock dataset must be computed once per process (e.g. an
`@functools.lru_cache` on a `_movements(seed)` accessor) and re-used
across requests. Endpoints must not call `generate_mock_movements`
directly.

## BE-4 — Endpoints stay thin

A route handler in `app/routes/*.py` may:

1. Read query params.
2. Look up the cached dataset.
3. Delegate to a pure function in `app/services.py`.
4. Return the result.

If a handler contains arithmetic, filtering loops, or list
comprehensions beyond ~3 lines, move that logic to `services.py` and
cover it with a unit test in `backend/tests/`.

## BE-5 — Pydantic models declare the shape at the boundary

Every endpoint must keep its `response_model=` decorator argument. Every
new field must be added to the Pydantic model, not just to the returned
`dict`. This is what makes `/docs` trustworthy and matches G1 in the
audit.
