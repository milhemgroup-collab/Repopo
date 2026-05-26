# `clasp` setup — edit Apps Script from Claude Code directly

Five minutes once, then any future change to `Code.gs`, parsers, sinks, etc.
ships from this repo with `clasp push` instead of copy-paste into the editor.

## One-time setup (on your local machine)

```bash
# 1. Install clasp
npm install -g @google/clasp

# 2. Log in (opens browser)
clasp login

# 3. Enable the Apps Script API at https://script.google.com/home/usersettings
#    (one click — toggle to "On")
```

## Connect this repo to your Apps Script project

You have an Apps Script project already (the one Comet created). Find its
script ID from `https://script.google.com/home/projects/<SCRIPT_ID>/edit` —
copy `<SCRIPT_ID>`.

```bash
cd apps-script
cat > .clasp.json <<JSON
{
  "scriptId": "<SCRIPT_ID>",
  "rootDir": "."
}
JSON

# Pull whatever's in the live project (sanity check)
clasp pull

# Push this framework over it
clasp push
```

After `clasp push` you should see ten `.gs` files plus `appsscript.json` in
the Apps Script editor.

## Day-to-day workflow

```bash
# Edit any .gs file locally with your editor of choice (or Claude Code).
clasp push                        # ship to Apps Script
clasp run runRepsOnce             # run via clasp (requires Apps Script API + login)
clasp logs --watch                # stream Stackdriver logs
clasp open                        # open the editor in a browser
clasp deploy --description "..."  # bump the Web App deployment
```

## Why this matters for Claude Code

Once `.clasp.json` is committed and `clasp` is in your shell, Claude Code can:

- read and edit `00_Code.gs` directly (no browser copy-paste)
- run `clasp push` from `Bash` to ship changes
- run `clasp logs` from `Bash` to read execution output
- trigger routines with `clasp run` or via the Web App `curl`

That makes the Apps Script project a first-class development surface for any
agent working from this repo.

## Security note

`.clasp.json` contains your script ID but no secret. Don't check in
`~/.clasprc.json` (your OAuth token); it stays in your home directory.
