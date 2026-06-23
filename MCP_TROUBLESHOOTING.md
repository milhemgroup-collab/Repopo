# MCP Troubleshooting Guide

This guide covers the current Obsidian MCP setup for Claude Desktop on Windows.

## Current Baseline

As of 2026-06-22, the live Claude Desktop config uses:

- Config path: `%APPDATA%\\Claude\\claude_desktop_config.json`
- `obsidian` server command: `mcp-obsidian.exe`
- `obsidian-mcp-tools` server command: plugin-bundled `mcp-server.exe`
- Local REST API host: `127.0.0.1`
- Local REST API port: `27124`

This repo's `claude_desktop_config.json` is a sanitized template that matches that structure.

## Pre-Launch Checklist

Before starting Claude Desktop, ensure:

- Obsidian is open
- The Local REST API plugin is enabled
- The Local REST API plugin is listening on the same host and port as the config
- `mcp-obsidian.exe` exists at the configured path
- `mcp-server.exe` exists in the `mcp-tools` plugin folder
- The API key in the config matches the key in Obsidian

## Issue 1: Editing the Wrong Config File

### Symptoms

- Changes seem to save but do not affect Claude Desktop
- MCP server status does not change after restart

### Root Cause

The active file is `%APPDATA%\\Claude\\claude_desktop_config.json`. Older notes that point somewhere else can send you to the wrong file.

### Fix

1. Open Claude Desktop
2. Go to `Settings > Developer > Edit Config`
3. Confirm the file being edited is `%APPDATA%\\Claude\\claude_desktop_config.json`
4. Apply changes there
5. Fully quit Claude Desktop and relaunch

## Issue 2: `mcp-obsidian.exe` Missing or Moved

### Symptoms

- The `obsidian` MCP server shows disconnected
- Claude Desktop reports that the command cannot be found

### Root Cause

The Python install path changed, the executable was removed, or the environment was rebuilt.

### Fix

1. Verify this file exists:
   - `C:\\Users\\matts\\AppData\\Local\\Python\\pythoncore-3.14-64\\Scripts\\mcp-obsidian.exe`
2. If it does not exist, reinstall or restore the package that provides `mcp-obsidian.exe`
3. Update the config path if the executable moved
4. Restart Claude Desktop

## Issue 3: Obsidian API Key or Port Mismatch

### Symptoms

- The MCP server starts but cannot talk to Obsidian
- Requests fail even though the executable launches

### Root Cause

The API key in the Claude Desktop config does not match the Local REST API plugin, or the port in the config does not match the port Obsidian is listening on.

### Fix

1. Open Obsidian Local REST API settings
2. Confirm the API key
3. Confirm the listening host and port
4. Update `%APPDATA%\\Claude\\claude_desktop_config.json` to match
5. Restart Claude Desktop after saving

## Issue 4: `obsidian-mcp-tools` Binary Missing

### Symptoms

- The `obsidian-mcp-tools` server shows disconnected
- Claude Desktop reports that `mcp-server.exe` cannot be found

### Root Cause

The plugin folder moved, the binary was removed, or the vault path changed.

### Fix

1. Verify this file exists:
   - `C:\\Users\\matts\\My Drive\\MilhemVault\\.obsidian\\plugins\\mcp-tools\\bin\\mcp-server.exe`
2. If it does not exist, reinstall the plugin or restore the missing binary
3. Update the command path in the config if the vault or plugin location changed
4. Restart Claude Desktop

## Legacy Note

The repo previously focused on an `npx`-based config and a filesystem MCP server. That is no longer the current live baseline. If you intentionally return to a filesystem-server setup later, treat it as a separate configuration path rather than assuming this template still covers it.
