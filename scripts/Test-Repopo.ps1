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
$expectedObsidianCommandName = "mcp-obsidian.exe"
$expectedToolsCommandName = "mcp-server.exe"
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
    Test-Condition ($null -ne $config.mcpServers.obsidian) "Config is missing obsidian server"
    Test-Condition ($null -ne $config.mcpServers.'obsidian-mcp-tools') "Config is missing obsidian-mcp-tools server"

    if ($config.mcpServers.obsidian) {
        $obsidian = $config.mcpServers.obsidian
        Test-Condition ($obsidian.command -like "*$expectedObsidianCommandName") "Obsidian command must point to $expectedObsidianCommandName"
        Test-Condition ($obsidian.env.OBSIDIAN_API_KEY -eq "YOUR_OBSIDIAN_API_KEY_HERE") "Committed Obsidian API key must remain YOUR_OBSIDIAN_API_KEY_HERE"
        Test-Condition ($obsidian.env.OBSIDIAN_HOST -eq "127.0.0.1") "Obsidian host must remain 127.0.0.1"
        Test-Condition ($obsidian.env.OBSIDIAN_PORT -eq "27124") "Obsidian port must remain 27124"
    }

    if ($config.mcpServers.'obsidian-mcp-tools') {
        $tools = $config.mcpServers.'obsidian-mcp-tools'
        Test-Condition ($tools.command -like "*$expectedToolsCommandName") "obsidian-mcp-tools command must point to $expectedToolsCommandName"
        Test-Condition ($tools.env.OBSIDIAN_API_KEY -eq "YOUR_OBSIDIAN_API_KEY_HERE") "Committed obsidian-mcp-tools API key must remain YOUR_OBSIDIAN_API_KEY_HERE"
    }

    if ($config.mcpServers.'obsidian-mcp-server') {
        Add-Failure "Config should use current obsidian server name, not legacy obsidian-mcp-server"
    }

    if ($config.mcpServers.filesystem) {
        Add-Failure "Config should use current Obsidian MCP servers, not legacy filesystem server"
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
    "OBSIDIAN_API_KEY`"\s*:\s*`"(?!YOUR_OBSIDIAN_API_KEY_HERE`")[^`"]+",
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
