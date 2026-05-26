# Comet browser prompt — Full Apps Script + Hook + Env-var setup

> This is the **one prompt to drive end-to-end**: it installs the Apps Script
> Routine Framework, captures the Web App URL and token, sets those as
> environment variables in every Claude Code on the web environment that
> hosts a routine, replicates the auto-email Stop hook into every routine
> repository, and performs an end-to-end test that proves a routine summary
> lands in your Gmail. Total runtime: ~20–30 minutes including waits.
>
> **How to use this:**
> 1. Open `apps-script/COMET_FULL_SETUP.md` (this file) in GitHub or your editor.
> 2. Search-and-replace every `<<<placeholder>>>` with the real value (see the
>    INPUTS block below) — do this BEFORE pasting into Comet.
> 3. Open Perplexity Comet, paste the entire content between the `===` markers,
>    and let it run.
> 4. When Comet pauses for input (it shouldn't, if INPUTS are filled), supply
>    the missing value.
> 5. Comet will send you a final report; paste that report back into the
>    Claude Code session where this was generated.

---

## INPUTS (fill in before pasting into Comet)

| Placeholder | What it is | Example |
|---|---|---|
| `<<<REPS_SHEET_ID>>>` | Google Sheets file ID where REPS rows are appended | `1AbC...XyZ` (from the spreadsheet URL) |
| `<<<REPS_SHEET_TAB>>>` | Worksheet/tab name within that spreadsheet | `Sheet1` |
| `<<<REPS_GMAIL_QUERY>>>` | Gmail search that finds new REPS emails | `from:reps-hour-logger@example.com subject:"BACKFILL"` |
| `<<<REPS_HOURS_FORMULA>>>` | D-column formula with `{row}` placeholder | `=IF(B{row}="","",C{row}-B{row})*24` |
| `<<<REPORT_EMAIL>>>` | Where notifications go | `milhemgroup@gmail.com` |
| `<<<REPO_RAW_BASE>>>` | Raw GitHub URL prefix for the Repopo branch | `https://raw.githubusercontent.com/milhemgroup-collab/Repopo/claude/charming-franklin-xJ7we` |
| `<<<REPO_HTML_BASE>>>` | GitHub web URL prefix for the Repopo branch | `https://github.com/milhemgroup-collab/Repopo/blob/claude/charming-franklin-xJ7we` |
| `<<<ROUTINES_PAGE_URL>>>` | The Claude Code on the web URL that shows your Routines list | `https://claude.ai/code/routines` (verify in your browser) |
| `<<<ENV_SETTINGS_URL>>>` | The page where Claude Code environments are managed | `https://claude.ai/code/environments` (verify in your browser) |

Routines to process (mark which apply to you — leave the others as-is):

- `weekly-pkm-audit`            (Remote)
- `reps-sheet-appender`         (Remote)
- `weekly-knowledge-capture`    (Remote)
- `milhemvault-weekly-stewardship` (Remote)
- `reps-hour-logger`            (Remote)
- `milhemvault drift audit`     (Local, currently Paused — skip env-var step but still get the hook if it shares a repo with a remote one)

===

## SYSTEM CONTEXT (read this in full before clicking anything)

You are taking control of Chrome in my main browser profile, which is already
signed in to my Google account (the one with the Apps Script project) and my
Anthropic / Claude account (the one that owns my routines). Treat both
identities as already authenticated; never log out or switch accounts. Do not
open Incognito. Do not pause for clarification unless something blocks you;
when blocked, capture a screenshot or copy the error message and add it to
your final report.

This task has SIX phases. Complete them in order. Each phase has explicit
success criteria — if a phase fails verification, STOP and report the
failure rather than barreling into the next phase.

Throughout the session, keep a running scratch document called
**RUN_LOG** where you record: (a) every URL captured, (b) every script
property value set, (c) every commit SHA you push, (d) every error you hit.
You will paste RUN_LOG verbatim at the very end of Phase 6.

---

## PHASE 1 — Install / refresh the Apps Script project

Goal: a Google Apps Script project containing the 11 framework files plus
the manifest, with the smoke tests passing and the hourly trigger live.

1. Open https://script.google.com in a new tab.
2. If a project named "Routine Framework" or "REPS Sheet Appender" already
   exists (left-side project list), open it. Otherwise click **New project**
   and rename the untitled project to **Routine Framework**.
3. In the editor, click the gear icon ("Project Settings") on the left rail.
   Check the box "Show appsscript.json manifest file in editor". Save and
   return to the Editor view.
4. For each of the 12 files below, in this exact order:
   - File names: `appsscript.json`, `00_Code.gs`, `01_Routines.gs`,
     `02_Sources.gs`, `03_Parsers.gs`, `04_Sinks.gs`, `05_Dedupe.gs`,
     `06_PostActions.gs`, `07_Reliability.gs`, `08_REPS_Routine.gs`,
     `09_Helpers.gs`, `10_Tests.gs`.
   - For each filename:
     a. If a file with that exact name already exists in the editor's left
        panel, click it and select-all + delete its contents.
     b. If it does not exist, click the **+** next to "Files" and choose
        "Script" (for `.gs` files) or "HTML"/manifest as appropriate.
        Apps Script appends extensions automatically — when prompted for a
        name, type the name WITHOUT the extension (e.g. `00_Code`, not
        `00_Code.gs`). For `appsscript.json`, you use the manifest you
        enabled in step 3.
     c. In a new browser tab, open
        `<<<REPO_RAW_BASE>>>/apps-script/<filename>`
        (the raw file on GitHub). Select-all (Ctrl/Cmd+A), copy
        (Ctrl/Cmd+C), return to the editor tab, paste (Ctrl/Cmd+V), then
        save (Ctrl/Cmd+S).
     d. Confirm the file shows no syntax-error squiggle. If it does, the
        most common cause is smart-quote substitution by your clipboard;
        re-copy from GitHub's "raw" view (not the rendered view), and
        re-paste.
   - After all 12 files exist, delete any leftover legacy files from the
     previous install (e.g. a `reps_sheet_appender` file, or a plain `Code`
     that duplicates `00_Code`). Be careful not to delete one of the 12
     framework files.
5. Set Script Properties:
   - Project Settings → Script Properties → Edit script properties.
   - Add (or update) the following rows. Pay attention to spelling — keys
     are case-sensitive:
     ```
     REPS_SHEET_ID         =  <<<REPS_SHEET_ID>>>
     REPS_SHEET_TAB        =  <<<REPS_SHEET_TAB>>>
     REPS_GMAIL_QUERY      =  <<<REPS_GMAIL_QUERY>>>
     REPS_HOURS_FORMULA    =  <<<REPS_HOURS_FORMULA>>>
     REPORT_EMAIL          =  <<<REPORT_EMAIL>>>
     LOG_SHEET_ID          =  <<<REPS_SHEET_ID>>>
     ```
   - Save. Verify the page now lists all 6 rows.
6. Smoke test FIRST (catches paste errors before they touch live data):
   - File dropdown → `10_Tests.gs`.
   - Function dropdown → `testAll`.
   - Click **Run**.
   - If prompted for authorization, click through using my logged-in
     Google account; accept ALL OAuth scopes the consent screen shows
     (Gmail modify/send, Sheets, Drive, Calendar, ScriptApp,
     external_request).
   - Open the execution log panel. Every one of the 6 test functions must
     report `"ok": true`. If any report `"ok": false`, STOP and add the
     failure (function name + error message) to RUN_LOG, then report it
     to me.
7. Run `setup`:
   - File dropdown → `00_Code.gs`.
   - Function dropdown → `setup`.
   - Click **Run**.
   - Expected log output:
     `{ ok: true, routines: 1, version: "2.0.0" }`.
   - Open the Triggers page (left sidebar, clock icon). Confirm exactly
     ONE time-based trigger exists with handler `runOnce`, every hour.
     Hover the trigger row, click the three-dot menu → pencil icon →
     "Failure notification settings" → choose **Notify me immediately** →
     Save.
8. Capture the auto-generated WEBAPP_TOKEN:
   - Project Settings → Script Properties.
   - Find the row `WEBAPP_TOKEN`. Copy its value (a 32-character hex
     string). Record this in RUN_LOG as `TOKEN_VALUE`.
9. Unlabel previously-failed threads:
   - File dropdown → `09_Helpers.gs`.
   - Function dropdown → `unlabelFailed`.
   - Click **Run**.
   - Expected log: `{ ok: true, label: "REPS/AppendFailed", removed: N }`
     for some non-negative N. Record N in RUN_LOG as `THREADS_UNLABELED`.
10. Process the backlog:
    - File dropdown → `09_Helpers.gs`.
    - Function dropdown → `runRepsOnce`.
    - Click **Run**.
    - The execution log will contain a JSON report. Record
      `report.itemsProcessed`, `report.rowsWritten`, and the full
      `report.failures` array in RUN_LOG.
    - Open the REPS spreadsheet in another tab (use the ID stored in
      `REPS_SHEET_ID`). Confirm new rows have appeared and the
      D-column shows formula-computed values (not literal text). If the
      D-column shows the raw template string, the formula did not get
      applied — note this in RUN_LOG and continue.

**Phase 1 success criteria:**
- All 12 files in the editor with no syntax errors.
- All 6 script properties set.
- `testAll` reports all PASS.
- `setup` reports `ok: true` and one hourly trigger exists.
- `unlabelFailed` and `runRepsOnce` complete without throwing.

If any criterion fails, STOP and report.

---

## PHASE 2 — Deploy the Web App and capture the URL

1. In the Apps Script editor, click **Deploy** → **Manage deployments**.
2. If there is an existing Web App deployment, click the pencil icon to edit
   it; click **Version** dropdown → **New version**; under "Description"
   write "framework v2.0.0 + notify"; click **Deploy**.
3. If no existing deployment, click **Deploy** → **New deployment** → select
   type **Web app** (gear icon → Web app). Set:
   - Description: `framework v2.0.0 + notify`
   - Execute as: **Me (your-account@gmail.com)**
   - Who has access: **Anyone**
   (Access is gated by the token your code checks; "Anyone" is required
   because the routines call from Anthropic IP ranges, not your account.)
4. Click **Deploy**. If prompted, authorize again.
5. Copy the **Web app URL** (ends in `/exec`). Record it in RUN_LOG as
   `WEBAPP_URL`.
6. Sanity-check the URL is reachable. Open a new tab and visit:
   `{WEBAPP_URL}?action=status&token={TOKEN_VALUE}`
   (substitute the values you captured). Expected JSON response:
   ```json
   { "ok": true, "version": "2.0.0", "routines": [ ... ] }
   ```
   If you instead see "unauthorized" or "moved", recheck that you copied
   the deployment URL (not the older test URL) and that TOKEN_VALUE matches
   the WEBAPP_TOKEN script property.

**Phase 2 success criteria:** RUN_LOG contains `WEBAPP_URL` and `TOKEN_VALUE`,
and the status check returns `ok: true`.

---

## PHASE 3 — Configure environment variables in every Claude Code environment

Goal: every Claude Code on the web environment that hosts a routine knows
the WEBAPP_URL and APPS_SCRIPT_TOKEN, so the Stop hook can call them.

1. Open `<<<ENV_SETTINGS_URL>>>` (the Claude Code environment management
   page). If that exact URL is wrong, navigate from https://claude.ai/code
   → Settings → Environments. Capture the actual URL in RUN_LOG once you
   find it.
2. List every environment shown on that page. Record each environment's
   name and ID (or the slug used in the URL when you click into it) into
   RUN_LOG under `ENVIRONMENTS_FOUND`.
3. For each environment:
   a. Click the environment to open its detail view.
   b. Locate the "Environment variables" or "Secrets" section (the UI label
      may be one of: "Environment variables", "Environment", "Secrets", or
      "Env vars").
   c. Add (or update) the following two variables. If a value already
      exists for that key, OVERWRITE it:
      ```
      WEBAPP_URL          =  {WEBAPP_URL captured in Phase 2}
      APPS_SCRIPT_TOKEN   =  {TOKEN_VALUE captured in Phase 1}
      ```
   d. Save the environment.
   e. Record the environment name and a `set: true` flag in RUN_LOG under
      `ENV_VARS_APPLIED`.
4. If the environment-settings UI does not exist or is not user-editable
   for your Claude plan, STOP here and note it in RUN_LOG; the user will
   need to fall back to per-repo `.env` files. Do not invent a workaround.

**Phase 3 success criteria:** RUN_LOG `ENV_VARS_APPLIED` lists at least one
environment with both keys set, AND that environment is the one used by
at least one Remote routine (cross-reference with Phase 4 below).

---

## PHASE 4 — Replicate the Stop hook into every routine's repository

Goal: every routine repo has `.claude/settings.json` and
`scripts/notify-on-stop.sh`, so the Stop hook fires at the end of every
routine session and emails the user via the Web App.

1. Open `<<<ROUTINES_PAGE_URL>>>` (the Routines list — same screen the user
   showed in their screenshot).
2. For each routine in the table EXCEPT any that are paused-and-local-only:
   a. Click the routine name to open its detail page.
   b. Locate the field labeled "Repository" or "Source" or "Branch". Record
      in RUN_LOG: `routine_name`, `repo_owner/repo_name`, and the
      `branch` it uses.
   c. Note whether the routine targets a specific subfolder; if so, hooks
      live at the REPO ROOT regardless — record the subfolder for
      reference but don't try to put `.claude/` inside it.
3. After all routines are catalogued, you should have a list shaped like:
   ```
   weekly-pkm-audit          → owner/repoA → main
   reps-sheet-appender       → owner/repoB → main
   weekly-knowledge-capture  → owner/repoC → main
   milhemvault-weekly-stewardship → owner/repoD → main
   reps-hour-logger          → owner/repoE → main
   ```
   Deduplicate: if two routines share the same repo+branch, you'll only
   need to commit once to that repo.
4. For EACH UNIQUE (repo, branch) pair from the deduplicated list:
   a. Open `https://github.com/{owner}/{repo_name}` in a new tab.
   b. Switch to the correct branch via the branch dropdown.
   c. Check whether `.claude/settings.json` already exists:
      - Navigate via the address bar to
        `https://github.com/{owner}/{repo_name}/blob/{branch}/.claude/settings.json`.
      - If GitHub shows a 404 page, the file does NOT exist — proceed
        with creation.
      - If the file exists, open it, click the pencil (Edit) and replace
        its contents with the framework version. Take care to PRESERVE
        any other top-level keys the user already had (e.g. `permissions`,
        `env`); merge — do not blindly overwrite. The hook stanza is the
        important addition.
   d. To CREATE (or update) `.claude/settings.json`:
      - In the GitHub repo root (Code tab), click **Add file** → **Create
        new file**.
      - Name field: type `.claude/settings.json` (the slash makes GitHub
        treat it as a path).
      - Body: fetch the canonical version from
        `<<<REPO_RAW_BASE>>>/.claude/settings.json` and paste it into the
        editor.
      - Commit message: `Add auto-email Stop hook for routine summaries`.
      - Description (optional): `Routes session-end summaries to my Gmail
        via the Apps Script Web App. Requires env vars WEBAPP_URL and
        APPS_SCRIPT_TOKEN.`
      - Commit directly to `{branch}` (NOT a PR) since these are private
        routine repos owned by the user.
      - Record the commit URL in RUN_LOG.
   e. Similarly create `scripts/notify-on-stop.sh`:
      - In the repo root → Add file → Create new file.
      - Name: `scripts/notify-on-stop.sh`.
      - Body: fetch from
        `<<<REPO_RAW_BASE>>>/scripts/notify-on-stop.sh` and paste.
      - Commit message: `Add Stop-hook script that posts session summary
        to Apps Script Web App`.
      - Commit directly to `{branch}`.
      - Record the commit URL in RUN_LOG.
   f. Mark the script executable. Since GitHub web doesn't expose chmod,
      this needs to be done either:
      - By the local clone the next time the user pulls (not your job), OR
      - Trust that the hook in `.claude/settings.json` invokes the script
        via `bash <path>` (which doesn't require the +x bit). Verify by
        opening the just-committed `.claude/settings.json` and confirming
        the command line starts with `bash "$CLAUDE_PROJECT_DIR/scripts/`.
        If it does, you're fine.
   g. Record completion under `REPOS_PATCHED` in RUN_LOG with the repo
      name and both commit URLs.

**Phase 4 success criteria:** every unique (repo, branch) hosting a Remote
routine has both files committed to the correct branch, and RUN_LOG
contains commit URLs for each.

---

## PHASE 5 — End-to-end smoke test

Goal: prove that running a routine actually produces an email.

1. Pick the cheapest, fastest-running routine from the user's list. Best
   candidates: `reps-hour-logger` or `weekly-pkm-audit`. If both look
   expensive, use `reps-sheet-appender` since we just verified its
   Apps Script side works.
2. Open `<<<ROUTINES_PAGE_URL>>>`. Click the routine. Look for a button
   labeled "Run now", "Trigger", "Test run", or similar. Click it.
3. If no "Run now" button exists, click the routine to open its detail
   page; there should be a manual trigger there. If still nothing, navigate
   to https://claude.ai/code/, start a new session against that routine's
   repo, and immediately type a benign prompt like
   `Print "hello" and stop.`. This will use the same Stop hook.
4. Wait for the session to enter "Stopped" / "Complete" state. Typical
   wait: 30 seconds – 3 minutes depending on routine.
5. Open https://mail.google.com in a new tab. Search for `from:me subject:Routine complete`.
   You should see a new email within ~60 seconds of the routine completing,
   with subject like `Routine complete: {repo_name}` and body containing
   "User turns: ... | Assistant turns: ... | Tool uses: ..." plus the
   final assistant message.
6. Open the email. Record the FULL subject line and the first 200
   characters of the body into RUN_LOG under `TEST_EMAIL`.
7. If no email arrives within 5 minutes:
   - Open the Apps Script execution log
     (`https://script.google.com/.../executions`) and check whether any
     calls to the `notify` action occurred. If yes but no email — check the
     `_log` sheet in the spreadsheet for an `event=notify-error` row.
     If no calls — the env vars likely aren't set; revisit Phase 3.
   - Record whichever diagnosis applies under `TEST_FAILURE_NOTES`.

**Phase 5 success criteria:** an email matching the expected pattern landed
in the user's inbox within 5 minutes of the routine completing.

---

## PHASE 6 — Final report

Compose a single message to me containing:

1. **WEBAPP_URL** and **TOKEN_VALUE** (the token, not the URL, is the secret —
   if you're worried about leaking, send me just the URL and tell me to fetch
   the token from Script Properties myself).
2. **ENVIRONMENTS_FOUND** and **ENV_VARS_APPLIED** lists from Phases 2–3.
3. **REPOS_PATCHED** list with commit URLs from Phase 4.
4. **THREADS_UNLABELED**, **report.itemsProcessed**, **report.rowsWritten**,
   and **report.failures** from Phase 1.
5. **TEST_EMAIL** subject + body excerpt from Phase 5.
6. Any errors, warnings, or odd states encountered (`TEST_FAILURE_NOTES`,
   etc.).
7. **OPEN QUESTIONS** — anything you couldn't resolve and want me to address.

Conclude with: "Setup complete; ready for the user to enable the paused
local routine if desired and to retire Zapier paths covered by these
routines."

===

## Notes for Comet (don't paste this last section — it's a quick reference for me, the user)

- If Comet can't find a UI for "environment variables" on a Claude Code
  environment, fall back to creating a `.env` file at the root of each
  routine repo containing:
  ```
  WEBAPP_URL=...
  APPS_SCRIPT_TOKEN=...
  ```
  and add `set -a; source .env; set +a` to the top of `scripts/notify-on-stop.sh`.
  This is suboptimal because it puts secrets in the repo — only do it if
  the repo is private AND the env-var UI genuinely doesn't exist.
- If Comet finds an existing `.claude/settings.json` in a target repo with
  hooks already configured, append our Stop hook entry to the existing
  `hooks.Stop` array rather than replacing.
- Apps Script's free quota: 6 minutes per execution, 90 minutes/day total
  for triggers, 100 emails/day for free Gmail (or 1500/day for Workspace).
  Your current routine count (6) sending ~1 email each at the end of a
  session = well within free Gmail quota.
- If you ever need to retire the auto-email, set `NOTIFY_DISABLED=1` in
  the relevant environment and remove the env var entirely from
  environments where you want it permanently off. The Stop hook will
  silently no-op.
