# Progress — TrackFlow monorepo

Rolling log of substantive changes. Newest first.

---

## 2026-08-14 · Fold Milestone 2 into `packages/programming-fundamentals`

**Branch:** `milestone-2-fold-in`

Prior work from the draft PR `milestone-2-programming-fundamentals`
(dated 2026-08-05) had been sitting open. Rather than closing and
discarding it, the salvageable pieces landed in their proper homes
under the Milestone 4 workspace layout:

- `packages/programming-fundamentals/` — new `@trackflow/programming-fundamentals`
  workspace with the M2 domain types (Product, Shipment, Carrier,
  InventoryMovement), collection filters, search helpers,
  transformations (shipping cost, carrier scoring, aggregations),
  and business-rule validations. 24 `node --test` tests pass.
- `docs/company-context/` — the M2 briefings
  (00-trackflow-company-briefing, 01-web-fundamentals,
  02-coding-fundamentals) kept as reference material.
- Root `package.json` bootstrap / test scripts extended to cover
  the new workspace.

**Dropped from the original PR:**
- `uis/website/*.html|*.js` — Milestone 4 already provides a
  Next.js website at `uis/website/`; keeping the old static
  version would overwrite it.
- `packages/shared/package.json` change — Milestone 4 conventions
  use `@trackflow/<workspace>` scoping; the template's stub
  `@repo/shared-types` stays grandfathered (MONO-3).
- Root-level `src/` — the code lives in a workspace now, not at
  the tree root.

Delivery workflow: `npm run bootstrap && npm run test && npm run demo:programming-fundamentals`
all exit 0.

---

## 2026-08-02 · Milestone 4 — AI-driven engineering infrastructure

**Branch:** `milestone-4`

### Delivered

- **CONTEXT.md** replaced with the TrackFlow scenario. Placeholder
  Spanish variant removed — the CONTEXT is one file, one language,
  because it is code-adjacent.
- **`memory-bank/`** seeded with `projectbrief.md`, `techContext.md`,
  and this `progress.md`. Every file is anchored to CONTEXT.md so
  the "business + technical" pair is not a template.
- **`AGENTS.md`** at repo root: names the memory-bank files the
  agent must read at the start of every session, spells out a 5-step
  pre-commit workflow, and lists the do-not-modify surfaces that
  require explicit developer confirmation.
- **`.agents/rules/`** — one file (`monorepo-conventions.md`) with
  three scoped, actionable rules (`MONO-1..3`). More will accrete as
  we discover them.
- **`.agents/skills/freight-quote-invariants/SKILL.md`** — a
  reusable, verifiable skill for confirming freight-quote logic
  hasn't drifted from CONTEXT.md, with an executable acceptance
  script (`scripts/verify.mjs`).
- **`packages/business-logic/`** — Milestone 2 stand-in:
  `quoteShipment(input)` implementing the freight-quote formula from
  CONTEXT.md. Ships with `node --test` unit tests.
- **`uis/website/`** — Next.js 15 corporate site, App Router,
  Tailwind v4, TypeScript strict. Sections: hero, offering,
  countries served, pricing tiers, contact. Per-page metadata.
- **`uis/backoffice/`** — Next.js 15 internal app, App Router.
  Home route (`/`) is the account-manager quote calculator. It
  imports `@trackflow/business-logic` — the module is not copied.

### Deferred

- CI workflow (`MONO-2`) — noted in `techContext.md` and in
  `.agents/rules/monorepo-conventions.md`.
- Shared UI kit — deferred until a third `uis/*` appears.
- Backend services under `services/` — Milestone 5+.
- Merging `@repo/shared-types` and `@trackflow/business-logic`.

### Delivery workflow — end-of-branch pass

Ran all five steps from `AGENTS.md § Delivery workflow` before the
final commit:

1. `git status` — clean tree after each phase commit.
2. `npm run typecheck` — three workspaces, exit 0.
3. `npm run test` — 5/5 tests pass in `@trackflow/business-logic`;
   backoffice / website have placeholder `test` scripts pending
   real coverage (rule MONO-2 stopgap, marked `TODO(MONO-2)` in
   their `package.json` for a follow-up).
4. `npm run build` — all three workspaces build cleanly with
   turbopack.
5. `npm run verify:freight-quote` — skill script prints
   `freight-quote-invariants: OK (10 assertions)`.

### Notes on rebuilds vs. migrations

The public website's Milestone 1 version and the Milestone 2
TypeScript module are not present in the fork at the start of this
milestone. Both were **built from CONTEXT.md** so this delivery is
self-contained and reflects TrackFlow rather than a generic company.
When earlier milestones land, `MONO-1` (single source of truth) is
the guardrail that keeps the imports pointed at
`packages/business-logic`.

---

## Error handling audit (`feature/error-handling-audit`)

Cross-cutting pass over the whole repository. No new features: the
deliverable is the same platform, failing better. Full report in
[`docs/ERROR_HANDLING_AUDIT.md`](../docs/ERROR_HANDLING_AUDIT.md).

### Behaviour that changed

- **`services/api/main.py` now has a global `Exception` handler.** Every
  error response from the API is JSON. It used to be possible to get the
  plain-text body `Internal Server Error`, which the frontend then failed
  to parse — surfacing to the user as `Unexpected token 'I'`.
  Reproducible trigger: a CSV field over 128 KB uploaded to
  `/api/incidents/analyze`.
- **Exception text no longer reaches clients.** The real exception is
  logged server-side; responses carry a fixed, human-readable `detail`.
  This closed a leak where a password sent as a non-string JSON value
  came back inside a Pydantic validation error.
- **New incidents reject containers.** `{"title": {"a": 1}}` used to be
  stored as the literal `"{'a': 1}"`.
- **`AuthProvider` distinguishes a rejected token from an unreachable
  server.** Previously any failure cleared the token, so an API blip
  logged people out permanently. A transport failure now keeps the
  session and renders a recoverable state with Retry.
- **Scripts exit non-zero with advice on `stderr`**, never a traceback.
  Unreadable input exits 2, a parse failure exits 1.

### New shared module

`uis/*/lib/errors.ts` — `toUserMessage(error, fallback)` and
`readJson(res)`. Every user-facing error render goes through it. Server
messages written for humans pass through; browser and parser noise
(`Failed to fetch`, `Unexpected token`, stringified bodies) is replaced.
Duplicated into both `uis/backoffice` and `uis/talent-pipeline-tracker`
deliberately — they are separate Next apps with separate `@/` roots, and
promoting it to `packages/` is the follow-up if a third UI appears
(rule MONO-2).

### Verification

- 196 backend tests (19 new in `tests/test_error_handling.py`).
- Every backend fix mutation-checked: reverting it makes its test fail.
- 47 browser assertions against the running stack, including a
  deliberately killed API, asserting no technical text ever reaches the
  screen and every error state offers a way forward.

### Deferred

- The two `lib/errors.ts` copies (see above).
- `uis/website` needs nothing — it is static and has no async work.
- `packages/incident_analyzer` still raises precise exceptions rather
  than handling them; that is correct for a library, and the handling
  now lives at the route and script boundaries.
