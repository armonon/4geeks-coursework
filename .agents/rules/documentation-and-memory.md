# documentation-and-memory

Scope: `docs/`, `memory-bank/`, `.agents/`, top-level `README*.md`.

## DOC-1 — `memory-bank/` reflects reality, not intent

Files under `memory-bank/` (`product.md`, `tech-stack.md`,
`current-status.md`) must describe what is *in the repo now*. When a
feature is added or removed:

1. Update the relevant `memory-bank/*.md` file in the same PR.
2. If the change invalidates a claim in `docs/repo-summary.md`, update
   that too.

A PR that changes runtime behavior without updating `memory-bank/` is
incomplete.

## DOC-2 — Every claim in `docs/*` cites a file

`docs/repo-summary.md` and `docs/engineering-practices.md` cite file
paths (and line numbers where useful) for every non-obvious statement.
New documentation must follow the same pattern; unverifiable claims are
worse than absent ones because they mislead the next agent.

## DOC-3 — Rules are living; edit before working around

If a rule under `.agents/rules/` blocks a legitimate change, edit the
rule (with the reason in the commit) rather than ignoring it. Rules
must not accumulate silent exceptions.

## DOC-4 — Match language to surface

- `.agents/`, `docs/`, and `memory-bank/` are in English (they document
  code that is already in English).
- User-facing UI copy currently mixes English and Spanish; when adding
  copy, match the language already used in the sibling component
  (see FE-2 for the same rule at the code level).
- `README.md` and `README.es.md` mirror each other; changes to one
  should be reflected in the other in the same PR.
