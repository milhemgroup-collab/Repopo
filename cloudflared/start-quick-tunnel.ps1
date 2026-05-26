# Quick tunnel — no Cloudflare account, URL rotates each run.
# Use this for testing; switch to a named tunnel (config.example.yml) for permanence.

$ErrorActionPreference = "Stop"

Write-Host "Starting Cloudflare Quick Tunnel to Obsidian Local REST API..." -ForegroundColor Cyan
Write-Host "When the tunnel URL appears below, append /mcp/ to it and use that as your"
Write-Host "MCP server URL in Perplexity Comet's custom connector settings." -ForegroundColor Yellow
Write-Host ""

cloudflared tunnel --no-tls-verify --url https://127.0.0.1:27124
