# Repopo - Claude Guidance

General guidance lives outside this repo. Keep this file short and repo-specific.

## Scope

Repopo is the safe example config and troubleshooting reference for Claude Desktop MCP servers on Windows.

## Editing Rules

- Keep `claude_desktop_config.example.json` as an example config, not a real personal config.
- Never commit a real API key or token.
- Keep config and docs in sync.
- Preserve escaped Windows paths in JSON.
- Run `powershell -ExecutionPolicy Bypass -File .\scripts\Test-Repopo.ps1` before committing.
