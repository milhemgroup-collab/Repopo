# Repopo

Corrected MCP server configuration for Claude Desktop, fixing the Filesystem and obsidian-mcp-server connectivity issues. Also includes a workaround for enabling the **Cowork** feature on Windows 11 Home.

## Files

- **`claude_desktop_config.json`** — Fixed config template with corrected paths and commands
- **`MCP_TROUBLESHOOTING.md`** — Troubleshooting guide for MCP server issues
- **`enable_hyperv_home.bat`** — Installs Hyper-V on Windows 11 Home (run as Administrator)
- **`verify_cowork_readiness.ps1`** — Checks all Cowork prerequisites and reports pass/fail status
- **`fix_cowork_vm_service.ps1`** — Fixes "VM service not running" error (TEMP drive, services, bundle)
- **`COWORK_TROUBLESHOOTING.md`** — Troubleshooting guide for Cowork on Windows 11 Home

## Cowork on Windows 11 Home

Claude Desktop's Cowork feature requires Hyper-V, which is not included in Windows 11 Home. The detection logic currently checks the OS edition rather than actual hypervisor availability, blocking Home users even when their hardware supports virtualization.

**Quick fix:**
1. Run `verify_cowork_readiness.ps1` as Administrator to check your system
2. Run `enable_hyperv_home.bat` as Administrator to install Hyper-V
3. Reboot and try Cowork
4. If you get "VM service not running", run `fix_cowork_vm_service.ps1` as Administrator, reboot, and try again

See **[COWORK_TROUBLESHOOTING.md](COWORK_TROUBLESHOOTING.md)** for detailed instructions and known issues.