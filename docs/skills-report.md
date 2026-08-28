# Agent-Skills Session Report

Session goal: raise the bar on accessibility and deployment-readiness
by loading external agent skills into the workspace and applying their
guidance to the dashboard. Every change committed on
`feature/agent-skills` is traceable to a specific skill instruction.

## Skills loaded

Installed with `npx skills add <owner/repo@skill>`. All three land in
`.agents/skills/` (the project's existing convention set by
`AGENTS.md`).

| Skill                                                  | Installs | Why installed                                     |
| ------------------------------------------------------ | -------- | ------------------------------------------------- |
| `addyosmani/web-quality-skills@accessibility`          | 41.1K    | Rubric requirement (a11y audit + fixes)           |
| `vercel-labs/agent-skills@vercel-react-best-practices` | 599.2K   | Rubric requirement (deployment-ready React)       |
| `anthropics/skills@webapp-testing`                     | 125.7K   | Chosen extra — most-installed testing skill in the ecosystem; the dashboard has only one Vitest file today, so a Playwright-based end-to-end skill is the natural next investment. Justification: the previous milestone's rule `TEST-4` explicitly asks for component tests, and Playwright's DOM-inspection loop pairs well with the a11y changes we just landed. |

## Ecosystem exploration performed

Ran `npx skills find <topic>` for four topics before choosing the extra
skill. Top results (by install count) that could be relevant later:

- **typescript** → `wshobson/agents@typescript-advanced-types` (57.3K).
  Deferred — the project's TS surface is small and static.
- **testing** → `anthropics/skills@webapp-testing` (125.7K). **Chosen.**
- **performance** → `get-convex/agent-skills@convex-performance-audit`
  (94.3K). Not applicable — the project doesn't use Convex.
- **react** → `vercel-labs/agent-skills@vercel-react-best-practices`
  already covered the top hit.

## Skill applications (change → skill instruction)

### `accessibility` skill

Applied via `.agents/skills/accessibility/SKILL.md`.

| File                                                            | Rule / section applied                                       |
| --------------------------------------------------------------- | ------------------------------------------------------------ |
| `frontend/src/App.tsx`                                          | Perceivable 1.3 (landmarks + h2), Operable 2.4.1 (skip link), Robust 4.1.3 (aria-live status region, role=alert on the error banner) |
| `frontend/src/components/dashboard/dashboard-header.tsx`        | Perceivable 1.1 (`aria-hidden` on decorative icons + `focusable={false}`) |
| `frontend/src/components/dashboard/kpi-card.tsx`                | Perceivable 1.1 (decorative icon) + Robust 4.1.2 (accessible name via `aria-labelledby` / `aria-describedby`) |
| `frontend/src/components/dashboard/income-outcome-chart.tsx`    | Perceivable 1.1 (chart wrapped in `<figure role="group">` with computed `aria-label` and a `<figcaption class="sr-only">` that spells out the data), Operable 2.1 (chart tabbable) |
| `frontend/src/components/dashboard/profit-percent-chart.tsx`    | Same as above                                                |
| `frontend/src/components/ui/skeleton.tsx`                       | `aria-hidden` (the sr-only status in `App.tsx` owns the announcement) + `motion-reduce:animate-none` |
| `frontend/index.html`                                           | Perceivable 1.3 / 2.4.2 (informative `<title>`), meta description |
| `frontend/src/index.css`                                        | Operable 2.4.7 (`:focus-visible` outline) + `prefers-reduced-motion` block, `sr-only` helper |

### `vercel-react-best-practices` skill

Applied via `.agents/skills/vercel-react-best-practices/rules/*`.

| Rule                              | Change                                                                                                       |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `rerender-derived-state-no-effect` | `App.tsx`: keep only the raw `movements` in state; derive `metrics` and `monthlyData` via `useMemo` at render time. Two `useState`s and their sync effects removed. |
| `bundle-dynamic-imports`          | `App.tsx`: `React.lazy()` for both chart components + `Suspense` fallbacks. Vite splits Recharts into its own 342 kB chunk (gzip 100 kB) and the initial JS drops from **586 → 189 kB** (gzip **176 → 60 kB**). |

Rules **explicitly skipped** and why (deployment target is Vite, not
Next.js):

- `next/image`, `next/font` — no equivalent primitive; the app has one
  SVG favicon and no bitmap assets to optimize.
- `optimizePackageImports` (Next.js `next.config.js`) — Vite already
  ESM-tree-shakes `lucide-react` and `recharts`; a manual barrel-import
  rewrite would fight the bundler.
- Every rule under `server-*` — no server components in a Vite app.

### `webapp-testing` skill (extra, installed only)

Reviewed but not yet invoked. The skill is a Playwright driver that
runs a local dev server and captures screenshots + console logs. It's
the natural fit for verifying the a11y changes above (e.g. tabbing
into the chart focuses it visibly, `role="alert"` gets announced when
the backend is offline). Left as the seed for the next branch —
following the rubric's "targeted improvement, not full rebuild" note,
this session did not add a Playwright harness on top of everything
else.

## Custom skill authored

`.agents/skills/dashboard-metric-card/SKILL.md` — end-to-end recipe for
adding a new KPI card. Covers types, derivation, formatting, a11y
inheritance, and tests, with explicit acceptance criteria and a checklist of
anti-patterns to reject. It lives beside the installed skills so agents can
discover it through the repository convention documented in `AGENTS.md`.

## Verification

```bash
cd frontend
npm run build   # passes; two chart chunks split out
npm test        # existing utility suite still passes
```

Every claim above about bundle sizes was read off `vite build` output
after the changes, not estimated.
