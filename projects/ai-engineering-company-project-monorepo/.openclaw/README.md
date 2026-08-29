# Public warehouse-agent workspace

This directory is reserved for the version-controlled deliverables in
`docs/BRIEF-warehouse-agent.md`.

Only the public agent contract belongs here:

- `IDENTITY.md`, `AGENTS.md`, and `TOOLS.md`
- `skills/*/SKILL.md` and their non-secret support files
- `TRANSCRIPT.md` after a real, authenticated acceptance session

The root `.gitignore` denies every other `.openclaw/` path by default. Never
force-add credentials, tokens, local memory, session databases, generated
state, or an edited/fabricated transcript. The transcript is created only
when the real inventory API and an operative account are available.

The existing `4geeks-coursework` OpenClaw agent uses the repository root as
its workspace. The warehouse agent will be registered separately with this
directory as its workspace when implementation begins, keeping coursework
coordination and inventory-write authority isolated.
