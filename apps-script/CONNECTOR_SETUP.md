# Cross-surface connector setup

Goal: make the Apps Script framework reachable from every Claude surface
(Claude Code CLI/Web, Desktop, Cowork, Online, and the API) without re-doing
auth or copy-pasting code each time.

There are three layered options. Pick the one that matches how far you want
to go — they're cumulative.

## Option A — Web App + curl (minimum viable)

You already have this if you completed `COMET_INSTALL_PROMPT.md`.

```bash
# In any shell — Claude Code, your laptop, a server, anything.
WEBAPP_URL='https://script.google.com/macros/s/.../exec'
TOKEN='<the value from ScriptProperties.WEBAPP_TOKEN>'

# Health check
curl -s "$WEBAPP_URL?action=status&token=$TOKEN"

# Run one routine
curl -sX POST "$WEBAPP_URL" \
  -H 'Content-Type: application/json' \
  -d "{\"token\":\"$TOKEN\",\"action\":\"run\",\"id\":\"reps_appender\"}"

# Run everything
curl -sX POST "$WEBAPP_URL" \
  -H 'Content-Type: application/json' \
  -d "{\"token\":\"$TOKEN\",\"action\":\"runAll\"}"

# Strip a label
curl -sX POST "$WEBAPP_URL" \
  -H 'Content-Type: application/json' \
  -d "{\"token\":\"$TOKEN\",\"action\":\"unlabelFailed\",\"label\":\"REPS/AppendFailed\"}"
```

In Claude Code, drop the URL + token into `.env` (and add `.env` to `.gitignore`):

```bash
echo 'WEBAPP_URL=...' >> .env
echo 'APPS_SCRIPT_TOKEN=...' >> .env
```

Claude Code can then call the script from any conversation by sourcing `.env`
and `curl`-ing — no MCP infrastructure required.

## Option B — Local MCP server wrapping the Web App

When you want typed tools (`apps_script_run`, `apps_script_status`,
`apps_script_unlabel`) instead of free-form curl. Useful if you find yourself
making the same calls repeatedly across sessions.

Skeleton (`mcp-apps-script/server.ts`, using `@modelcontextprotocol/sdk`):

```ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const URL = process.env.WEBAPP_URL!;
const TOKEN = process.env.APPS_SCRIPT_TOKEN!;

async function call(action: string, extra: Record<string, unknown> = {}) {
  const r = await fetch(URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token: TOKEN, action, ...extra })
  });
  return await r.json();
}

const server = new Server({ name: 'apps-script', version: '1.0.0' }, { capabilities: { tools: {} } });
server.setRequestHandler('tools/list', () => ({
  tools: [
    { name: 'apps_script_status', description: 'List routines and framework version', inputSchema: { type: 'object' } },
    { name: 'apps_script_run',    description: 'Run one routine by id',                  inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
    { name: 'apps_script_run_all', description: 'Run every enabled routine',             inputSchema: { type: 'object' } },
    { name: 'apps_script_unlabel', description: 'Strip a Gmail label from all threads',  inputSchema: { type: 'object', properties: { label: { type: 'string' } }, required: ['label'] } }
  ]
}));
server.setRequestHandler('tools/call', async (req) => {
  const { name, arguments: a = {} } = req.params;
  if (name === 'apps_script_status')   return { content: [{ type: 'text', text: JSON.stringify(await call('status'), null, 2) }] };
  if (name === 'apps_script_run')      return { content: [{ type: 'text', text: JSON.stringify(await call('run', { id: a.id }), null, 2) }] };
  if (name === 'apps_script_run_all')  return { content: [{ type: 'text', text: JSON.stringify(await call('runAll'), null, 2) }] };
  if (name === 'apps_script_unlabel')  return { content: [{ type: 'text', text: JSON.stringify(await call('unlabelFailed', { label: a.label }), null, 2) }] };
  throw new Error('unknown tool: ' + name);
});
await server.connect(new StdioServerTransport());
```

Wire it into `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "apps-script": {
      "command": "node",
      "args": ["/abs/path/to/mcp-apps-script/dist/server.js"],
      "env": {
        "WEBAPP_URL": "https://script.google.com/macros/s/.../exec",
        "APPS_SCRIPT_TOKEN": "<token>"
      }
    }
  }
}
```

Restart Desktop. The four tools appear in any chat — Cowork and Online don't
see local MCP servers, so this is Desktop-only and Code-with-local-mcp-only.

## Option C — Remote MCP via Cloudflare Worker (recommended long-term)

Same surface as Option B, but hosted, so EVERY Claude surface sees it
(Desktop, Code, Cowork, Online, API). Free tier handles 100k req/day.

1. Create a Worker (`wrangler init apps-script-mcp`).
2. Stick the same handler logic from Option B into the Worker — same
   `tools/list` and `tools/call` shape, but speak the remote MCP HTTPS
   transport (see `https://modelcontextprotocol.io/specification` for the
   spec; the Anthropic SDK has a `RemoteMcpServer` helper).
3. Store `WEBAPP_URL` and `APPS_SCRIPT_TOKEN` as Worker secrets:
   `wrangler secret put WEBAPP_URL` etc.
4. Deploy: `wrangler deploy`. You get a `https://...workers.dev` URL.
5. Connect from each Claude surface as a Remote MCP server with that URL.

Once Option C is live, you can retire Options A and B (or keep A as a
break-glass for shell scripts).

## Top non-obvious suggestions

- **Turn on Apps Script trigger failure notifications.** Triggers → pencil →
  "Notify me immediately." Free, silent insurance — you'd have caught the
  parse bug in the first hour instead of via a run-report scan.
- **Adopt `clasp` early** (see `CLASP_SETUP.md`). Then Claude Code can edit
  and push `.gs` files directly. Round-tripping through the browser editor
  is the single biggest source of paste errors.
- **Migrate Zapier zaps to Apps Script over time.** Anything Gmail / Sheets /
  Drive / Calendar runs faster, free, and more reliably here. Zapier earns
  its keep for non-Google services (Slack ↔ Notion, Stripe ↔ HubSpot).
- **Use the `_log` sheet for audit.** Every `runOnce` writes one JSON-stringified
  row. Future parse drift is one filter away, no Stackdriver scraping needed.
- **Rotate `WEBAPP_TOKEN` after any laptop / browser change.**
  `09_Helpers.gs::resetWebAppToken()` generates a new one in 1 second.
