# Progress Log

Rolling record of substantive changes across sessions. Newest entry first.

---

## 2026-08-02 — Agent-skills session (`feature/agent-skills`)

Goal: raise the bar on accessibility and deployment best practices
using externally-authored agent skills.

### Skills loaded (all under `.agents/skills/`)

- `addyosmani/web-quality-skills@accessibility` — WCAG 2.2 audit rules.
- `vercel-labs/agent-skills@vercel-react-best-practices` — 70 React
  performance rules from Vercel Engineering.
- `anthropics/skills@webapp-testing` — Playwright-based end-to-end
  testing harness (installed, not yet invoked; see rationale in
  `docs/skills-report.md`).

### Changes made (every one traceable to a specific skill instruction)

- **Accessibility fixes** across the whole frontend: skip-to-main link,
  h2 landmarks, `role="alert"` on the error banner, aria-live loading
  region, decorative-icon `aria-hidden`, aria-labelledby wiring on KPI
  cards, chart figures with sr-only captions, `:focus-visible` ring,
  reduced-motion honouring, informative `<title>` + meta description.
  Files: `frontend/src/App.tsx`,
  `frontend/src/components/dashboard/{dashboard-header,kpi-card,income-outcome-chart,profit-percent-chart}.tsx`,
  `frontend/src/components/ui/skeleton.tsx`,
  `frontend/index.html`, `frontend/src/index.css`.
- **React perf**: derived state moved from `useState`+effects to
  `useMemo` in `App.tsx`; both chart components lazy-loaded via
  `React.lazy` + `Suspense`. Initial JS bundle: **586 kB → 189 kB**
  (gzip **176 → 60 kB**); Recharts split into its own 342 kB async
  chunk.
- **Small correctness win** collateral to the a11y work: `App.tsx`
  now uses an `AbortController` to avoid a stale-response race and
  logs the original fetch error before mapping it to a user message.

### Custom skill authored

`./.skills/dashboard-metric-card/SKILL.md` — end-to-end procedure to
add or modify a KPI card. Codifies conventions we've had to explain
verbally in past reviews (formatter usage, badge variants, aria
inheritance, test coverage requirement). Short and specific by design.

### Explicitly not done this session

- Full Playwright harness on top of the a11y changes (deferred; the
  `webapp-testing` skill is loaded for the next branch).
- Refactoring backend Python — the skills applied were frontend-only.
- Any change unrelated to a loaded skill.

### Verification

- `npm run build` passes with reduced initial bundle.
- Existing `financial-utils.test.ts` Vitest suite still passes.
- Backend was not modified; its `pytest` suite is unaffected.

---

*Older progress before this branch lived in the prior session's
`docs/` and `memory-bank/` snapshot. Nothing there was superseded.*
