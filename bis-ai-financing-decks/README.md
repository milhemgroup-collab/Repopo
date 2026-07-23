# BIS AI-Financing Fragility: Two-Deck Briefing

Two institutional-quality briefing decks (delivered as PDFs, Milhem Group
formatting) that answer the two structured prompts on the BIS 2026 view of AI
financing fragility. Each deck follows its source prompt section by section.

## Deliverables

| File | Slides | Primary source |
|------|-------:|----------------|
| `Deck-1_Circular-Money_BIS-AER-2026-Chapter-I.pdf` | 30 | BIS Annual Economic Report 2026, Chapter I, "Progress and peril" (28 June 2026) |
| `Deck-2_From-Cash-Flows-to-Debt_BIS-Bulletin-120.pdf` | 20 | BIS Bulletin No. 120, "Financing the AI boom: from cash flows to debt" (Aldasoro, Doerr, Rees, 7 January 2026) |

Deck 1 is the system-level view (circular structures, CDS repricing, historical
parallels, policy). Deck 2 is the channel-level companion (macro scale, the
cash-flow-to-debt shift, private credit microdata, the pricing schism). They
cross-reference each other and are meant to be read as a pair.

## Format

- 16:9 landscape, one page per slide (a deck rendered to PDF).
- Milhem Group branding: Navy `#1B365D`, Gold `#D4AF37`, Charcoal `#36454F`,
  Ash `#F5F5F5`; Calibri (Carlito substitute); approved logo on the title slide
  and every content-slide header.
- Every content slide carries a source footer and a speaker-notes band.
- All charts are native recreations of the BIS exhibits, labelled "recreated
  from BIS Graph #". No BIS graphics were screenshotted.

## Sourcing and scope

- Every factual claim traces to the BIS AER 2026 Chapter I text or BIS Bulletin
  120, per the prompts' scoping rules. Where the BIS itself cites an external
  input (Bank of America debt projections; Bloomberg, CNBC, LSEG Datastream,
  S&P Global Market Intelligence, The Wall Street Journal for Graph 13.C;
  McKinsey and IEA scenarios for Bulletin Graph 1), it is attributed as "per
  BIS, citing [source]".
- Headline figures were independently corroborated against public coverage of
  the report (Fortune, The Register, American Banker, TechTimes, ForkLog and
  the BIS press materials) in addition to the BIS documents themselves.
- Charts whose underlying per-year values are not published are faithful
  approximations of the BIS shape and are labelled "shape approximate".
- Excluded by design (non-BIS third-party overlays, per the prompts): the
  Apollo / Athene / AMAPS / xAI / NVIDIA pipeline diagram, the GPU-depreciation
  schedule debate, Air Street Compute Index data, and CoreWeave commentary.

## QA (both decks)

- No em dashes anywhere (checked programmatically: 0).
- Source footer on every content slide.
- All recreated charts labelled.
- Deck 1: all four excluded non-BIS topics confirmed absent; slide 7.4 is the
  only interpretive slide and is marked INTERNAL, with no views attributed to
  the BIS.
- Deck 2: the three private-credit growth metrics (originations, outstanding,
  average fund exposure) always appear with their exact definitions; the 8% and
  15% figures co-appear only on the reconciliation slide (6.2); the Bulletin's
  calibrated "risks appear moderate" tone is preserved except where explicitly
  comparing the two documents.

## Rebuilding

The PDFs are reproducible from `source/`:

```bash
cd source && ./build.sh
```

Requires `python3` with `matplotlib` and `pymupdf`, the Carlito font
(`fonts-crosextra-carlito`), and a Chromium binary for print-to-PDF. Pipeline:
`charts_*.py` render the branded charts, `deck*_content.py` emit the slide HTML
via `deckgen.py`, and Chromium renders each HTML to a 16:9 PDF.

## Note on the logo aspect ratio

The source prompts specify a 3.829:1 logo. The approved Milhem Group logo asset
is 2.990:1, and the branding standard forbids stretching it, so the real asset
ratio (2.990:1) was used to preserve logo integrity.
