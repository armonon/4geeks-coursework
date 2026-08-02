---
name: monorepo-conventions
scope: always-active
applies-to:
  - packages/**
  - uis/**
  - services/**
description: Structural conventions that keep the TrackFlow monorepo coherent as more apps and services land in it.
---

# Monorepo conventions

Three rules. Each has an id (`MONO-*`) you must cite in commit
messages and PR descriptions when it applies.

## MONO-1 — One authoritative implementation of domain logic

**Scope:** always active. Applies to any code under `uis/**`,
`services/**`, or `agents/**` that computes something the CONTEXT
says has a canonical formula (freight quote, service-tier
eligibility, currency conversion, ETA).

**Rule.** Domain logic named in [`CONTEXT.md`](../../CONTEXT.md)
lives in exactly one file, under `packages/business-logic/src/`. UIs
and services **import** it (`@trackflow/business-logic`), never
re-implement it, never copy it, and never patch it locally.

**Rationale.** The freight-quote formula, service-tier eligibility
rules, and currency handling are things sales teams and customers
depend on. Two implementations means two bugs and one is always
wrong.

**How to comply.**
- Before adding any arithmetic in `uis/backoffice`, grep
  `packages/business-logic` for a function that covers it. Extend
  the package if it doesn't.
- New public exports go through `packages/business-logic/src/index.ts`
  — importers use the package root, never a deep path.
- Any change to `freight-quote.ts` also updates
  [`.agents/skills/freight-quote-invariants/scripts/verify.mjs`](../skills/freight-quote-invariants/scripts/verify.mjs)
  if the invariants moved.

## MONO-2 — Every workspace has `typecheck`, `test`, `build`

**Scope:** always active. Applies to every workspace declared in the
root `package.json`.

**Rule.** Every workspace under `packages/*` and `uis/*` must expose
these three npm scripts:

- `typecheck` — runs `tsc --noEmit` (or `next build` for Next.js
  apps that type-check as part of build; then `typecheck` is a
  simple `tsc --noEmit -p tsconfig.json`).
- `test` — exits 0 even if the workspace has no tests yet (use
  `node --test` or `next test` when tests exist; use `echo 'no
  tests yet' && exit 0` as a stopgap, with a `TODO(MONO-2)` comment
  in the package.json).
- `build` — produces the deployable artifact (`tsc --build` for
  packages, `next build` for Next.js apps).

The root `package.json` has aggregate scripts (`npm run typecheck`,
`npm run test`, `npm run build`) that fan out to every workspace.
The AGENTS.md pre-commit workflow relies on this being uniform.

**Rationale.** The delivery workflow in AGENTS.md needs a single
command that runs across the whole graph. Missing scripts silently
skip a workspace, which is worse than a loud failure.

**Rationale for the temporary `exit 0`.** Adding a workspace usually
happens before its tests exist. Blocking new workspaces on tests
would make people invent them; blocking new commits on tests would
stall the branch. The `TODO(MONO-2)` marker is grep-able and gates
the workspace's next PR from adding real behaviour without real
tests.

## MONO-3 — Workspace names are `@trackflow/<kebab>`, folders match

**Scope:** always active. Applies to every new workspace.

**Rule.** A new workspace under `packages/` or `uis/` uses the npm
name `@trackflow/<folder-name>`. Folder name and package name are the
same kebab-case slug. `packages/shared` (`@repo/shared-types`) is
grandfathered; do not rename in this milestone, but any new package
follows this rule.

**Rationale.** Grep-ability. Given an import
`@trackflow/business-logic`, any contributor can find the source at
`packages/business-logic/` without opening the workspace map. Given
a folder, the package name is obvious. Names that drift from the
folder they live in create the exact kind of "where does this come
from" question the memory bank is meant to prevent.

**How to comply.**
- New folder under `packages/foo/` → `package.json` `"name":
  "@trackflow/foo"`.
- New folder under `uis/bar/` → `package.json` `"name":
  "@trackflow/bar"`.
- The root workspaces glob (`packages/*`, `uis/*`) picks them up
  automatically — do not hand-edit workspace lists.
