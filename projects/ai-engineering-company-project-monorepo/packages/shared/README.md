# `packages/shared` — `trackflow_shared`

Domain rules shared by **both** `scripts/seed_incidents.py` and
`services/api`, so neither owns a private copy.

```
trackflow_shared/
└── incidents/
    ├── model.py        enums, lifecycle transitions, field validation
    └── csv_mapping.py  analyzer-CSV → incident-model transformation
```

## Why this package exists

The incident manager and the historical seed have to agree on three
things exactly:

1. **What a valid incident is** — the closed value sets for `status`,
   `origin`, `branch`, and `category` from
   [`CONTEXT.md`](../../CONTEXT.md).
2. **Which status transitions are legal** — the API rejects the rest
   with 400, and the seed must not create records the API would
   consider unreachable.
3. **How an analyzer CSV row becomes an incident** — the title/status/
   category/branch mapping.

If either side kept its own copy, the seeded data and the API would
drift. They import from here instead.

## Reuse, not duplication

Row-level CSV validity (is this row usable at all?) is *not*
re-implemented here. `csv_mapping.py` calls `validate_record` from
`incident_analyzer` — the package written for the analyzer milestone —
so the definition of "valid CSV row" lives in exactly one place across
the whole monorepo.

> This folder also contains `package.json` for the npm workspace
> `@repo/shared-types`. The two coexist: JS/TS tooling reads
> `package.json`, Python tooling reads `pyproject.toml`.
