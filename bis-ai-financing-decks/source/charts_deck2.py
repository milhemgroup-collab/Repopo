"""Deck 2 (BIS Bulletin 120) chart recreations, Milhem branding."""
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.ticker import FuncFormatter
from milhem_style import (apply_milhem_style, brand_axes, save,
                          NAVY, GOLD, CHARCOAL, ASH, GREEN, RED, SLATE, DGOLD, GRAYBLUE)

apply_milhem_style()
OUT = "charts/"

def interp(anchor_years, anchor_vals, years):
    return np.interp(years, anchor_years, anchor_vals)

years = np.arange(1995, 2026)

# ---------------------------------------------------------------------------
# Graph 1.A  -- IT-related investment as share of GDP (stacked area)
# ---------------------------------------------------------------------------
software = interp([1995,2000,2003,2010,2020,2025],[0.8,1.9,1.4,1.6,2.3,2.9], years)
other_it = interp([1995,2000,2003,2010,2020,2025],[0.6,1.6,0.9,0.95,1.0,1.05], years)
it_manuf = interp([1995,2000,2003,2010,2020,2025],[0.08,0.28,0.16,0.15,0.18,0.38], years)
dcentre  = interp([1995,2000,2003,2010,2020,2025],[0.05,0.18,0.12,0.2,0.42,0.66], years)
fig, ax = plt.subplots(figsize=(12.6, 6.5))
ax.stackplot(years, software, other_it, it_manuf, dcentre,
             colors=[NAVY, SLATE, GOLD, DGOLD],
             labels=["Software", "Other IT equipment", "IT manufacturing facilities", "Data centres (incl equipment)"])
total = software+other_it+it_manuf+dcentre
ax.plot(years, total, color=CHARCOAL, lw=1.0, alpha=0)
ax.axhline(total[years==2000][0], color=CHARCOAL, ls=":", lw=1.3)
ax.text(1996, total[years==2000][0]+0.06, "Dot-com peak (2000)", fontsize=10, color=CHARCOAL, style="italic")
ax.text(2025, total[-1]+0.05, f"{total[-1]:.0f}% of GDP", ha="right", fontweight="bold", color=NAVY, fontsize=12)
ax.set_ylim(0, 5.6)
ax.yaxis.set_major_formatter(FuncFormatter(lambda x, _: f"{x:.0f}%"))
ax.legend(loc="upper left", fontsize=10, ncol=1)
brand_axes(ax, title="AI Investment Has Passed the Dot-Com Peak",
           subtitle="Total IT-related investment as a share of US GDP; this boom is driven by IT-producing, not IT-using, firms",
           ylabel="Share of US GDP (%)",
           source="Recreated from BIS Bulletin 120, Graph 1.A (shape approximate). Data centre equipment estimated at 3x construction spend, per BIS citing Noffsinger et al (2025).")
save(fig, OUT+"g1a_gdp.png")

# ---------------------------------------------------------------------------
# Graph 1.B  -- contribution to GDP growth
# ---------------------------------------------------------------------------
yrs = ["2022","2023","2024","2025"]
dc_semi = [0.1, 0.3, 0.45, 0.5]      # pp from data centres + semiconductor facilities
tot_it  = [0.3, 0.6, 0.8, 0.9]       # pp from total IT investment
x = np.arange(len(yrs))
fig, ax = plt.subplots(figsize=(12.4, 6.4))
ax.bar(x-0.2, dc_semi, width=0.38, color=NAVY, label="Data centres + semiconductor facilities", edgecolor="white")
ax.bar(x+0.2, tot_it, width=0.38, color=GOLD, label="Total IT investment", edgecolor="white")
for xi, v in zip(x-0.2, dc_semi): ax.text(xi, v+0.02, f"{v:.2f}", ha="center", va="bottom", fontsize=10.5, color=NAVY, fontweight="bold")
for xi, v in zip(x+0.2, tot_it): ax.text(xi, v+0.02, f"{v:.1f}", ha="center", va="bottom", fontsize=10.5, color=DGOLD, fontweight="bold")
ax.set_xticks(x); ax.set_xticklabels(yrs)
ax.set_ylim(0, 1.05)
ax.yaxis.set_major_formatter(FuncFormatter(lambda v, _: f"{v:.1f}pp"))
ax.legend(loc="upper left", fontsize=10.5)
ax.text(0.985, 0.90, "H1 2025: GDP growth would have been\njust 0.1% without data centres and IT",
        transform=ax.transAxes, ha="right", va="top", fontsize=11, color=CHARCOAL,
        bbox=dict(boxstyle="round,pad=0.5", fc="#FBF6E6", ec=GOLD, lw=2))
brand_axes(ax, title="Half of Recent US GDP Growth",
           subtitle="Contribution to US GDP growth (percentage points); IT investment offset tariff drag",
           ylabel="Contribution to GDP growth (pp)",
           source="Recreated from BIS Bulletin 120, Graph 1.B (shape approximate). Figures may overstate net contribution as some equipment is imported.")
save(fig, OUT+"g1b_contribution.png")

# ---------------------------------------------------------------------------
# Graph 1.C  -- data centre spending projection fan
# ---------------------------------------------------------------------------
py = np.arange(2025, 2031)
base = np.linspace(0.5, 0.8, len(py))     # IEA base
high = np.linspace(0.5, 1.3, len(py))     # McKinsey momentum
mid = (base+high)/2
fig, ax = plt.subplots(figsize=(12.4, 6.4))
ax.fill_between(py, base, high, color=NAVY, alpha=0.14, label="Projection range")
ax.plot(py, high, color=NAVY, lw=2.2, label="McKinsey continued-momentum (high)")
ax.plot(py, base, color=GOLD, lw=2.2, label="IEA base case (medium)")
ax.plot(py, mid, color=CHARCOAL, lw=1.4, ls="--")
ax.text(2030, high[-1]+0.02, "1.3%", color=NAVY, fontweight="bold", ha="right", fontsize=12)
ax.text(2030, base[-1]-0.06, "0.8%", color=DGOLD, fontweight="bold", ha="right", fontsize=12)
ax.text(2025, 0.5+0.03, "0.5% today", color=CHARCOAL, fontsize=11, fontweight="bold")
ax.set_ylim(0.3, 1.5)
ax.yaxis.set_major_formatter(FuncFormatter(lambda v, _: f"{v:.1f}%"))
ax.set_xticks(py)
ax.legend(loc="upper left", fontsize=10.5)
ax.text(0.985, 0.16, "Incremental annual spend:\n$100-225 billion per year",
        transform=ax.transAxes, ha="right", va="bottom", fontsize=11.5, color=CHARCOAL,
        bbox=dict(boxstyle="round,pad=0.5", fc="#FBF6E6", ec=GOLD, lw=2))
brand_axes(ax, title="The Next Five Years: $100-225 Billion More Per Year",
           subtitle="Data centre spending as a share of US GDP; the denominator for every later financing estimate",
           ylabel="Data centre spend, share of GDP (%)",
           source="Recreated from BIS Bulletin 120, Graph 1.C (shape approximate). Scenario anchors: McKinsey (high), IEA (medium), per BIS.")
save(fig, OUT+"g1c_projection.png")

# ---------------------------------------------------------------------------
# Graph 2.B  -- the self-funding era ends (dual panel)
# ---------------------------------------------------------------------------
yy = np.arange(2015, 2026)
capex_rev = interp([2015,2019,2022,2024,2025],[9,12,15,19,23], yy)     # capex/revenue %
fcf_assets = interp([2015,2019,2022,2024,2025],[11,12,10,8,6.5], yy)   # fcf/assets %
capex_abs = interp([2015,2019,2022,2024,2025],[70,140,260,400,520], yy)
fcf_abs   = interp([2015,2019,2022,2024,2025],[90,170,240,290,300], yy)
fig, (a1, a2) = plt.subplots(1, 2, figsize=(13.2, 6.2))
a1.plot(yy, capex_rev, color=NAVY, lw=2.2, marker="o", markersize=4, label="Capex / revenue")
a1.plot(yy, fcf_assets, color=GOLD, lw=2.2, marker="s", markersize=4, label="Free cash flow / assets")
a1.yaxis.set_major_formatter(FuncFormatter(lambda v,_: f"{v:.0f}%"))
a1.set_title("Ratios", color=NAVY, fontweight="bold", fontsize=12.5, loc="left")
a1.legend(loc="upper left", fontsize=10); a1.yaxis.grid(True); a1.xaxis.grid(False); a1.set_axisbelow(True)
a2.plot(yy, capex_abs, color=NAVY, lw=2.4, marker="o", markersize=4, label="Capex")
a2.plot(yy, fcf_abs, color=GOLD, lw=2.4, marker="s", markersize=4, label="Free cash flow")
a2.fill_between(yy, capex_abs, fcf_abs, where=(capex_abs>fcf_abs), color=RED, alpha=0.12)
a2.yaxis.set_major_formatter(FuncFormatter(lambda v,_: f"${v:.0f}bn"))
a2.set_title("Absolute (USD bn)", color=NAVY, fontweight="bold", fontsize=12.5, loc="left")
a2.legend(loc="upper left", fontsize=10); a2.yaxis.grid(True); a2.xaxis.grid(False); a2.set_axisbelow(True)
a2.annotate("FCF now lags capex", xy=(2025, 410), xytext=(2020.4, 470), fontsize=10.5, color=RED, fontweight="bold",
            arrowprops=dict(arrowstyle="->", color=RED, lw=1.3))
fig.suptitle("The Self-Funding Era Is Ending", color=NAVY, fontweight="bold", fontsize=16, x=0.012, ha="left", y=1.02)
fig.text(0.012, 0.955, "Alphabet, Amazon, Meta, Microsoft, Oracle: capex has overtaken internally generated cash",
         fontsize=10.5, color=CHARCOAL, ha="left")
fig.text(0.012, 0.012, "Recreated from BIS Bulletin 120, Graph 2.B (shape approximate). Universe per Graph 2 definition. Source: Capital IQ, asset-weighted, per BIS.",
         fontsize=8.5, style="italic", color=CHARCOAL)
save(fig, OUT+"g2b_selffund.png", pad=0.6)

# ---------------------------------------------------------------------------
# Graph 3.A  -- outstanding direct loans to AI firms + share line
# ---------------------------------------------------------------------------
gy = np.arange(2010, 2026)
outstanding = interp([2010,2015,2019,2022,2024,2025],[1,10,45,110,175,210], gy)
share = interp([2010,2015,2019,2022,2024,2025],[0.6,1.5,3.2,5.5,7.2,7.9], gy)
fig, ax = plt.subplots(figsize=(12.6, 6.4))
ax.bar(gy, outstanding, color=NAVY, width=0.7, edgecolor="white", label="Outstanding direct loans to AI firms")
ax.set_ylim(0, 260)
ax.yaxis.set_major_formatter(FuncFormatter(lambda v,_: f"${v:.0f}bn"))
ax.text(2025, 214, "$200bn+", ha="center", va="bottom", fontweight="bold", color=NAVY, fontsize=12)
ax2 = ax.twinx()
ax2.plot(gy, share, color=GOLD, lw=2.6, marker="o", markersize=4, label="Share of total outstanding direct loans (rhs)")
ax2.set_ylim(0, 10)
ax2.yaxis.set_major_formatter(FuncFormatter(lambda v,_: f"{v:.0f}%"))
ax2.spines["top"].set_visible(False)
ax2.text(2025, 8.1, "~8%", color=DGOLD, fontweight="bold", ha="right", fontsize=12)
ax2.set_ylabel("Share of outstanding direct loans (%)", color=CHARCOAL)
h1,l1 = ax.get_legend_handles_labels(); h2,l2 = ax2.get_legend_handles_labels()
ax.legend(h1+h2, l1+l2, loc="upper left", fontsize=10.5)
ax.text(0.985, 0.66, "BIS extrapolation:\n$300-600bn outstanding by 2030",
        transform=ax.transAxes, ha="right", va="bottom", fontsize=11, color=CHARCOAL,
        bbox=dict(boxstyle="round,pad=0.5", fc="#FBF6E6", ec=GOLD, lw=2))
brand_axes(ax, title="Outstanding AI Direct Loans: Near Zero to Over $200 Billion",
           subtitle="Share of total outstanding direct loan volumes rose from under 1% to almost 8%",
           ylabel="Outstanding (USD bn)",
           source="Recreated from BIS Bulletin 120, Graph 3.A (shape approximate). Universe: PitchBook verticals Artificial Intelligence, Big Data, Cloud Tech.")
save(fig, OUT+"g3a_outstanding.png")

# ---------------------------------------------------------------------------
# Graph 3.B/C  -- loan terms comparison (AI vs other sectors)
# ---------------------------------------------------------------------------
metrics = [("Secured share", 46, 48, "%","{:.0f}%"),
           ("Average size", 169, 90, "$M","${:.0f}M"),
           ("Maturity", 4.7, 4.8, "yrs","{:.1f}"),
           ("Rate spread", 6.2, 6.1, "pp","{:.1f}pp")]
fig, axs = plt.subplots(1, 4, figsize=(13.2, 5.6))
for ax,(name,ai,other,unit,fmt) in zip(axs, metrics):
    bars = ax.bar([0,1],[ai,other], color=[NAVY, GOLD], width=0.62, edgecolor="white")
    ax.set_xticks([0,1]); ax.set_xticklabels(["AI","Other"], fontsize=10.5)
    top = max(ai,other)
    ax.set_ylim(0, top*1.28)
    for xi,v in zip([0,1],[ai,other]):
        ax.text(xi, v+top*0.03, fmt.format(v), ha="center", va="bottom", fontweight="bold",
                color=(NAVY if xi==0 else DGOLD), fontsize=11.5)
    ax.set_title(name, color=NAVY, fontweight="bold", fontsize=12, pad=8)
    ax.set_yticks([]); ax.spines["left"].set_visible(False)
    ax.xaxis.grid(False); ax.yaxis.grid(False)
fig.suptitle("Same Price, Bigger Ticket", color=NAVY, fontweight="bold", fontsize=16, x=0.012, ha="left", y=1.03)
fig.text(0.012, 0.955, "AI-related private credit loans vs other sectors: nearly double the ticket at identical pricing",
         fontsize=10.5, color=CHARCOAL, ha="left")
fig.text(0.012, 0.012, "Recreated from BIS Bulletin 120, Graphs 3.B and 3.C. Spread difference statistically insignificant after controls (Bulletin footnote 6).",
         fontsize=8.5, style="italic", color=CHARCOAL)
save(fig, OUT+"g3bc_terms.png", pad=0.6)

# ---------------------------------------------------------------------------
# Graph 4  -- AI boom scale vs historical booms
# ---------------------------------------------------------------------------
eps = [("Japan property (1980s)", 5.5, GRAYBLUE),
       ("Australia mining (2000s)", 5.4, GRAYBLUE),
       ("US dot-com IT (1990s)", 2.0, CHARCOAL),
       ("US shale (mid-2010s)", 1.0, SLATE),
       ("US AI (2020s)", 1.0, NAVY)]
names = [e[0] for e in eps]; vals=[e[1] for e in eps]; cols=[e[2] for e in eps]
fig, ax = plt.subplots(figsize=(12.6, 6.2))
bars = ax.barh(names, vals, color=cols, height=0.6, edgecolor="white")
bars[-1].set_edgecolor(GOLD); bars[-1].set_linewidth(3)
for b,v in zip(bars, vals):
    ax.text(v+0.1, b.get_y()+b.get_height()/2, f"~{v:.0f}% of GDP" if v>=2 else f"~{v:.0f}%",
            va="center", fontsize=11, fontweight="bold", color=CHARCOAL)
ax.set_xlim(0, 6.6)
ax.xaxis.set_major_formatter(FuncFormatter(lambda x,_: f"{x:.0f}%"))
ax.xaxis.grid(True); ax.yaxis.grid(False)
brand_axes(ax, title="Smaller Than You Think, Still Dangerous",
           subtitle="Peak investment size relative to GDP; the AI boom is modest, but boom-ends slow GDP growth by 1pp+",
           xlabel="Peak investment, share of GDP (%)",
           source="Recreated from BIS Bulletin 120, Graphs 4.A/4.B. Largest post-boom contraction followed the US dot-com boom despite its modest relative size.")
save(fig, OUT+"g4_scale.png")

print("Deck 2 charts done")
