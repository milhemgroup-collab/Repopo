# MCP Server Troubleshooting Guide

This guide covers common issues with the Filesystem and obsidian-mcp-server MCP servers in Claude Desktop on Windows.

---

## Pre-Launch Checklist

Before starting Claude Desktop, ensure:

- [ ] **Google Drive for Desktop** is running and the `G:` drive is mounted
- [ ] All configured Google Drive folders exist at their exact paths
- [ ] **Obsidian** is open with the **Local REST API** plugin enabled
- [ ] The Local REST API plugin is listening on `http://127.0.0.1:27123`

---

## Issue 1: Filesystem Server — "Server disconnected"

### Symptoms
- Filesystem MCP server shows as disconnected in Settings > Developer
- Server crashes immediately on startup

### Root Cause
The `@modelcontextprotocol/server-filesystem` server validates all directory paths on startup. If **any single path** does not exist, the server crashes.

Common triggers:
- Google Drive for Desktop is not running (the `G:\` drive is not mounted)
- A folder was renamed or deleted (e.g., `G:\My Drive\5. AI Guides`)
- A typo in the folder path in the config

### Fix

1. Open File Explorer and verify **every** path listed in the `args` array exists exactly as written:
   - `G:\My Drive\1. Milhem Group_gdrive`
   - `G:\My Drive\2. Master Personal Data - Back up files`
   - `G:\My Drive\3. Spend Analysis`
   - `G:\My Drive\4. Finance & Spend Analysis`
   - `G:\My Drive\5. AI Guides`
2. If a folder no longer exists, either recreate it or remove/update the path in the config
3. Make sure Google Drive for Desktop is running before launching Claude Desktop

---

## Issue 2: obsidian-mcp-server — "Server disconnected"

### Symptoms
- obsidian-mcp-server shows as disconnected in Settings > Developer
- Server fails to start

### Root Cause
Using bare `"command": "npx"` does not always resolve on Windows. The system cannot find the `npx` executable without the full path and `.cmd` extension.

### Fix

Replace the command in your config:

**Before (broken):**
```json
"command": "npx"
```

**After (fixed):**
```json
"command": "C:\\Program Files\\nodejs\\npx.cmd"
```

Also ensure:
- Obsidian is running
- The **Local REST API** plugin is installed and enabled in Obsidian
- The API key in the config matches the one set in the plugin settings

---

## Applying Changes

1. Open Claude Desktop config: **Settings > Developer > Edit Config**
2. Apply the fixes from `claude_desktop_config.json` in this repo
3. Replace `YOUR_API_KEY_HERE` with your actual Obsidian REST API key
4. Fully quit Claude Desktop (right-click system tray icon > **Exit**)
5. Relaunch Claude Desktop
6. Verify both servers show green in **Settings > Developer**
