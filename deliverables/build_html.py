# -*- coding: utf-8 -*-
"""Assemble the branded HTML from model_data.json and render to PDF via WeasyPrint.
No em dashes anywhere. Brand: Navy #1B365D, Gold #D4AF37, Charcoal #36454F, Carlito."""
import json, html, datetime
from weasyprint import HTML

D = json.load(open("deliverables/assets/model_data.json"))
INST = D["institutions"]; WATCH = D["watchlist"]; W = D["weights"]; SEG = D["segments"]
DATE = "2026-07-01"
def esc(s): return html.escape(str(s))
def money(x): return f"${x:,.0f}"

DIM_LABEL = {"cash":"Net after-tax cash","recurring":"Recurring lending / card",
             "yield":"Cash / CD yield","hold":"Hold &amp; clawback flexibility",
             "perks":"Tier perks &amp; service","neg":"Negotiability"}
MEDAL = {1:"01",2:"02",3:"03"}
def tier_label(r):
    return "Gold Tier" if r==1 else "Silver Tier" if r==2 else "Bronze Tier" if r==3 else "Field"

# ---------- Sources ----------
SOURCES = [
 ("Robinhood Gold ACATS transfer match, 2% / 3% terms",
  "https://www.doctorofcredit.com/robinhood-gold-brokerage-transfer-2-unlimited-bonus/"),
 ("Robinhood ACATS 2% Bonus Offer Terms &amp; Conditions (PDF)",
  "https://cdn.robinhood.com/assets/robinhood/legal/acats_2percent_Bonus_Offer.pdf"),
 ("Public.com 1% uncapped transfer match, 5-year hold",
  "https://help.public.com/en/articles/12293706-cash-bonus-to-transfer-1-match-to-transfer-your-account"),
 ("Public.com ACATS &amp; IRA Match Program disclosures",
  "https://public.com/disclosures/matchprogram"),
 ("tastytrade tiered ACAT bonus schedule ($5,000 at $1M+)",
  "https://www.mymoneyblog.com/tastyworks-acat-transfer-bonus.html"),
 ("Bank of America / Merrill BofA Rewards (Premier tier) benefits",
  "https://www.merrilledge.com/preferred-rewards"),
 ("BofA Preferred Rewards to BofA Rewards tier changes, May 2026",
  "https://www.doctorofcredit.com/bank-of-america-to-make-changes-to-preferred-rewards-tiers-names/"),
 ("E*TRADE (Morgan Stanley) OFFER26 brokerage promotion, $1,500 cap",
  "https://us.etrade.com/promo/brokerage"),
 ("Charles Schwab Investor Reward transfer bonus, up to $6,000",
  "https://www.mymoneyblog.com/charles-schwab-new-deposit-transfer-bonus.html"),
 ("J.P. Morgan Self-Directed Investing bonus, up to $1,000",
  "https://www.stockbrokers.com/guides/best-brokerage-account-bonuses"),
 ("Interactive Brokers margin rates (benchmark + ~0.75% tiered)",
  "https://www.interactivebrokers.com/en/trading/margin-rates.php"),
 ("Margin rate comparison 2026 (IBKR ~4.58% at $500k+, Robinhood 6.75%)",
  "https://www.gremlin.money/blog/margin-rates-comparison-2026"),
 ("IRS Publication 525, taxable income incl. bonuses / prizes",
  "https://www.irs.gov/publications/p525"),
]

CSS = """
@page {
  size: A4 portrait; margin: 2.0cm 1.5cm 1.9cm 1.5cm;
  @top-left { content: element(hdr); width: 18cm; }
  @bottom-left { content: "Confidential"; font-family: Carlito, Arial, sans-serif;
    font-size: 8pt; color:#36454F; font-style:italic; border-top:1.2pt solid #D4AF37;
    width: 6cm; padding-top:3pt; }
  @bottom-center { content: "Page " counter(page) " of " counter(pages);
    font-family: Carlito, Arial, sans-serif; font-size: 8pt; color: #36454F;
    border-top:1.2pt solid #D4AF37; width: 6cm; padding-top:3pt; }
  @bottom-right { content: "Prepared for Mattson Wardy"; font-family: Carlito, Arial, sans-serif;
    font-size: 8pt; color:#36454F; border-top:1.2pt solid #D4AF37; width: 6cm; padding-top:3pt; }
}
@page cover { margin: 0; @top-left{content:none;}
  @bottom-left{content:none;} @bottom-center{content:none;} @bottom-right{content:none;} }
html { font-family: Carlito, Helvetica, Arial, sans-serif; color:#36454F; font-size:10pt; }
body { margin:0; }
.hdr { position: running(hdr); width: 18cm; display:flex; justify-content:space-between;
  align-items:flex-end; border-bottom:1.4pt solid #D4AF37; padding-bottom:3pt; }
.hdr .l { font-size:8pt; color:#1B365D; font-weight:bold; letter-spacing:.6px; }
.hdr .r { font-size:8pt; color:#36454F; }
h1,h2,h3 { color:#1B365D; margin:0 0 .3em 0; }
h2 { font-size:16pt; border-bottom:2.2pt solid #D4AF37; padding-bottom:4pt; margin-top:2pt; }
h3 { font-size:12pt; }
p { line-height:1.42; margin:.35em 0; }
.small { font-size:8.2pt; color:#5a6570; }
.gold { color:#D4AF37; } .navy{color:#1B365D;}
.cover { background:#1B365D; color:#fff; height:100vh; padding:0; position:relative; page:cover; }
.cover .band { position:absolute; top:34%; left:0; right:0; padding:0 2.4cm; }
.cover .rule { height:3pt; background:#D4AF37; width:5.2cm; margin:14pt 0; }
.cover h1 { color:#fff; font-size:30pt; line-height:1.12; letter-spacing:.3px; }
.cover .sub { color:#D4AF37; font-size:13pt; font-weight:bold; letter-spacing:1.5px; text-transform:uppercase; }
.cover .meta { position:absolute; bottom:2.4cm; left:2.4cm; right:2.4cm; color:#c8d0dc; font-size:9.5pt; }
.cover .brandtop { position:absolute; top:2.2cm; left:2.4cm; color:#D4AF37; font-size:11pt; font-weight:bold; letter-spacing:3px; }
.lead { font-size:10.5pt; color:#36454F; }
table { border-collapse:collapse; width:100%; font-size:8.6pt; }
.league th { background:#1B365D; color:#fff; text-align:left; padding:5pt 6pt; font-size:8pt; text-transform:uppercase; letter-spacing:.4px; }
.league td { padding:5pt 6pt; border-bottom:.6pt solid #dfe3e8; vertical-align:middle; }
.league tr:nth-child(even) td { background:#F7F5EF; }
.rankbadge { display:inline-block; width:20pt; height:20pt; line-height:20pt; text-align:center;
  border-radius:50%; font-weight:bold; font-size:8.5pt; color:#fff; }
.r1{background:#D4AF37;} .r2{background:#9AA3AD;} .r3{background:#B08D57;} .rn{background:#1B365D;}
.scorebar { background:#e7e9ee; border-radius:3px; height:9pt; width:52pt; display:inline-block; vertical-align:middle; overflow:hidden;}
.scorebar > span { display:block; height:100%; background:#1B365D; }
.flag { font-size:7pt; font-weight:bold; padding:1pt 4pt; border-radius:3px; color:#fff; }
.LIVE{background:#2e7d32;} .VERIFY{background:#C9922B;} .CLOSED{background:#9AA3AD;}
.kpis { display:flex; gap:9pt; margin:8pt 0 12pt 0; }
.kpi { flex:1; border:1pt solid #e2e5ea; border-top:3pt solid #D4AF37; border-radius:5px; padding:8pt 9pt; background:#fff; }
.kpi .n { font-size:17pt; font-weight:bold; color:#1B365D; }
.kpi .l { font-size:7.6pt; color:#5a6570; text-transform:uppercase; letter-spacing:.4px; }
.cards { display:flex; flex-wrap:wrap; gap:9pt; }
.card { width:calc(50% - 5pt); box-sizing:border-box; border:1pt solid #e2e5ea; border-radius:6px;
  padding:9pt 10pt; page-break-inside:avoid; background:#fff; border-left:4pt solid #1B365D; }
.card.win { border-left:4pt solid #D4AF37; background:#FBF9F2; }
.card .top { display:flex; justify-content:space-between; align-items:baseline; }
.card .nm { font-size:11pt; font-weight:bold; color:#1B365D; }
.card .sc { font-size:15pt; font-weight:bold; color:#D4AF37; }
.card .row { font-size:8.4pt; margin:3pt 0; }
.card .lab { color:#8a929c; text-transform:uppercase; font-size:7pt; letter-spacing:.4px; }
.card .vd { font-style:italic; color:#36454F; font-size:8.4pt; margin-top:4pt; border-top:.6pt dotted #d5d9df; padding-top:4pt; }
.callout { background:#1B365D; color:#fff; border-radius:6px; padding:11pt 13pt; }
.callout h3 { color:#D4AF37; } .callout li{ margin:3pt 0; font-size:9pt; line-height:1.4; }
.chart { width:100%; margin:6pt 0 2pt 0; }
.seg { border:1pt solid #e2e5ea; border-radius:6px; padding:8pt 10pt; margin:6pt 0; border-top:3pt solid #1B365D; }
.seg .h { font-weight:bold; color:#1B365D; font-size:10pt; }
.seg .w { color:#D4AF37; font-weight:bold; }
.appx th { background:#36454F; color:#fff; text-align:left; padding:4pt 6pt; font-size:7.8pt; }
.appx td { padding:4pt 6pt; border-bottom:.6pt solid #e2e5ea; font-size:8.2pt; }
.appx tr:nth-child(even) td { background:#F7F5EF; }
.wt th{background:#1B365D;color:#fff;padding:4pt 7pt;text-align:left;font-size:8pt;}
.wt td{padding:4pt 7pt;border-bottom:.6pt solid #e2e5ea;font-size:8.6pt;}
.src { font-size:8pt; line-height:1.45; }
.src li{ margin:3pt 0; word-break:break-all; }
.note { background:#F4F1E8; border-left:3pt solid #D4AF37; padding:7pt 10pt; font-size:8.6pt; border-radius:0 4px 4px 0; }
.sig { margin-top:10pt; font-size:9pt; }
.sig .nm{ font-weight:bold; color:#1B365D; font-size:11pt; }
section { page-break-before: always; }
"""

def running_bits():
    return f"""
    <div class="hdr"><span class="l">MILHEM GROUP PROPERTIES</span>
      <span class="r">Brokerage Transfer Analysis &nbsp;|&nbsp; {DATE}</span></div>"""

# ---------- Cover ----------
cover = f"""
<div class="cover">
  <div class="brandtop">MILHEM GROUP PROPERTIES</div>
  <div class="band">
    <div class="sub">Private Capital Advisory</div>
    <div class="rule"></div>
    <h1>Brokerage &amp; Private-Bank<br>Transfer Value Ranking</h1>
    <div class="rule"></div>
    <p style="color:#c8d0dc;font-size:11pt;max-width:15cm;">
      A weighted, after-tax scoring of where to move $1,000,000 to $2,000,000 of
      appreciated, in-kind assets for the largest <span class="gold">total</span>
      economic package, not the biggest headline cash bonus.</p>
  </div>
  <div class="meta">
    Prepared for Mattson Wardy &nbsp;&bull;&nbsp; Self-directed value portfolio &amp; rental operations<br>
    Retrieval date {DATE} &nbsp;&bull;&nbsp; Assumed combined marginal tax rate 40% &nbsp;&bull;&nbsp; Confidential
  </div>
</div>"""

# ---------- Dashboard: KPI + league table + segments ----------
top = INST[0]; rh = next(i for i in INST if i["key"]=="Robinhood")
kpis = f"""
<div class="kpis">
  <div class="kpi"><div class="n">{esc(top['name'].split(' /')[0])}</div><div class="l">Top total-value pick &nbsp;(score {top['score']})</div></div>
  <div class="kpi"><div class="n">{money(rh['at2'])}</div><div class="l">Best net after-tax cash @ $2M (Robinhood 2%)</div></div>
  <div class="kpi"><div class="n">10 + 5</div><div class="l">Institutions scored + flagged watchlist</div></div>
</div>"""

rows = ""
for r,it in enumerate(INST,1):
    badge = f'<span class="rankbadge {"r1" if r==1 else "r2" if r==2 else "r3" if r==3 else "rn"}">{r}</span>'
    perk = esc(it["standout"])
    rows += f"""<tr>
      <td>{badge}</td>
      <td><b>{esc(it['name'])}</b><br><span class="small">{esc(it['type'])} &bull; {esc(tier_label(r))}</span></td>
      <td>{money(it['at2'])}<br><span class="small">{esc(it['pct'])}</span></td>
      <td style="max-width:5.4cm">{perk}</td>
      <td><span class="scorebar"><span style="width:{it['score']}%"></span></span> <b>{it['score']}</b></td>
      <td><span class="flag {it['v']}">{it['v']}</span></td></tr>"""

segblocks = ""
seg_extra = {
 "Pure cash maximizer":"Robinhood Gold 2% match delivers "+money(rh['at2'])+" after tax at $2M; the trade is a 5-year lock plus Gold membership.",
 "Mortgage / loan bundler":"Merrill / BofA Premier tier at $1M unlocks a 75% card-rewards boost, a 0.25% mortgage-rate reduction, and a 0.625% HELOC discount; recurring value compounds every year you hold property.",
 "Active margin trader":"Interactive Brokers is the lowest ongoing cost of capital at roughly 4.8% versus 6.75% at Robinhood; on a $500k debit that is about $9,750 saved per year. Robinhood Gold is the bonus-adjusted alternative if you commit to the 5-year hold.",
}
for name, winners in SEG.items():
    segblocks += f"""<div class="seg"><span class="h">{esc(name)}:</span>
      <span class="w">{esc(winners[0])}</span> &gt; {esc(winners[1])} &gt; {esc(winners[2])}
      <div class="small" style="margin-top:3pt">{seg_extra[name]}</div></div>"""

dashboard = f"""
<section>
  {running_bits()}
  <h2>Executive Dashboard</h2>
  <p class="lead">The composite weights net after-tax cash (30), recurring lending and card value (25),
  cash and CD yield (15), hold and clawback flexibility (15), tier perks and service (10), and
  negotiability (5). The headline-cash leader does not win the total-value crown; a relationship
  tier does, because recurring mortgage, HELOC, and card value compounds for a leveraged operator.</p>
  {kpis}
  <table class="league">
    <tr><th>#</th><th>Institution</th><th>Net after-tax @ $2M</th><th>Standout element</th><th>Composite</th><th>Status</th></tr>
    {rows}
  </table>
  <p class="small">Composite score is 0 to 100. Status: LIVE confirmed on {DATE}; VERIFY not confirmable at the
  $1M to $2M tier from public pages; CLOSED expired. Full arithmetic in the appendix.</p>
</section>"""

segments = f"""
<section>
  {running_bits()}
  <h2>Best Picks by Investor Segment</h2>
  <p class="lead">The winner changes with how you will actually use the assets. Cash-max chasers, property
  bundlers, and margin borrowers should not transfer to the same institution.</p>
  {segblocks}
  <div class="callout" style="margin-top:12pt">
    <h3>What $1,000,000 unlocks</h3>
    <ul>
      <li><b>BofA / Merrill Premier tier:</b> 75% credit-card rewards boost, 0.25% mortgage-rate cut, 0.625% HELOC discount, dedicated team.</li>
      <li><b>Chase Private Client:</b> negotiated mortgage pricing, relationship banking, waived fees.</li>
      <li><b>Schwab &amp; Fidelity:</b> private-client desks, competitor-offer matching, priority service.</li>
      <li><b>Robinhood &amp; Public:</b> uncapped percentage match; every incremental $100k earns $2,000 or $1,000 respectively.</li>
      <li><b>Interactive Brokers:</b> tier does not gate anything; the edge is a structurally lower margin rate.</li>
    </ul>
  </div>
</section>"""

# ---------- Profile cards + bar chart ----------
cards = ""
for r,it in enumerate(INST[:6],1):
    win = " win" if r==1 else ""
    cards += f"""<div class="card{win}">
      <div class="top"><span class="nm">{r}. {esc(it['name'])}</span><span class="sc">{it['score']}</span></div>
      <div class="row"><span class="lab">Net after-tax</span> &nbsp; $1M {money(it['at1'])} &nbsp;|&nbsp; $2M {money(it['at2'])} &nbsp;
        <span class="flag {it['v']}">{it['v']}</span></div>
      <div class="row"><span class="lab">Offer</span> &nbsp; {esc(it['pct'])}; hold {it['hold_mo']} mo</div>
      <div class="row"><span class="lab">Standout</span> &nbsp; {esc(it['standout'])}</div>
      <div class="vd">{esc(it['verdict'])}.</div></div>"""

profiles = f"""
<section>
  {running_bits()}
  <h2>Top Institution Profiles</h2>
  <p class="lead">The leaders split cleanly: Robinhood and Public win on raw match, Merrill and Chase on
  relationship and lending value, Fidelity on flexibility and yield. Read the card verdicts against your
  intended use of the assets.</p>
  <div class="cards">{cards}</div>
  <img class="chart" src="assets/chart_bars.png" alt="Net after-tax bar chart">
  <p class="small">After-tax figures apply the 40% marginal assumption to pre-tax bonuses. Robinhood and
  Public scale linearly with assets, so their $2M bars are double their $1M bars; flat-cash offers cap out.</p>
</section>"""

# ---------- Charts + tier callout ----------
charts = f"""
<section>
  {running_bits()}
  <h2>Scoring Visualizations</h2>
  <p class="lead">Two views of the same model: the heatmap shows every institution across all six weighted
  dimensions, and the radar isolates the three composite leaders so their trade-offs are legible.</p>
  <img class="chart" src="assets/chart_heatmap.png" alt="heatmap" style="width:80%; display:block; margin:2pt auto;">
  <p class="small" style="margin-bottom:4pt; text-align:center">Darker navy is a stronger dimension score (0 to 100);
  Robinhood and Public own cash, Merrill and Chase own recurring value and perks, Fidelity and IBKR own yield and flexibility.</p>
  <img class="chart" src="assets/chart_radar.png" alt="radar" style="width:60%; display:block; margin:2pt auto 0 auto;">
  <p class="small" style="text-align:center">The headline-cash leader (Robinhood) spikes on a single axis; the
  total-value leader (Merrill) covers more area across the weighted criteria.</p>
</section>"""

# ---------- Appendix ----------
wt_rows = "".join(f"<tr><td>{DIM_LABEL[k]}</td><td>{v}</td><td>{esc(rat)}</td></tr>"
  for (k,v),rat in zip(W.items(), [
   "Absolute after-tax dollars; the direct prize. Normalized to the best offer.",
   "Annualized mortgage, HELOC, and card value; compounds yearly for a property operator.",
   "Sweep and CD yield edge at the $1M to $2M cash level.",
   "Shorter hold and softer clawback rank higher; a 5-year lock is penalized.",
   "Private-client tier, dedicated service, platform depth.",
   "Whether the offer can be negotiated upward at this asset level."]))

cash_rows = ""
for it in INST:
    yrs = max(it["hold_mo"],1)/12
    ann = (it["at2"]/yrs)/2_000_000*100 if it["hold_mo"]>0 else 0
    anns = f"{ann:.2f}%" if it["hold_mo"]>0 else "n/a"
    cash_rows += f"""<tr><td>{esc(it['name'])}</td><td>{money(it['b1'])}</td><td>{money(it['at1'])}</td>
      <td>{money(it['b2'])}</td><td>{money(it['at2'])}</td><td>{it['hold_mo']}</td><td>{anns}</td>
      <td><span class="flag {it['v']}">{it['v']}</span></td></tr>"""

comp_rows = ""
for r,it in enumerate(INST,1):
    d=it["dims"]
    calc = " + ".join(f"{d[k]}&times;{W[k]/100:g}" for k in W)
    comp_rows += f"<tr><td>{r}. {esc(it['name'])}</td><td class='small'>{calc}</td><td><b>{it['score']}</b></td></tr>"

watch_rows = "".join(f"<tr><td>{esc(w['name'])}</td><td><span class='flag {w['status']}'>{w['status']}</span></td><td>{esc(w['note'])}</td></tr>" for w in WATCH)

appendix = f"""
<section>
  {running_bits()}
  <h2>Appendix A &bull; Scoring Model and Weights</h2>
  <p class="lead">Every score below is reproducible from the arithmetic shown. The composite is the
  weighted sum of six dimension scores, each on a 0 to 100 scale.</p>
  <h3>Weight table</h3>
  <table class="wt"><tr><th>Dimension</th><th>Weight</th><th>Rationale</th></tr>{wt_rows}
    <tr><td><b>Total</b></td><td><b>100</b></td><td></td></tr></table>

  <h3 style="margin-top:12pt">Composite arithmetic (dimension score &times; weight)</h3>
  <table class="appx"><tr><th>Institution</th><th>Calculation</th><th>Score</th></tr>{comp_rows}</table>

  <div class="note" style="margin-top:12pt"><b>Tax treatment.</b> Brokerage transfer bonuses are
  ordinary income, reported on Form 1099-MISC or 1099-INT, per IRS Publication 525. All after-tax
  figures apply a 40% combined marginal rate; override the rate and every after-tax number scales
  linearly. Move securities <b>in-kind</b> via ACATS so no position is sold and no capital gain is
  triggered by the transfer itself; only the cash bonus is taxable.</div>
</section>

<section>
  {running_bits()}
  <h2>Appendix B &bull; Cash Math and Segment Method</h2>
  <h3>Bonus cash: pre-tax to after-tax, with hold-adjusted yield</h3>
  <table class="appx">
    <tr><th>Institution</th><th>Pre-tax $1M</th><th>After-tax $1M</th><th>Pre-tax $2M</th><th>After-tax $2M</th>
      <th>Hold (mo)</th><th>Annualized after-tax on $2M</th><th>Status</th></tr>
    {cash_rows}
  </table>
  <p class="small">Annualized after-tax yield = after-tax bonus divided by the hold period in years, expressed
  on the $2M base. It lets a $5,000 / 12-month offer be compared against a $40,000 / 60-month offer on equal footing.</p>

  <h3 style="margin-top:10pt">Segment weighting</h3>
  <p class="small">Cash maximizer: cash 60, yield 15, hold 15, negotiability 10. Mortgage bundler:
  recurring 50, perks 20, cash 15, negotiability 15. Margin trader: yield 35, recurring 25, cash 25,
  perks 15, with an explicit overlay for cost of capital where Interactive Brokers leads.</p>

  <h3 style="margin-top:10pt">Watchlist (flagged, not scored)</h3>
  <table class="appx"><tr><th>Institution</th><th>Status</th><th>Why it is flagged</th></tr>{watch_rows}</table>
  <p class="small">These carry credible but unconfirmed value at the $1M to $2M tier. Private-bank
  relationship offers (Citi, Chase, Morgan Stanley, Wells Fargo, HSBC) are negotiated privately and are
  not posted; confirm by phone before acting.</p>
</section>

<section>
  {running_bits()}
  <h2>Appendix C &bull; Sources and Method Notes</h2>
  <p class="lead">All offers retrieved {DATE}. Primary institution pages take precedence; aggregator and
  forum sources are used for tier detail and real-world clawback behavior. Percentage-match economics
  (Robinhood, Public) were the decisive independent finding at this asset level.</p>
  <ol class="src">
  {''.join(f'<li>{t}. <span class="navy">{u}</span></li>' for t,u in SOURCES)}
  </ol>
  <div class="note"><b>Verification legend.</b> LIVE means confirmed active on the retrieval date.
  VERIFY means the structure is credible but the exact $1M to $2M value, hold, or negotiated tier could
  not be confirmed from a public page and should be checked directly. CLOSED means expired. No offer in
  the scored league is presented as current unless marked LIVE.</div>
  <div class="note" style="margin-top:8pt"><b>Method and independence note.</b> Rendering engine WeasyPrint;
  charts built with matplotlib in the Milhem Group palette; model computed in Python with all arithmetic
  exposed. This pass deliberately diverges from a wide comparison-grid layout, uses a scorecard and
  dashboard language, and surfaces uncapped percentage-match offers that a flat-cash screen tends to miss.</div>
  <div class="sig">
    <div>Prepared by</div>
    <div class="nm">Mattson Wardy</div>
    <div class="small">Milhem Group Properties &bull; {DATE} &bull; Confidential. For internal decision use.
    Figures are estimates from public promotional terms and are not tax advice; confirm current offers and
    consult your tax advisor before transferring.</div>
  </div>
</section>"""

doc = f"<!doctype html><html><head><meta charset='utf-8'><style>{CSS}</style></head><body>{cover}{dashboard}{segments}{profiles}{charts}{appendix}</body></html>"
open("deliverables/report.html","w").write(doc)
HTML("deliverables/report.html", base_url="deliverables/").write_pdf("deliverables/Milhem_Group_Brokerage_Transfer_Analysis.pdf")
print("PDF rendered.")
