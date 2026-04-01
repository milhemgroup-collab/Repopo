# Cowork Troubleshooting Guide (Windows 11 Home)

This guide helps Windows 11 Home users get the Claude Desktop **Cowork** feature working. Cowork requires Hyper-V, which is not included in Windows 11 Home by default but can be installed.

**Status:** Anthropic has confirmed Windows Home is supported ([Issue #27396](https://github.com/anthropics/claude-code/issues/27396)). The current errors are a detection bug, not a platform limitation.

---

## Prerequisites Checklist

Before starting, ensure:

- [ ] **Windows 11 Home** version 22H2 or later
- [ ] **Hardware virtualization** enabled in BIOS/UEFI (Intel VT-x or AMD-V)
- [ ] At least **8 GB RAM** (16 GB recommended)
- [ ] At least **10 GB free disk space**
- [ ] **Administrator access** on your PC
- [ ] **Claude Desktop** installed and updated to the latest version

---

## Quick Start

1. Open PowerShell as Administrator and run:
   ```powershell
   .\verify_cowork_readiness.ps1
   ```
2. If Hyper-V checks fail, right-click `enable_hyperv_home.bat` > **Run as administrator**
3. **Reboot** when prompted
4. Run `verify_cowork_readiness.ps1` again to confirm all checks pass
5. Open Claude Desktop and try the Cowork tab
6. If you get **"VM service not running"**, run:
   ```powershell
   .\fix_cowork_vm_service.ps1
   ```
   Then reboot and try again

---

## Issue 1: "Virtualization is not available" Error

### Symptoms
- Cowork tab shows: *"Virtualization is not available — Claude's workspace requires Hyper-V"*
- Restarting does not fix it
- You have Virtual Machine Platform and Windows Hypervisor Platform enabled

### Root Cause
Windows 11 Home does not include Hyper-V by default. Claude Desktop checks for Hyper-V and reports it as missing, even though your hardware supports virtualization.

### Fix

1. **Run the install script:**
   - Right-click `enable_hyperv_home.bat` > **Run as administrator**
   - Type `YES` when prompted
   - Wait for the installation to complete (may take several minutes)
   - Reboot when prompted

2. **Verify the installation:**
   ```powershell
   # Run as Administrator
   .\verify_cowork_readiness.ps1
   ```

3. If the script cannot find Hyper-V packages, your Windows installation may not include them. Try running Windows Update first, then retry.

---

## Issue 2: "VM service not running. The service failed to start."

### Symptoms
- Cowork shows: *"Failed to start Claude's workspace — VM service not running"*
- Hyper-V is installed and verification script shows most checks passing
- This typically appears AFTER successfully enabling Hyper-V on Home edition

### Root Causes

There are multiple possible causes:

**A. TEMP and AppData on different drives (EXDEV error)** — Claude downloads VM files to `%TEMP%` then tries to rename them to `%APPDATA%`. If these are on different drives, the rename fails silently. ([Issue #29657](https://github.com/anthropics/claude-code/issues/29657))

**B. Hyper-V services not running** — The `vmms` and `vmcompute` services may not start automatically on Home edition.

**C. Corrupt or incomplete VM bundle** — The `claudevm.bundle` directory may be empty or missing required files (`rootfs.vhdx`, `sessiondata.vhdx`).

**D. Windows Defender Controlled Folder Access** — Can block Claude from writing VM files.

### Fix (Automated)

Run the all-in-one fix script:
```powershell
# Open PowerShell as Administrator
.\fix_cowork_vm_service.ps1
```
This automatically checks and fixes all of the above issues. Then reboot and try Cowork.

### Fix (Manual)

1. **Check TEMP drive alignment:**
   ```powershell
   # If these show different drive letters, that's the problem
   Write-Host "TEMP: $env:TEMP"
   Write-Host "APPDATA: $env:APPDATA"
   ```
   Fix: Set TEMP to be on the same drive as APPDATA:
   ```powershell
   # Example: if AppData is on C:
   [System.Environment]::SetEnvironmentVariable("TEMP", "C:\ClaudeTemp", "User")
   [System.Environment]::SetEnvironmentVariable("TMP", "C:\ClaudeTemp", "User")
   mkdir "C:\ClaudeTemp" -Force
   ```

2. **Start Hyper-V services:**
   ```powershell
   Set-Service vmms -StartupType Automatic
   Set-Service vmcompute -StartupType Automatic
   Start-Service vmms
   Start-Service vmcompute
   ```

3. **Set hypervisor launch type:**
   ```cmd
   bcdedit /set hypervisorlaunchtype auto
   ```

4. **Delete corrupt VM bundle** (Claude will re-download):
   ```powershell
   Remove-Item "$env:APPDATA\Claude\vm_bundles\claudevm.bundle" -Recurse -Force -ErrorAction SilentlyContinue
   Remove-Item "$env:LOCALAPPDATA\AnthropicClaude\vm_bundles\claudevm.bundle" -Recurse -Force -ErrorAction SilentlyContinue
   ```

5. **Reboot**, then open Claude Desktop and try Cowork.

6. If it still fails, click **"reinstall the workspace"** in the error message.

7. **Update Claude Desktop** to the latest version — Anthropic has been fixing these issues in recent updates.

8. If the problem persists, follow [Issue #29657](https://github.com/anthropics/claude-code/issues/29657) and [Issue #27396](https://github.com/anthropics/claude-code/issues/27396) for official fixes.

---

## Issue 3: VM Boots but Cannot Connect to API

### Symptoms
- Cowork starts setting up but gets stuck
- Error: *"Cannot connect to Claude API from workspace"*
- Regular Chat works fine

### Root Cause
The Cowork VM boots but cannot reach `api.anthropic.com` due to network configuration issues with the Hyper-V virtual switch.

### Fix

1. **Check the Hyper-V virtual switch:**
   - Open **Hyper-V Manager** > **Virtual Switch Manager**
   - Ensure a Default Switch exists and is connected to your network adapter

2. **Reset network in the VM:**
   - Open PowerShell as Admin:
     ```powershell
     Get-VMSwitch
     # If no switch exists:
     New-VMSwitch -Name "Default Switch" -SwitchType Internal
     ```

3. **Check firewall rules:**
   - Ensure Windows Firewall is not blocking Hyper-V networking
   - Temporarily disable firewall to test (re-enable after)

4. **Update Claude Desktop** — version 1.1.4328+ includes networking fixes.

---

## Issue 4: BIOS Virtualization Not Enabled

### Symptoms
- `verify_cowork_readiness.ps1` reports BIOS Virtualization as FAIL
- Task Manager > Performance > CPU shows Virtualization: Disabled

### Root Cause
Hardware virtualization (VT-x / AMD-V) must be enabled in your motherboard's BIOS/UEFI firmware.

### Fix

1. Restart your PC and enter BIOS/UEFI (usually **Del**, **F2**, or **F10** during boot)
2. Find the virtualization setting:
   - **Intel:** Look for "Intel Virtualization Technology" or "VT-x" under CPU or Advanced settings
   - **AMD:** Look for "SVM Mode" under CPU or Advanced settings
3. Set it to **Enabled**
4. Save and exit BIOS

---

## Issue 5: Setup Stuck Spinning Forever

### Symptoms
- Cowork shows "Setting up Claude's workspace" indefinitely
- No error message is displayed

### Fix

1. Wait at least 5 minutes — first-time setup can be slow
2. If still stuck, fully quit Claude Desktop (system tray > right-click > **Exit**)
3. Open PowerShell as Admin and restart services:
   ```powershell
   Restart-Service vmms
   Restart-Service vmcompute
   ```
4. Relaunch Claude Desktop and try again

---

## Reverting Changes

If you need to undo the Hyper-V installation:

**Option 1: System Restore**
1. Open Start > search "Create a restore point"
2. Click **System Restore**
3. Select the restore point created by the script

**Option 2: Manual removal**
```cmd
dism /online /disable-feature /featurename:Microsoft-Hyper-V-All /norestart
dism /online /disable-feature /featurename:Microsoft-Hyper-V /norestart
```
Then reboot.

---

## Known Limitations

- The DISM install method is **unofficial** — Microsoft does not officially support Hyper-V on Home edition
- **Windows Update** may remove the Hyper-V packages after major updates (re-run `enable_hyperv_home.bat` if this happens)
- This workaround may become **unnecessary** once Anthropic fixes the edition detection bug ([#27396](https://github.com/anthropics/claude-code/issues/27396))
- Some **antivirus software** may flag the batch script — right-click the file > Properties > **Unblock** if needed

---

## Related Issues

- [#27396](https://github.com/anthropics/claude-code/issues/27396) — Detection false negative (primary issue, assigned to Anthropic dev)
- [#31991](https://github.com/anthropics/claude-code/issues/31991) — Fails to start on Home
- [#32233](https://github.com/anthropics/claude-code/issues/32233) — "Virtualization is not available" error
- [#27384](https://github.com/anthropics/claude-code/issues/27384) — Regression after update
- [#25241](https://github.com/anthropics/claude-code/issues/25241) — VM boots but API unreachable
