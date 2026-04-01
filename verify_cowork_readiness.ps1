#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Checks all prerequisites for Claude Desktop Cowork on Windows 11 Home.
.DESCRIPTION
    Runs diagnostic checks and reports pass/fail status for each requirement.
    Must be run as Administrator.
.EXAMPLE
    Right-click PowerShell > Run as Administrator, then:
    .\verify_cowork_readiness.ps1
#>

$passes = 0
$fails = 0
$warnings = 0

function Write-Check {
    param([string]$Status, [string]$Name, [string]$Detail)
    switch ($Status) {
        "PASS" { Write-Host "  [PASS] " -ForegroundColor Green -NoNewline; $script:passes++ }
        "FAIL" { Write-Host "  [FAIL] " -ForegroundColor Red -NoNewline; $script:fails++ }
        "WARN" { Write-Host "  [WARN] " -ForegroundColor Yellow -NoNewline; $script:warnings++ }
        "INFO" { Write-Host "  [INFO] " -ForegroundColor Cyan -NoNewline }
    }
    Write-Host "$Name" -NoNewline
    if ($Detail) { Write-Host " - $Detail" -ForegroundColor Gray } else { Write-Host "" }
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor White
Write-Host "  Claude Cowork Readiness Check" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor White
Write-Host ""

# 1. Windows Edition
$os = Get-CimInstance Win32_OperatingSystem
$edition = $os.Caption
Write-Check "INFO" "Windows Edition" "$edition"

$isHome = $edition -match "Home"
if ($isHome) {
    Write-Check "INFO" "Home Edition Detected" "Hyper-V must be installed via script"
}

# 2. Windows Version
$build = [System.Environment]::OSVersion.Version.Build
Write-Check "INFO" "Windows Build" "$build"

# 3. BIOS Virtualization
try {
    $virtEnabled = (Get-CimInstance Win32_Processor).VirtualizationFirmwareEnabled
    # Also check if the hypervisor is actually running (more reliable indicator)
    $hypervisorRunning = (Get-CimInstance Win32_ComputerSystem).HypervisorPresent
    if ($virtEnabled) {
        Write-Check "PASS" "BIOS Virtualization (VT-x/AMD-V)" "Enabled"
    } elseif ($hypervisorRunning) {
        Write-Check "PASS" "BIOS Virtualization (VT-x/AMD-V)" "Enabled (confirmed via active hypervisor)"
    } else {
        Write-Check "FAIL" "BIOS Virtualization (VT-x/AMD-V)" "DISABLED - Enable in BIOS/UEFI settings"
    }
} catch {
    Write-Check "WARN" "BIOS Virtualization" "Could not detect - check BIOS manually"
}

# 4. Hyper-V Feature
try {
    $hyperv = Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -ErrorAction Stop
    if ($hyperv.State -eq "Enabled") {
        Write-Check "PASS" "Hyper-V Feature" "Enabled"
    } else {
        Write-Check "FAIL" "Hyper-V Feature" "Not enabled - run enable_hyperv_home.bat"
    }
} catch {
    Write-Check "FAIL" "Hyper-V Feature" "Not installed - run enable_hyperv_home.bat"
}

# 5. Hyper-V Hypervisor
try {
    $hvHypervisor = Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V-Hypervisor -ErrorAction Stop
    if ($hvHypervisor.State -eq "Enabled") {
        Write-Check "PASS" "Hyper-V Hypervisor" "Enabled"
    } else {
        Write-Check "FAIL" "Hyper-V Hypervisor" "Not enabled"
    }
} catch {
    Write-Check "FAIL" "Hyper-V Hypervisor" "Not installed"
}

# 6. Virtual Machine Platform
try {
    $vmp = Get-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform -ErrorAction Stop
    if ($vmp.State -eq "Enabled") {
        Write-Check "PASS" "Virtual Machine Platform" "Enabled"
    } else {
        Write-Check "WARN" "Virtual Machine Platform" "Not enabled - may be needed"
    }
} catch {
    Write-Check "WARN" "Virtual Machine Platform" "Could not check"
}

# 7. Windows Hypervisor Platform
try {
    $whp = Get-WindowsOptionalFeature -Online -FeatureName HypervisorPlatform -ErrorAction Stop
    if ($whp.State -eq "Enabled") {
        Write-Check "PASS" "Windows Hypervisor Platform" "Enabled"
    } else {
        Write-Check "WARN" "Windows Hypervisor Platform" "Not enabled - may be needed"
    }
} catch {
    Write-Check "WARN" "Windows Hypervisor Platform" "Could not check"
}

# 8. Hypervisor Running
try {
    $cs = Get-CimInstance Win32_ComputerSystem
    if ($cs.HypervisorPresent) {
        Write-Check "PASS" "Hypervisor Running" "Active"
    } else {
        Write-Check "FAIL" "Hypervisor Running" "Not active - reboot may be required"
    }
} catch {
    Write-Check "WARN" "Hypervisor Running" "Could not detect"
}

# 9. vmms Service (Virtual Machine Management)
try {
    $vmms = Get-Service vmms -ErrorAction Stop
    if ($vmms.Status -eq "Running") {
        Write-Check "PASS" "vmms Service" "Running"
    } else {
        Write-Check "FAIL" "vmms Service" "Status: $($vmms.Status) - try: Start-Service vmms"
    }
} catch {
    Write-Check "FAIL" "vmms Service" "Not found - Hyper-V may not be installed"
}

# 10. vmcompute Service (Host Compute Service)
try {
    $vmcompute = Get-Service vmcompute -ErrorAction Stop
    if ($vmcompute.Status -eq "Running") {
        Write-Check "PASS" "vmcompute Service (HCS)" "Running"
    } else {
        Write-Check "WARN" "vmcompute Service (HCS)" "Status: $($vmcompute.Status) - try: Start-Service vmcompute"
    }
} catch {
    Write-Check "WARN" "vmcompute Service (HCS)" "Not found - may start automatically when needed"
}

# 11. BCDEdit Hypervisor Launch Type
try {
    $bcd = bcdedit /enum "{current}" 2>&1 | Select-String "hypervisorlaunchtype"
    if ($bcd -match "Auto") {
        Write-Check "PASS" "Hypervisor Launch Type" "Auto"
    } elseif ($bcd -match "Off") {
        Write-Check "FAIL" "Hypervisor Launch Type" "OFF - run: bcdedit /set hypervisorlaunchtype auto"
    } else {
        Write-Check "WARN" "Hypervisor Launch Type" "Could not determine"
    }
} catch {
    Write-Check "WARN" "Hypervisor Launch Type" "Could not check"
}

# 12. Claude Desktop Installed
$claudePaths = @(
    "$env:LOCALAPPDATA\Programs\Claude\Claude.exe",
    "$env:LOCALAPPDATA\AnthropicClaude\Claude.exe",
    "${env:ProgramFiles}\Claude\Claude.exe"
)
$claudeFound = $false
foreach ($path in $claudePaths) {
    if (Test-Path $path) {
        Write-Check "PASS" "Claude Desktop" "Found at $path"
        $claudeFound = $true
        break
    }
}
if (-not $claudeFound) {
    Write-Check "WARN" "Claude Desktop" "Not found in common locations"
}

# Summary
Write-Host ""
Write-Host "============================================================" -ForegroundColor White
Write-Host "  Summary" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor White
Write-Host ""

if ($fails -eq 0) {
    Write-Host "  All checks passed! Cowork should be ready to use." -ForegroundColor Green
    Write-Host "  Open Claude Desktop and try the Cowork tab." -ForegroundColor Green
} else {
    Write-Host "  $fails check(s) failed." -ForegroundColor Red
    if ($warnings -gt 0) { Write-Host "  $warnings warning(s)." -ForegroundColor Yellow }
    Write-Host ""
    Write-Host "  Next steps:" -ForegroundColor White
    Write-Host "    1. Fix any FAIL items listed above" -ForegroundColor White
    Write-Host "    2. If Hyper-V is missing, run enable_hyperv_home.bat as Admin" -ForegroundColor White
    Write-Host "    3. Reboot and run this script again" -ForegroundColor White
}

Write-Host ""
Write-Host "  For detailed help, see COWORK_TROUBLESHOOTING.md" -ForegroundColor Gray
Write-Host ""
