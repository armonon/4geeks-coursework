# OpenClaw coursework agent

This repository is the workspace for the dedicated `4geeks-coursework`
OpenClaw agent. Workspace instructions live at the repository root so they
are loaded directly by current OpenClaw versions.

## Register the agent

From this repository root:

```bash
openclaw agents add 4geeks-coursework --workspace "$(pwd)" --non-interactive
openclaw agents set-identity --agent 4geeks-coursework --from-identity
openclaw config set gateway.mode local
openclaw config set gateway.port 18790 --strict-json
openclaw doctor --generate-gateway-token --non-interactive --yes
openclaw gateway install
openclaw gateway start
openclaw models --agent 4geeks-coursework auth login --provider openai
openclaw agents list --bindings
openclaw doctor --lint
```

This Mac uses local port `18790` because `18789` is already assigned to a
gateway owned by a different macOS account. The coursework gateway remains
loopback-only and is not exposed to the network.

Do not bind a public messaging channel until the agent has passed the
repository audit and its GitHub write confirmation rule has been tested.

The model-login command is interactive and stores provider credentials in
OpenClaw's private state directory, never in this repository.

## Enable read-only 4Geeks status checks

```bash
cp .env.example .env
# Edit .env locally and replace the placeholder token.
node scripts/verify-4geeks-session.mjs
```

The `.env`, `USER.md`, `MEMORY.md`, and `memory/` paths are ignored so
credentials and personal memory do not enter this public repository.

## First prompt

```text
Audit the milestone branches, report missing or dirty work, and tell me
which branch should receive my next 4Geeks assignment. Do not write to
GitHub or the 4Geeks platform.
```
