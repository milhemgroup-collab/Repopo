# Cowork Troubleshooting Notes

These notes are informational only. Cowork repair steps can require Administrator access and can modify Windows features, services, boot configuration, or local VM bundles.

Do not run admin-level commands from this repo without an explicit approval checkpoint.

## Readiness Checks

Before changing anything, verify:

- Claude Desktop is fully updated.
- Hardware virtualization is enabled in BIOS or UEFI.
- Windows has enough disk space for VM bundles.
- Hyper-V related Windows features are present and enabled if Cowork requires them.
- The relevant services, such as `vmms` and `vmcompute`, are running.
- `%TEMP%` and `%APPDATA%` are on compatible drives if Cowork setup fails while moving VM files.

## Common Failure Areas

| Symptom | Read-only check |
|---|---|
| Virtualization unavailable | Check Task Manager > Performance > CPU > Virtualization. |
| VM service not running | Inspect Windows Services for Hyper-V and compute services. |
| Workspace reinstall loop | Confirm the VM bundle directory is present and not obviously empty. |
| Network setup hangs | Confirm Windows firewall or VPN settings are not blocking the VM network. |

## Admin-Change Warning

Commands that enable Hyper-V, edit boot configuration, restart services, delete VM bundles, or alter Defender settings are system changes. Treat those as a separate approved maintenance task, not as normal repo validation.
