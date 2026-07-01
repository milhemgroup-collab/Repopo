# Brokerage / Private-Bank Transfer Value Analysis

Decision-ready, Milhem Group branded analysis ranking where to move $1,000,000 to
$2,000,000 of appreciated, in-kind brokerage assets for the largest **total**
economic package, not the biggest headline cash bonus. Offers retrieved 2026-07-01.

## Deliverable

- `Milhem_Group_Brokerage_Transfer_Analysis.pdf` — final 8-page branded PDF
  (cover, executive dashboard and league table, segment picks, institution
  profile cards, scoring visualizations, and a three-part analytical appendix
  with all arithmetic and sources).

## How it was produced (reproducible)

1. `model.py` — builds the weighted composite score (0 to 100), computes pre-tax
   and after-tax bonus cash at $1M and $2M (40% marginal rate assumption), the
   hold-adjusted annualized yield, and the three segment rankings. Prints every
   calculation to `assets/model_output.txt`, writes `assets/model_data.json`, and
   renders the three brand-styled charts to `assets/`.
2. `build_html.py` — reads `assets/model_data.json`, assembles the branded HTML
   (`report.html`), and renders the PDF with WeasyPrint (running header and footer
   with gold rules, page counters, Milhem Group palette: Navy #1B365D,
   Gold #D4AF37, Charcoal #36454F, Carlito font).

Rebuild: `python3 deliverables/model.py && python3 deliverables/build_html.py`

## Method notes

- Bonuses are treated as ordinary income (Form 1099-MISC / 1099-INT, IRS Pub 525).
- Transfer assets **in-kind** via ACATS so no position is sold and no capital gain
  is triggered by the transfer itself; only the cash bonus is taxable.
- Verification status per offer: LIVE (confirmed 2026-07-01), VERIFY (credible but
  not confirmable at the $1M to $2M tier from a public page), CLOSED (expired).
- Estimates from public promotional terms; not tax advice. Confirm current offers
  and consult a tax advisor before transferring.
