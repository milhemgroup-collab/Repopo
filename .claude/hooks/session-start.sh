#!/bin/bash
# SessionStart hook for the Milhem Group PKM audit routine.
# Runs before each Claude Code session begins. Sets timezone, prints a
# session banner, and writes a marker file the audit prompt can read to
# verify the hook actually ran.
set -euo pipefail

# Timezone: routine schedule and timestamps should match user's wall-clock.
echo "export TZ=America/New_York" >> "${CLAUDE_ENV_FILE:-/dev/null}"
export TZ=America/New_York

# Banner: helpful when reviewing run transcripts later.
echo "==================================================================="
echo "Milhem Group PKM Audit Routine — session start"
echo "Date:        $(date -Iseconds)"
echo "CWD:         ${CLAUDE_PROJECT_DIR:-$(pwd)}"
echo "Remote env:  ${CLAUDE_CODE_REMOTE:-false}"
echo "Session ID:  $(jq -r .session_id 2>/dev/null < /dev/stdin || echo 'n/a')"
echo "==================================================================="

# Marker file the audit prompt can stat() to confirm the hook executed.
# Lives at the project root so the prompt finds it without env-var lookup.
marker="${CLAUDE_PROJECT_DIR:-$(pwd)}/.claude/.session-start-ran"
date -Iseconds > "$marker"

exit 0
