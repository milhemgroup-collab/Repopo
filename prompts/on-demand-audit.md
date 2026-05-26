# On-Demand PKM Audit — Prompt (with intake answers)

Use this when the user has answered open intake questions and you want
Claude to immediately apply those answers across both systems instead of
waiting for the weekly run.

Trigger via:

- `claude.ai/code/routines` → **Run now** on a one-off routine using this prompt
- Or CLI: `/schedule one-off in 5 minutes — apply PKM intake answers per prompts/on-demand-audit.md`

---

You are running an **on-demand PKM update** triggered by the user
providing answers to the intake form sent on 2026-05-26. Your job is to
take the intake answers below and propagate them across MilhemVault
(Google Drive) and the Notion workspace. Read this repo's `CLAUDE.md`
first for canonical IDs, source-of-truth hierarchy, and stop conditions.

## Intake Answers (USER FILLS THESE IN BEFORE EACH RUN)

Edit this section with the actual values before firing the routine. Leave
`[STILL TBD]` for anything not yet known — the routine will skip those
sub-tasks and surface them in the summary email.

```yaml
# Heather W-2 detail
heather_w2_employer: [STILL TBD - FQHC confirmed; specific name?]
heather_w2_annual: 250000
heather_w2_fte: [STILL TBD - 1.0, 0.5, 0.3?]
heather_w2_hours_per_year: [STILL TBD]

# Placed-in-service dates (YYYY-MM-DD)
pis_lebeau_loop: [STILL TBD]
pis_mayberry: [STILL TBD]
pis_micelli: [STILL TBD]
pis_veranda_unit_b: [STILL TBD]
pis_lynch_st: [STILL TBD]

# Broker / position data
wfc_shares: [STILL TBD]
bac_basis_per_share: [STILL TBD]
alto_custody_split: [STILL TBD - all JPMorgan, or split with Merrill?]
pbi_shares: [STILL TBD]
brk_b_shares: [STILL TBD]
iras_or_other_accounts: [STILL TBD - list any]

# Decisions
cpa_decision: [STILL TBD - Matt Reese/Dark Horse | WCG | Jase Fuller | other]
cpa_engagement_letter_date: [STILL TBD]
frank_dipaola_status: [STILL TBD - retained for 2025 only | fully off | other]
grouping_election_go: [STILL TBD - yes/no for TY 2026 residential 5-pack]
q3_ltcg_meeting_target_week: [STILL TBD]
```

## Step 1 — Validate intake

If ALL intake fields are `[STILL TBD]`, send a polite email to
`milhemgroup@gmail.com` saying "no intake provided, nothing to apply" and
stop. Otherwise, continue with whatever IS provided.

## Step 2 — Apply Heather W-2 detail

If `heather_w2_fte` or `heather_w2_hours_per_year` provided:

1. Read latest `MilhemVault/Tax-Strategy/REPS-Status-YYYY-MM.md`.
2. Create a new snapshot `REPS-Status-<current-YYYY-MM>.md` with the W-2 Proportionality Test section now populated with concrete hours, not `[TBD]`. Mark the prior snapshot as superseded in frontmatter.
3. Update Notion REPS Hours Snapshot page (`3516d7c3-34ef-81e4-aa7e-d450a6bc36ca`) W-2 Proportionality Test table with same numbers.
4. Append entry to `MilhemVault/_System/Vault-Errata-Log.md` (create a new dated file under `_System/Audit-Runs/` since we can't edit existing files).
5. Close the Notion task "Confirm Heather W-2 FTE..." (mark `Status: Done`).

## Step 3 — Apply Placed-In-Service dates

If any `pis_*` field provided:

1. Read `MilhemVault/Tax-Strategy/Placed-In-Service-Dates.md` (file ID `1xnpnuPIby9tA0q38o0taZcEsJrCsQvnd`).
2. Create a new version `Placed-In-Service-Dates.md` (Drive will create a duplicate — that's OK; user can delete the original). New version replaces `[TBD]` rows with provided dates.
3. For each property whose PIS is now confirmed, also update the corresponding property file's frontmatter by creating a new sibling property note `<Property> Placed-In-Service.md` documenting just the PIS date (since we can't edit the main property file in place).
4. If all 5 PIS dates are confirmed, close the Notion task "Confirm placed-in-service dates for all 5 properties".

## Step 4 — Apply broker / position data

If `wfc_shares`, `bac_basis_per_share`, `alto_custody_split`, `pbi_shares`, or `brk_b_shares` provided:

1. Read `MilhemVault/Investments/Broker-Account-Map.md` (file ID `1nYFMU4pBCLfuKPKWtCrLSIfEYYd9SG59`).
2. Create new version `Broker-Account-Map.md` with `[TBD]` rows now populated.
3. If `wfc_shares` provided, also create new `Investments/WFC/WFC-Thesis.md` with the share count baked into the Position Snapshot section (supersedes the old one which has `[TBD]`).
4. Same for BAC if basis provided.

## Step 5 — Apply CPA decision

If `cpa_decision` provided:

1. Update Notion CPA Identity Reconciliation page (`36c6d7c3-34ef-8111-bba5-c273b97b2527`) with the resolution.
2. Update Notion Operations Dashboard Quick Reference table — change "Tax Advisor" row to the new CPA name.
3. Update Notion 2026 Strategy Status Report Key Contacts — confirm WCG row matches decision or update.
4. Append an entry to `MilhemVault/_System/Vault-Errata-Log.md` (via new dated audit-run file) documenting the CPA decision and the three locations that should be updated.
5. Send an email reminder to the user: `MilhemVault/CLAUDE.md` IDENTITY section's "CPA" line needs a manual edit (we don't touch CLAUDE.md autonomously). Provide the suggested edit verbatim in the email body so the user can copy-paste.
6. Close the Notion task "Resolve CPA identity..." with `Status: Done`.

## Step 6 — Apply grouping election decision

If `grouping_election_go` provided:

1. Read `MilhemVault/Tax-Strategy/Grouping-Election-469-7.md`.
2. Create a new version with the Status table updated: "Internal recommendation drafted" stays ✅, "CPA validation requested" updates to ✅/❌ based on `cpa_decision` resolution.
3. If `yes`, add a tax milestone to Notion 2026 Tax Strategy Milestones DB (`collection://4172250e-678c-40a4-ba85-cbb517138e09`): Milestone = "File §469(c)(7)(A) grouping election statement with 2026 return", Strategy Pillar = REPS Qualification, Status = Planning, Quarter = Q1 2027, IRC Reference = "§469(c)(7)(A) / Reg. §1.469-9".

## Step 7 — Schedule LTCG Q3 meeting (if applicable)

If `q3_ltcg_meeting_target_week` provided AND `cpa_decision` is resolved:

1. Create a Google Calendar event for that week (suggested: 2 PM ET on the Tuesday of the target week, 2 hours duration).
2. Invite the resolved CPA (use CPA contact from Obsidian `People/<CPA>.md` if known).
3. Attach the Notion Q3 LTCG Pro-Forma Meeting Prep page URL (`36c6d7c3-34ef-8161-b5ca-cc444471b1cc`) to the event description.
4. Update the Notion task "Schedule Q3 LTCG pro-forma meeting with CPA" → mark `Status: Done` and add the calendar event link in Notes.

## Step 8 — Run summary

Create a new file `MilhemVault/_System/Audit-Runs/YYYY-MM-DD_On-Demand-Run.md`
documenting:

- Each intake field that was applied
- Each intake field that was skipped (`[STILL TBD]`)
- Files created in MilhemVault (paths)
- Notion pages/tasks updated (URLs)
- Calendar events created (if any)
- Anything that still needs user action

## Step 9 — Email summary

Subject: `[PKM Audit] On-Demand Run YYYY-MM-DD — <N> items applied`

Body (HTML, no CDATA wrapper): structured by step, with hyperlinks to
created/updated artifacts. If any `[STILL TBD]` items remain, include a
"Still pending" section listing them so the user knows what's left.

## Stop Conditions (same as weekly routine)

- Do NOT edit `MilhemVault/CLAUDE.md` — email a suggested patch instead
- Do NOT delete or overwrite existing files — create new versions
- Do NOT push to non-`claude/`-prefixed branches in this repo
- Do NOT email anyone other than `milhemgroup@gmail.com`
- If `cpa_decision` is provided but conflicts with currently-engaged CPA per any other source, FLAG and do not apply until user confirms via second intake
