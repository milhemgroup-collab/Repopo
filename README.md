# Repopo

Two purposes:

1. **Claude Desktop MCP config** — corrected configuration for the Filesystem and obsidian-mcp-server connectivity issues
2. **PKM Audit Routine** — working directory for the automated weekly PKM audit that keeps Notion, Obsidian (MilhemVault), and the canonical Google Sheets in sync

## Files

### Claude Desktop MCP config
- **`claude_desktop_config.json`** — Fixed config template with corrected paths and commands
- **`MCP_TROUBLESHOOTING.md`** — Troubleshooting guide with root causes, fixes, and pre-launch checklist

### PKM Audit Routine
- **`CLAUDE.md`** — Persistent context loaded into every routine session (canonical IDs, source-of-truth hierarchy, open conflicts, stop conditions)
- **`.claude/settings.json`** — Hooks registration + pre-approved tool permissions for autonomous runs
- **`.claude/hooks/session-start.sh`** — SessionStart hook (sets TZ, prints banner, writes marker file)
- **`.claude/skills/pkm-audit/SKILL.md`** — Reusable skill wrapper around the weekly audit procedure (invokable mid-session via `Skill(skill="pkm-audit")`)
- **`prompts/weekly-pkm-audit.md`** — Paste-into-routine prompt for the scheduled weekly run
- **`prompts/on-demand-audit.md`** — Paste-into-routine prompt for applying user intake answers on demand

### Live routine
- **Routine URL:** https://claude.ai/code/routines/trig_0164Diw9WsLm2aKxKfbKikgA
- **Schedule:** Weekly, Monday 9:00 AM ET
- **First run:** Monday 2026-06-01 ~9:15 AM ET (output to `milhemgroup@gmail.com`)

## Setting up the routine (one-time, user-side)

1. Visit `claude.ai/customize/connectors` — confirm Notion, Google Drive, and Gmail are connected at the **claude.ai account level** (not just `claude mcp add` locally)
2. Visit `claude.ai/code/routines` → **New routine**
3. Paste the contents of `prompts/weekly-pkm-audit.md` as the Instructions
4. Select this repo (`milhemgroup-collab/repopo`)
5. Environment: **Default** (Trusted network access is sufficient)
6. Schedule: **Weekly Mondays 6:00 AM ET** (or whatever cadence you prefer)
7. Connectors: keep Notion, Google Drive, Gmail; add SEC EDGAR if you want ALTO catalyst monitoring
8. Click **Run now** once to validate the first run

## Verification

```bash
# Verify the SessionStart hook executes cleanly
CLAUDE_CODE_REMOTE=true CLAUDE_PROJECT_DIR=$(pwd) CLAUDE_ENV_FILE=/tmp/claude-env bash .claude/hooks/session-start.sh
cat /tmp/claude-env
ls -la .claude/.session-start-ran
```