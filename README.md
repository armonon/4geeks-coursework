# 4Geeks Coursework

This monorepo collects coursework completed for 4Geeks Academy. Each project remains self-contained under `projects/` with its original files and Git history preserved.

## Repository map

| Project | Area | Imported branch | Original repository |
| --- | --- | --- | --- |
| `4geeks` | Foundations archive | `main` | [armonon/4geeks](https://github.com/armonon/4geeks) |
| `4geeksproject` | JavaScript foundations | `copilot/add-excuse-generator` | [armonon/4geeksproject](https://github.com/armonon/4geeksproject) |
| `4geeks-company-proj` | AI Engineering template | `main` | [armonon/4geeks-company-proj](https://github.com/armonon/4geeks-company-proj) |
| `excuses-generator-with-prompts` | JavaScript foundations | `main` | [armonon/excuses-generator-with-prompts](https://github.com/armonon/excuses-generator-with-prompts) |
| `exercise-postcard` | HTML and CSS foundations | `main` | [armonon/exercise-postcard](https://github.com/armonon/exercise-postcard) |
| `prokect1` | HTML and CSS | `main` | [armonon/prokect1](https://github.com/armonon/prokect1) |
| `healthcore-public-website` | Milestone 1 | `main` | [armonon/healthcore-public-website](https://github.com/armonon/healthcore-public-website) |
| `influencer-dashboard` | HTML and Tailwind CSS | `main` | [armonon/influencer-dashboard](https://github.com/armonon/influencer-dashboard) |
| `agenthub-admin-panel` | HTML and Tailwind CSS | `main` | [armonon/agenthub-admin-panel](https://github.com/armonon/agenthub-admin-panel) |
| `cinema-seat-manager` | TypeScript fundamentals | `main` | [armonon/cinema-seat-manager](https://github.com/armonon/cinema-seat-manager) |
| `edutrack-data-audit` | SQL data auditing | `main` | [armonon/edutrack-data-audit](https://github.com/armonon/edutrack-data-audit) |
| `edutrack-related-tables` | Relational SQL and JOINs | `main` | [armonon/edutrack-related-tables](https://github.com/armonon/edutrack-related-tables) |
| `maison-lumiere-ecommerce` | Milestone 1 | `main` | [armonon/maison-lumiere-ecommerce](https://github.com/armonon/maison-lumiere-ecommerce) |
| `maison-lumiere-data-utilities` | Milestone 2 | `main` | [armonon/maison-lumiere-data-utilities](https://github.com/armonon/maison-lumiere-data-utilities) |
| `airbnb-ui-clone` | Next.js and Tailwind CSS | `main` | [armonon/airbnb-ui-clone](https://github.com/armonon/airbnb-ui-clone) |
| `nextjs-wanderlust-explorer` | Next.js and TypeScript | `main` | [armonon/nextjs-wanderlust-explorer](https://github.com/armonon/nextjs-wanderlust-explorer) |
| `talk-to-the-machine` | AI chat application | `main` | [armonon/talk-to-the-machine](https://github.com/armonon/talk-to-the-machine) |
| `talent-pipeline-tracker` | Milestone 3 | `main` | [armonon/talent-pipeline-tracker](https://github.com/armonon/talent-pipeline-tracker) |
| `ai-engineering-company-project-monorepo` | Milestone 4 | `milestone-4` | [armonon/ai-engineering-company-project-monorepo](https://github.com/armonon/ai-engineering-company-project-monorepo) |
| `ai-eng-financial-dashboard-context-project` | Context engineering | `main` | [armonon/ai-eng-financial-dashboard-context-project](https://github.com/armonon/ai-eng-financial-dashboard-context-project) |
| `frontend-specs-financial-dashboard` | Spec-driven development | `feature/frontend-specs` | [armonon/frontend-specs-financial-dashboard](https://github.com/armonon/frontend-specs-financial-dashboard) |
| `financial-dashboard-agent-skills` | Agent skills | `feature/agent-skills` | [armonon/financial-dashboard-agent-skills](https://github.com/armonon/financial-dashboard-agent-skills) |
| `exercise-terminal-challenge-slides` | Course reference | `master` | [armonon/exercise-terminal-challenge-slides](https://github.com/armonon/exercise-terminal-challenge-slides) |

## Working with a project

Open the project directory and follow its own README. Projects keep their original package files, development commands, and environment requirements; there is intentionally no shared root build command.

```bash
cd projects/influencer-dashboard
python3 server.py
```

## Canonical development workflow

Use this monorepo as the working home for future 4Geeks coursework. Start each change from `main`, use a focused branch such as `codex/<project>-<change>`, and keep changes inside that project's directory under `projects/`.

The standalone repositories remain available as submission snapshots and history sources. Do not delete them while a project is awaiting grading or resubmission.

The two EduTrack imports also have source-specific monorepo branches:

- `codex/import-edutrack-data-audit`
- `codex/import-edutrack-related-tables`

## History and source repositories

Projects were imported with `git subtree` without squashing, so their original commit histories are reachable from this repository. The source repositories remain independent and unchanged.

The private `digital-wallet-class-diagram` repository is intentionally excluded from this public monorepo.
