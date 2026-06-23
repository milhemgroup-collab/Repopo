# Repopo

Small Windows-focused reference repo for Claude Desktop MCP configuration and troubleshooting.

## Purpose

Repopo keeps a safe example Claude Desktop MCP config plus notes for fixing common Windows startup failures. It is not a general app, package, or personal live config store.

## Quick Start

1. Copy `claude_desktop_config.example.json` to your local Claude Desktop config location.
2. Replace the example filesystem paths with folders that exist on your machine.
3. Replace `YOUR_API_KEY_HERE` with your Obsidian Local REST API key in your local copy only.
4. Fully quit Claude Desktop from the system tray, relaunch it, and confirm both MCP servers are green in Settings > Developer.
5. Run the validator before committing any repo changes:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\Test-Repopo.ps1
```

## Files

| File | Purpose |
|---|---|
| `claude_desktop_config.example.json` | Safe template for the Claude Desktop MCP config. |
| `MCP_TROUBLESHOOTING.md` | Fixes for Filesystem and Obsidian MCP startup issues. |
| `COWORK_TROUBLESHOOTING.md` | Read-only Cowork troubleshooting notes with admin-change warnings. |
| `AGENTS.md` | Repo-specific instructions for Codex and other agents. |
| `CLAUDE.md` | Short Claude-specific repo guidance. |
| `.gitignore` | Keeps local secrets, logs, and machine-specific configs out of commits. |
| `.github/workflows/validate.yml` | Runs repo validation in GitHub Actions. |
| `scripts/Test-Repopo.ps1` | Validates config shape, placeholders, and secret/path hygiene. |

## Validation

The validator checks that the example config parses, contains the expected MCP servers, uses the Windows-safe `C:\\Program Files\\nodejs\\npx.cmd` command, keeps the Obsidian API key placeholder, and avoids obvious secrets or personal machine paths.

GitHub Actions runs the same validation on pull requests and pushes to `main`.

## Safety

Do not commit a real `claude_desktop_config.json`, API key, token, password, or machine-specific private path. Keep personal config copies in ignored local files such as `claude_desktop_config.local.json`.

## Troubleshooting

- Use `MCP_TROUBLESHOOTING.md` for Filesystem and Obsidian MCP server startup failures.
- Use `COWORK_TROUBLESHOOTING.md` only as a read-only guide before making admin-level Windows changes.
