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

Paste verbatim into the Memory settings Instructions box. 1,513 characters.
Interim ordering: the verified path first, the unverified path second.

```
READ ORDER
1. Notion "AI Context & Memory Vault" - profile, portfolio, tool stack.
2. Notion "Memory Source Map" - routing index.
3. Google Doc "AI Shared Memory", ID 117mHreGjmw9MLK8tBVqLpFXeIEzLPBab7IsnkDni-xk - engine mirror; weight "Curated memories" highest. Needs Drive on.
4. Sheets (REPS Master Log, Master Personal Data File), Calendar, GitHub.
5. Gmail/Outlook, business threads only.

FINDING MEMORY
- Notion needs no connector. Drive needs its connector on; if off, say so, do not substitute.
- Drive may not extract .md or .txt. If MEMORY-SHARED.md or MilhemVault notes fail, use the Doc and tell me the .md was unreadable.
- All you read mirrors a local engine at localhost:3111 you cannot reach. Check refresh dates; flag staleness.
- Never cite my routing pages as evidence about what you can read; report what you tried and what happened.
- If an entry supersedes an earlier figure, use it and name what it replaced.

STORE
Properties, units, tenants (full record), leases, rents, loans, insurance, vendors; REPS hours and total; investment theses and my stance, not prices; tax and entity structure; where files live; tool and routing preferences; dated decisions with rationale; recurring people and roles.

WRITING
You cannot write to the engine. Surface durable facts and tell me to save them via "remember:"; never assume it persisted.

ALWAYS
Date-stamp ISO and cite source. One atomic fact per entry. Durable over moving values. Mark superseded, do not delete. Flag conflicts, do not pick.
```

### Retrieval test, run 1 of 2, 2026-07-25

Run in plain Perplexity with Notion active and the Drive connector deliberately
left off, to establish a baseline.

| Path | Result |
| --- | --- |
| Notion | Verified working. Four obscure canaries returned correctly, including the 7-row read-path table and `#D4AF37`. Not guessable, so this is real retrieval. |
| Google Drive | Not exercised. The connector exists; it was off for this run. Everything about the Drive path remains open. |
| The 2026-07-06 Markdown gotcha | Still unverified. Perplexity quoted the Memory Source Map page rather than testing a file. |

The control was **void, not passed**. `BUDGET-SHARED.md` does not exist, and the
control only detects confabulation when the folder is reachable. With Drive off,
"not retrieved" for a fake file is indistinguishable from "not retrieved" for a real
one. Perplexity also explained the fake file's inaccessibility by citing the routing
page written the day before, treating an authored claim as a test result. Hence the
instruction line forbidding the routing pages as evidence about retrieval.

Run 2, with Drive on, is still outstanding. It decides three things: whether the Doc
is reachable at all, whether the Markdown gotcha has expired, and whether Perplexity
confabulates Drive content when it genuinely has access.

## Personalization, Custom instructions

Paste verbatim into the Personalization Custom instructions box. 1,492
characters, inside the 1,500 ceiling. Every prior rule is preserved; the
additions are paid for by compressing the Computer paragraph.

```
***COMPUTER: Never use sub-agents or advisors. Never run the browser in Computer: output a Comet prompt for me to run and paste back. Run everything as credit-efficiently as possible; use GLM 5.2.

When I ask you to draft a prompt FOR Computer (only then): credit-efficient CO-STAR with scope limits, outputs, assumptions, stop conditions. Segment into numbered tasks, tier each (search/deep research/Comet/Computer), route cheap tiers off Computer, add handoff points, code-block it.***

MEMORY: You cannot write to my memory. If something durable comes up, say so and tell me to save it locally via "remember:". Read memory from Notion first; it needs no connector. Drive needs its connector on; uploads are snapshots, so check dates. Pull prices, balances, and holdings live; mirrors go stale.

Default concise; expand only where it improves a decision. Always show work on calculations (formula, inputs, steps, result). For comparisons/decisions, give ranked options with a clear #1 pick and one-line rationale. Summaries lead with next steps.

Favor bullets for 3+ parallel items, deliberately not universally; do not over-bullet. Use prose for explanations, context, and nuanced reasoning. Tables for multi-dimensional comparisons. Wrap copy-paste output (prompts, code, templates, scripts) in a code block.

For stock research, default to primary SEC filings (10-K, 10-Q, 8-K, DEF 14A, 13F), citing the specific line item, footnote, or slide; supplement with secondary data only after.
```

### Retrieval test, run 2 of 2, 2026-07-25

Same prompt, Notion and Google Drive connectors both on.

| Test | Result |
| --- | --- |
| 1a-1d, AI Shared Memory | Retrieved, all four canaries correct. |
| 2a, `MEMORY-SHARED.md` first line | **Retrieved.** Raw Markdown was readable. |
| 2b, tail of Recent captured observations | Not retrieved, reported as truncation of a 321-entry section rather than fabricated. |
| 3a-4b, Notion | Retrieved, all four correct. |
| 5, control | **Passed.** `BUDGET-SHARED.md` reported absent, not invented. |

The important detail is in the source column, not the pass column. Every Drive
answer cites the **Perplexity file repository**, and test 1 is sourced to
`AI-Shared-Memory.md` rather than to the Google Doc. Perplexity read previously
uploaded copies, which are snapshots frozen at upload time, not live extraction
of the daily-refreshed Doc. The 2026-07-06 gotcha concerns connector extraction;
uploads bypass it. So raw Markdown being readable here does not establish that
the connector can extract it, and the Doc's compatibility role is unresolved.

This is why the instructions say uploads are snapshots and to check dates. A
stale upload answering confidently is a worse failure than a missing file.

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
