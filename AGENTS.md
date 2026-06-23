# AGENTS.md - Repopo

## Repo Scope

This repo is only for Claude Desktop MCP example config and troubleshooting on Windows.

Do not turn this into a general automation repo, app repo, or personal config archive.

## Safety Rules

- Prefer an example config over personal machine configs.
- Never commit a real API key, token, password, or private machine-specific path.
- Keep config and docs in sync when server names, commands, args, paths, or env vars change.
- Preserve Windows JSON path escaping, for example `C:\\Program Files\\nodejs\\npx.cmd`.
- Keep `YOUR_API_KEY_HERE` in committed examples.

## Expected Files

- `claude_desktop_config.example.json` is the committed config template.
- `MCP_TROUBLESHOOTING.md` explains Filesystem and Obsidian MCP failures.
- `COWORK_TROUBLESHOOTING.md` is read-only guidance for admin-level Cowork troubleshooting.
- `scripts/Test-Repopo.ps1` is the local and CI validator.

## Validation

Run this before committing:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\Test-Repopo.ps1
```
