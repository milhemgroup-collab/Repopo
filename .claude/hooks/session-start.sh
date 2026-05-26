#!/usr/bin/env bash
# SessionStart hook for the Milhem Group PKM Audit Routine.
# Creates the marker file the audit Step 0 looks for, and echoes a compact
# canonical-IDs cheatsheet to the transcript so the assistant doesn't have
# to discover any IDs at runtime.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
MARKER="$REPO_ROOT/.claude/.session-start-ran"

mkdir -p "$(dirname "$MARKER")"
date -u +"%Y-%m-%dT%H:%M:%SZ" > "$MARKER"

cat <<'EOF'
[session-start] PKM Audit context loaded.

Canonical IDs (read CLAUDE.md for the full table):
  Drive MilhemVault root: 1pvRZ7m50boJYVqR16w16sncPpC0y2Mci
  Drive Inbox:            15LHe3CSkAFril0Dqj4IxjKCnQYG8ECVZ
  Drive Investments:      156SK3IuUhhqBiGwwPbpdNWJ7g3DBVvPX
  Drive Tax-Strategy:     142F2pNDcOSFActlybyYhfuuTEmje00gw
  Drive Real-Estate:      1LfSDkgTNV4750otjifQvuusPldZawoDt
  Drive Resources:        1Z9KD_U1B-GjEPC4POaH8NfillzRNQLXH
  Drive _System/audits:   17bCvnuULG7X0zenlF1Dm1Mb8u-JA_J7a
  Drive CLAUDE.md file:   17gZRjmSZW9y-PXVpkoBmLzntOkAfakIq
  Drive REPS Tracker:     1Kakr5bX3KAUPhjUhcQKj48ghFg4VuxNCgeotIjoZjOo
  Notion Ops Dashboard:   3346d7c3-34ef-810e-b14f-e7956aa6ad49
  Notion 2026 Strategy:   3346d7c3-34ef-8162-a4e8-f2bf82188317
  Notion CPA Recon page:  36c6d7c3-34ef-8111-bba5-c273b97b2527
  Tasks DB data source:   bcc0d453-a07c-4a62-a7c5-46007375ed83
  ALTO Catalyst tracker:  ee7894eb-316c-432c-b6a7-4c6c36fbaeca

Tool gaps in this environment:
  - No Google Sheets MCP: use Drive read_file_content on the spreadsheet ID
  - No SEC EDGAR MCP: Step 5 must skip or use WebFetch on data.sec.gov
  - No Gmail send: only create_draft is available; user sends manually

Tasks DB Domain enum (do NOT use "Operations"):
  "Real Estate" | "Tax" | "Investment" | "Personal" | "PKM" | "Family" | "Insurance" | "Legal"

When creating files in Drive with mimeType text/markdown, set
disableConversionToGoogleType=true or your .md becomes a Google Doc.

Notion notion-create-pages: "parent" is a TOP-LEVEL key, not per-page.
EOF
