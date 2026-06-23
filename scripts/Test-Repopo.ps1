param(
    [string]$ConfigPath
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($ConfigPath)) {
    $configPath = Join-Path $repoRoot "claude_desktop_config.example.json"
} else {
    $configPath = $ConfigPath
}
$expectedCommand = "C:\Program Files\nodejs\npx.cmd"
$failures = New-Object System.Collections.Generic.List[string]

function Add-Failure {
    param([string]$Message)
    $failures.Add($Message) | Out-Null
}

function Test-Condition {
    param(
        [bool]$Condition,
        [string]$Message
    )
    if (-not $Condition) {
        Add-Failure $Message
    }
}

if (-not (Test-Path -LiteralPath $configPath)) {
    Add-Failure "Missing claude_desktop_config.example.json"
} else {
    try {
        $configText = Get-Content -LiteralPath $configPath -Raw
        $config = $configText | ConvertFrom-Json
    } catch {
        Add-Failure "Example config is not valid JSON: $($_.Exception.Message)"
    }
}

if ($config) {
    Test-Condition ($null -ne $config.mcpServers) "Config is missing mcpServers"
    Test-Condition ($null -ne $config.mcpServers.filesystem) "Config is missing filesystem server"
    Test-Condition ($null -ne $config.mcpServers.'obsidian-mcp-server') "Config is missing obsidian-mcp-server"

    if ($config.mcpServers.filesystem) {
        Test-Condition ($config.mcpServers.filesystem.command -eq $expectedCommand) "Filesystem command must be $expectedCommand"
        Test-Condition ($config.mcpServers.filesystem.args -contains "@modelcontextprotocol/server-filesystem") "Filesystem args must include @modelcontextprotocol/server-filesystem"
    }

    if ($config.mcpServers.'obsidian-mcp-server') {
        $obsidian = $config.mcpServers.'obsidian-mcp-server'
        Test-Condition ($obsidian.command -eq $expectedCommand) "Obsidian command must be $expectedCommand"
        Test-Condition ($obsidian.args -contains "obsidian-mcp-server") "Obsidian args must include obsidian-mcp-server"
        Test-Condition ($obsidian.env.OBSIDIAN_API_KEY -eq "YOUR_API_KEY_HERE") "Committed Obsidian API key must remain YOUR_API_KEY_HERE"
        Test-Condition ($obsidian.env.OBSIDIAN_BASE_URL -eq "http://127.0.0.1:27123") "Obsidian base URL must remain http://127.0.0.1:27123"
    }
}

$trackedTextFiles = Get-ChildItem -LiteralPath $repoRoot -Recurse -File -Force |
    Where-Object {
        $_.FullName -notmatch "\\.git\\" -and
        $_.FullName -ne $PSCommandPath -and
        $_.Extension -notin @(".png", ".jpg", ".jpeg", ".gif", ".ico", ".pdf", ".zip")
    }

$combinedText = foreach ($file in $trackedTextFiles) {
    Get-Content -LiteralPath $file.FullName -Raw
}
$combinedText = ($combinedText -join "`n")

$blockedPatterns = @(
    [regex]::Escape(("C:\Users\" + "matts")),
    ("Master " + "Personal Data"),
    ("Comet-" + "Passwords"),
    "OBSIDIAN_API_KEY`"\s*:\s*`"(?!YOUR_API_KEY_HERE`")[^`"]+",
    "(?i)(api[_-]?key|token|password|secret)\s*[:=]\s*['`"][^'`"]{8,}['`"]"
)

foreach ($pattern in $blockedPatterns) {
    if ($combinedText -match $pattern) {
        Add-Failure "Blocked secret or personal-path pattern found: $pattern"
    }
}

if ($failures.Count -gt 0) {
    Write-Host "Repopo validation failed:" -ForegroundColor Red
    foreach ($failure in $failures) {
        Write-Host " - $failure" -ForegroundColor Red
    }
    exit 1
}

Write-Host "Repopo validation passed." -ForegroundColor Green
