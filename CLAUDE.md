# CLAUDE.md — Milhem Group PKM Audit Routine

This file is loaded into every Claude Code session that runs against this
repo. It is the persistent context for the **automated weekly PKM audit
routine** (`prompts/weekly-pkm-audit.md`) and any on-demand audit runs.

> This is a routine-context file. The user's primary global context lives
> at `MilhemVault/CLAUDE.md` in their Google Drive. When that file and this
> one disagree, the user's MilhemVault `CLAUDE.md` wins — but flag the
> conflict in the audit summary.

## Identity

- **User:** Mattson Milhem Wardy (Matt)
- **Email:** milhemgroup@gmail.com
- **Business:** Milhem Group Properties (DBA, sole proprietorship in FL)
- **Spouse:** Heather Wardy — Pediatrician at FQHC, **~$250,000/yr W-2**
  (confirmed 2026-05-26; FTE / clinical hours per year still pending user
  confirmation, controls REPS proportionality test)
- **Portfolio:** 5 properties (4 FL + 1 MO), 9 rental units, ~$3.5M equity
  portfolio concentrated in ALTO at JPMorgan

## Source-of-Truth Hierarchy

| Domain | Canonical | Mirror | Notes |
|---|---|---|---|
| REPS hours | Google Sheets (REPS Tracker 2026) | Notion REPS Hours Snapshot, Obsidian `REPS-Status-YYYY-MM.md` monthly snapshots | Sheet ID `1Kakr5bX3KAUPhjUhcQKj48ghFg4VuxNCgeotIjoZjOo` |
| Property records | Notion Properties DB | Obsidian `Real-Estate/<property>/` | Per-property page in each |
| Tenant data | Notion Leases & Tenants DB | — | Obsidian rent roll redirects to Notion |
| Investment theses | Obsidian `Investments/<ticker>/` | Notion AI Knowledge Base | Long-form reasoning lives in Obsidian |
| Tax strategy | Obsidian `Tax-Strategy/` | Notion Tax Strategy Milestones DB | Operational milestones in Notion; analysis in Obsidian |
| Tasks / action items | Notion Tasks & Action Items DB | — | Routine writes blocked items here |
| Audit trail | Obsidian `_System/Vault-Errata-Log.md` | — | Routine appends every correction |

## Canonical IDs (do not re-discover)

### Google Drive — MilhemVault root and key folders
| Folder | ID |
|---|---|
| MilhemVault (root) | `1pvRZ7m50boJYVqR16w16sncPpC0y2Mci` |
| `Tax-Strategy/` | `142F2pNDcOSFActlybyYhfuuTEmje00gw` |
| `Investments/` | `156SK3IuUhhqBiGwwPbpdNWJ7g3DBVvPX` |
| `Real-Estate/` | `1LfSDkgTNV4750otjifQvuusPldZawoDt` |
| `Projects/` | `1ddX0Q6PMYVTuTwrfwPSH47uLT-OBWgrh` |
| `People/` | `1jyXGYKmW3OVAwAdpR-MKGoNJzVI1zhT6` |
| `Reference/` | `1yOTM4pWkH_bS2SeadKHb3_qq1kL0ORXr` |
| `_System/` | `14f3ODbhAZR5RC7OgA3t3paOaYTQec0PX` |
| `_Archive/` | `1YwjLTQKENn5aqybv44jHUE0aNVvQEjZV` |
| `Inbox/` | `15LHe3CSkAFril0Dqj4IxjKCnQYG8ECVZ` |

### Notion — pages and databases
| Item | ID |
|---|---|
| Operations Dashboard (root) | `3346d7c3-34ef-810e-b14f-e7956aa6ad49` |
| REPS Hours Snapshot | `3516d7c3-34ef-81e4-aa7e-d450a6bc36ca` |
| 2026 Strategy Status Report | `3346d7c3-34ef-8162-a4e8-f2bf82188317` |
| Tasks & Action Items (DB) | `collection://bcc0d453-a07c-4a62-a7c5-46007375ed83` |
| ALTO Catalyst Tracker (DB) | `collection://ee7894eb-316c-432c-b6a7-4c6c36fbaeca` |
| 2026 Tax Strategy Milestones (DB) | `collection://4172250e-678c-40a4-ba85-cbb517138e09` |
| Cost Segregation Tracker (DB) | `collection://f577a431-5e35-4b35-a26f-a2dd74f70b8c` |
| Lease Renewal Decisions (DB) | `collection://cb04365f-fc08-4029-b15e-c546bdf09bdb` |
| Watchlist & Stock Research (DB) | `collection://ccf66b14-0133-413c-8c1b-a60a212e6eaa` |
| PKM File Registry (DB) | `collection://220eec8d-3234-45a7-83d8-2150876c131a` |
| AI Knowledge Base (DB) | `collection://c50914cf-1ad5-4b85-ab04-38fb1c486aae` |

### Other
| System | Identifier |
|---|---|
| REPS Tracker Sheet | `1Kakr5bX3KAUPhjUhcQKj48ghFg4VuxNCgeotIjoZjOo` |
| Innago Email Parser Sheet | `1YrG0_EwZDwAwvj7nHAoodxBAaCYBYmhUo4XsnBrmapQ` |
| Innago Apps Script project | `1bQdxB4zRv3sqowJ9G_RPZKFsQaKUJC1lhOEknGWJbWm6qOcPF3SrTBnG` |

## Open Conflicts (as of 2026-05-26)

The audit routine must check these every run and re-surface if still unresolved:

1. **CPA identity** — three sources disagree:
   - User's MilhemVault `CLAUDE.md` says "Matt Reese at Dark Horse CPAs"
   - Notion Operations Dashboard says "Frank DiPaola, EA"
   - Notion 2026 Strategy Status Report says "WCG CPAs (Megan Oeltjenbruns / Rachael Weber)"
   - Resolution page: Notion "CPA Identity Reconciliation" (`36c6d7c3-34ef-8111-bba5-c273b97b2527`)
2. **Heather W-2 FTE** — dollar figure confirmed at $250K/FQHC; hours per year still TBD. Controls REPS >50% proportionality test.
3. **Placed-in-service dates** — none documented for any of 5 properties. Blocks cost seg engagement.

## Stop Conditions (the routine MUST NOT)

- Edit the user's `MilhemVault/CLAUDE.md` autonomously (high backlinks; user approval required)
- Delete or overwrite any existing file in `MilhemVault/` — only create new files
- Push to remote branches other than `claude/`-prefixed ones in this repo
- Send Gmail to addresses other than `milhemgroup@gmail.com`
- Modify Notion properties that are `readOnly: true` (synced/system-managed)
- Update REPS hour totals without first reading from the Google Sheets source of truth

## Output & Formatting Rules (from MilhemVault CLAUDE.md)

- **No em dashes.** Use colons, semicolons, commas, or restructure.
- **No filler preamble.** Don't say "Great question" / "Let me break this down".
- **No hedge disclaimers** beyond the CPA-review warning required on tax notes.
- **No AI tell words:** delve, tapestry, multifaceted, navigate (non-literal), realm, pivotal, embark, unleash, harness, fostering, spearhead.
- **Tables for comparisons.** Bullets 1-2 sentences max.
- **Lead with the answer**, then support it.
- **File naming convention:** `YYYY-MM-DD_Task_V1` for ad-hoc notes; date-suffix snapshots (e.g., `REPS-Status-2026-05.md`) for monthly mirrors.

## Tax-Note Convention

Any note that contains tax figures or strategy MUST include:

```
> [!warning] CPA Review Required
> Confirm with WCG CPAs before acting on any figures in this note.
```

(Replace "WCG CPAs" with the actual current CPA name once the CPA identity conflict is resolved.)

## Wikilink Preservation Rule

When the routine creates a new note that supersedes an old one, it MUST:

1. Add a `supersedes: "[[Old-Note-Name]]"` frontmatter field
2. Add a callout block at the top: `> [!note] Supersedes [[Old-Note-Name]]`
3. Preserve ALL `[[wikilinks]]` from the original
4. NEVER edit the original file in place (Drive MCP create_file can't replace; would create duplicates)
5. Append an entry to `_System/Vault-Errata-Log.md` explaining the supersession

## Idempotency

The routine runs weekly. It must be safe to run multiple times in the same
week without producing duplicate output. Mechanisms:

- New monthly snapshots only created when REPS hour diff vs latest existing
  `REPS-Status-YYYY-MM.md` > 20 hours
- Inbox processing tracks a sidecar marker (`.processed-YYYYMMDD`) per file
- Notion task creation: search for existing open task with same title before
  creating; skip if found
- ALTO Catalyst Tracker entries: search by catalyst name + status before
  adding new row

## Skills the routine should consult

- `process-inbox` rules from MilhemVault `CLAUDE.md` (INBOX PROCESSING RULES section)
- `daily-summary` pattern (scan recent notes, report themes)
- `connect-notes` pattern (add wikilinks between related notes)

## Audit Trail

Every routine run MUST end by:

1. Appending a run-summary entry to `MilhemVault/_System/Vault-Errata-Log.md`
   with date, what was synced, what conflicts surfaced
2. Sending an email summary to `milhemgroup@gmail.com` with subject prefix
   `[PKM Audit] YYYY-MM-DD Run Summary`
3. Creating Notion tasks for any blocked-on-user items in the Tasks & Action
   Items DB with `Owner: Self` and appropriate priority

## Related

- `prompts/weekly-pkm-audit.md` — the routine's main prompt
- `prompts/on-demand-audit.md` — same but with user-supplied intake answers
- `MCP_TROUBLESHOOTING.md` — Claude Desktop MCP config fix (separate concern; not for routine)
