# Brief — TrackFlow Warehouse Agent

**Project:** an OpenClaw agent that operates the `/inventory` API
**Prerequisite:** Milestone 5 (inventory + dual database) merged to `main`
**Scenario:** TrackFlow — last-mile delivery and warehousing, Los Angeles and Zaragoza

**Context authority:** for this agent, `CONTEXT.md` supplies shared TrackFlow
rules and `docs/CONTEXT-inventory-trackflow.md` supplies the scoped inventory
API, seed data, and `LA` / `ZGZ` facility geography.

---

## The situation

The inventory API went live last milestone. Stock is computed from
movements, exits that would go negative are rejected, and every movement
records who created it. The data is trustworthy for the first time.

Nobody on the warehouse floor uses it.

The backoffice is a desktop web app. A warehouse operative in Los
Angeles is holding a scanner and a pallet, and the question they need
answered — *"how many of these do we actually have here?"* — takes six
clicks and a login they do not have on that device. So they ask a
colleague, who checks the old spreadsheet, which is wrong.

## Brief from your tech lead

> **From: Andrés Kim (CTO) — Linear ticket TRK-0388**
>
> "The API is correct and nobody touches it. I want an agent the floor
> team can talk to — 'how many CLT-SNK-W-42 in LA', 'log a receipt of 60
> against PO-2024-0098', 'dispatch 12 with tracking 1Z999…'.
>
> It calls the same `/inventory` endpoints the backoffice does. It gets
> no special privileges and no direct database access — if the API says
> insufficient stock, the agent says insufficient stock.
>
> One thing I care about more than the feature: this agent can dispatch
> physical goods. Reads are free. Every write gets confirmed with the
> numbers read back first. I would rather it be slightly annoying than
> ship a pallet twice."

---

## What you need to build

### The agent

An OpenClaw agent whose public, submission-safe workspace files live in
`.openclaw/`, and which talks to the TrackFlow inventory API as an
authenticated user. Local credentials, memory, and runtime state remain
ignored even though the public agent contract is versioned.

It should handle, in plain language:

| The operative says | The agent does |
|---|---|
| "how many white sneakers do we have in LA" | resolves the SKU, reads stock for that warehouse |
| "what's low in Zaragoza" | lists SKUs at or near zero for ZGZ |
| "receipt of 60 against PO-2024-0098" | confirms, then registers a `StockEntry` |
| "dispatch 12, tracking 1Z999AA10123456784" | confirms, then registers a `StockExit` |
| "we're 3 short on the serum, write them off" | confirms, then registers a `loss` |
| "what moved today" | reads the movement feed |

### Skills

At least two, each with a `SKILL.md` that states its trigger, the
endpoints it touches, and what it refuses to do:

- **`stock-check`** — read-only. Resolves a partial description or SKU
  code to a real SKU, and reports stock for the right warehouse.
- **`log-movement`** — the write path. Registers receipts, dispatches
  and losses, with confirmation.

A third is optional: **`discrepancy-report`** — compares what the
operative counted against what the system says, and drafts the loss
entries without registering them.

---

## Hard constraints

These are the point of the project. An agent that can move stock and
does it eagerly is worse than no agent.

1. **Reads are free. Writes are confirmed.** Before any `POST`, the
   agent restates what it is about to do — SKU code, quantity,
   warehouse, movement type — and waits for a yes. "Log 60" is not
   consent to log 600.

2. **Never invent a SKU code.** If the operative says "the white
   sneakers", the agent looks up candidates and asks which one. Two
   warehouses hold the same product under different codes
   (`CLT-SNK-W-42` in LA, `CLT-SNK-W-42-Z` in Zaragoza) and guessing
   puts stock in the wrong building.

3. **Never retry a failed write.** A timeout is not a failure — the
   movement may have been recorded. The agent reports what happened and
   asks; it does not resend. A double-registered dispatch is a pallet
   that ships twice.

4. **The API's refusal is final.** If a dispatch is rejected for
   insufficient stock, the agent relays the message. It does not
   register a receipt to make room, split the dispatch, or try the other
   warehouse.

5. **Every movement carries the operative.** The agent authenticates as
   a real user; `user_uuid` on the record is that person, not a shared
   service account. Traceability is the reason the field exists.

6. **Never state a stock figure it did not read.** No estimating from
   an earlier turn in the conversation. Stock changes while you talk.

---

## Deliverables

```
.openclaw/
├── IDENTITY.md          the agent's name and role
├── AGENTS.md            the six constraints above, as hard limits
├── TOOLS.md             the inventory API: base URL, auth, endpoints
└── skills/
    ├── stock-check/SKILL.md
    └── log-movement/SKILL.md
README.md                how to run it against a live API
TRANSCRIPT.md            a real session, unedited
```

`TRANSCRIPT.md` is the part that proves it works. It must show, with
real output:

- a stock question answered correctly
- a receipt registered, and the stock figure moving by exactly that much
- **a dispatch the agent refuses** because stock is insufficient, with
  the API's own message
- **a confirmation the operative declines**, and nothing written
- an ambiguous SKU that the agent disambiguates rather than guesses

---

## How this will be judged

- The agent calls the real API. No mocked responses, no direct database
  access, no privileges the backoffice does not have.
- Every write is preceded by a confirmation that restates the numbers.
- The refusal cases in the transcript are real — the API rejected them,
  the agent did not simulate a rejection.
- `AGENTS.md` states the constraints as limits, not suggestions.
- Skills declare what they will not do, not only what they will.
- Nothing in the repo contains a credential. The API token is read from
  the environment.

---

## Where to start

1. Get the inventory API running with a seeded database
   (`uv run seed-inventory` — six SKUs across both warehouses).
2. Register an operative account and confirm you can call
   `GET /inventory/products` with its token.
3. Write `AGENTS.md` **first**. The constraints shape every skill that
   follows; retrofitting them is how they get watered down.
4. Build `stock-check` before `log-movement`. Reading is safe, and the
   SKU-resolution problem is the same in both.
