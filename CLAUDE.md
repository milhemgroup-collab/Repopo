# Repopo — Claude guidance

## Single source of truth

Personal and system-wide Claude guidance lives at:

```
C:\Users\matts\My Drive\MilhemVault\CLAUDE.md
```

That file takes precedence over anything written here. Keep this file short
and repo-specific.

---

## Repo scope

This repo is the corrected MCP server config for Claude Desktop on Windows.
It is not a general-purpose project. Only changes that touch the MCP config
or its troubleshooting guide belong here.

---

## Where to look

- `claude_desktop_config.json` — canonical config template (the file to
  copy into Claude Desktop's config).
- `MCP_TROUBLESHOOTING.md` — pre-launch checklist, root causes, and fixes
  for the Filesystem and obsidian-mcp-server servers.
- `README.md` — one-paragraph repo overview.

---

## Editing rules

- Defer to the SSOT for general guidance; do not duplicate its content here.
- Any change to MCP server paths must stay in sync between
  `claude_desktop_config.json` and the path list in `MCP_TROUBLESHOOTING.md`
  (Issue 1 → Fix → step 1).
- Never commit a real `OBSIDIAN_API_KEY`. The placeholder
  `YOUR_API_KEY_HERE` (`claude_desktop_config.json:21`) must remain in the
  committed config.
