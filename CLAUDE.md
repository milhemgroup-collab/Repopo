# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

This is a **documentation + configuration** repository (no application code, no build system, no tests). It exists to share a working `claude_desktop_config.json` for Claude Desktop on Windows and to document fixes for two recurring MCP server failures (Filesystem and `obsidian-mcp-server`).

There is nothing to build, lint, or test. Changes are validated by hand: copy the config into Claude Desktop, fully quit and relaunch, and confirm both servers show green in **Settings > Developer**.

## Files

- `claude_desktop_config.json` — canonical, working MCP server config template. Two servers are configured: `filesystem` (with hard-coded `G:\My Drive\...` paths) and `obsidian-mcp-server`.
- `MCP_TROUBLESHOOTING.md` — user-facing troubleshooting guide. The pre-launch checklist and the two "Issue" sections are the source of truth for known failure modes.
- `README.md` — one-paragraph overview pointing at the two files above.

## Conventions When Editing

These are non-obvious rules driven by the Windows + Claude Desktop environment this repo targets:

- **Always use the full path `C:\\Program Files\\nodejs\\npx.cmd` for `command`**, never bare `"npx"`. Bare `npx` fails to resolve on Windows and is the documented root cause of "Server disconnected" for both servers. Any new MCP server added to the config must follow the same pattern.
- **JSON paths use double-escaped backslashes** (`G:\\My Drive\\...`) because the file is JSON, while the troubleshooting doc shows the same paths as single-backslash Windows paths (`G:\My Drive\...`). Keep both in sync when adding/removing/renaming a path.
- **The Filesystem server crashes on startup if any single `args` path does not exist.** When adding a path, confirm it exists in Google Drive for Desktop; when removing one, also remove the matching bullet in `MCP_TROUBLESHOOTING.md` Issue 1.
- **Never commit a real Obsidian API key.** The committed value is the literal placeholder `YOUR_API_KEY_HERE`; the troubleshooting guide instructs users to replace it locally.
- The repo is consumed as a **template** — users copy `claude_desktop_config.json` into their own Claude Desktop config. Treat the committed file as documentation, not as a live config: don't add user-specific paths or secrets.

## Workflow

Develop on the branch specified by the current task (e.g. `claude/add-claude-documentation-DMz81`), commit with descriptive messages, and push to that same branch. Do not open PRs unless explicitly asked.
