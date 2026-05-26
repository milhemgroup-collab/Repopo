# Connect Perplexity Comet to Obsidian (Windows)

Wire your Obsidian vault into Perplexity Comet as a custom MCP connector, so Comet can read and write notes via natural language.

## How it works

```
Perplexity Comet ──HTTPS──► Cloudflare Tunnel ──HTTPS (localhost)──► Obsidian Local REST API plugin
   (custom connector)         (public URL)         (port 27124)        (MCP endpoint /mcp/)
```

The Local REST API plugin already ships an MCP server at `https://127.0.0.1:27124/mcp/` over Streamable HTTP — no custom bridge needed. Comet requires a public HTTPS URL, so Cloudflare Tunnel exposes the local endpoint.

## Prerequisites

- Obsidian open with **Local REST API** plugin enabled (you already have this — see `MCP_TROUBLESHOOTING.md`)
- The plugin's API key (Obsidian → Settings → Community plugins → Local REST API)
- Perplexity Pro / Max / Enterprise (custom connectors require a paid plan)
- Windows PowerShell

## Step 1 — Install cloudflared

In PowerShell (admin):

```powershell
winget install --id Cloudflare.cloudflared
```

Verify:

```powershell
cloudflared --version
```

## Step 2 — Confirm the Obsidian MCP endpoint is reachable locally

```powershell
curl.exe -k https://127.0.0.1:27124/
```

You should get a small JSON `status` response. If it fails, Obsidian isn't running or the plugin isn't enabled.

## Step 3 — Start a Cloudflare Quick Tunnel

Quick tunnels need no Cloudflare account but the URL rotates on each restart. Good for trying it out.

```powershell
cloudflared tunnel --no-tls-verify --url https://127.0.0.1:27124
```

Watch for a line like:

```
Your quick Tunnel has been created! Visit it at:
https://<random-name>.trycloudflare.com
```

Your MCP URL is **`https://<random-name>.trycloudflare.com/mcp/`** (note the trailing `/mcp/`).

For a stable, permanent URL, see "Permanent tunnel" at the bottom.

## Step 4 — Register the connector in Perplexity Comet

Two options. Pick whichever you prefer.

### Option A: Have Comet do it for you

Open Comet, open the Assistant sidebar, and paste this prompt (fill in the URL and your API key first):

```
Open https://www.perplexity.ai/settings/connectors in this tab. Click the
button to add a new custom connector / custom MCP server. Fill the form with:

  - Name: Obsidian
  - Description: Read and write notes in my local Obsidian vault
  - MCP server URL: https://<random-name>.trycloudflare.com/mcp/
  - Authentication: API key (Bearer token)
  - Header name: Authorization
  - Header value: Bearer <YOUR_OBSIDIAN_API_KEY>

Submit the form, then verify the connector shows as connected and lists its
available tools. If any field name on the page differs from what I said, use
the closest equivalent and tell me what you mapped. Do not paste my API key
into chat, search, or any other site — only into the connector form on
perplexity.ai. When done, summarize the tools the connector exposes.
```

### Option B: Do it manually

1. Go to https://www.perplexity.ai/settings/connectors
2. Click **Add custom connector** (or "Add MCP server")
3. Fill in:
   - **Name**: Obsidian
   - **MCP server URL**: `https://<random-name>.trycloudflare.com/mcp/`
   - **Authentication**: API key / Bearer token
   - **Header**: `Authorization: Bearer <YOUR_OBSIDIAN_API_KEY>`
4. Save. The connector should pick up the vault tools (list notes, read note, create/append, search, etc.).

## Step 5 — Try it in Comet

In the Comet Assistant:

> "Using the Obsidian connector, list the notes in my `Daily/` folder and summarize today's note."

> "Create a new note `Inbox/Perplexity test.md` with the heading 'Hello from Comet' and a one-line body."

## Security notes

- **Anyone who guesses your tunnel URL and API key gets your whole vault.** The URL is a random subdomain (hard to guess) but treat the API key like a password.
- If you want IP-level lockdown, use a **named tunnel** (below) behind **Cloudflare Access** with an email policy — only logged-in identities can hit the URL.
- Don't commit your API key. The `claude_desktop_config.json` in this repo deliberately uses `YOUR_API_KEY_HERE`.

## Permanent tunnel (optional)

Quick tunnels die when the terminal closes. For a stable URL on your own domain:

1. `cloudflared tunnel login` (browser auth to your Cloudflare account)
2. `cloudflared tunnel create obsidian-mcp`
3. Add a DNS record: `cloudflared tunnel route dns obsidian-mcp obsidian-mcp.yourdomain.com`
4. Save the config below as `%USERPROFILE%\.cloudflared\config.yml`
5. Run as a service: `cloudflared service install`

See `cloudflared/config.example.yml` in this repo for the config template.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Comet says "connector unreachable" | Tunnel not running, or wrong URL | Re-check `cloudflared` output and that you appended `/mcp/` |
| `401 Unauthorized` | Bad API key or wrong header format | Header value must be `Bearer <key>` with a space |
| `502 Bad Gateway` from tunnel | Obsidian closed or plugin disabled | Open Obsidian; verify plugin in Settings |
| Tools list is empty | Hit the wrong path | URL must end in `/mcp/` (trailing slash matters) |
| Self-signed cert errors in cloudflared | Missing `--no-tls-verify` flag | The flag tells cloudflared to trust the local plugin cert; safe because traffic stays on-machine |
