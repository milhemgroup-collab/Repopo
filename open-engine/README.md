# Open Engine

**The ticket is the state manager.**

Open Engine is an open-source coordination layer for multi-agent work. It removes
the human copy-paste bottleneck between AI tools (Claude, Claude Code, ChatGPT,
Codex, Cursor, Gemini, and future agents) by making the **work ticket** — not chat
history, not a Slack thread, not a transient prompt — the durable source of truth.

> **Prompts are not tasks.** A valid task is a structured statement of work with
> enough context, constraints, acceptance criteria, execution history, and receipts
> for any capable agent to pick it up and continue.

This repository is a working MVP: a local-first TypeScript engine with a SQLite
state store, a ticket state machine, an audit log, mandatory work receipts, a
delegation engine, a CLI, and swappable adapters for queues and agent runners.

---

## Why

Today, moving work between AI tools means a human copies output from one chat and
pastes it as the prompt for the next. Context is lost, there is no audit trail, and
nothing enforces that the work is actually *done*. Open Engine replaces that with a
structured ticket that carries its own state:

- a human (or agent) creates a **structured task**,
- an agent **claims** it safely (atomic lock, no double-work),
- the agent **executes locally** and **logs progress**,
- if it is blocked, it **asks a precise question** instead of guessing,
- it can **delegate** a sub-task to a specialized agent,
- every step writes to a durable **audit trail**,
- and the ticket closes only when a **Definition of Done** is satisfied and a
  **work receipt** exists.

---

## Architecture

Everything is an injected, swappable interface. The engine owns the lifecycle; the
collaborators own their concerns.

| Interface | Reference implementation | Responsibility |
|---|---|---|
| `QueueAdapter` | `LocalQueueAdapter` (SQLite) | durable tickets + **atomic** claim/release |
| `AgentRunner` | `MockAgentRunner` | execute a claimed ticket, report an outcome |
| `StateMachine` | `StateMachine` | the single authority on legal transitions + guards |
| `ReceiptGenerator` | `DefaultReceiptGenerator` | build + validate mandatory work receipts |
| `DelegationEngine` | `DefaultDelegationEngine` | spawn child tickets, wire parent/child, wait/continue |
| `TaskSpecValidator` | `DefaultTaskSpecValidator` | enforce "prompts are not tasks" |
| `AuditLogger` | `SqliteAuditLogger` | append-only event history |

Optional provider adapters — `LinearQueueAdapter` and `JiraQueueAdapter` — implement
the same `QueueAdapter` contract. They run in **dry-run** mode (local store + logged
API calls) whenever no API key is present, so Open Engine works with **zero external
credentials**.

### Zero native dependencies

State is stored via Node's built-in `node:sqlite` (Node ≥ 22.5), so there is no
native module to compile.

---

## Ticket lifecycle

```text
agent-instructions ──validate──▶ agent-to-do ──claim──▶ agent-working ──complete──▶ agent-done
                                     ▲                        │
                                     │                        ├── raise-blocker ─▶ needs-input ──answer──▶ agent-to-do
                                     │                        │
                          delegate-continue                   ├── fail ─▶ agent-failed
                                     │                        │
                                     └────────────────────────┘

Delegation:  agent-working ─▶ child ticket(s) created ─▶ parent waits (needs-input) or continues (agent-to-do)
```

Guards enforced by the state machine and engine:

- a ticket leaves `agent-instructions` **only after validation**,
- a ticket reaches `agent-done` **only with a work receipt**,
- a ticket enters `needs-input` **only with an open blocker question**,
- a ticket is claimed **atomically** — two agents never work the same ticket.

Every transition and side effect writes an `AuditEvent`
(`ticket.created`, `ticket.validated`, `ticket.claimed`, `agent.heartbeat`,
`progress.logged`, `blocker.raised`, `input.received`, `child.created`,
`receipt.generated`, `ticket.completed`, `ticket.failed`, …).

---

## Quick start

Requires **Node.js ≥ 22.5** (for the built-in `node:sqlite`).

Open Engine is not published to npm yet, so install it from this repo. From the
`open-engine/` directory:

```bash
npm install
npm run build
npm link          # puts `open-engine` on your PATH

open-engine doctor   # confirm the install is healthy
open-engine new      # guided wizard: answer questions, get a valid ticket
```

`open-engine new` interviews you (objective, done-criteria, acceptance tests, …)
and assembles a **valid** ticket for you — you never hand-write JSON or memorise
the required fields. It can also save the spec to a file to re-use or edit.

Undo the global link at any time with `npm unlink -g open-engine`.

### Without linking

```bash
npm run engine -- doctor   # run the CLI via tsx, no build needed
node dist/cli.js doctor    # or the compiled binary after `npm run build`
```

### Once published to npm

After `npm publish`, no clone or build is needed at all:

```bash
npx open-engine new
```

### Development

```bash
npm test          # 35 tests: validation, state machine, lifecycle, claims, delegation, adapters, wizard, doctor
npm run typecheck
```

### CLI walkthrough

```bash
# 0. Not sure it's installed right? Ask it.
open-engine doctor

# 1. Easiest: the guided wizard builds + submits a ticket for you.
open-engine new

# 2. Or submit a structured statement of work from a file (a bare prompt is rejected).
open-engine submit -f examples/health-endpoint.json

# 3. See the queue.
open-engine list

# 4. Let an agent claim + run the next available ticket (mock runner).
open-engine work

# 5. Inspect the ticket and its audit trail.
open-engine show <ticketId>
open-engine history <ticketId>

# If a run raised a blocker:
open-engine answer <ticketId> <questionId> "OAuth2, per the security doc"
```

> Using a clone instead of an installed binary? Prefix commands with
> `npm run engine --` (e.g. `npm run engine -- list`).

`examples/health-endpoint.json` is a fully-formed spec; `examples/underspecified.json`
is a bare prompt that the validator refuses (exit code 2).

---

## Library usage

```ts
import { Engine, MockAgentRunner } from 'open-engine';

const engine = new Engine({ dbPath: '.open-engine/engine.db' });
engine.registerRunner(new MockAgentRunner({ id: 'coder', capabilities: ['code'] }));

const { ticket, validation } = engine.submit({
  objective: 'Add a /health endpoint',
  requiredCapability: ['code'],
  definitionOfDone: ['GET /health returns 200 {status:"ok"}'],
  acceptanceTests: ['curl localhost/health returns 200'],
});

if (validation.valid) {
  const result = await engine.runTicket(ticket.id);
  // result.status === 'done' | 'blocked' | 'failed' | 'delegated'
}
```

### Writing a real runner

Implement `AgentRunner.run(ticket, ctx)` and return a `RunResult`:

- `{ outcome: 'done', receipt }` — completes the ticket (receipt is validated).
- `{ outcome: 'blocked', blockers }` — moves it to `needs-input` with your questions.
- `{ outcome: 'delegated', delegations }` — spawns specialized child tickets.
- `{ outcome: 'failed', error }` — moves it to `agent-failed`.

Use `ctx.logProgress(...)` and `ctx.heartbeat()` during long runs; heartbeats renew
the claim lease so an abandoned run can be safely reclaimed by another agent.

---

## Project layout

```
open-engine/
├── src/
│   ├── types.ts             # Ticket, TaskSpec, WorkReceipt, AuditEvent, states
│   ├── validator.ts         # TaskSpecValidator — "prompts are not tasks"
│   ├── state-machine.ts     # StateMachine — legal transitions + guards
│   ├── receipt.ts           # ReceiptGenerator — mandatory work receipts
│   ├── audit.ts             # AuditLogger — append-only event log
│   ├── delegation.ts        # DelegationEngine — child tickets + handoffs
│   ├── engine.ts            # Engine — orchestration core
│   ├── db.ts                # node:sqlite store (no native deps)
│   ├── cli.ts               # Commander CLI
│   ├── wizard.ts            # interactive "new task" wizard (no hand-written JSON)
│   ├── doctor.ts            # `doctor` self-diagnosis: is this install working?
│   ├── adapters/            # QueueAdapter: local + Linear/Jira (dry-run)
│   └── runners/             # AgentRunner: interface + mock
├── test/                    # Vitest suite
└── examples/                # sample specs
```

## License

MIT.
