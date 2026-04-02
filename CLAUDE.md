# CLAUDE.md

## Project Overview

**Repopo** is a configuration and troubleshooting repository for fixing Model Context Protocol (MCP) server connectivity issues in Claude Desktop on Windows. It contains a corrected MCP config template and a troubleshooting guide — no application code.

## Repository Structure

```
Repopo/
├── CLAUDE.md                        # This file — guidance for AI assistants
├── README.md                        # Project overview and file listing
├── MCP_TROUBLESHOOTING.md           # Troubleshooting guide (root causes, fixes, pre-launch checklist)
└── claude_desktop_config.json       # Fixed MCP server config template for Claude Desktop
```

This is a flat, documentation-only repository with no subdirectories, no build system, and no application code.

## Key Files

- **`claude_desktop_config.json`** — Working MCP server configuration for two servers:
  - `filesystem` — provides access to Google Drive folders via `@modelcontextprotocol/server-filesystem`
  - `obsidian-mcp-server` — integrates with Obsidian via the Local REST API plugin
- **`MCP_TROUBLESHOOTING.md`** — Documents two resolved issues:
  1. Filesystem server crash from missing directory paths or bare `npx` command
  2. obsidian-mcp-server failure from bare `npx` on Windows (needs full `npx.cmd` path)

## Technical Context

- **Platform:** Windows-specific (paths use `C:\`, `G:\` drive, `.cmd` extensions)
- **Dependencies (external, not managed here):**
  - Node.js (for `npx.cmd`)
  - Google Drive for Desktop (mounts `G:` drive)
  - Obsidian with Local REST API plugin (on `http://127.0.0.1:27123`)
- **Languages:** JSON (config), Markdown (documentation)
- **No build, test, or lint tooling** — this repo has no package.json, CI/CD, or testing setup

## Conventions

### Editing Guidelines

- **JSON config:** Maintain the existing structure in `claude_desktop_config.json`. All Windows paths must use double-backslash escaping (`\\`). The `command` field must always use the full path `C:\\Program Files\\nodejs\\npx.cmd`, never bare `npx`.
- **Documentation:** Keep `MCP_TROUBLESHOOTING.md` in sync with any config changes. Update root causes, fixes, and the pre-launch checklist as needed.
- **Sensitive values:** Never commit real API keys. Use the placeholder `YOUR_API_KEY_HERE` for the Obsidian API key.

### Commit Style

- Short, descriptive commit messages focused on what was fixed or added
- Co-author attribution when collaborating with humans (use `Co-authored-by:` trailer)
- Reference Claude Code session URLs in commit messages when applicable

### Branch Strategy

- `main` — stable, reviewed configuration
- Feature/fix branches for changes before merging to main

## Common Tasks

### Adding a new Google Drive folder
1. Add the full `G:\My Drive\...` path to the `args` array in `claude_desktop_config.json`
2. Update the path list in `MCP_TROUBLESHOOTING.md` (Issue 1 > Fix section)
3. Verify the folder exists on disk before committing

### Adding a new MCP server
1. Add a new entry under `mcpServers` in `claude_desktop_config.json`
2. Use the full `C:\\Program Files\\nodejs\\npx.cmd` path as the command (not bare `npx`)
3. Document any new troubleshooting steps in `MCP_TROUBLESHOOTING.md`

### Updating the troubleshooting guide
- Keep the existing structure: Symptoms > Root Cause > Fix
- Include the Pre-Launch Checklist at the top
- End with the "Applying Changes" section
