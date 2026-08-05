# Repository Rules

These rules govern how new work should be added to this repository. They
were derived from a full audit of the existing code (see
[`docs/engineering-practices.md`](../../docs/engineering-practices.md))
and each one is written against a concrete file that exists in the tree
today.

## How to use

- Read every rule file below before non-trivial changes.
- Cite the rule id (e.g. `BE-1`) in commit messages and PR descriptions
  when it applies.
- If a rule blocks a legitimate change, update the rule (and note the
  reason) rather than working around it silently.

## Files

| File                                        | Scope                                   |
| ------------------------------------------- | --------------------------------------- |
| [`backend-structure.md`](./backend-structure.md)         | How `backend/app/*` is organized        |
| [`api-contract.md`](./api-contract.md)                   | Backend / frontend contract discipline  |
| [`security-baseline.md`](./security-baseline.md)         | CORS, secrets, container hardening      |
| [`frontend-data-fetching.md`](./frontend-data-fetching.md) | React data-fetching and error UX      |
| [`testing-and-fixtures.md`](./testing-and-fixtures.md)   | pytest / vitest expectations            |
| [`tooling-and-ci.md`](./tooling-and-ci.md)               | Linting, formatting, Docker, CI         |
| [`documentation-and-memory.md`](./documentation-and-memory.md) | Keeping `memory-bank/` and docs true |
