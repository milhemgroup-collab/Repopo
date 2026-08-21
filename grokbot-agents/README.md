# GrokBot Fleet: Four-Agent Build Packet

Build instructions for four GrokBot agents that hang off an existing Chief of
Staff bot, derived from the research dossier
*"Build-Spec Research Dossier: Four GrokBot Agents"* (compiled 2026-08-21).

| # | Bot name | Job | Sends / acts externally? |
|---|---|---|---|
| 1 | `Inbox` | Trashes junk mail, drafts replies | Trash + drafts, never sends |
| 2 | `Filings` | Public-source research, SEC EDGAR weighted | Never |
| 3 | `Logbook` | Bot activity log to Google Sheets | Writes one spreadsheet only |
| 4 | `Subscriptions` | Recurring-charge inventory and cancel packets | Never cancels |

## Files

- `MASTER-PROMPT.md` — the single prompt to paste into the Chief of Staff bot
- `chief-of-staff-addendum.md` — profile text to add to the Chief of Staff bot
- `agent-1-inbox-manager.md` — field-by-field build spec
- `agent-2-research-analyst.md` — field-by-field build spec
- `agent-3-work-logger.md` — field-by-field build spec
- `agent-4-subscription-auditor.md` — field-by-field build spec

Each agent file is self-contained: name, title, the verbatim description
(custom instructions), connectors, skills, routines, approval rules, test
plan, and known failure modes.

## Can the Chief of Staff build the other three... er, four bots for you?

**Partly. Plan for a hybrid.** Paste `MASTER-PROMPT.md` and the Chief of Staff
will do everything it is permitted to do, then hand you a punch list for the
rest.

| Step | Who can do it | Why |
|---|---|---|
| Create a Bot (name, title, description) | Bot **may** be able to; unverified | Not a documented bot-facing capability. The master prompt makes the bot self-report and attempt it. |
| Write Skills onto a bot | Bot **may** be able to; unverified | Same. |
| Create Routines | Bot **may** be able to; unverified | Routines are owned per bot; creation surface is the app. |
| Install a connector (Settings → Plugins) | **You only** | Connectors are account-wide and installed by a human. |
| Complete OAuth / 2FA / CAPTCHA | **You only** | GrokBot's documented model is human *takeover* of the shared computer. |
| Set Auto Review Require-Approval rules | **You only** (assume) | Treat approval gates as yours; never let a bot weaken its own gate. |
| Enable a routine / run the first test | **You only** | A test run performs real work. |

So: the paste gets you the bot records, descriptions, and skills if the
platform allows it, and a precise punch list if it does not. The punch list is
short, and every item on it is something no bot should be doing unattended
anyway.

If bot creation turns out to be unavailable, `MASTER-PROMPT.md` still earns
its place: the Chief of Staff echoes back four clean paste blocks you drop
straight into the New Bot dialog, and it adopts the delegation and logging
rules itself.

## Preflight: verify these in-app before building

GrokBot was ~10 days old when the dossier was compiled. Confirm each of these
in the product, not from these notes:

1. **Is Google Sheets a native connector?** The documented native list
   includes Google Drive but not Sheets. Agent 3's build path depends on the
   answer (see `agent-3-work-logger.md`).
2. **Weekly usage allowance size.** Not published. Find your current
   consumption before adding four bots and a routine schedule.
3. **Is on-demand spend enabled?** There is no GrokBot-specific spend cap.
   Turn on-demand spend **off** until you have a week of real consumption data.
4. **Bot and routine ceilings.** 50 bots + group chats combined; 50 routines
   per bot; the app keeps only the 20 most recent run records per routine.
5. **Gmail connector scopes.** xAI does not publish them. Whether a bot can
   apply labels programmatically is undocumented. Agent 1 is written to not
   need label writes.

## The shared-computer constraint shapes every spec here

xAI states it twice: *"Do not use separate Bots as a security boundary."* All
bots on the account share one cloud computer: same browser cookies, same
files, same command-line credentials. Every design decision below follows from
that.

**Do not sign into these on the GrokBot computer:** bank, brokerage, payroll,
tax software, Innago or any tenant-payment portal, or anything holding tenant
PII. Deleting a bot does not remove shared files or browser sessions; teardown
is a manual, multi-step job you do yourself.

**Connect only what a bot genuinely needs**, and prefer read+draft over write.
The account-wide connector list for this fleet is deliberately short:

| Connector | Needed by | Auth | Status |
|---|---|---|---|
| Gmail | `Inbox`, `Subscriptions` | Browser OAuth (you) | Native, confirmed |
| Google Drive | `Logbook`, `Filings`, `Subscriptions` | Browser OAuth (you) | Native, confirmed; reaches Sheets files |
| Google Sheets | `Logbook` | Browser OAuth (you) | **Verify** — may not exist natively |
| Composio | `Logbook` (fallback) | Per-toolkit OAuth | Optional bridge for deterministic row appends |

Nothing else. No Slack, GitHub, Notion, or X connector is required by this
fleet; every extra connector is another credential sitting on the shared
machine.

## Collision warning: this repo already runs a Gmail draft assistant

`gmail-assistant/` is an active, draft-only assistant that runs daily at
05:00 ET, creates up to 8 drafts per run, and applies `AI/*` labels. Its
idempotency rule 3 is: *never add a draft to a thread that already contains
any unsent draft.*

If a GrokBot inbox bot also drafts into that mailbox, three things break at
once: you get duplicate drafts, the Codex assistant starts silently skipping
threads GrokBot drafted into, and you pay twice for the same triage.

Agent 1 drafts, so parking the Codex assistant is a prerequisite rather than a
preference. Set `assistant.run_mode: paused` in `gmail-assistant/config.yaml`
and redeploy per `gmail-assistant/UPGRADE.md` before `Inbox` goes LIVE. Pausing
writes a one-line skip report and exits, so nothing is lost if you want it
back, and it also stops the `AI/*` labels being applied.

`Inbox` itself ships with `MODE: SHADOW` on the first line of its description:
it reports what it would trash and draft, and touches nothing, until you change
that word to `LIVE`.

## Build order

1. Read this file and the four agent specs. Decide Agent 3's Sheets path.
   Agent 1 needs no decision: it starts in SHADOW.
2. Install connectors at Settings → Plugins (you, once, account-wide).
3. Create the work-log spreadsheet and copy its URL.
4. Paste `MASTER-PROMPT.md` into the Chief of Staff bot.
5. Work the punch list it returns.
6. Pause the Codex Gmail assistant, then test each bot manually, one at a
   time, before enabling any routine.
7. Enable routines last, one per day, watching consumption.
8. Run `Inbox` in SHADOW for about a week. Read every would-trash list. Flip
   it to LIVE only when a week of them contains nothing you wanted to read.

## Cost discipline

Multiple users report exhausting the weekly allowance on multi-bot swarms;
one hit the limit mid-task. The allowance is drawn down by agent steps and
tokens, not message count. Practical rules baked into every spec here:

- One routine per bot to start. Add the second only after a week of data.
- No bot fans out to other bots without an explicit instruction from you.
- Every bot stops and asks rather than looping when a task exceeds its step
  budget.
- `Filings` is manual-trigger by default. Research is the most expensive
  thing in the fleet and the least schedule-sensitive.

## Known-unknowns carried from the dossier

These are stated plainly rather than estimated, and none of them are resolved
by this packet:

- No first-person report exists of a GrokBot agent doing SEC/EDGAR value
  analysis. Agent 2's feasibility is inferred from platform capability plus
  SEC-verified endpoints, not from an observed deployment.
- Google Sheets native-connector status could not be confirmed or ruled out.
- Gmail OAuth scopes are unpublished; programmatic label writes are
  undocumented.
- Auto Review is model-based. It complements least privilege; it does not
  guarantee anything. An approval also does not reverse work already done.
- The audit view is listed as "coming." Until it ships, `Logbook` is your
  audit trail.
