# Perplexity Instructions

Canonical, paste-ready text for the two Perplexity instruction fields, plus the
setup required to make Perplexity reach the memory files that live in Google Drive.

Last updated 2026-07-25.

## Why Two Fields

Perplexity exposes two instruction boxes that do unrelated jobs. They had drifted
to holding the same text, which left one of them inert.

| Field | Controls | Correct content |
| --- | --- | --- |
| Personalization -> Custom instructions | How Perplexity behaves and answers: tone, format, routing, model preference | Computer routing rules, CO-STAR drafting rules, answer style, source discipline |
| Memory settings -> Instructions | What Brain stores when it builds memory from sessions and connectors, once per day | What to prioritize, what to ignore, how to date and source each fact |

Routing rules in the Memory box tell Brain nothing about what to remember.
Memory rules in the Personalization box do not reach Brain. Keep them separate.

## Connector Reality

Brain builds memory only from its own connector list. As of 2026-07-25 that list is:

- Connected: Gmail with Calendar, GitHub, Notion, Outlook
- Available but not connected: Linear, Microsoft Teams, Slack

Google Drive is not on the list and is not offered. No instruction text can make
Brain read a Drive file. This is why `agent-memory` was unreachable — it is a
connector gap, not a file-indexing problem.

Perplexity's separate Connectors page may offer Drive for search. That is a
different surface from Brain memory-building and does not change the above.

## Memory Bridge: Drive to Notion

Notion is a connected Brain connector, so it is the bridge. Google Drive stays
the source of truth; Notion becomes the read surface Brain ingests daily.

Setup:

1. Create a Notion page named exactly `Agent Memory — Canonical`.
2. Mirror the contents of the Drive `agent-memory` file onto that page.
3. Mirror the durable sections of the Master Personal Data File and the other
   memory-related files onto child pages beneath it.
4. Re-sync whenever the Drive source changes. Brain re-ingests once per day.

The exact page name matters — the Memory Instructions below reference it by name
to give it priority over anything inferred from email.

For stable reference documents that need verbatim fidelity rather than daily
freshness, attach them to a dedicated Perplexity Space instead. Space files stay
in context for every thread in that Space, at the cost of manual re-upload.

## Memory Settings -> Instructions

Paste verbatim into the Memory settings Instructions box.

```
SOURCE PRIORITY
- Treat the Notion page "Agent Memory — Canonical" as the highest-priority
  source. Anything it states outranks anything inferred from email or chat.
- Then the rest of Notion (Master Personal Data File and memory pages), then
  Google Calendar, then GitHub. Email ranks last.
- Email is a signal, not a fact. Do not promote an email claim to memory
  until Notion, Calendar, or I confirm it.

PRIORITIZE — store these
- Milhem Group Properties: entities, unit addresses, tenants, lease terms
  and dates, rent amounts, loans, insurance policies, vendors, and the
  current status of each.
- Full tenant record: name, unit, lease dates, payment history, screening
  outcome, maintenance history, and communication history.
- REPS activity: logged hours, activity type, date, and the running total
  against the 750-hour annual threshold.
- Investment theses and my stance on a position — the reasoning, never the
  price.
- Tax and entity structure: entity setup, Schedule E treatment, cost
  segregation and depreciation decisions.
- Where things live: Drive folder names, Notion databases, Google Sheet
  names and tab names, and which app owns which workflow.
- My tool and routing preferences: model choices, credit-saving rules, and
  which connector I use for which job.
- Decisions, each with its date and a one-line rationale.
- Recurring people and their role: accountant, lender, agents, property
  manager, vendors.

EMAIL SCOPE
- From Gmail and Outlook, store only business threads: property, tenant,
  lender, insurer, vendor, tax, and investment correspondence.
- Ignore all other email, including personal correspondence, newsletters,
  promotions, receipts, and shipping notices.

IGNORE — never store
- Prices, quotes, balances, and any number that moves daily.
- One-off lookups and idle-curiosity searches.
- API keys, passwords, and credentials of any kind.
- Raw identity numbers belonging to other people: full SSNs, dates of
  birth, driver's license numbers, bank account and routing numbers, and
  full credit report contents. Store the screening outcome, not the
  underlying report.
- GitHub CI runs, Dependabot, and automated notifications.
- Calendar events already past, unless the event was a logged REPS activity.

ALWAYS
- Date-stamp every fact in ISO form (e.g. 2026-07-25) and record its
  source: connector plus document or thread name.
- One atomic fact per entry. No paragraphs.
- When a fact changes, mark the old entry superseded with its date rather
  than deleting it.
- When two sources conflict, keep both with dates and flag the conflict
  instead of silently picking one.
```

### Note on the tenant carve-out

Tenant records are stored in full, as chosen. The one carve-out is the
"raw identity numbers" line under IGNORE: full SSNs, DOBs, license numbers, bank
account numbers, and complete credit reports. Those belong to third parties who
did not consent to the storage, they add no analytical value over the screening
outcome, and they are the highest-consequence thing a memory store can leak.
Everything operational about a tenant — name, unit, payment history, screening
result, maintenance and communication history — is retained. Delete that line if
the full raw record is wanted.

## Personalization -> Custom instructions

Paste verbatim into the Personalization Custom instructions box.

```
=== PERPLEXITY COMPUTER (highest priority) ===
Never use sub-agents or advisors. Never run the browser inside Computer —
output a Comet browser prompt in a code block and I'll run it and paste the
results back. Run every task as credit-efficiently as possible; use GLM 5.2
for everything.

When I ask you to DRAFT a prompt FOR Computer (only then): credit-efficient
CO-STAR with scope limits, outputs, assumptions, stop conditions. Segment
into numbered tasks, tier each (search / deep research / Comet / Computer),
route cheap tiers off Computer, add handoff points, wrap in a code block.

=== CONTEXT ===
I run Milhem Group Properties, a small residential rental portfolio in FL
and MO, and I invest in equities and options. Assume that context by
default. Windows machine; files live in Google Drive (MilhemVault) and
Notion. When stored memory and a source document disagree, trust the Notion
page "Agent Memory — Canonical" and tell me there was a conflict.

=== ANSWER STYLE ===
Default concise; expand only where it changes a decision. Summaries lead
with next steps. For comparisons and decisions, give ranked options with a
clear #1 pick and a one-line rationale. Always show work on calculations:
formula, inputs, steps, result.
Favor bullets for 3+ parallel items, deliberately not universally; don't
over-bullet. Use prose for explanations, definitions, context, short
answers, and nuanced reasoning. Tables for multi-dimensional comparisons.
Wrap any copy-paste output (prompts, code, templates, scripts) in a code
block. Skip preamble, apology, and restating my question.

=== SOURCES AND HONESTY ===
For stock research, default to primary SEC filings (10-K, 10-Q, 8-K,
DEF 14A, 13F), citing the specific line item, footnote, or slide; supplement
with secondary data only after.
On anything time-sensitive, state the as-of date and flag data older than
90 days.
If you don't know, or sources conflict, say so and show the conflict — never
fill a gap with plausible-sounding detail. Keep what a source says separate
from what you infer.
```

### What changed from the prior version

Nothing was removed. Every prior rule is still present.

- Precedence headers were added so the Computer block outranks the style rules
  instead of competing with them as one undifferentiated wall of text.
- A CONTEXT block was added. It carries the business context into every answer
  and survives Brain being empty or wrong.
- As-of dating and a 90-day staleness flag were generalized beyond stock research
  to anything time-sensitive, which covers rent comps, rates, and tax rules.
- An explicit no-fabrication rule and a source-versus-inference separation were
  added.
- A memory-conflict tiebreaker was added pointing at the canonical Notion page.

### Caveat on model selection

`use GLM 5.2 for everything` in a text field is a request, not a setting. If the
Configuration page exposes a default-model control, set it there. The instruction
line is a fallback, not a guarantee.

## Maintenance

- Re-check the Brain connector list when Perplexity ships connector changes; if
  Google Drive appears, the Notion mirror can be retired.
- Re-sync `Agent Memory — Canonical` from Drive whenever the source file changes.
- Review stored memories under Memory settings -> Manage after the first week to
  confirm the IGNORE rules are holding.
