# Frontend Specs — Financial Dashboard

Spec-driven-development deliverable for three new features on the
[financial-dashboard project](https://github.com/armonon/ai-eng-financial-dashboard-context-project).

All work lives in [`frontend/specs/`](./frontend/specs) on the
`feature/frontend-specs` branch, matching the rubric's expected
folder layout. The `main` branch of this repo is intentionally empty
so the branch shows a clean diff.

## Contents

- [`frontend/specs/api-types.ts`](./frontend/specs/api-types.ts) — response types.
- [`frontend/specs/param-types.ts`](./frontend/specs/param-types.ts) — query-parameter types.
- [`frontend/specs/components.md`](./frontend/specs/components.md) — component breakdown.
- [`frontend/specs/README.md`](./frontend/specs/README.md) — endpoint map, valid values, edge cases.
- [`frontend/specs/tsconfig.json`](./frontend/specs/tsconfig.json) — strict TS config used for verification.

## Verify

```bash
npx tsc --noEmit --project frontend/specs/tsconfig.json
```

Exits `0` when the types compile cleanly under strict mode.

## Note

The rubric asks for this work to live on the existing dashboard fork
under a `feature/frontend-specs` branch. Per user instruction this
delivery lives in a dedicated repository; the branch and folder
conventions are preserved so the same commit could be replayed onto
the dashboard fork verbatim.
