# 4Geeks coursework audit

Snapshot taken on 2026-08-28 from the signed-in
`miami-ft-ai-engineering-3` program. This file maps portal assignments to the
canonical local project and GitHub submission target. Portal status can change
after instructor review, so re-check the assignment page immediately before
resubmitting.

## Repository policy

- Use this repository as the local archive and working index. Independent
  exercises live under `projects/<slug>` and retain a standalone GitHub mirror
  when 4Geeks expects a repository URL.
- Use
  [`armonon/ai-engineering-company-project-monorepo`](https://github.com/armonon/ai-engineering-company-project-monorepo)
  for every cumulative company milestone. Do not create another company repo.
- The company is **TrackFlow** across all cumulative milestones. Stable
  milestone submission branches are documented in that repository's
  `MILESTONES.md`.
- Do not create guessed Milestone 7 or 8 branches. Their assignment mapping has
  not yet been proven by the portal.

## Ready for review or resubmission

| Assignment | Teacher issue | Corrected target |
| --- | --- | --- |
| A simple Dashboard with Tailwind CSS | Missing 4Geeks template environment | [`projects/influencer-dashboard`](./projects/influencer-dashboard), mirrored at [`armonon/influencer-dashboard`](https://github.com/armonon/influencer-dashboard); template restored and styling is now strictly Tailwind-only |
| Milestone 2 — Building Scripts to Automate Tasks | Submitted outside the required monorepo/company context | [`milestone-2-fold-in`](https://github.com/armonon/ai-engineering-company-project-monorepo/tree/milestone-2-fold-in) |
| Talk to the Machine | Groq key exposed through `NEXT_PUBLIC_GROQ_API_KEY` | [`projects/talk-to-the-machine`](./projects/talk-to-the-machine), mirrored at [`armonon/talk-to-the-machine`](https://github.com/armonon/talk-to-the-machine); requests now use a server-only API route |
| Milestone 3 — Talent Pipeline Tracker | Company differed from earlier milestones | [`milestone-3-talent-pipeline`](https://github.com/armonon/ai-engineering-company-project-monorepo/tree/milestone-3-talent-pipeline) |
| Enhancing development with agent skills | Default branch had rules but no discoverable custom skill | [`projects/financial-dashboard-agent-skills`](./projects/financial-dashboard-agent-skills), mirrored at [`armonon/financial-dashboard-agent-skills`](https://github.com/armonon/financial-dashboard-agent-skills); custom skill is under `.agents/skills/dashboard-metric-card/` |
| Milestone 4 — AI-driven Engineering | Company differed from earlier milestones | [`milestone-4`](https://github.com/armonon/ai-engineering-company-project-monorepo/tree/milestone-4) |
| EduTrack Data Audit | Submitted ahead of cohort pace | [`projects/edutrack-data-audit`](./projects/edutrack-data-audit), mirrored at [`armonon/edutrack-data-audit`](https://github.com/armonon/edutrack-data-audit) |
| EduTrack Data Audit — Related Tables | Submitted ahead of cohort pace | [`projects/edutrack-related-tables`](./projects/edutrack-related-tables), mirrored at [`armonon/edutrack-related-tables`](https://github.com/armonon/edutrack-related-tables) |

## Requires the student's real interaction or evidence

These cannot be truthfully completed by editing repository files alone.

| Assignment | Remaining requirement |
| --- | --- |
| Command Line Challenge | Complete the interactive terminal challenge. The portal shows `Rejected` but provides no written teacher correction. |
| Setting Up Your Personal AI Agent with OpenClaw | Perform the VPS, SSH, LiteLLM, local-chat, personalization, and push-from-VPS steps. The submitted repository URL was rejected. A public repository alone does not prove these actions. |
| Connect Your Agent: Telegram, Google Drive & Calendar | Configure the test accounts and integrations, run the real workflow, and capture evidence without exposing credentials. The portal currently shows 0/25 tasks. |

## Completed in code; portal records unchanged

These deliverables were completed during the repository remediation. No portal
assignment was submitted or resubmitted.

| Assignment | Completed target |
| --- | --- |
| Todo List CLI with Python | [`projects/todo-list-cli-python`](./projects/todo-list-cli-python), mirrored at [`armonon/todo-list-cli-python`](https://github.com/armonon/todo-list-cli-python); required functions, CSV persistence, menu, and seven tests |
| Milestone 5 — Backoffice: Inventory Management Interface | [`milestone-5-inventory-backoffice`](https://github.com/armonon/ai-engineering-company-project-monorepo/tree/milestone-5-inventory-backoffice), merged by [PR #19](https://github.com/armonon/ai-engineering-company-project-monorepo/pull/19) |
| Company Monorepo Containerization | TrackFlow `main`, merged by [PR #20](https://github.com/armonon/ai-engineering-company-project-monorepo/pull/20); Docker execution still requires a machine with Docker installed |

## Built but waiting for cohort timing

The instructor feedback on these submissions says they were delivered ahead of
the current cohort pace. Preserve the code and resubmit only when the class
reaches the assignment.

| Assignment | Existing target |
| --- | --- |
| My first collaborative professional project | [`projects/maison-lumiere-ecommerce`](./projects/maison-lumiere-ecommerce); each required view now has a preserved feature branch and merged PR, documented in the project README |
| My 4Geeks Assistant — Teaching OpenClaw to Track Your Progress | [`armonon/openclaw-setup-armonon`](https://github.com/armonon/openclaw-setup-armonon) |
| Backend Architecture Proposal | [`milestone-5-strengthening`](https://github.com/armonon/ai-engineering-company-project-monorepo/tree/milestone-5-strengthening) |
| Voice Command API | [`armonon/voice-command-api`](https://github.com/armonon/voice-command-api) |
| Company Incident File Analyzer | [`milestone-6-incident-analyzer`](https://github.com/armonon/ai-engineering-company-project-monorepo/tree/milestone-6-incident-analyzer) |
| AI basic Inventory Agent Loop | [`armonon/inventory-agent-loop`](https://github.com/armonon/inventory-agent-loop) |
| Supplier Directory — Lightweight Storage API | [`milestone-9-supplier-directory`](https://github.com/armonon/ai-engineering-company-project-monorepo/tree/milestone-9-supplier-directory) |
| Securing the API | Cumulative implementation on the company monorepo `main` branch |
| Authentication Flows in the Frontend | Cumulative implementation on the company monorepo `main` branch |
| Password Reset Flow | Cumulative implementation on the company monorepo `main` branch |
| Error Handling | Cumulative implementation on the company monorepo `main` branch |
| Building Bullet-Proof Applications | Cumulative implementation on the company monorepo `main` branch |

## Verified quality gates

- TrackFlow milestone branch audit: no errors.
- TrackFlow workspace typecheck: passed for all six npm workspaces.
- TrackFlow JavaScript/TypeScript tests: 69 passed.
- TrackFlow FastAPI tests: 318 passed.
- TrackFlow production builds: website, backoffice, and talent tracker passed.
- Talk to the Machine: lint and production build passed; local page returned
  HTTP 200 and the server-only API route returned a controlled missing-key
  response without exposing a client key.
- Financial dashboard: production build and all five current tests passed;
  `dashboard-metric-card` passed the skill validator.
- Todo List CLI: all seven standard-library unit tests passed.
- Maison Lumiere storefront: all five page-specific PRs passed the production
  Tailwind build; the work remains honestly identified as single-contributor.
- TrackFlow containerization: Compose YAML, shell syntax, required files, and
  Python dependency resolution passed static checks. Docker was unavailable
  locally, so no live container run is claimed.
