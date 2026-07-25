# AGENTS.md

## Project

Repopo is a **documentation and configuration reference** repository for a Windows
**Claude Desktop + Obsidian MCP** setup. It is not an application: there is no source
code, build pipeline, or runtime. It holds a sanitized Claude Desktop config template
and troubleshooting notes for Obsidian Model Context Protocol (MCP) servers.

- **Stack:** Markdown documentation + a single JSON config template.
- **Runtime/target:** Claude Desktop on Windows, talking to Obsidian's Local REST API.
- **No package manager**, no dependencies, no compiled artifacts.

## Build/Test/Lint

There is no build step. "Testing" means validating the JSON config and Markdown.

- **Validate JSON** (config must stay valid):
  - `python -m json.tool claude_desktop_config.json` (any platform with Python), or
  - `node -e "JSON.parse(require('fs').readFileSync('claude_desktop_config.json','utf8'))"`
- **Lint Markdown** (optional, if tooling is available):
  - `npx markdownlint-cli2 "**/*.md"`
- **Build:** none.

## Conventions

- **Docs:** plain GitHub-flavored Markdown, ATX headings (`#`, `##`). Example: `## Pre-Launch Checklist`.
- **Dates:** absolute ISO format. Example: `2026-06-22`.
- **Paths:** Windows-style with escaped backslashes inside JSON. Example: `C:\\Users\\matts\\...`.
- **Secrets:** never commit real keys. Use the placeholder `YOUR_OBSIDIAN_API_KEY_HERE`.

## Architecture

Flat layout at the root, plus one project subdirectory.

- `claude_desktop_config.json` — sanitized Claude Desktop MCP config template (entry point for the setup it documents).
- `MCP_TROUBLESHOOTING.md` — issue/symptom/fix runbook for the Obsidian MCP servers.
- `README.md` — overview and audit status for humans.
- `PERPLEXITY_INSTRUCTIONS.md` — canonical paste-ready text for the Perplexity Personalization and Memory settings instruction fields, plus the Drive-to-Notion memory bridge setup. Reference only; the live values are set in the Perplexity web UI.
- `gmail-assistant/` — reviewed source for the daily Gmail draft assistant (config, automation prompt, SQLite scripts, test fixtures). The runtime copy lives in the MilhemVault control folder; deploy per `gmail-assistant/UPGRADE.md`. Validate with a YAML parse of `config.yaml` and `python gmail-assistant/init_state.py <db> --check`.
- No module boundaries; files are independent reference documents.

## Boundaries

- Do **not** insert real API keys, hostnames, or personal file paths beyond the existing sanitized examples.
- Do **not** restructure or rewrite `MCP_TROUBLESHOOTING.md` content; it reflects an audited live setup.
- Treat `%APPDATA%\Claude\claude_desktop_config.json` as the real config — this repo only mirrors a template.

## Gotchas

- The JSON config intentionally contains the literal placeholder `YOUR_OBSIDIAN_API_KEY_HERE`; keep it.
- The repo documents a Windows-specific `.exe`-based setup; do not "port" the paths to other OSes.
- A "Legacy Note" in the docs references an older `npx`/filesystem-server setup — keep it as historical context, do not delete.
