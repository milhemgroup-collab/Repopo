#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Fixes the "VM service not running" error for Claude Desktop Cowork on Windows 11 Home.
.DESCRIPTION
    Addresses the most common causes:
    1. EXDEV cross-device link error (TEMP and AppData on different drives)
    2. CoworkVMService not running or not configured
    3. Hyper-V services not started
    4. Corrupt or incomplete VM bundle
.EXAMPLE
    Right-click PowerShell > Run as Administrator, then:
    .\fix_cowork_vm_service.ps1
#>

Write-Host ""
Write-Host "============================================================" -ForegroundColor White
Write-Host "  Claude Cowork VM Service Fix" -ForegroundColor White
Write-Host "  For Windows 11 Home" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor White
Write-Host ""

$fixesApplied = 0

# ---------------------------------------------------------------
# Fix 1: TEMP and AppData cross-device issue
# ---------------------------------------------------------------
Write-Host "[Fix 1] Checking TEMP vs AppData drive alignment..." -ForegroundColor Cyan

$tempDrive = (Split-Path $env:TEMP -Qualifier)
$appDataDrive = (Split-Path $env:APPDATA -Qualifier)

if ($tempDrive -ne $appDataDrive) {
    Write-Host "  PROBLEM FOUND: TEMP is on $tempDrive but AppData is on $appDataDrive" -ForegroundColor Red
    Write-Host "  Claude cannot move VM files across drives (EXDEV error)." -ForegroundColor Red
    Write-Host ""

    # Create a TEMP directory on the same drive as AppData
    $newTemp = Join-Path $appDataDrive "\ClaudeTemp"
    if (-not (Test-Path $newTemp)) {
        New-Item -ItemType Directory -Path $newTemp -Force | Out-Null
    }

    Write-Host "  FIX: Setting TEMP/TMP to $newTemp (same drive as AppData)" -ForegroundColor Green
    [System.Environment]::SetEnvironmentVariable("TEMP", $newTemp, "User")
    [System.Environment]::SetEnvironmentVariable("TMP", $newTemp, "User")
    $env:TEMP = $newTemp
    $env:TMP = $newTemp
    Write-Host "  Done. TEMP and TMP now point to $newTemp" -ForegroundColor Green
    $fixesApplied++
} else {
    Write-Host "  OK: TEMP ($tempDrive) and AppData ($appDataDrive) are on the same drive." -ForegroundColor Green
}

Write-Host ""

# ---------------------------------------------------------------
# Fix 2: Ensure Hyper-V services exist and are configured
# ---------------------------------------------------------------
Write-Host "[Fix 2] Checking Hyper-V services..." -ForegroundColor Cyan

$services = @("vmms", "vmcompute", "HvHost")
foreach ($svc in $services) {
    try {
        $service = Get-Service $svc -ErrorAction Stop
        if ($service.StartType -eq "Disabled") {
            Write-Host "  $svc is Disabled. Setting to Automatic..." -ForegroundColor Yellow
            Set-Service $svc -StartupType Automatic
            $fixesApplied++
        }
        if ($service.Status -ne "Running") {
            Write-Host "  Starting $svc..." -ForegroundColor Yellow
            Start-Service $svc -ErrorAction Stop
            Write-Host "  $svc started." -ForegroundColor Green
            $fixesApplied++
        } else {
            Write-Host "  $svc: Running" -ForegroundColor Green
        }
    } catch {
        Write-Host "  $svc: Not found or cannot start - $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host ""

# ---------------------------------------------------------------
# Fix 3: Ensure hypervisor launch type is Auto
# ---------------------------------------------------------------
Write-Host "[Fix 3] Checking hypervisor launch type..." -ForegroundColor Cyan

$bcd = bcdedit /enum "{current}" 2>&1 | Select-String "hypervisorlaunchtype"
if ($bcd -match "Off") {
    Write-Host "  Hypervisor launch type is OFF. Setting to Auto..." -ForegroundColor Yellow
    bcdedit /set hypervisorlaunchtype auto | Out-Null
    Write-Host "  Set to Auto. Reboot required." -ForegroundColor Green
    $fixesApplied++
} elseif ($bcd -match "Auto") {
    Write-Host "  OK: Hypervisor launch type is Auto." -ForegroundColor Green
} else {
    Write-Host "  Setting hypervisor launch type to Auto..." -ForegroundColor Yellow
    bcdedit /set hypervisorlaunchtype auto | Out-Null
    Write-Host "  Done." -ForegroundColor Green
    $fixesApplied++
}

Write-Host ""

# ---------------------------------------------------------------
# Fix 4: Clear corrupt VM bundle
# ---------------------------------------------------------------
Write-Host "[Fix 4] Checking VM bundle integrity..." -ForegroundColor Cyan

$bundlePath = Join-Path $env:APPDATA "Claude\vm_bundles\claudevm.bundle"
$bundlePathLocal = Join-Path $env:LOCALAPPDATA "AnthropicClaude\vm_bundles\claudevm.bundle"

$checkPaths = @($bundlePath, $bundlePathLocal)
foreach ($bp in $checkPaths) {
    if (Test-Path $bp) {
        $files = Get-ChildItem $bp -ErrorAction SilentlyContinue
        $hasRootfs = $files | Where-Object { $_.Name -eq "rootfs.vhdx" }

        if (-not $hasRootfs) {
            Write-Host "  PROBLEM: Bundle at $bp is incomplete (missing rootfs.vhdx)" -ForegroundColor Red
            Write-Host "  Removing corrupt bundle so Claude can rebuild it..." -ForegroundColor Yellow
            Remove-Item $bp -Recurse -Force -ErrorAction SilentlyContinue
            Write-Host "  Removed. Claude will re-download on next Cowork launch." -ForegroundColor Green
            $fixesApplied++
        } else {
            $rootfsSize = ($hasRootfs | Select-Object -First 1).Length / 1MB
            Write-Host "  Bundle found at $bp (rootfs.vhdx = $([math]::Round($rootfsSize, 1)) MB)" -ForegroundColor Green
            if ($rootfsSize -lt 100) {
                Write-Host "  WARNING: rootfs.vhdx is suspiciously small. Consider deleting bundle to force re-download." -ForegroundColor Yellow
            }
        }
    }
}

Write-Host ""

# ---------------------------------------------------------------
# Fix 5: Windows Defender Controlled Folder Access
# ---------------------------------------------------------------
Write-Host "[Fix 5] Checking Windows Defender Controlled Folder Access..." -ForegroundColor Cyan

try {
    $cfa = (Get-MpPreference).EnableControlledFolderAccess
    if ($cfa -eq 1) {
        Write-Host "  WARNING: Controlled Folder Access is ON." -ForegroundColor Yellow
        Write-Host "  This can block Claude from writing VM files." -ForegroundColor Yellow
        Write-Host "  Consider adding Claude Desktop as an allowed app, or temporarily disable it." -ForegroundColor Yellow
        Write-Host "  Settings > Privacy & Security > Windows Security > Virus & Threat Protection" -ForegroundColor Gray
    } else {
        Write-Host "  OK: Controlled Folder Access is off or not blocking." -ForegroundColor Green
    }
} catch {
    Write-Host "  Could not check (non-critical)." -ForegroundColor Gray
}

Write-Host ""

# ---------------------------------------------------------------
# Fix 6: Register Hyper-V WMI providers (common Home edition issue)
# ---------------------------------------------------------------
Write-Host "[Fix 6] Re-registering Hyper-V WMI providers..." -ForegroundColor Cyan

$mofFiles = @(
    "$env:SystemRoot\System32\wbem\vsms_admin.mof",
    "$env:SystemRoot\System32\wbem\hvms.mof"
)
foreach ($mof in $mofFiles) {
    if (Test-Path $mof) {
        mofcomp $mof 2>&1 | Out-Null
        Write-Host "  Registered: $(Split-Path $mof -Leaf)" -ForegroundColor Green
        $fixesApplied++
    }
}

Write-Host ""

# ---------------------------------------------------------------
# Summary
# ---------------------------------------------------------------
Write-Host "============================================================" -ForegroundColor White
Write-Host "  Summary" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor White
Write-Host ""

if ($fixesApplied -eq 0) {
    Write-Host "  No issues found to fix." -ForegroundColor Green
    Write-Host "  If Cowork still fails, try:" -ForegroundColor White
    Write-Host "    1. Fully quit Claude Desktop (system tray > Exit)" -ForegroundColor White
    Write-Host "    2. Reboot your PC" -ForegroundColor White
    Write-Host "    3. Open Claude Desktop and try Cowork" -ForegroundColor White
    Write-Host "    4. If still broken, click 'reinstall the workspace' in the error" -ForegroundColor White
} else {
    Write-Host "  Applied $fixesApplied fix(es)." -ForegroundColor Green
    Write-Host ""
    Write-Host "  Next steps:" -ForegroundColor White
    Write-Host "    1. Fully quit Claude Desktop (system tray > right-click > Exit)" -ForegroundColor White
    Write-Host "    2. REBOOT your computer" -ForegroundColor White
    Write-Host "    3. Open Claude Desktop and try Cowork" -ForegroundColor White
    Write-Host "    4. If it still fails, run verify_cowork_readiness.ps1 to check status" -ForegroundColor White
}

Write-Host ""
Write-Host "  For detailed help, see COWORK_TROUBLESHOOTING.md" -ForegroundColor Gray
Write-Host ""
