# Repopo — PKM Audit Routine Playbook

This repo is the operating root for the **Milhem Group PKM Audit Routine** running
on Claude Code (web). The routine prompt itself is provided per-run by the user;
this file is the persistent context that makes each run efficient.

When a run starts, the SessionStart hook (`.claude/hooks/session-start.sh`) writes
a marker and echoes the canonical-IDs cheatsheet to the transcript. **Read this
file first** before issuing any probe or search calls — every ID below is already
verified and stable.

---

## Canonical IDs

### Google Drive (MilhemVault)

| Path | ID | Notes |
|------|----|----|
| `MilhemVault/` (root) | `1pvRZ7m50boJYVqR16w16sncPpC0y2Mci` | Probe target for Step 0 |
| `MilhemVault/Inbox/` | `15LHe3CSkAFril0Dqj4IxjKCnQYG8ECVZ` | Source for Step 3 |
| `MilhemVault/Investments/` | `156SK3IuUhhqBiGwwPbpdNWJ7g3DBVvPX` | Destination: stock/options notes |
| `MilhemVault/Tax-Strategy/` | `142F2pNDcOSFActlybyYhfuuTEmje00gw` | Destination: REPS, cost seg, CPA; also REPS-Status-* snapshots |
| `MilhemVault/Real-Estate/` | `1LfSDkgTNV4750otjifQvuusPldZawoDt` | Destination: property/tenant/lease notes |
| `MilhemVault/Resources/` | `1Z9KD_U1B-GjEPC4POaH8NfillzRNQLXH` | Destination: automation, AI infra, tooling |
| `MilhemVault/Reference/` | `1yOTM4pWkH_bS2SeadKHb3_qq1kL0ORXr` | Destination: glossary, ops rules |
| `MilhemVault/People/` | `1jyXGYKmW3OVAwAdpR-MKGoNJzVI1zhT6` | Destination: contacts, CPAs, brokers |
| `MilhemVault/Vendors/` | `10tZsNCJ2XPGZfFgUe6sMwRG37chUyg0Y` | Destination: vendor contacts |
| `MilhemVault/Finance/` | `1tdLPx3lzbhJ6sOFF82RG4_nKkYXQlz1T` | Destination: rewards, insurance, Stessa |
| `MilhemVault/_System/` | `14f3ODbhAZR5RC7OgA3t3paOaYTQec0PX` | System folder |
| `MilhemVault/_System/audits/` | `17bCvnuULG7X0zenlF1Dm1Mb8u-JA_J7a` | Destination for Step 6 audit-run errata |
| `MilhemVault/_System/Session-Harvests/` | `1POKUA_AQboyZ82BOFuJJETa-BcBHmYc4` | Destination for session-harvest meta files |
| `MilhemVault/CLAUDE.md` (file) | `17gZRjmSZW9y-PXVpkoBmLzntOkAfakIq` | Source for Step 2 CPA check |
| REPS Tracker 2026 (Sheet) | `1Kakr5bX3KAUPhjUhcQKj48ghFg4VuxNCgeotIjoZjOo` | Source for Step 1; read via `read_file_content` (no Sheets MCP) |

### Notion

| Entity | ID | Notes |
|--------|----|----|
| Operations Dashboard (page) | `3346d7c3-34ef-810e-b14f-e7956aa6ad49` | Source for Step 2 Quick Reference; Step 4 freshness |
| 2026 Strategy Status Report (page) | `3346d7c3-34ef-8162-a4e8-f2bf82188317` | Source for Step 2 Key Contacts |
| CPA Identity Reconciliation (page) | `36c6d7c3-34ef-8111-bba5-c273b97b2527` | Link target for Step 2 task |
| Tasks & Action Items (database) | `480e9fe1-2cca-4b68-8eda-8b7617268eab` | Notion page ID |
| Tasks & Action Items (data source) | `bcc0d453-a07c-4a62-a7c5-46007375ed83` | **Use this** for `notion-create-pages` parent |
| ALTO Catalyst Tracker (data source) | `ee7894eb-316c-432c-b6a7-4c6c36fbaeca` | Step 5 target |

### Notion property enums (Tasks & Action Items)

- **Domain**: `"Real Estate"`, `"Tax"`, `"Investment"`, `"Personal"`, `"PKM"`, `"Family"`, `"Insurance"`, `"Legal"` — NOT `"Operations"`. Dashboard-refresh tasks go to `"PKM"`.
- **Priority**: `"Red"`, `"Yellow"`, `"Green"`
- **Status**: `"To Do"`, `"In Progress"`, etc.
- **Owner**: free text; use `"Self"` for routine-generated tasks
- Required title property is `"Task"` (not `"title"`).
- Due date is set via `"date:Due Date:start": "YYYY-MM-DD"` and `"date:Due Date:is_datetime": 0`.

### ALTO Catalyst Tracker schema

Title property: `Catalyst`. Selects: `Type` (Tax Credit / Regulatory / Index / Demand / Supply / Geopolitical / Earnings / Corporate Action), `Direction` (Bull / Bear / Neutral), `Probability` (High / Medium / Low / Tail), `Position Impact` (Add / Hold / Trim / Exit / Re-evaluate), `Status` (Pending / In Progress / Resolved Positive / Resolved Negative / Watching / Stale).

---

## Tool-availability matrix (verified 2026-05-26)

| Need | Tool | Notes |
|------|------|-------|
| Drive read | `mcp__Google-Drive__read_file_content` | Works for Google Sheets too — returns text dump |
| Drive create | `mcp__Google-Drive__create_file` | Use `disableConversionToGoogleType: true` for `.md` files; otherwise text/markdown gets converted to a Google Doc |
| Drive search | `mcp__Google-Drive__search_files` | `parentId =` (no `contains`) |
| Notion read | `mcp__Notion__notion-fetch` | Pass page ID OR `collection://<data-source-id>` |
| Notion write | `mcp__Notion__notion-create-pages` | `parent` is a **top-level** key, not per-page |
| Notion search | `mcp__Notion__notion-search` | Use to verify task existence by title before creating |
| Gmail draft | `mcp__Gmail__create_draft` | **No send tool exists** — see workaround below |
| Sheets MCP | NOT AVAILABLE | Use Drive `read_file_content` on the spreadsheet ID |
| SEC EDGAR MCP | NOT AVAILABLE | Step 5 must be skipped or fallback to WebFetch on data.sec.gov |

### Gmail send workaround

Only `create_draft` is exposed. To get the summary email actually delivered:

1. Create the draft as usual.
2. Either (a) have the user send manually from Gmail, or (b) set up a Gmail filter
   that matches `to:milhemgroup@gmail.com subject:"[PKM Audit]"` and labels for
   review — then user batches sends. A future Apps Script could auto-send drafts
   carrying a specific label, but that requires user setup outside this routine.

Document this limitation in every Step 7 send so the user knows the email is a draft.

---

## Inbox routing rules

When processing `MilhemVault/Inbox/*.md` files in Step 3:

| Filename signal | Destination | Folder ID |
|-----------------|-------------|-----------|
| Ticker mention (ALTO, BAC, WFC, BRK-B, PBI, SCVL, etc.) or `investments` tag | `Investments/` | `156SK3IuUhhqBiGwwPbpdNWJ7g3DBVvPX` |
| REPS / cost-seg / capital-gains / CPA / 45Z-tax-credit | `Tax-Strategy/` | `142F2pNDcOSFActlybyYhfuuTEmje00gw` |
| Lease / tenant / property / Innago / Stessa | `Real-Estate/` | `1LfSDkgTNV4750otjifQvuusPldZawoDt` |
| Automation / Playwright / Comet / Espanso / pipeline architecture | `Resources/` | `1Z9KD_U1B-GjEPC4POaH8NfillzRNQLXH` |
| Glossary / ops rules / reference material | `Reference/` | `1yOTM4pWkH_bS2SeadKHb3_qq1kL0ORXr` |
| `Session_Harvest_*` | `_System/Session-Harvests/` | `1POKUA_AQboyZ82BOFuJJETa-BcBHmYc4` (sidecar-only; original meta stays in Inbox) |
| `_write-test_*` | skip; sidecar only | — |
| `*_SessionSummary_*`, `*_ReviewQueue_*` | skip; sidecar only (meta-operational) | — |

### Processed file frontmatter template

```yaml
---
title: <human title>
date: <YYYY-MM-DD from filename>
type: <Thesis|Reference|Decision|Note|Research>
source: <Claude history|Gmail|perplexity|...>
tags: [<comma-separated>]
area: <Investments|Tax-Strategy|Real-Estate|Resources|Reference>
vault-section: <same as area>
processed: <YYYY-MM-DD of this run>
---
```

Then below the H1: `## Summary` (2 sentences with 3 bolded concepts), `## Key Takeaways` (3–5 bullets), original content, `## Related Notes` (`[[wikilinks]]`).

### Sidecar template

Filename: `<original-filename>.processed-YYYYMMDD`
Body:
```
processed: YYYY-MM-DD
destination: <folder>/<filename>
drive-id: <new-file-id>
```

For sidecar-only files (meta/operational), set `destination: N/A` with a brief `note:` line explaining why.

---

## Idempotency invariants

- **REPS snapshot**: Only create if `(sheet_hours - latest_snapshot_hours) > 20` AND no snapshot for the current month already exists. **Never overwrite.** If a same-month snapshot exists but is stale by > 20 hrs, log the discrepancy in the errata file and email — do not auto-version.
- **Notion task by title**: Always `notion-search` first; create only if exact-title match returns zero open tasks in Tasks & Action Items.
- **ALTO catalyst row**: Search-before-create by catalyst name.
- **Inbox sidecar**: Skip any file with an existing `.processed-*` sidecar.
- **Audit-run file**: Date-stamped, multiple per day are acceptable.
- **Email draft**: Always created; user dedupes downstream.

## Stop conditions (DO NOT violate)

- Do NOT edit `MilhemVault/CLAUDE.md` autonomously
- Do NOT delete or overwrite files in MilhemVault
- Do NOT push to non-`claude/`-prefixed branches in this repo
- Do NOT email anyone other than `milhemgroup@gmail.com`
- Do NOT touch any `readOnly: true` Notion properties
- If ambiguity arises, write it into the summary email AND create a Notion task — do not guess

## CPA identity check (Step 2)

Three sources, all must match:
1. `MilhemVault/CLAUDE.md` IDENTITY section → `**CPA:**` line
2. Notion Operations Dashboard → Quick Reference table → `Tax Advisor` row
3. Notion 2026 Strategy Status Report → Key Contacts table → CPA firm row

**Current state (2026-05-26):** All three disagree (`Matt Reese / Dark Horse` vs `Frank DiPaola, EA` vs `WCG CPAs`). Task MGP-21 is open in Tasks DB. No new task to create until resolved.

---

## Per-run efficiency target

Cold-start cost target: **≤ 8 tool calls** before first real action.
- 1 SessionStart hook (auto)
- 3 parallel Step-0 probes (Drive root, Notion dashboard, REPS sheet metadata)
- 1 parallel batch of Step 2 source reads (CLAUDE.md + 2026 Strategy page)
- 1 parallel batch of Step 3 inbox list + Step 4 dashboard freshness extraction
- 1 parallel Notion-search batch (CPA task + Dashboard task existence)
- 1 parallel REPS snapshot file search

Everything downstream (process files, create tasks, write errata, send email) should be batched into ≤ 4 large parallel rounds.

If a run exceeds 15 tool calls before doing real work, the IDs cheatsheet has drifted — update this file.
