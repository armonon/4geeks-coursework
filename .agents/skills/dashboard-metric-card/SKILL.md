---
name: dashboard-metric-card
description: Add or modify a KPI card on this financial dashboard with the required type, aggregation, formatting, accessibility, and tests. Use for requests to add a KPI, show a new metric, or change a header card; do not use for unrelated charts or backend-only metrics.
license: MIT
metadata:
  author: armonon
  version: "1.0.0"
  project: financial-dashboard
---

# Add or modify a KPI card

This skill covers the full, opinionated flow for adding a new KPI (or
changing an existing one) on the financial dashboard so it doesn't
break the mental model the rest of the codebase already establishes.

## Objective

Ship a new KPI card that:

1. Reads from the same `FinancialMovement[]` payload every other card
   uses (no bespoke endpoint added just for the card).
2. Passes accessibility and rendering rules the project already enforces
   (`.agents/skills/accessibility`, `.agents/skills/vercel-react-best-practices`).
3. Has a Vitest unit test for the new derivation function.
4. Uses the shared formatting helpers — never a hand-rolled currency /
   percent string.

## Inputs (given by the requester)

- **Metric name** as it will appear on the card, in Title Case
  (e.g. `"Operating Ratio"`).
- **Helper text** — one-sentence description that fits under the value.
- **Formula** — expressed in terms of `FinancialMovement` fields
  (`operation_type`, `category`, `business_type`, `amount`).
- **Formatting** — one of `currency`, `percent`, or a documented
  reason to add a new formatter (which then goes into
  `frontend/src/lib/financial-utils.ts`).
- **Badge variant** — `income` | `outcome` | `profit` | `profitPercent`.
  If none of these fit, extend the `variant` union in
  `frontend/src/components/dashboard/kpi-card.tsx` and add a matching
  entry to `variantStyles` before writing the new card.

## Steps

### 1. Extend the KPI type

Edit `frontend/src/lib/financial-types.ts`:

```ts
export interface KPIMetrics {
  totalIncome: number
  totalOutcome: number
  profit: number
  profitPercent: number
  // add here — always `number` (never a pre-formatted string):
  operatingRatio: number
}
```

**Do not** store formatted strings on `KPIMetrics`. Formatters run at
render time.

### 2. Extend `computeKPIs`

Edit `frontend/src/lib/financial-utils.ts`. Add the derivation inside
`computeKPIs`; keep it a pure function of `movements`, no dates in
scope. Handle the divide-by-zero case explicitly (return `0`, not
`NaN`/`Infinity` — the existing `profitPercent` already sets the
precedent).

### 3. Add a Vitest case

Edit `frontend/src/lib/financial-utils.test.ts`. Add at least:

- One "happy path" case using a hand-crafted 3–5 movement fixture where
  the expected value is trivial to reason about.
- One divide-by-zero / empty-array case asserting the fallback (`0`).

Never test the display string; test the number `computeKPIs` returns.

### 4. Insert the card in `KPIRow`

Edit `frontend/src/components/dashboard/kpi-row.tsx`. Add the fifth
card *between* Profit and Profit Margin (grouping by "money" then
"ratios") and update the grid to `xl:grid-cols-5`. Pass:

- `label` — the Title Case metric name.
- `value` — `metrics ? formatCurrency(metrics.<field>) : '—'`
  (or `formatPercent`, depending on the metric).
- `helperText` — from the input.
- `icon` — pick from `lucide-react` and import by *named* import.
- `variant` — as chosen above.
- `loading` — pass through unchanged.

### 5. Verify accessibility wiring is inherited

`KPICard` already sets `aria-hidden` on the badge icon and wires
`aria-labelledby` / `aria-describedby` between the value and its
helper text. **Do not** override those attributes on the new card. If
the value needs a different accessible name (e.g. because it's a
ratio that should be read as "0.42"), pass a `<span className="sr-only">`
inside the value string rather than editing `KPICard`.

### 6. Verify the build and tests

Run both — no exceptions:

```bash
cd frontend
npm run build
npm test
```

## Expected output

- A single PR / commit with edits to exactly four files:
  `financial-types.ts`, `financial-utils.ts`, `financial-utils.test.ts`,
  `kpi-row.tsx`. A justified new visual variant may also require
  `kpi-card.tsx` and `frontend/src/index.css`; document that exception
  in the commit body. Changes to the API client are out of scope.
- Commit message references this skill by name in the trailer:
  `Skill: dashboard-metric-card`.

## Acceptance criteria (checklist)

- [ ] `KPIMetrics` gains exactly one new `number` field.
- [ ] `computeKPIs` returns the new field for every input, including
      empty arrays, without producing `NaN` or `Infinity`.
- [ ] There is at least one new test case in
      `financial-utils.test.ts` per new field.
- [ ] `KPIRow` renders 5 cards on `xl`, still stacks to 1 on mobile.
- [ ] `npm run build` passes.
- [ ] `npm test` passes.
- [ ] `KPICard` was **not** modified (unless a new `variant` was
      genuinely required, in which case the extension is documented
      in the commit body).
- [ ] Currency / percent strings appear only via `formatCurrency` /
      `formatPercent`, never inline.

## Anti-patterns to reject

- Adding a new endpoint to the backend just to power one card. Every
  KPI in this dashboard is derived on the client from the movements
  payload — that consistency is the whole point of
  `.agents/rules/api-contract.md#API-1`.
- Storing an already-formatted string on `KPIMetrics`.
- Passing an emoji or unicode symbol in `value` to convey trend
  direction — trend arrows belong on the badge icon (a `lucide-react`
  component), not in the value string, so screen readers keep reading
  the number cleanly.
- Adding a new `variant` colour without adding the matching CSS custom
  properties (`--<variant>-badge`, `--<variant>-badge-fg`) to
  `frontend/src/index.css` for both light and dark themes.
