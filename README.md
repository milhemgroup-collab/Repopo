# Repopo

Windows Claude Desktop MCP reference files for the current Obsidian-based setup.

## Purpose

Repopo keeps a safe example Claude Desktop MCP config plus troubleshooting notes for the current Obsidian MCP setup on Windows. It is not a general app, package, or personal live config store.

## Audit Status

Audited on 2026-06-22 against the live config at `%APPDATA%\\Claude\\claude_desktop_config.json`.

The current live structure uses:

- `obsidian` via `mcp-obsidian.exe`
- `obsidian-mcp-tools` via the plugin-bundled `mcp-server.exe`
- Obsidian Local REST API host `127.0.0.1`
- Obsidian Local REST API port `27124`

This repo keeps a sanitized example template that matches the current structure without exposing real API keys or private local paths.

## Quick Start

1. Copy `claude_desktop_config.example.json` into your local Claude Desktop config location.
2. Replace the example executable paths with paths that exist on your machine.
3. Replace `YOUR_OBSIDIAN_API_KEY_HERE` with your Obsidian Local REST API key in your local copy only.
4. Fully quit Claude Desktop from the system tray, relaunch it, and confirm both MCP servers are green in Settings > Developer.
5. Run the validator before committing any repo changes:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\Test-Repopo.ps1
```

## Files

| File | Purpose |
|---|---|
| `claude_desktop_config.example.json` | Safe template for the current Claude Desktop Obsidian MCP config. |
| `MCP_TROUBLESHOOTING.md` | Troubleshooting notes for the current Obsidian MCP setup. |
| `COWORK_TROUBLESHOOTING.md` | Read-only Cowork troubleshooting notes with admin-change warnings. |
| `AGENTS.md` | Repo-specific instructions for Codex and other agents. |
| `CLAUDE.md` | Short Claude-specific repo guidance. |
| `.gitignore` | Keeps local secrets, logs, and machine-specific configs out of commits. |
| `.github/workflows/validate.yml` | Runs repo validation in GitHub Actions. |
| `scripts/Test-Repopo.ps1` | Validates config shape, placeholders, and secret/path hygiene. |

## Validation

The validator checks that the example config parses, contains the expected current MCP servers, keeps the Obsidian API key placeholder, uses the expected host and port, and avoids obvious secrets or personal machine paths.

GitHub Actions runs the same validation on pull requests and pushes to `main`.

## Safety

Do not commit a real `claude_desktop_config.json`, API key, token, password, or machine-specific private path. Keep personal config copies in ignored local files such as `claude_desktop_config.local.json`.

## Troubleshooting

- Use `MCP_TROUBLESHOOTING.md` for current Obsidian MCP server startup failures.
- Use `COWORK_TROUBLESHOOTING.md` only as a read-only guide before making admin-level Windows changes.
