# MCP Server Troubleshooting Guide

This guide covers common Filesystem and `obsidian-mcp-server` failures in Claude Desktop on Windows.

## Pre-Launch Checklist

Before starting Claude Desktop, verify:

- [ ] Google Drive for Desktop is running if your filesystem paths use a Drive mount.
- [ ] Every filesystem folder in `claude_desktop_config.example.json` has been replaced with a folder that exists on your machine.
- [ ] Obsidian is open with the Local REST API plugin enabled.
- [ ] The Local REST API plugin is listening on `http://127.0.0.1:27123`.
- [ ] Your local config contains your real Obsidian API key, while the committed example keeps `YOUR_API_KEY_HERE`.

## Issue 1: Filesystem Server "Server disconnected"

### Symptoms

- Filesystem MCP server shows as disconnected in Settings > Developer.
- Server exits immediately on Claude Desktop startup.

### Root Cause

Two common causes:

1. Bare command usage. On Windows, `"command": "npx"` often fails to resolve. Use the full command path instead:

```json
"command": "C:\\Program Files\\nodejs\\npx.cmd"
```

2. Missing directory paths. The Filesystem server validates every configured directory on startup. If any path is missing, the server can exit.

### Fix

1. Confirm the Filesystem server command is exactly:

```json
"command": "C:\\Program Files\\nodejs\\npx.cmd"
```

2. Replace the example paths in the `args` array with real local folders. For example:

```json
"G:\\My Drive\\Example Vault"
```

3. Open File Explorer and verify each configured folder exists exactly as written.
4. Restart Claude Desktop after saving the local config.

## Issue 2: obsidian-mcp-server "Server disconnected"

### Symptoms

- `obsidian-mcp-server` shows as disconnected in Settings > Developer.
- Server fails to start even though Obsidian is open.

### Root Cause

The Obsidian server can fail when Windows cannot resolve a bare `npx` command, when Obsidian is closed, or when the Local REST API key does not match the local plugin settings.

### Fix

1. Confirm the Obsidian server command is exactly:

```json
"command": "C:\\Program Files\\nodejs\\npx.cmd"
```

2. Confirm the server args contain:

```json
"obsidian-mcp-server"
```

3. Confirm Obsidian is open and the Local REST API plugin is enabled.
4. In your local config only, replace `YOUR_API_KEY_HERE` with the key from Obsidian's Local REST API settings.
5. Confirm the base URL is still:

```json
"OBSIDIAN_BASE_URL": "http://127.0.0.1:27123"
```

## Applying Changes

1. Open Claude Desktop config from Settings > Developer > Edit Config.
2. Use `claude_desktop_config.example.json` as the template.
3. Keep personal paths and real API keys in your local config only.
4. Fully quit Claude Desktop from the system tray.
5. Relaunch Claude Desktop.
6. Verify both servers show green in Settings > Developer.

## Validation

Run this before committing repo changes:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\Test-Repopo.ps1
```

The validator checks JSON parsing, server names, `npx.cmd` command usage, placeholder safety, and personal-path hygiene.
