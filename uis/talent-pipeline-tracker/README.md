# TrackFlow · Talent Pipeline Tracker

Milestone 3 — internal People & Talent workspace for **TrackFlow** (see
[`CONTEXT.md`](./CONTEXT.md) for the company scenario). Built with Next.js
App Router, React 19, TypeScript, and Tailwind. Talks to the 4Geeks
Talent Tracker REST API.

## Features

- Candidate list with filters (status, stage) via URL query params and a
  live search by name/email — no full page reloads.
- Candidate detail view with all fields, inline status/stage updates
  (`PATCH`), notes (list / add / delete).
- Register (`POST`) and edit (`PUT`) candidates via validated forms.
- Loading, success, and error states for every async operation.
- No external state libraries — component-level state only.

## Getting started

```bash
cp .env.example .env.local
npm install
npm run dev
```

Then open <http://localhost:3000>.

### Environment variables

| Name                  | Required | Description                        |
| --------------------- | -------- | ---------------------------------- |
| `NEXT_PUBLIC_API_URL` | yes      | Base URL of the Talent Tracker API |

Default: `https://playground.4geeks.com/tracker/api/v1`
(API docs: <https://playground.4geeks.com/tracker/api/v1/docs>).

## Project structure

```
app/
  layout.tsx                     Shell + TrackFlow header
  page.tsx                       Candidate list page
  candidates/
    new/page.tsx                 Register candidate
    [id]/page.tsx                Candidate detail
    [id]/edit/page.tsx           Edit candidate
components/                      UI components (list, form, notes, badges…)
hooks/                           useDebounced
lib/api.ts                       fetch wrapper + ApiError
services/candidates.ts           API service layer
types/index.ts                   Shared TypeScript types + labels
```

## Notes

- Uses only Next.js App Router, React, TypeScript, and Tailwind.
- Terminology in the UI reflects TrackFlow's People & Talent context;
  API field names remain those of the tracker backend.
- Intended to live at `/uis/talent-pipeline-tracker/` inside the course
  monorepo; here it lives at the repository root as a standalone app.
