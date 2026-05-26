# Comet browser prompt — Install Apps Script Routine Framework v2

> Paste everything between the `===` markers into Perplexity Comet. Replace
> `<<<...>>>` placeholders with your real values BEFORE pasting. When the
> prompt tells you to paste a file's contents, fetch it from this repo:
> `apps-script/<filename>` and paste verbatim.

===

You are taking over my Chrome browser. Do not pause to ask questions unless an
error blocks you; surface every result so I can verify each step. Use the user
account that's already signed into Google in this browser. Your job is to
install / refresh a Google Apps Script project that hosts a multi-routine
framework (current routine: REPS sheet-appender).

ARTIFACTS YOU WILL NEED:
- The 11 files in this repo at `apps-script/`:
  appsscript.json, 00_Code.gs, 01_Routines.gs, 02_Sources.gs, 03_Parsers.gs,
  04_Sinks.gs, 05_Dedupe.gs, 06_PostActions.gs, 07_Reliability.gs,
  08_REPS_Routine.gs, 09_Helpers.gs, 10_Tests.gs.
- The following values (substitute now, before you start):
  REPS_SHEET_ID = <<<your-spreadsheet-id>>>
  REPS_SHEET_TAB = <<<the-tab-name, e.g. Sheet1>>>
  REPS_GMAIL_QUERY = <<<your gmail search, e.g. from:reps-hour-logger@example.com subject:"BACKFILL">>>
  REPS_HOURS_FORMULA = <<<your D-column formula template, with {row} placeholder, e.g. =IF(B{row}="","",C{row}-B{row})*24>>>
  REPORT_EMAIL = <<<email for run reports, default milhemgroup@gmail.com>>>

STEPS:

1. OPEN OR CREATE THE PROJECT.
   - Navigate to https://script.google.com.
   - If there's an existing project named "REPS Sheet Appender" (or similar)
     from the earlier install, open it. Otherwise, click "New project" and
     name it "Routine Framework".

2. SHOW THE MANIFEST.
   - In the editor, click the gear icon (Project Settings) on the left.
   - Check "Show appsscript.json manifest file in editor". Save.
   - Return to the Editor view.

3. REPLACE EVERY FILE WITH THE FRAMEWORK FILES.
   For each of the 11 files listed above, in this exact order:
   a. If a file with that name already exists in the editor, click it and
      select-all + delete its contents.
   b. If it doesn't exist, click the + next to "Files" and add a new Script
      file (or HTML/JSON for appsscript.json) with the exact same name (do
      NOT include the .gs suffix when naming — Apps Script adds it).
   c. Paste in the contents I will provide for that file.
   d. Press Ctrl/Cmd+S to save.

   When all 11 files exist, DELETE any leftover .gs files from the previous
   install (e.g. "reps_sheet_appender", "Code" if it duplicates 00_Code,
   etc.). Be careful: do not delete one of the 11 framework files.

4. SET SCRIPT PROPERTIES.
   - Project Settings → "Script Properties" → "Edit script properties".
   - Add (or update) these rows:
       REPS_SHEET_ID         -> <<<your-spreadsheet-id>>>
       REPS_SHEET_TAB        -> <<<your-tab-name>>>
       REPS_GMAIL_QUERY      -> <<<your-gmail-search>>>
       REPS_HOURS_FORMULA    -> <<<your-formula-template>>>
       REPORT_EMAIL          -> <<<email>>>
       LOG_SHEET_ID          -> <<<same as REPS_SHEET_ID unless you have a separate log book>>>
   - Save.

5. RUN THE SMOKE TESTS FIRST (catches paste errors before touching live data).
   - In the editor, file dropdown → select 10_Tests.gs.
   - Function dropdown → testAll.
   - Click Run.
   - Authorize the OAuth scopes if prompted (Gmail modify/send, Sheets, Drive,
     Calendar, ScriptApp, external_request).
   - Open the Execution log (View → Logs, or the bottom panel). All 6 tests
     should print `"ok": true`. If any FAIL, stop and report the failure
     name + error message to me.

6. RUN SETUP.
   - File dropdown → 00_Code.gs.
   - Function dropdown → setup.
   - Click Run.
   - Expected log: `{ ok: true, routines: 1, version: "2.0.0" }`.
   - In Triggers (left sidebar, clock icon) you should see exactly one
     time-based trigger for runOnce, hourly.

7. ENABLE FAILURE NOTIFICATIONS ON THE TRIGGER.
   - On the triggers page, hover the runOnce row, click the three-dot menu.
   - Click the pencil icon (Edit trigger).
   - Failure notification settings → "Notify me immediately".
   - Save.

8. UNLABEL THE FAILED THREADS FROM THE PRIOR INSTALL.
   - File dropdown → 09_Helpers.gs.
   - Function dropdown → unlabelFailed.
   - Click Run.
   - Expected log: `{ ok: true, label: "REPS/AppendFailed", removed: N }` for some N ≥ 0.

9. PROCESS THE BACKLOG.
   - File dropdown → 09_Helpers.gs.
   - Function dropdown → runRepsOnce.
   - Click Run.
   - Wait for completion. Check the execution log: there should be a
     report JSON with `itemsProcessed`, `rowsWritten`, and an empty
     (or near-empty) `failures` array.
   - Open the REPS spreadsheet in another tab and confirm new rows appeared
     with the D-column formula populated.

10. (RE)DEPLOY THE WEB APP.
    - Deploy → Manage deployments. If there's an existing one, click the
      pencil → "New version" → Deploy. If not, Deploy → New deployment →
      type "Web app".
    - Execute as: Me. Who has access: Anyone (token-gated in code).
    - Save and copy the Web App URL.

11. CAPTURE OUTPUTS AND REPORT BACK TO ME.
    Send me a single message containing:
    - The Web App URL from step 10.
    - The value of the WEBAPP_TOKEN script property (Project Settings →
      Script Properties; copy the auto-generated value).
    - The `removed` count from step 8.
    - The report JSON from step 9 (especially `itemsProcessed`, `rowsWritten`,
      `failures`).
    - Any errors or non-obvious warnings.

NOTES:
- If at any step you hit "Authorization required", click through the
  consent screen using my logged-in account. Approve all scopes.
- If a file shows a red squiggly with a syntax error after paste, check
  for accidental smart-quotes or trailing whitespace; re-paste from source.
- Do not modify any .gs file contents — paste them verbatim.

===
