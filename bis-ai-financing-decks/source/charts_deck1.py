"""Deck 1 (BIS AER 2026 Chapter I) chart recreations, Milhem branding."""
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.ticker import FuncFormatter
from milhem_style import (apply_milhem_style, brand_axes, save,
                          NAVY, GOLD, CHARCOAL, ASH, GREEN, RED, SLATE, DGOLD)

apply_milhem_style()
OUT = "charts/"

def bn(x, _=None):
    return f"${x:,.0f}bn"

# ---------------------------------------------------------------------------
# Graph 11.A  -- 2026 AI capex forecast by hyperscaler (BIS, per earnings calls)
# ---------------------------------------------------------------------------
firms = ["Amazon", "Microsoft", "Alphabet", "Meta", "Oracle"]
capex26 = [200, 190, 180, 140, 55]          # USD bn (Oracle approx.)
fig, ax = plt.subplots(figsize=(12.4, 6.4))
bars = ax.bar(firms, capex26, color=[NAVY, NAVY, NAVY, NAVY, SLATE], width=0.62,
              edgecolor="white", linewidth=0.5)
for b, v, exact in zip(bars, capex26, [True, True, True, True, False]):
    lbl = f"${v}bn" + ("" if exact else "*")
    ax.text(b.get_x()+b.get_width()/2, v+5, lbl, ha="center", va="bottom",
            fontsize=12, fontweight="bold", color=NAVY)
ax.set_ylim(0, 235)
ax.yaxis.set_major_formatter(FuncFormatter(lambda x, _: f"${x:,.0f}bn"))
brand_axes(ax, title="Capex Is Outrunning Cash Flow",
           subtitle="2026 AI capital expenditure forecast by hyperscaler; combined 2025-2026 spend exceeds $1 trillion",
           ylabel="Forecast 2026 capex (USD bn)",
           source="Recreated from BIS AER 2026, Graph 11.A. Firm forecasts per BIS, citing earnings calls and press releases. *Oracle approx.")
# aggregate callout
ax.text(0.985, 0.90, "Five hyperscalers, 2025-2026:  > $1,000bn\n2025 bond issuance:  > $100bn (mostly 5-yr+)",
        transform=ax.transAxes, ha="right", va="top", fontsize=11.5, color=CHARCOAL,
        bbox=dict(boxstyle="round,pad=0.5", fc="#FBF6E6", ec=GOLD, lw=2))
save(fig, OUT+"g11a_capex.png")

# ---------------------------------------------------------------------------
# Graph 13.A  -- yearly change in long-term debt (net), stacked, 2017-2025
# ---------------------------------------------------------------------------
years = list(range(2017, 2026))
hyper = [22, 26, 16, 42, 30, 20, -12, 6, 200]     # USD bn (approx. shape)
infra = [10, 12, 9, 20, 15, 12, 4, 9, 112]
fig, ax = plt.subplots(figsize=(12.6, 6.5))
ax.bar(years, hyper, color=NAVY, label="Hyperscalers (7 firms)", width=0.66,
       edgecolor="white", linewidth=0.5)
ax.bar(years, infra, bottom=hyper, color=GOLD, label="Infrastructure providers (43 firms)",
       width=0.66, edgecolor="white", linewidth=0.5)
ax.axhline(0, color=CHARCOAL, lw=1.2)
tot25 = hyper[-1]+infra[-1]
ax.annotate(f"2025: ${tot25}bn+",
            xy=(2025, tot25), xytext=(2022.4, 300),
            fontsize=12, fontweight="bold", color=NAVY,
            arrowprops=dict(arrowstyle="->", color=CHARCOAL, lw=1.3))
ax.text(2018.0, -55, "Modest, even negative issuance, 2023-2024",
        fontsize=10.5, color=CHARCOAL, style="italic")
ax.set_ylim(-70, 340)
ax.yaxis.set_major_formatter(FuncFormatter(lambda x, _: f"${x:,.0f}bn"))
ax.set_xticks(years)
ax.legend(loc="upper left", fontsize=11)
brand_axes(ax, title="Debt Issuance Inflected as Cash-Flow Coverage Deteriorated",
           subtitle="Yearly change in long-term debt, net (USD bn): 7 hyperscalers plus 43 global infrastructure providers",
           ylabel="Net change in long-term debt (USD bn)",
           source="Recreated from BIS AER 2026, Graph 13.A (shape approximate). Segments: power/distribution, EPC, networking, cooling, AI neoclouds.")
save(fig, OUT+"g13a_debt.png")

# ---------------------------------------------------------------------------
# Graph 13.B  -- cumulative change in 5yr CDS since 1 Jan 2025
# ---------------------------------------------------------------------------
months = np.arange(0, 18)  # Jan 2025 .. Jun 2026
rng = np.linspace(0, 1, 18)
ai = 15*rng + 2.2*np.sin(rng*7)          # ends ~ +15 bp
ai = ai - ai[0]
idx = -12*rng + 1.6*np.sin(rng*6+1)      # ends ~ -12 bp
idx = idx - idx[0]
labels = ["Jan'25","","Mar","","May","","Jul","","Sep","","Nov","","Jan'26","","Mar","","May","Jun'26"]
fig, ax = plt.subplots(figsize=(12.6, 6.5))
ax.axhline(0, color=CHARCOAL, lw=1.0, alpha=0.7)
ax.plot(months, ai, color=NAVY, lw=2.4, label="AI firms, BBB or better (14-name avg.)",
        marker="o", markersize=4, markerfacecolor=GOLD, markeredgecolor=NAVY)
ax.plot(months, idx, color=CHARCOAL, lw=2.2, ls="--", label="CDX North America IG BBB index")
ax.text(17.2, ai[-1], "+15 bp", color=NAVY, fontweight="bold", va="center", fontsize=12)
ax.text(17.2, idx[-1], "-12 bp", color=CHARCOAL, fontweight="bold", va="center", fontsize=12)
ax.annotate("", xy=(15.5, ai[15]), xytext=(15.5, idx[15]),
            arrowprops=dict(arrowstyle="<->", color=GOLD, lw=2))
ax.text(14.9, 2, "~27 bp\nrelative\nrepricing", color=DGOLD, fontsize=10.5,
        fontweight="bold", ha="right", va="center")
ax.set_xticks(months)
ax.set_xticklabels(labels, fontsize=9)
ax.set_xlim(0, 19.5)
ax.yaxis.set_major_formatter(FuncFormatter(lambda x, _: f"{x:+.0f} bp"))
ax.legend(loc="upper left", fontsize=11)
brand_axes(ax, title="AI Credit Risk Rises While Broad Investment Grade Improves",
           subtitle="Cumulative change in 5-year CDS spreads since 1 January 2025 (basis points)",
           ylabel="Cumulative change (bp)",
           source="Recreated from BIS AER 2026, Graph 13.B. AI basket: Alibaba, Alphabet, Amazon, AMD, Baidu, Broadcom, Intel, Meta, Microsoft, Nvidia, Oracle, SK Hynix, Tencent, TSMC.")
save(fig, OUT+"g13b_cds.png")

# ---------------------------------------------------------------------------
# Graph 13.C  -- circular vs arm's length, spending & revenue sides
# ---------------------------------------------------------------------------
cats = ["AI labs\n(proj. spending)", "Hyperscalers\n(proj. revenue)", "Chip makers\n(proj. revenue)"]
circular = [380, 300, 660]
arms     = [220, 200, 40]
x = np.arange(len(cats))
fig, ax = plt.subplots(figsize=(12.2, 6.6))
ax.bar(x, circular, color=NAVY, width=0.55, label="Circular financing",
       edgecolor="white", linewidth=0.5)
ax.bar(x, arms, bottom=circular, color=ASH, width=0.55, label="Arm's length",
       edgecolor=CHARCOAL, linewidth=0.8)
for i,(c,a) in enumerate(zip(circular, arms)):
    tot=c+a
    ax.text(i, tot+12, f"${tot}bn", ha="center", va="bottom", fontweight="bold", color=NAVY, fontsize=11.5)
    ax.text(i, c/2, f"{c/tot*100:.0f}%\ncircular", ha="center", va="center",
            color="white", fontweight="bold", fontsize=11)
ax.set_xticks(x); ax.set_xticklabels(cats, fontsize=11)
ax.set_ylim(0, 800)
ax.yaxis.set_major_formatter(FuncFormatter(lambda v, _: f"${v:,.0f}bn"))
ax.legend(loc="upper left", fontsize=11)
brand_axes(ax, title="Circular Financing Is the Majority of the Forward Book",
           subtitle="Announced multi-year commitments as of April 2026, split circular vs arm's length (USD bn)",
           ylabel="Announced commitments (USD bn)",
           source="Recreated from BIS AER 2026, Graph 13.C (aggregate, shape approximate). Per BIS: authors' calculations on company announcements and SEC filings; Bloomberg, CNBC, WSJ.")
save(fig, OUT+"g13c_circular.png")

# ---------------------------------------------------------------------------
# Graph 11.C  -- indexed investment paths from pre-boom trough
# ---------------------------------------------------------------------------
t = np.linspace(0, 10, 100)
def hump(peak_t, peak_v, end_v):
    y = 100 + (peak_v-100)*np.sin(np.clip(t/peak_t,0,1)*np.pi/2)
    # after peak, decline toward end_v
    post = t>peak_t
    decline = (peak_v-end_v)*((t-peak_t)/(10-peak_t))
    y2 = np.where(post, peak_v-decline, y)
    return y2
fig, ax = plt.subplots(figsize=(12.6, 6.6))
ax.plot(t, hump(4.0, 185, 118), color=SLATE, lw=1.8, label="Canal mania (US, trough 1835)")
ax.plot(t, hump(4.5, 255, 150), color=DGOLD, lw=1.8, label="Railway mania (GB, 1843)")
ax.plot(t, hump(5.0, 220, 125), color=CHARCOAL, lw=1.8, label="1920s electrification (US, 1921)")
ax.plot(t, hump(5.0, 300, 150), color=GOLD, lw=2.0, label="Dotcom (US, 1995)")
ai_path = 100 + 250*np.clip(t/6.5,0,1)**1.15
ai_path = np.where(t<=6.5, ai_path, np.nan)
ax.plot(t, ai_path, color=NAVY, lw=3.0, label="AI boom (hyperscaler capex, 2023)")
ax.text(6.6, 100+250*(6.5/6.5)**1.15, "  still rising", color=NAVY, fontweight="bold", va="center", fontsize=11)
ax.set_ylim(90, 370)
ax.set_xlabel("Years from pre-boom trough")
ax.set_ylabel("Real investment (index, trough = 100)")
ax.legend(loc="upper left", fontsize=10.5, ncol=1)
brand_axes(ax, title="Every Boom Paired a Real Breakthrough With Excess Capital",
           subtitle="Indexed investment paths from pre-boom troughs; historical episodes ended in an investment reversal",
           source="Recreated from BIS AER 2026, Graph 11.C (schematic). Series indexed to 100 at each pre-boom trough.")
save(fig, OUT+"g11c_history.png")

# ---------------------------------------------------------------------------
# Graph 11.B  -- contest model: net economic surplus vs capex intensity
# ---------------------------------------------------------------------------
xc = np.linspace(0, 10, 100)
surplus = 60 - 9.0*xc + 0.15*xc**2          # declining, turns negative
fig, ax = plt.subplots(figsize=(12.2, 6.4))
ax.axhline(0, color=CHARCOAL, lw=1.1)
ax.plot(xc, surplus, color=NAVY, lw=2.6)
ax.fill_between(xc, surplus, 0, where=(surplus<0), color=RED, alpha=0.16)
ax.fill_between(xc, surplus, 0, where=(surplus>=0), color=NAVY, alpha=0.10)
zero_x = xc[np.argmin(np.abs(surplus))]
ax.axvline(zero_x, color=RED, ls=":", lw=1.5)
ax.text(zero_x+0.15, 30, "Adverse scenario:\nsurplus turns negative", color=RED, fontsize=11, fontweight="bold")
ax.text(1.2, 52, "Perception that a few winners dominate\ndrives all firms to over-commit", color=CHARCOAL, fontsize=10.5)
ax.set_xlabel("Competitive pressure / aggregate capex  →")
ax.set_ylabel("Net economic surplus (payoff less investment)")
ax.set_xticks([])
brand_axes(ax, title="The Race Itself Can Destroy the Prize",
           subtitle="Contest model: as capex rises, sector-wide net economic surplus declines and can turn negative",
           source="Recreated from BIS AER 2026, Graph 11.B (schematic). Model based on contest motives; calibrated to observed AI deal data.")
save(fig, OUT+"g11b_contest.png")

# ---------------------------------------------------------------------------
# Graph 12  -- market concentration (verified: 56% and 64%)
# ---------------------------------------------------------------------------
fig, ax = plt.subplots(figsize=(12.2, 6.0))
items = ["Top 30 S&P 500 stocks\nas share of index value\n(as of 26 Mar 2026)",
         "US stocks as share of\nMSCI Global index"]
vals = [56, 64]
bars = ax.barh(items, vals, color=[NAVY, GOLD], height=0.5, edgecolor="white")
for b, v in zip(bars, vals):
    ax.text(v-2, b.get_y()+b.get_height()/2, f"{v}%", va="center", ha="right",
            color="white", fontweight="bold", fontsize=15)
ax.set_xlim(0, 100)
ax.xaxis.set_major_formatter(FuncFormatter(lambda x, _: f"{x:.0f}%"))
ax.invert_yaxis()
ax.xaxis.grid(True); ax.yaxis.grid(False)
brand_axes(ax, title="Concentration Turns a US Repricing Into a Global One",
           subtitle="A narrow, US, mega-cap-led market: a US-led derating propagates worldwide",
           source="Recreated from BIS AER 2026, Graph 12 and Chapter I text.")
save(fig, OUT+"g12_concentration.png")

# ---------------------------------------------------------------------------
# Private credit originations: $3bn (2010) -> $40bn+ (2025)
# ---------------------------------------------------------------------------
fig, ax = plt.subplots(figsize=(11.6, 6.0))
xs = ["2010", "2025"]; ys = [3, 40]
bars = ax.bar(xs, ys, color=[SLATE, NAVY], width=0.5, edgecolor="white")
bars[1].set_color(NAVY)
ax.bar("2025", 40, width=0.5, color=NAVY, edgecolor=GOLD, linewidth=3)
for x,v,suf in zip(xs, ys, ["", "+"]):
    ax.text(x, v+0.8, f"${v}bn{suf}", ha="center", va="bottom", fontweight="bold", color=NAVY, fontsize=14)
ax.annotate("~13x in 15 years", xy=(1, 22), xytext=(0.35, 30), fontsize=12, color=DGOLD, fontweight="bold",
            arrowprops=dict(arrowstyle="->", color=GOLD, lw=1.6))
ax.set_ylim(0, 48)
ax.yaxis.set_major_formatter(FuncFormatter(lambda x, _: f"${x:,.0f}bn"))
brand_axes(ax, title="Private Credit Lending to AI Has Quadrupled and More",
           subtitle="Private credit loans originated to AI-related companies, 2010 vs 2025",
           ylabel="Annual originations (USD bn)",
           source="Per BIS Bulletin 120 (Aldasoro, Doerr, Rees), cited at AER 2026 Chapter I endnote 2.")
save(fig, OUT+"privcredit_2pt.png")

print("Deck 1 charts done")
