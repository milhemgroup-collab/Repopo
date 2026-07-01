# Codex Prompt — REPS Auto Logger Improvement Review

**Drafted:** 2026-07-01
**Intended use:** Paste the prompt below into Codex when working in the REPS Auto Logger
workspace. It is self-contained; Codex needs no other context.

---

## Prompt

You are reviewing and improving **REPS Auto Logger**, a local-first automation system for
Matt's REPS (Real Estate Professional Status) activity tracking.

**Workspace:**
`C:\Users\matts\OneDrive\Other\MBA Documents\Pre-MBA Documents\getting started codex\reps_auto_logger`

### What this system is

It finds potential rental real estate work from local and Google-connected evidence
(Gmail, Calendar, Drive, browser-history cues, AI exports, AI self-audit outputs),
classifies it conservatively, deduplicates it against the canonical Google Sheets REPS
tracker, and appends only high-confidence rows when every append-safety gate passes.

The deeper goal is an **IRS-defensible, low-manual-friction evidence pipeline**, not just
"log hours":

- Google Sheets is the single source of truth for REPS hours.
- All other inputs are source evidence, never truth.
- Real REPS work must be distinguished from non-REPS work, investment research, generic
  admin, ambiguous AI prompts, and unsupported browser cues.
- The system runs unattended on Windows, but appends only when evidence is strong,
  duplicate checks pass, and post-append verification proves formatting, row placement,
  formulas, and exact-once source IDs.
- Weak evidence is staged for review, never appended.
- AI-tool history capture (ChatGPT, Claude, Perplexity, Gemini) runs through the
  **AI self-audit lane** and **direct route proof** as primary; official exports,
  browser-cache recovery, and connector proof are fallback-only unless primary fails.
- The daily control panel gives one readable status: capture proved, append safe, rows
  appended, duplicates skipped, Tier 3 review items, owner actions, next action.

### Read order and authority hierarchy

Read in this order. When files disagree, **earlier in this list wins**:

1. `docs\REPS_AUTO_LOGGER_CURRENT_STATE.md` — authoritative current state. Trust this
   over every older or longer plan.
2. `logs\REPS_DAILY_CONTROL_PANEL.md` — canonical live dashboard (proof state, append
   safety, watcher status, AI self-audit status, owner actions, next action). Read it
   before recommending anything.
3. `README.md` — design, commands, safety defaults, scheduled task model, reports,
   watchdog behavior, proof artifacts.
4. `docs\REPS_AUTO_LOGGER_CLEANUP_INVENTORY.md` — what to keep, merge, archive, and
   never delete yet.
5. `docs\2026-06-30_REPS_AUTO_LOGGER_PRIORITY_PLAN.md` — **historical journal only.**
   Useful for context on why things exist; do NOT treat it as current state or as a task
   list.
6. `pyproject.toml` — Python 3.11+, pytest, ruff, Google API clients, pydantic, pandas,
   typer, rich.

### Current state (as of 2026-07-01)

- Capture is proved. Append safety is proved. Append readiness is `ready_no_rows`.
- No owner actions required. Tier 3 review queue is clear.
- Direct AI route proof is proved for ChatGPT, Claude, Perplexity, and Gemini.
- AI self-audit lane is the primary AI history capture lane; official connectors, Gemini
  ZIP export, and browser-cache recovery are fallback-only and must not block the main
  system while primary capture remains proved.
- Remaining completion work is watcher install readiness and final unattended proof —
  **not** basic append safety.
- The control panel may legitimately show `watcher_install_pending` or
  `waiting_for_operating_window` while the append path remains safe. Do not "fix" that.

### Codebase map

Core modules (`reps_logger\`):

- `main.py` — CLI dispatch and orchestration
- `config.py` — config loading and operational settings
- `auth.py` — Google OAuth handling
- `sheets.py` — Google Sheets interaction
- `dedupe.py` — duplicate detection
- `classify.py` — REPS candidate classification and false-positive filtering
- `append_readiness.py` — final gate before append
- `tracker_verification.py` — post-append verification
- `completion_audit.py` — proof audit across capture lanes
- `control_panel.py` — daily dashboard generator
- `source_capture_map.py` — source map and manuality status
- `assurance.py` — source assurance model
- `export_harvester.py` — local AI export intake
- `ai_export_control.py` — export email control-plane reports
- `browser_cue_ledger.py` — browser cue tracking
- `transcript_queue.py` — transcript gap queue
- `ai_self_audit_lane.py` / `ai_self_audit_intake.py` — AI self-audit capture and intake
- `direct_ai_route_*.py` — no-manual AI query-history route proof
- `watcher_install_*.py` — watcher installation approval and verification
- `scheduled_run_proof.py` / `scheduler_sentinel.py` — scheduled run and sentinel proof
- `objective_coverage.py` — end-state objective coverage
- `manual_debt_burndown.py` — remaining manual work tracker

Source adapters (`reps_logger\sources\`): `gmail_source.py`, `calendar_source.py`,
`drive_source.py`, `browser_history_source.py`, `browser_cache_source.py`,
`ai_export_source.py`.

Key scripts (`scripts\`): `run_hourly_append.ps1` (only append-capable scheduled
runner), `run_ai_export_watch.ps1`, `run_daily_coverage_check.ps1`,
`run_operating_window_checkpoint.ps1`, `run_pre_first_hour_preflight.ps1`, the
`install_*_windows.ps1` task installers, `run_watcher_install_approval_dry_run.ps1`,
the AI self-audit helpers, and the tracker verification/formatting helpers
(`verify_latest_tracker_rows.py`, `verify_tracker_formatting.py`,
`format_reps_tracker.py`).

Proof/status artifacts live in `logs\` (control panel, append readiness/proof, source
capture map, source assurance, scheduled run/task status, watcher install queue and
verification, objective coverage, manual debt burndown, AI self-audit intake/review/
freshness, direct AI route matrix and validation, browser cue gaps, transcript gap
queue, export action queue, owner action queue). Evidence folders: `incoming_exports\`,
`ai_exports\`, `incoming_self_audits\`, `incoming_direct_ai_routes\`, `reports\`,
`backups\`. `.secrets\` holds Google OAuth material — **never inspect or expose it.**

### Hard invariants — never weaken these

1. **No live append** unless ALL of: Sheets health passes, duplicate checks pass,
   row-level evidence is strong, append readiness is fresh, and post-append tracker
   verification proves exact-once source IDs plus formatting/formula integrity.
2. The **no-append watchdog** and the **append-capable hourly writer** are separate
   lanes and must stay separate. Never give a no-append lane write access.
3. Weak or ambiguous evidence goes to the Tier 3 review queue, never to the tracker.
4. Google Sheets stays the source of truth; nothing local overrides it.
5. Fallback lanes (official connectors, Gemini ZIP export, browser-cache recovery) stay
   demoted while primary capture is proved. Do not promote them to top-level blockers
   without a strong, stated reason.

### Operating constraints

- Windows + PowerShell environment; keep it that way.
- Do not append to Google Sheets during this review. Only append-capable paths with all
  gates passing may ever append, and this task is not one.
- No Zapier.
- Never process or store tenant SSNs, background checks, full leases, tax returns,
  account numbers, passwords, or private identifiers.
- Never read or expose `.secrets\` contents.
- Browser-cache recovery is opt-in only and disabled by default; leave it that way.
- Any Chrome automation must stop at login, CAPTCHA, permissions, uploads, account
  connections, settings changes, downloads, or external transmission unless explicitly
  approved.
- **Never delete files during cleanup without explicit approval. Archive first.**
- Preserve direct AI route proof and the AI self-audit lane as the primary AI-history
  strategy.
- Prefer reducing complexity, improving dashboard clarity, and hardening invariant
  tests over adding more proof layers.

### Your task

Produce an **improvement plan first, then implement only the approved low-risk items.**
Work in two phases:

**Phase 1 — Review (no code changes).** Read the files in the order above, then answer:

1. Which files or concepts can be merged so the system has fewer overlapping proof
   artifacts? Name specific `logs\` files and the modules that generate them.
2. Is the current split between append writer, no-append watchdog, AI self-audit lane,
   direct AI route proof, and fallback export lanes coherent? If not, what is the
   minimal restructuring?
3. Where could status generation be simplified without losing auditability?
4. Which invariants must be protected with tests before any cleanup proceeds? Prefer
   narrow tests around business invariants (gating logic, dedupe keys, classifier
   exclusions, exact-once source IDs) over tests that assert generated Markdown text.
5. Which modules look too coupled, or too dependent on parsing/emitting generated
   Markdown rather than structured data?
6. How should the project prevent stale historical files (like the 2026-06-30 priority
   plan) from misleading future agents? Propose a concrete convention (e.g. a status
   header, an `archive\` folder, a manifest).
7. Should status be represented as structured JSON first with Markdown rendered from
   it? If yes, sketch the schema and migration order.
8. What is the single smallest next improvement that makes the system easier to operate
   without weakening append safety?

**Phase 2 — Implement (gated).** From your Phase 1 answers, pick only changes that are
(a) reversible, (b) covered by existing or newly added invariant tests, and (c) do not
touch the append gates' behavior. For each: state the change, add or update tests
first, implement, run `pytest` and `ruff`, and report results. Anything touching
append-path behavior, watcher installation, or file deletion must be proposed and left
unimplemented pending explicit approval.

### Improvement priorities (in order)

1. **Complexity and proof sprawl** — many overlapping status artifacts; the control
   panel should be the one first-read surface. Consolidate, don't add.
2. **Current truth vs. historical plans** — protect current-state files as authority;
   quarantine history so it can't be mistaken for a task list.
3. **Append path correctness** — the invariant in "Hard invariants" item 1 is the most
   important thing in the system. Harden its tests.
4. **False positives** — the classifier must not log investment research,
   public-company research, generic AI activity, ambiguous admin, browser-history cues
   alone, or weak alias matches as REPS activity. Strengthen exclusion tests.
5. **Manuality reduction** — reduce recurring manual steps (especially AI query-history
   capture) without weakening proof or privacy boundaries.
6. **Watcher install and unattended operation** — help prove scheduled no-append
   watcher tasks are hidden, no-popup, safe, and useful before install/approval.
7. **Fallback lane noise** — keep fallback evidence demoted; reduce its footprint in
   the daily status.
8. **Test maintainability** — keep the suite valuable: narrow invariant tests over
   generated-text snapshot tests.

### Output format

End with a summary containing: (1) Phase 1 answers as a numbered list, (2) a table of
proposed changes with risk level and whether you implemented or deferred each, (3) test
and lint results for anything implemented, and (4) the single recommended next action
for the owner.
