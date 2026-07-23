#!/usr/bin/env bash
# Rebuild both BIS AI-financing decks (charts -> HTML -> PDF).
# Requires: python3 with matplotlib and pymupdf, Carlito font, a Chromium binary.
set -euo pipefail
cd "$(dirname "$0")"

echo "1/3  Generating charts..."
python3 charts_deck1.py
python3 charts_deck2.py

echo "2/3  Generating slide HTML..."
python3 deck1_content.py
python3 deck2_content.py

echo "3/3  Rendering PDFs..."
CHROME="${CHROME:-$(command -v chromium || command -v chromium-browser || echo /opt/pw-browsers/chromium-1194/chrome-linux/chrome)}"
for d in deck1 deck2; do
  "$CHROME" --headless=new --disable-gpu --no-sandbox --hide-scrollbars \
    --no-pdf-header-footer --print-to-pdf="$d.pdf" "file://$PWD/$d.html"
done

echo "Done. Outputs: deck1.pdf, deck2.pdf"
