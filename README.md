# Repopo

Windows Claude Desktop MCP reference files for the current Obsidian-based setup.

## Audit Status

Audited on 2026-06-22 against the live config at `%APPDATA%\\Claude\\claude_desktop_config.json`.

The repo previously documented an older `npx` plus filesystem-server setup. The live config now uses:

- `obsidian` via `mcp-obsidian.exe`
- `obsidian-mcp-tools` via the plugin-bundled `mcp-server.exe`
- Obsidian Local REST API host `127.0.0.1`
- Obsidian Local REST API port `27124`

This repo now keeps a sanitized template that matches the current structure without exposing the real API key.

## Files

- `claude_desktop_config.json`: sanitized current template for Claude Desktop
- `MCP_TROUBLESHOOTING.md`: current troubleshooting notes plus legacy context
- `gmail-assistant/`: reviewed source for the daily Gmail draft assistant (deployed to the MilhemVault control folder, see `gmail-assistant/UPGRADE.md`)
- `repstracker-candidate-search/`: reviewed source for the REPStracker candidate search skill (sweeps Gmail, Calendar, Drive, and logs for unlogged REPS hours)

## Important Notes

- Replace `YOUR_OBSIDIAN_API_KEY_HERE` before using the template.
- Keep the real config in `%APPDATA%\\Claude\\claude_desktop_config.json`.
- Do not treat this repo as the source of truth for personal preferences that do not affect MCP server startup.

## Project Structure

```
.
├── claude_desktop_config.json   # Sanitized Claude Desktop MCP config template
├── MCP_TROUBLESHOOTING.md       # Issue/symptom/fix runbook for Obsidian MCP servers
├── gmail-assistant/             # Gmail draft assistant: config, prompt, scripts, tests
├── repstracker-candidate-search/ # REPS hour candidate sweep skill (SKILL.md)
├── README.md                    # This file
├── AGENTS.md                    # Instructions for AI coding agents
└── CLAUDE.md                    # Claude Code wrapper pointing at AGENTS.md
```

## License

Released under the [MIT License](LICENSE). Copyright (c) 2026 Milhem Group Properties.
