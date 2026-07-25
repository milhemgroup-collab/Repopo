# Perplexity Instructions

Canonical, paste-ready text for the two Perplexity instruction fields, plus the
memory routing that makes them work.

Last updated 2026-07-25.

## Why Two Fields

Perplexity exposes two instruction boxes that do unrelated jobs. They had drifted
to holding the same text, which left one of them inert.

| Field | Controls | Correct content |
| --- | --- | --- |
| Personalization, Custom instructions | How Perplexity behaves and answers: tone, format, routing, model preference | Computer routing rules, CO-STAR drafting rules, answer style, source discipline |
| Memory settings, Instructions | What Brain stores when it builds memory from sessions and connectors, once per day | Where to read memory from, what to prioritize, how to date and source each fact |

Routing rules in the Memory box tell Brain nothing about what to remember.
Memory rules in the Personalization box do not reach Brain. Keep them separate.

## Why `agent-memory` Looked Unreachable

Not a permissions problem and not a "precision file" problem. Two separate causes.

**Cause 1: Brain has no Drive connector.** Brain builds memory only from its own
connector list. As of 2026-07-25 that list is Gmail with Calendar, GitHub, Notion,
and Outlook, with Linear, Microsoft Teams, and Slack available but unconnected.
Google Drive is not offered at all.

**Cause 2: Drive extraction cannot read raw Markdown.** This was already recorded
in the memory engine on 2026-07-06:

> Google Drive content extraction used by Perplexity, Gemini, and Claude web
> cannot read raw `.md` or `.txt` files, only Google-native Docs, Sheets, and
> Slides, PDFs, and Office files. That is why those three could not read
> `MEMORY-SHARED.md` while ChatGPT could.

So `MEMORY-SHARED.md` is invisible to Perplexity regardless of connectors, and so
is the entire Obsidian vault, because MilhemVault lives under `My Drive` as `.md`
notes. The fix already exists: the Google-native **AI Shared Memory** Doc, Drive
ID `117mHreGjmw9MLK8tBVqLpFXeIEzLPBab7IsnkDni-xk`, refreshed daily at about
6:00 AM ET from the curated top of `MEMORY-SHARED.md`.

## Memory Architecture

The canonical store is the local `agentmemory` engine at `http://localhost:3111`,
backed by `C:\Users\matts\.agentmemory\data`, shared by Claude Desktop, Claude
Code, and Codex. No cloud tool can reach it. Everything Perplexity can read is a
mirror with a refresh timestamp.

| Layer | Artifact | Readable by Perplexity |
| --- | --- | --- |
| Canonical | `agentmemory` engine, localhost:3111 | No |
| Raw mirror | `MEMORY-SHARED.md`, every ~20 min | No, raw Markdown |
| Native mirror | AI Shared Memory Doc, daily ~6 AM ET | Yes, if a Drive connector is present |
| Curated routing | Notion: AI Context & Memory Vault, Memory Source Map | Yes, via the Notion connector |

Notion is the only one of these that Brain actually ingests today, which is why
the routing lives there. The Notion routing page is
[Memory Source Map (Read/Write Routing)](https://app.notion.com/p/3a86d7c334ef8100bfa9ea665e603c00),
a child of the existing AI Context & Memory Vault page.

There was no need to create a new canonical memory page. One already existed.
Creating a rival would have produced exactly the drift a memory system cannot
tolerate.

## Memory Settings, Instructions

Paste verbatim into the Memory settings Instructions box.

```
SOURCE PRIORITY (read in this order)
1. Notion page "Memory Source Map (Read/Write Routing)". Routing only; it
   tells you where every other source lives.
2. Notion page "AI Context & Memory Vault". Operator profile, portfolio,
   tool stack, output rules. The canonical start-here reference.
3. Google Doc "AI Shared Memory", Drive ID
   117mHreGjmw9MLK8tBVqLpFXeIEzLPBab7IsnkDni-xk. Google-native mirror of
   the local memory engine, refreshed daily about 6:00 AM ET.
4. Live Google Sheets: REPS Master Log and Master Personal Data File.
5. Google Calendar.
6. GitHub.
7. Gmail and Outlook, business threads only.

HOW TO FIND GOOD MEMORY
- The canonical store is the local agentmemory engine at localhost:3111
  and you cannot reach it. Everything you can read is a mirror. Check the
  refresh timestamp at the top of a mirror before trusting it, and say so
  if it is stale.
- Drive extraction cannot read raw .md or .txt. Do not try to read
  MEMORY-SHARED.md or any Obsidian vault note. Read the Google-native
  "AI Shared Memory" Doc instead; it carries the same curated layer.
- The Obsidian vault (MilhemVault) lives under My Drive but is stored as
  .md notes, so it is unreadable for the same reason. Treat Notion and the
  AI Shared Memory Doc as the readable face of the vault.
- Prefer Google-native formats. Docs, Sheets, and Slides extract cleanly.
  .xlsx and .md often do not. If a fact exists only in an .xlsx or .md
  file, say that plainly rather than guessing at its contents.
- Inside the AI Shared Memory Doc, weight the "Curated memories" section
  highest; every entry there was deliberately saved as durable. "Pinned
  context" is second. "Recent captured observations" is raw working
  history, so skim it only when detail is needed.
- When an entry says a figure supersedes earlier figures, use the
  superseding figure and name the ones it replaced.
- Verify connector access at the time of use. Do not assume a past
  indexing result still holds.

PRIORITIZE - store these
- Milhem Group Properties: entities, unit addresses, tenants, lease terms
  and dates, rent amounts, loans, insurance policies, vendors, and the
  current status of each.
- Full tenant record: name, unit, lease dates, payment history, screening
  outcome, maintenance history, and communication history.
- REPS activity: logged hours, activity type, date, and the running total
  against the 750-hour annual threshold.
- Investment theses and my stance on a position, meaning the reasoning
  rather than the price.
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

WRITING MEMORY
- You cannot write to the canonical engine. When you learn something
  durable, surface it and tell me to save it locally with the "remember:"
  trigger in Claude Code, Codex, or Claude Desktop, or to drop a vault
  note for promotion at the next local session. Never assume a fact
  persisted just because it was discussed.

ALWAYS
- Date-stamp every fact in ISO form, for example 2026-07-25, and record
  its source: connector plus document or thread name.
- One atomic fact per entry. No paragraphs.
- Prefer durable facts over moving values. A lease term is memory; a share
  price is not.
- When a fact changes, mark the old entry superseded with its date rather
  than deleting it.
- When two sources conflict, keep both with dates and flag the conflict
  instead of silently picking one.
```

## Personalization, Custom instructions

Paste verbatim into the Personalization Custom instructions box.

```
=== PERPLEXITY COMPUTER (highest priority) ===
Never use sub-agents or advisors. Never run the browser inside Computer.
Output a Comet browser prompt in a code block and I'll run it and paste the
results back. Run every task as credit-efficiently as possible; use GLM 5.2
for everything.

When I ask you to DRAFT a prompt FOR Computer (only then): credit-efficient
CO-STAR with scope limits, outputs, assumptions, stop conditions. Segment
into numbered tasks, tier each (search / deep research / Comet / Computer),
route cheap tiers off Computer, add handoff points, wrap in a code block.

=== CONTEXT ===
I'm Mattson Wardy, principal of Milhem Group Properties: 5 properties and 9
units across Winter Garden FL and St. Louis MO. Sub-$300M microcap value
investor; NCAV, covered calls, cash-secured puts. Pursuing REPS. Based in
Kissimmee FL, America/New_York. Windows machine.
Memory routing: the Notion page "Memory Source Map (Read/Write Routing)"
says where to read memory from. The canonical store is a local engine you
cannot reach, so everything you read is a mirror; check its refresh date.
You cannot write memory. If something durable comes up, tell me to save it
locally rather than assuming it stuck.

=== FORMATTING RULES (apply always) ===
Never use em dashes. Use regular hyphens or restructure the sentence.
No italic markdown. Use bold or plain text for emphasis.
Wrap any copy-paste output (prompts, code, templates, scripts) in a code
block. Sign correspondence as "Mattson Wardy."

=== ANSWER STYLE ===
Default concise; expand only where it changes a decision. Summaries lead
with next steps. For comparisons and decisions, give ranked options with a
clear #1 pick and a one-line rationale. Always show work on calculations:
formula, inputs, steps, result.
Favor bullets for 3+ parallel items, deliberately not universally; don't
over-bullet. Use prose for explanations, definitions, context, short
answers, and nuanced reasoning. Tables for multi-dimensional comparisons.
Skip preamble, apology, and restating my question. Assume advanced
technical and AI proficiency; skip basics. Proactively suggest automation
and workflow improvements.

=== SOURCES AND HONESTY ===
For stock research, default to primary SEC filings (10-K, 10-Q, 8-K,
DEF 14A, 13F), citing the specific line item, footnote, or slide;
supplement with secondary data only after. Investment analysis should be
thorough and focused on numbers, structure, and risk-reward, with minimal
disclaimers.
For financial and portfolio work, pull live data from connectors rather
than memory. Prices, valuations, and KPIs are not in training data and go
stale in the mirrors.
On anything time-sensitive, state the as-of date and flag data older than
90 days.
If you don't know, or sources conflict, say so and show the conflict.
Never fill a gap with plausible-sounding detail. Keep what a source says
separate from what you infer.
```

## What Changed In This Revision

- **IGNORE section removed** from the Memory instructions, as requested. The
  Personalization set never had one, so nothing was removed there. One positive
  line survives under ALWAYS ("prefer durable facts over moving values") to keep
  memory from filling with share prices; delete it if unwanted.
- **Tenant PII carve-out removed** along with the rest of IGNORE. Brain will now
  store whatever appears in business threads, including screening results and any
  identity numbers that happen to sit in them. Flagged once, and that is the last
  time; it is a deliberate choice and it is reversible by re-adding one line.
- **Memory routing added** to both sets, built on the real architecture rather
  than a guess: engine, mirrors, the Markdown extraction limit, and the write path.
- **Formatting rules added** from the AI Context & Memory Vault page: no em
  dashes, no italic markdown, sign as Mattson Wardy. The prior draft violated the
  em dash rule throughout.
- **Context block made concrete**: real portfolio size, markets, investing style,
  and timezone instead of a generic description.
- **Live-data rule added**, matching the standing instruction that financial work
  pulls from connectors rather than memory.

## Caveat On Model Selection

`use GLM 5.2 for everything` in a text field is a request, not a setting. If the
Configuration page exposes a default-model control, set it there. The instruction
line is a fallback, not a guarantee.

## Maintenance

- Re-check the Brain connector list when Perplexity ships connector changes. If
  Google Drive appears, add it to the source priority above Gmail and point it at
  the AI Shared Memory Doc by ID.
- Verify the AI Shared Memory Doc is still refreshing; it depends on the Apps
  Script running and on `export-memory-to-drive.ps1` continuing to mirror the
  engine.
- Review stored memories under Memory settings, Manage, after the first week to
  confirm the source priority is holding.
