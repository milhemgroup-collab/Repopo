# CLAUDE.md

## Project Overview

Repopo is a reference repo for Claude Desktop MCP server configuration on Windows. It contains a working `claude_desktop_config.json` template and a troubleshooting guide for common MCP connectivity issues.

## Scope

- This repo is **Windows-only** — do not add macOS/Linux configs or instructions
- Focused on Claude Desktop MCP server configuration

## Repository Structure

- `claude_desktop_config.json` — Working MCP config template (Windows paths, full `npx.cmd` path)
- `MCP_TROUBLESHOOTING.md` — Troubleshooting guide: root causes, symptoms, step-by-step fixes
- `README.md` — Project summary and file list

## Key Context

- Target platform: **Windows** with Google Drive for Desktop and Obsidian
- MCP servers: `@modelcontextprotocol/server-filesystem`, `obsidian-mcp-server`
- Critical Windows fix: use `C:\Program Files\nodejs\npx.cmd` instead of bare `npx`
- Filesystem server validates all directory paths on startup — any missing path crashes it
- Obsidian server requires the Local REST API plugin on `http://127.0.0.1:27123`

## Gotchas

- **Never commit real API keys** — use placeholder `YOUR_API_KEY_HERE`
- **Bare `npx` fails on Windows** — always use the full `C:\Program Files\nodejs\npx.cmd` path
- **All filesystem server paths must exist** — if any path in `args` is missing, the server crashes on startup
- **Google Drive must be mounted** before testing the filesystem server (the `G:\` drive)

## Validation Workflow

No build/lint/test commands — this is a config-only repo. To validate changes:

1. Copy `claude_desktop_config.json` to `%APPDATA%\Claude\claude_desktop_config.json`
2. Replace `YOUR_API_KEY_HERE` with the actual Obsidian REST API key
3. Fully quit and relaunch Claude Desktop
4. Check **Settings > Developer** — both servers should show green

## Task Directives

### Adding a new MCP server
1. Add the server entry to `claude_desktop_config.json` using the full `npx.cmd` path pattern
2. Add a troubleshooting section to `MCP_TROUBLESHOOTING.md` (follow existing format: Symptoms → Root Cause → Fix)
3. Add a pre-launch checklist item for the new server
4. Update the `README.md` file list if any new files are created

### Updating docs
- Keep text concise — bullet points over paragraphs
- Use Markdown checklists (`- [ ]`) for verification steps
- Follow existing structure: root cause, symptoms, step-by-step fix

### Troubleshooting issues
- Document the root cause, not just the fix
- Add pre-launch checklist items to prevent recurrence

## Conventions

- JSON paths use Windows double-backslash escaping (`\\`)
- Sensitive values use placeholders — never commit real keys or tokens
- Keep all three files in sync when making changes
