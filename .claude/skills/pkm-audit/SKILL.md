---
name: pkm-audit
description: Run a PKM audit across the Milhem Group Notion workspace, MilhemVault (Google Drive Obsidian vault), and the canonical REPS Tracker Sheet. Reconciles drift, processes Inbox/, surfaces conflicts, creates Notion tasks for user-blocked items, and emails a summary to milhemgroup@gmail.com. Use when running the weekly scheduled routine OR when invoked manually mid-session ("run the pkm audit"). Idempotent — safe to run multiple times.
---

# PKM Audit Skill

The full step-by-step procedure lives in `prompts/weekly-pkm-audit.md` at the repo root. This skill is a thin wrapper that hands off to it. Treat the prompt file as the single source of truth for behavior.

## When to use

- The Claude Code Routine `weekly-pkm-audit` fires on schedule (Mondays ~9 AM ET) — the routine's Instructions field is a copy of `prompts/weekly-pkm-audit.md`
- User says "run the pkm audit" or "do a sync check" mid-session
- After a major event in MilhemVault that could cause drift (e.g., user reports having added 10+ Inbox files; user manually edited REPS Sheet)

## When NOT to use

- For on-demand application of user intake answers — use `prompts/on-demand-audit.md` instead (it has the intake YAML block at top)
- For one-off custom syncs not covered by the audit steps — write a fresh prompt

## How to invoke

1. Read `CLAUDE.md` at repo root for canonical IDs, source-of-truth hierarchy, open conflicts, stop conditions, formatting rules.
2. Read `prompts/weekly-pkm-audit.md` and execute its 7 steps in order.
3. End with the run-summary file and the summary email per Step 6 and Step 7.

## Critical rules (from CLAUDE.md — repeated here for skill-invocation safety)

- **Do NOT** edit `MilhemVault/CLAUDE.md` autonomously — surface proposed patches via email only.
- **Do NOT** delete or overwrite existing Drive files. Drive `create_file` cannot replace; create new dated versions and append to `_System/Audit-Runs/`.
- **Do NOT** email anyone other than `milhemgroup@gmail.com`.
- **Search-before-create** with `contains` (substring, case-insensitive) on title, scoped to open tasks. Never exact-match.
- **Confirmed facts to honor** (do not re-question): Heather W-2 = ~$250K/yr at FQHC (FTE still TBD).

## Files in scope

| Path | Role |
|---|---|
| `CLAUDE.md` (repo root) | Persistent context — canonical IDs, hierarchy, conflicts |
| `prompts/weekly-pkm-audit.md` | The actual procedure |
| `prompts/on-demand-audit.md` | Sibling skill for intake-driven runs |
| `.claude/hooks/session-start.sh` | Sets TZ, writes session marker |
| `.claude/settings.json` | Pre-approves the MCP tools the audit needs |

## Verification after invocation

A successful run produces:

1. A new file at `MilhemVault/_System/Audit-Runs/YYYY-MM-DD_Audit-Run.md`
2. An email at `milhemgroup@gmail.com` with subject prefix `[PKM Audit]`
3. (Conditionally) a new monthly REPS snapshot at `MilhemVault/Tax-Strategy/REPS-Status-YYYY-MM.md` if hours drift > 20
4. (Conditionally) 0 or more Notion tasks in the Tasks & Action Items DB for blocked-on-user items
5. (Conditionally) 0 or more ALTO Catalyst Tracker rows for new SEC EDGAR filings

If any of (1)–(2) is missing at the end of a run, the skill failed. Log the failure mode in the email body.

## Iteration

When the audit procedure needs to change (new step, new check, refined rule):

1. Edit `prompts/weekly-pkm-audit.md` in the repo
2. Commit + push to the branch the routine clones (`claude/admiring-curie-pi9KN` or whichever is current)
3. **Manually re-paste the new prompt into the saved routine's Instructions field** at `claude.ai/code/routines/trig_0164Diw9WsLm2aKxKfbKikgA` — the routine config does NOT auto-sync from the repo
4. Update this `SKILL.md` if the invocation interface changed

## Related

- `prompts/weekly-pkm-audit.md` — the procedure
- `prompts/on-demand-audit.md` — intake-driven sibling
- `CLAUDE.md` — context
- Routine URL: https://claude.ai/code/routines/trig_0164Diw9WsLm2aKxKfbKikgA
