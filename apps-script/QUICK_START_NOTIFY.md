# 5-Minute Manual Setup: Auto-email from Claude Routines

No Comet, no multi-file framework. One Apps Script file, six clicks, two
env vars. After this, every Claude routine session in `milhemgroup-collab/Repopo`
will automatically email you a summary when it ends — even with your computer off.

## Why this exists separately

The `COMET_FULL_SETUP.md` install ran into a real Comet limitation: Comet
streams characters one at a time into the Apps Script editor, which mangles
backslashes and regex literals. The full Routine Framework has many files
with regex-heavy code, so Comet kept stalling.

This minimal version sidesteps that entirely: **one file, ~80 lines, you
paste it yourself**. The REPS-specific stuff (parser, sheet appender,
dedupe) is independent and can be added later from the same repo without
breaking this.

## What you'll have when done

```
Claude routine completes (in Anthropic's cloud, your laptop can be off)
   ↓ Stop hook fires automatically  (already committed to Repopo)
   ↓ Hook script POSTs session summary to your Apps Script Web App
   ↓ Apps Script emails you at milhemgroup@gmail.com
```

## Step-by-step (do this yourself, no Comet)

### 1. Create the Apps Script project (~1 minute)

1. Open https://script.google.com in a browser logged into
   `milhemgroup@gmail.com`.
2. Click **New project** (top-left).
3. Rename it from "Untitled project" to **Claude Notify** (or anything).
4. Delete the placeholder `function myFunction() { ... }` in Code.gs.

### 2. Paste the script (~1 minute)

1. In a new tab, open the raw file:
   https://raw.githubusercontent.com/milhemgroup-collab/Repopo/claude/charming-franklin-xJ7we/apps-script/MINIMAL_NOTIFY.gs
2. Select all (Ctrl/Cmd+A), copy (Ctrl/Cmd+C).
3. Switch back to the Apps Script editor, click into Code.gs, paste.
4. Save with Ctrl/Cmd+S. The tab should show "Code.gs" with no asterisk.

### 3. Run `setup` and authorize (~1 minute)

1. In the editor's toolbar, the function dropdown should show "setup"
   (or pick it from the list).
2. Click **Run**.
3. Authorization dialog: click **Review permissions** → pick your
   `milhemgroup@gmail.com` account → click **Advanced** → **Go to
   Claude Notify (unsafe)** → **Allow**. (Google flags any unverified
   script as "unsafe"; this is yours, so it's fine.)
4. `setup` runs and logs something like:
   ```
   { ok: true, token: "abc123...", email: "milhemgroup@gmail.com" }
   ```
5. **Copy that `token` value** into a notes app — you need it in step 5.

### 4. Deploy as a Web App (~1 minute)

1. Top-right: **Deploy** → **New deployment**.
2. Click the gear icon next to "Select type" → choose **Web app**.
3. Description: `Claude routine notifier`.
4. Execute as: **Me (milhemgroup@gmail.com)**.
5. Who has access: **Anyone**. (Required so Anthropic's cloud routines
   can reach it. Your token check is what actually gates access.)
6. Click **Deploy**.
7. **Copy the Web app URL** (ends in `/exec`).
8. Click Done.

### 5. Set the env vars in Claude Code (~1 minute)

1. Open https://code.claude.com (or wherever your Claude Code on the web
   lives).
2. Settings → Environments. Find the environment that's used by your
   remote routines (the one wired to `milhemgroup-collab/Repopo`).
3. Click into it. Find the **Environment variables** section.
4. Add two variables:

   | Name | Value |
   |------|-------|
   | `WEBAPP_URL` | The `/exec` URL from step 4.7 |
   | `APPS_SCRIPT_TOKEN` | The `token` value from step 3.5 |

5. Save.

### 6. Test (~30 seconds)

Pick the cheapest remote routine (`reps-hour-logger` is a good choice).
Click it → "Run now" (or trigger it however you normally do).

Wait for it to finish. Within ~30 seconds of completion, check your
inbox. You should see an email:

> **Subject:** Routine complete: Repopo (session abc12345)
>
> User turns: N  |  Assistant turns: N  |  Tool uses: N
>
> --- Final assistant message ---
> (whatever the routine said at the end)

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| No email arrives | Env vars not set, or wrong environment | Re-check step 5; make sure the env vars are on the env the routine actually uses |
| Email arrives but body is empty / "(no transcript)" | Transcript path differs in cloud routines | Open Apps Script → Executions; check the `notify` call's body. The hook is best-effort; missing transcript = empty body, not a hard failure |
| "unauthorized" response from a curl test | Token mismatch | Re-copy from Project Settings → Script properties → WEBAPP_TOKEN |
| Anthropic env-var UI doesn't show env vars | Plan limitation | Fall back to a `.env` file at repo root (set `WEBAPP_URL` and `APPS_SCRIPT_TOKEN`) — the hook script can source it. Tell me and I'll add the sourcing line. |

## Sanity-check the Web App from your terminal

```bash
URL='https://script.google.com/macros/s/.../exec'   # your /exec URL
TOK='abc123...'                                       # your token

# Status check (no email sent)
curl -s "$URL?action=status&token=$TOK"
# → {"ok":true,"version":"notify-1.0.0"}

# Send a test email
curl -sX POST "$URL" \
  -H 'Content-Type: application/json' \
  -d "{\"token\":\"$TOK\",\"action\":\"notify\",\"subject\":\"test\",\"body\":\"hello from terminal\"}"
# → {"ok":true,"to":"milhemgroup@gmail.com","subject":"test"}
# → email lands in your inbox
```

## What you DON'T need to do

- ❌ Comet automation (it can't paste regex reliably).
- ❌ The 12-file Routine Framework install (skip until you actually need REPS again).
- ❌ Touch the existing broken "REPS Appender" project. Leave it paused or unused; this is a separate, clean project.
- ❌ Set up the hook in other repos. All your remote routines are in `milhemgroup-collab/Repopo`, where the hook is already committed at `.claude/settings.json` and `scripts/notify-on-stop.sh`.

## After this works

If you later want the REPS routine running through this framework instead
of the broken "REPS Appender" project:

1. Tell me, and I'll walk you through adding the rest of the framework
   files into the same "Claude Notify" project (or a separate one if you
   prefer).
2. Or fix the existing REPS Appender directly — the bug you flagged
   (`Summary` keyword matching inside column headers) is a one-line regex
   patch that you can apply yourself by hand in 30 seconds.
