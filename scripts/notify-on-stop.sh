#!/usr/bin/env bash
# notify-on-stop.sh — Claude Code Stop-hook handler.
#
# Reads the session transcript from stdin (Claude Code passes the hook
# payload as JSON), extracts a concise summary (last assistant text plus
# light stats), and POSTs it to the Apps Script Web App so it lands in
# the user's Gmail. Designed to run in any Claude Code environment —
# local laptop OR Anthropic's cloud routine containers.
#
# Required env vars (set per-environment in Claude Code on the web, or
# in your shell rc locally):
#   WEBAPP_URL          full /exec URL of the Apps Script Web App
#   APPS_SCRIPT_TOKEN   shared secret matching ScriptProperty WEBAPP_TOKEN
#
# Optional:
#   NOTIFY_TAG          prepended to the subject (defaults to repo name)
#   NOTIFY_TO           override recipient (defaults to Apps Script REPORT_EMAIL)
#   NOTIFY_DISABLED=1   skip notification entirely
#   NOTIFY_MAX_CHARS    cap on body length (defaults to 8000)
#
# Exit codes:
#   0 always — never block Claude on a notification failure.

set -u

if [ "${NOTIFY_DISABLED:-0}" = "1" ]; then
  exit 0
fi
if [ -z "${WEBAPP_URL:-}" ] || [ -z "${APPS_SCRIPT_TOKEN:-}" ]; then
  # Silent no-op when not configured — lets the hook ship to repos that
  # haven't been wired up yet without breaking their sessions.
  exit 0
fi

PAYLOAD="$(cat || true)"
TRANSCRIPT_PATH="$(printf '%s' "$PAYLOAD" | python3 -c 'import sys,json
try:
  d=json.load(sys.stdin); print(d.get("transcript_path",""))
except Exception: pass' 2>/dev/null || true)"
SESSION_ID="$(printf '%s' "$PAYLOAD" | python3 -c 'import sys,json
try:
  d=json.load(sys.stdin); print(d.get("session_id",""))
except Exception: pass' 2>/dev/null || true)"
CWD="$(printf '%s' "$PAYLOAD" | python3 -c 'import sys,json
try:
  d=json.load(sys.stdin); print(d.get("cwd",""))
except Exception: pass' 2>/dev/null || true)"

REPO_NAME="$(basename "${CWD:-$PWD}")"
TAG="${NOTIFY_TAG:-$REPO_NAME}"
MAX_CHARS="${NOTIFY_MAX_CHARS:-8000}"

# Extract the final assistant message + a tiny tool-use tally.
SUMMARY="$(
  python3 - "$TRANSCRIPT_PATH" "$MAX_CHARS" <<'PY' 2>/dev/null || echo "(transcript unavailable)"
import sys, json, os
path = sys.argv[1] if len(sys.argv) > 1 else ""
cap = int(sys.argv[2]) if len(sys.argv) > 2 else 8000
if not path or not os.path.exists(path):
    print("(no transcript at " + (path or "<empty>") + ")")
    sys.exit(0)
last_text = ""
tool_uses = 0
user_turns = 0
assistant_turns = 0
with open(path, "r", errors="replace") as f:
    for line in f:
        line = line.strip()
        if not line:
            continue
        try:
            row = json.loads(line)
        except Exception:
            continue
        t = row.get("type")
        if t == "user":
            user_turns += 1
        elif t == "assistant":
            assistant_turns += 1
            msg = row.get("message", {}) or {}
            for block in (msg.get("content") or []):
                if isinstance(block, dict):
                    if block.get("type") == "tool_use":
                        tool_uses += 1
                    elif block.get("type") == "text":
                        last_text = block.get("text", "") or last_text
out = []
out.append(f"User turns: {user_turns}  |  Assistant turns: {assistant_turns}  |  Tool uses: {tool_uses}")
out.append("")
out.append("--- Final assistant message ---")
out.append(last_text or "(none)")
body = "\n".join(out)
print(body[:cap])
PY
)"

SUBJECT="Routine complete: ${REPO_NAME}"
if [ -n "${SESSION_ID:-}" ]; then
  SUBJECT="$SUBJECT (session ${SESSION_ID:0:8})"
fi

# Build JSON body safely with python — avoids shell quoting nightmares.
JSON_BODY="$(python3 - "$APPS_SCRIPT_TOKEN" "$SUBJECT" "$TAG" "$SUMMARY" "${NOTIFY_TO:-}" <<'PY'
import sys, json
token, subject, tag, body, to = sys.argv[1:6]
payload = {"token": token, "action": "notify", "subject": subject, "tag": tag, "body": body}
if to:
    payload["to"] = to
print(json.dumps(payload))
PY
)"

# Best-effort POST with a tight timeout — never block Claude on this.
curl -sS --max-time 15 -X POST "$WEBAPP_URL" \
  -H 'Content-Type: application/json' \
  --data "$JSON_BODY" >/dev/null 2>&1 || true

exit 0
