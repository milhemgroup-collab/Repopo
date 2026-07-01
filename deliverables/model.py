# -*- coding: utf-8 -*-
"""
Milhem Group Properties — Brokerage / Private-Bank Transfer Value Model
Builds a transparent weighted composite score for moving $1M-$2M of appreciated,
in-kind brokerage assets. Prints every calculation, emits an appendix JSON, and
renders three brand-styled charts. No em dashes anywhere in output text.
Retrieval date for all offers: 2026-07-01.
"""
import json, textwrap
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
from matplotlib.patches import Patch
import numpy as np
from math import pi

# ----- Brand system -------------------------------------------------------
NAVY = "#1B365D"; GOLD = "#D4AF37"; CHARCOAL = "#36454F"
LIGHT = "#F4F1E8"; PAPER = "#FFFFFF"; GRIDGREY = "#D9D9D9"
for f in ["/usr/share/fonts/truetype/crosextra/Carlito-Regular.ttf",
          "/usr/share/fonts/truetype/crosextra/Carlito-Bold.ttf",
          "/usr/share/fonts/truetype/crosextra/Carlito-Italic.ttf"]:
    fm.fontManager.addfont(f)
plt.rcParams.update({"font.family": "Carlito", "font.size": 11, "text.parse_math": False,
                     "axes.edgecolor": CHARCOAL, "text.color": CHARCOAL,
                     "axes.labelcolor": CHARCOAL, "xtick.color": CHARCOAL,
                     "ytick.color": CHARCOAL})

TAX = 0.40          # combined marginal rate (override-able)
ACAT_OUT = 75       # assumed ACAT-out cost offset when later leaving
ASSET_LOW, ASSET_HIGH = 1_000_000, 2_000_000

# ----- Institution dataset (retrieved 2026-07-01) -------------------------
# bonus_fn returns pre-tax cash bonus for a given transferred asset level.
# 'v' = verification status: LIVE, VERIFY, CLOSED.
INST = [
 {"key":"Robinhood","name":"Robinhood Gold","type":"App broker",
  "b1":20000,"b2":40000,"pct":"2% uncapped ACATS match","hold_mo":60,
  "clawback":"Early-removal fee if withdrawn < 5 yrs; must hold Gold 1 yr",
  "v":"LIVE","note3":"3% if margin balance >= $10k (rewards-season, VERIFY if still open)",
  "standout":"Highest raw match at this asset level; 2% = $40k at $2M",
  "verdict":"Cash king, but a 5-year lock and app-tier service",
  "sweep":"~4.0% Gold cash sweep","margin":"6.75% flat",
  "dims":{"cash":100,"recurring":5,"yield":90,"hold":20,"perks":45,"neg":15}},

 {"key":"Merrill","name":"Merrill Edge / BofA Premier","type":"Bank + broker",
  "b1":1000,"b2":1000,"pct":"Up to ~$1,000 ACAT bonus","hold_mo":3,
  "clawback":"~90-day funding hold on bonus; tier benefits ongoing, no clawback",
  "v":"LIVE","note3":"$1M = BofA Rewards Premier tier (formerly Diamond Honors)",
  "standout":"75% credit-card rewards boost; 0.25% mortgage + 0.625% HELOC discount",
  "verdict":"Total-value winner for a leveraged real-estate operator",
  "sweep":"Low default sweep (~0.01-0.5%)","margin":"~10-12% (negotiable)",
  "dims":{"cash":2.5,"recurring":100,"yield":20,"hold":95,"perks":95,"neg":75}},

 {"key":"Public","name":"Public.com","type":"App broker",
  "b1":10000,"b2":20000,"pct":"1% uncapped ACATS match","hold_mo":60,
  "clawback":"Forfeit match if withdrawn < 5 yrs",
  "v":"LIVE","note3":"No Gold subscription required; flat 1% at any size",
  "standout":"Cleanest large-dollar match with no subscription gate",
  "verdict":"Second-best raw cash, same 5-year lock as Robinhood",
  "sweep":"~4.1% high-yield cash","margin":"~5.75-6.75%",
  "dims":{"cash":50,"recurring":3,"yield":92,"hold":22,"perks":50,"neg":20}},

 {"key":"Fidelity","name":"Fidelity","type":"Full-service broker",
  "b1":0,"b2":0,"pct":"No standing transfer bonus ($0)","hold_mo":0,
  "clawback":"None (no bonus, no lock)",
  "v":"LIVE","note3":"Will occasionally match a competitor offer on request (VERIFY)",
  "standout":"Best auto-sweep (SPAXX ~4%), no lock, strong private-client service",
  "verdict":"Zero cash, but highest flexibility and yield floor",
  "sweep":"~4.0% SPAXX auto-sweep","margin":"~11-12% (negotiable)",
  "dims":{"cash":0,"recurring":8,"yield":95,"hold":100,"perks":88,"neg":60}},

 {"key":"Chase","name":"J.P. Morgan / Chase Private Client","type":"Bank + broker",
  "b1":1000,"b2":1000,"pct":"Self-directed up to $1,000; CPC negotiable","hold_mo":3,
  "clawback":"~90-day hold on public bonus",
  "v":"VERIFY","note3":"Private Client relationship offers are negotiated, not posted",
  "standout":"Relationship banking, negotiable mortgage pricing, CPC perks",
  "verdict":"Strong bundler if you negotiate the private-client package",
  "sweep":"Low sweep","margin":"~11-13% (negotiable)",
  "dims":{"cash":2.5,"recurring":40,"yield":25,"hold":85,"perks":92,"neg":90}},

 {"key":"SoFi","name":"SoFi Invest","type":"App broker + bank",
  "b1":10000,"b2":10000,"pct":"Up to $10,000 ACAT (tier, VERIFY exact)","hold_mo":12,
  "clawback":"~12-month hold (VERIFY)",
  "v":"VERIFY","note3":"Exact $1M/$2M tier not posted; modeled at $10k cap",
  "standout":"Cash plus member banking ecosystem and relationship APY",
  "verdict":"Solid cash if the top tier confirms; verify before acting",
  "sweep":"~3.8% checking/savings","margin":"~11%",
  "dims":{"cash":25,"recurring":12,"yield":80,"hold":70,"perks":60,"neg":30}},

 {"key":"ETRADE","name":"E*TRADE (Morgan Stanley)","type":"Bank + broker",
  "b1":1500,"b2":1500,"pct":"OFFER26 public cap $1,500","hold_mo":12,
  "clawback":"12-month hold after 60-day funding window",
  "v":"LIVE","note3":"Larger bonuses require Morgan Stanley wealth negotiation (VERIFY)",
  "standout":"Access to Morgan Stanley wealth platform and lending",
  "verdict":"Weak public cash; value is the MS relationship door",
  "sweep":"~4.0% Premium Savings (6-mo promo)","margin":"~11-12%",
  "dims":{"cash":3.75,"recurring":8,"yield":80,"hold":78,"perks":80,"neg":85}},

 {"key":"Schwab","name":"Charles Schwab","type":"Full-service broker",
  "b1":6000,"b2":6000,"pct":"Investor Reward up to $6,000 (public top tier)","hold_mo":12,
  "clawback":"12-month hold; negotiable higher via Private Client",
  "v":"LIVE","note3":"Private Client desk will negotiate above the public tier (VERIFY)",
  "standout":"Best-in-class service and negotiability at $1M+",
  "verdict":"Balanced; negotiate before accepting the posted $6k",
  "sweep":"Poor default sweep (~0.45%); must buy MMF manually","margin":"~11.5%",
  "dims":{"cash":15,"recurring":10,"yield":30,"hold":80,"perks":85,"neg":90}},

 {"key":"IBKR","name":"Interactive Brokers","type":"Pro broker",
  "b1":0,"b2":0,"pct":"No transfer bonus ($0)","hold_mo":0,
  "clawback":"None",
  "v":"LIVE","note3":"Lowest margin in market; benchmark + ~0.75% tiered",
  "standout":"Cheapest cost of capital (~4.8% at $500k+ debit) and high idle-cash yield",
  "verdict":"The margin trader's home; no cash, all carry advantage",
  "sweep":"~3.8% on idle cash","margin":"~4.58-4.83% (lowest)",
  "dims":{"cash":0,"recurring":10,"yield":85,"hold":100,"perks":55,"neg":20}},

 {"key":"tastytrade","name":"tastytrade","type":"Options broker",
  "b1":5000,"b2":5000,"pct":"Tiered; $5,000 flat at $1M+","hold_mo":12,
  "clawback":"12-month hold on initial funding",
  "v":"LIVE","note3":"Referral code required at signup; caps at $5k regardless of size",
  "standout":"Shortest lock among cash offers relative to dollars, options tooling",
  "verdict":"Fine for a trader, but the flat cap is weak at $2M",
  "sweep":"Moderate sweep","margin":"~9-11%",
  "dims":{"cash":12.5,"recurring":3,"yield":40,"hold":80,"perks":55,"neg":25}},
]

# ----- Watchlist (flagged, not scored in league) --------------------------
WATCH = [
 {"name":"Citigold Private Client","status":"VERIFY",
  "note":"Relationship cash historically up to ~$2k-$5k plus banking perks; not posted at $1M tier"},
 {"name":"Wells Fargo Premier","status":"VERIFY",
  "note":"Premier relationship pricing and Bilt-style card synergy; brokerage bonus not posted"},
 {"name":"HSBC Premier","status":"VERIFY",
  "note":"Global Premier relationship; US brokerage transfer bonus not currently posted"},
 {"name":"M1 Finance","status":"VERIFY",
  "note":"Advertises up to $10,000 transfer bonus; exact $1M/$2M tier and hold not confirmed"},
 {"name":"Webull","status":"VERIFY",
  "note":"Tiered ACAT bonus advertised; top-tier value and hold not confirmed for $1M+"},
]

WEIGHTS = {"cash":30,"recurring":25,"yield":15,"hold":15,"perks":10,"neg":5}
DIM_LABEL = {"cash":"Net after-tax cash","recurring":"Recurring lending / card",
             "yield":"Cash / CD yield","hold":"Hold & clawback flexibility",
             "perks":"Tier perks & service","neg":"Negotiability"}

def after_tax(x): return round(x*(1-TAX))
def composite(d): return round(sum(d[k]*WEIGHTS[k] for k in WEIGHTS)/100, 1)

# ----- Compute ------------------------------------------------------------
print("="*78)
print("MILHEM GROUP PROPERTIES  |  BROKERAGE TRANSFER VALUE MODEL")
print("Marginal tax rate assumed: {:.0%}   |   Retrieval date: 2026-07-01".format(TAX))
print("Bonuses treated as ordinary income (1099-MISC/INT, IRS Pub 525).")
print("="*78)

for it in INST:
    it["at1"] = after_tax(it["b1"]); it["at2"] = after_tax(it["b2"])
    it["score"] = composite(it["dims"])
    # hold-adjusted annualized after-tax yield on the $2M base
    yrs = max(it["hold_mo"],1)/12
    it["ann2"] = (it["at2"]/yrs)/ASSET_HIGH   # fraction per yr
    it["ann1"] = (it["at1"]/max(it["hold_mo"],1)*12)/ASSET_LOW

INST.sort(key=lambda x: x["score"], reverse=True)

print("\n--- CASH MATH (pre-tax -> after-tax @ {:.0%}) ---".format(TAX))
for it in INST:
    print(f"{it['name']:<34} $1M: ${it['b1']:>6,} -> ${it['at1']:>6,}   "
          f"$2M: ${it['b2']:>6,} -> ${it['at2']:>6,}   "
          f"hold {it['hold_mo']}mo   [{it['v']}]")

print("\n--- HOLD-ADJUSTED ANNUALIZED AFTER-TAX YIELD (on $2M base) ---")
for it in INST:
    if it["hold_mo"]>0:
        print(f"{it['name']:<34} after-tax ${it['at2']:>6,} / {it['hold_mo']}mo "
              f"= {it['ann2']*100:>5.2f}% per yr")
    else:
        print(f"{it['name']:<34} no bonus / no lock (n/a)")

print("\n--- WEIGHTED COMPOSITE (weights: "
      + ", ".join(f"{DIM_LABEL[k]} {v}" for k,v in WEIGHTS.items()) + ") ---")
for rank,it in enumerate(INST,1):
    parts = " + ".join(f"{it['dims'][k]}x{WEIGHTS[k]/100:g}" for k in WEIGHTS)
    print(f"{rank:>2}. {it['name']:<34} = {parts} = {it['score']}")

# ----- Segment rankings ---------------------------------------------------
def seg(weights):
    return sorted(INST, key=lambda it: sum(it["dims"][k]*weights.get(k,0)
                  for k in it["dims"]), reverse=True)
SEG = {
 "Pure cash maximizer": {"cash":60,"yield":15,"hold":15,"neg":10},
 "Mortgage / loan bundler": {"recurring":50,"perks":20,"cash":15,"neg":15},
 "Active margin trader": {"yield":35,"recurring":25,"cash":25,"perks":15},
}
print("\n--- SEGMENT WINNERS ---")
seg_winners = {}
for name,w in SEG.items():
    ranked = seg(w)
    seg_winners[name] = [r["name"] for r in ranked[:3]]
    print(f"{name}: " + " > ".join(seg_winners[name]))
# Margin note: IBKR is the pure cost-of-capital winner; overlay explicitly.
print("Note: for the margin segment, Interactive Brokers is the lowest ongoing")
print("cost of capital (~4.8% vs 6.75% Robinhood at $500k debit = ~$9,750/yr saved).")

# ----- Persist appendix data ---------------------------------------------
out = {"tax":TAX,"retrieved":"2026-07-01","weights":WEIGHTS,
       "institutions":INST,"watchlist":WATCH,
       "segments":{k:seg_winners[k] for k in SEG}}
with open("deliverables/assets/model_data.json","w") as f:
    json.dump(out,f,indent=2)

# =========================================================================
# CHARTS
# =========================================================================
def brand_ax(ax):
    for s in ["top","right"]: ax.spines[s].set_visible(False)
    ax.spines["left"].set_color(CHARCOAL); ax.spines["bottom"].set_color(CHARCOAL)
    ax.tick_params(length=0)

# 1) Horizontal grouped bar: net after-tax value at $1M and $2M (top 8 by score)
top = INST[:8]
names = [it["name"] for it in top][::-1]
v1 = [it["at1"] for it in top][::-1]
v2 = [it["at2"] for it in top][::-1]
y = np.arange(len(names)); h = 0.38
fig, ax = plt.subplots(figsize=(9.4,5.2))
ax.barh(y+h/2, v2, h, color=NAVY, label="After-tax @ $2M")
ax.barh(y-h/2, v1, h, color=GOLD, label="After-tax @ $1M")
for i,(a,b) in enumerate(zip(v1,v2)):
    ax.text(b+300, i+h/2, f"${b:,.0f}", va="center", fontsize=9, color=NAVY, weight="bold")
    ax.text(a+300, i-h/2, f"${a:,.0f}", va="center", fontsize=9, color=CHARCOAL)
ax.set_yticks(y); ax.set_yticklabels(names, fontsize=10)
ax.set_xlabel("Net after-tax cash bonus (USD, 40% marginal rate)")
ax.set_title("Net After-Tax Transfer Cash at $1M and $2M", color=NAVY, weight="bold", fontsize=14, pad=12)
ax.xaxis.set_major_formatter(matplotlib.ticker.FuncFormatter(lambda x,_:f"${x/1000:.0f}k"))
ax.set_xlim(0, max(v2)*1.18); brand_ax(ax)
ax.legend(loc="lower right", frameon=False, fontsize=10)
ax.grid(axis="x", color=GRIDGREY, lw=0.6); ax.set_axisbelow(True)
fig.tight_layout(); fig.savefig("deliverables/assets/chart_bars.png", dpi=170, facecolor=PAPER); plt.close()

# 2) Heatmap of dimension scores across institutions
dims = list(WEIGHTS.keys())
M = np.array([[it["dims"][d] for d in dims] for it in INST])
fig, ax = plt.subplots(figsize=(9.4,5.6))
im = ax.imshow(M, aspect="auto", cmap=matplotlib.colors.LinearSegmentedColormap.from_list(
    "mg",[PAPER,"#E9D9A2",GOLD,NAVY]), vmin=0, vmax=100)
ax.set_xticks(range(len(dims))); ax.set_xticklabels([DIM_LABEL[d] for d in dims], rotation=22, ha="right", fontsize=9)
ax.set_yticks(range(len(INST))); ax.set_yticklabels([it["name"] for it in INST], fontsize=9)
for i in range(len(INST)):
    for j in range(len(dims)):
        val=M[i,j]; ax.text(j,i,f"{val:.0f}",ha="center",va="center",
            color="white" if val>62 else CHARCOAL, fontsize=8.5, weight="bold")
ax.set_title("Score Heatmap Across Weighted Dimensions (0-100)", color=NAVY, weight="bold", fontsize=14, pad=12)
cb=fig.colorbar(im, ax=ax, fraction=0.025, pad=0.02); cb.outline.set_visible(False)
ax.tick_params(length=0)
fig.tight_layout(); fig.savefig("deliverables/assets/chart_heatmap.png", dpi=170, facecolor=PAPER); plt.close()

# 3) Radar of top 3 across 6 dimensions
top3 = INST[:3]
labels = [DIM_LABEL[d] for d in dims]
ang = [n/float(len(dims))*2*pi for n in range(len(dims))]; ang += ang[:1]
fig = plt.figure(figsize=(7.6,6.4)); ax = plt.subplot(111, polar=True)
ax.set_theta_offset(pi/2); ax.set_theta_direction(-1)
ax.set_xticks(ang[:-1]); ax.set_xticklabels(labels, fontsize=9)
ax.set_ylim(0,100); ax.set_yticks([20,40,60,80,100])
ax.set_yticklabels(["20","40","60","80","100"], fontsize=8, color=CHARCOAL)
ax.grid(color=GRIDGREY); ax.spines["polar"].set_color(GRIDGREY)
cols=[NAVY,GOLD,CHARCOAL]
for it,c in zip(top3,cols):
    vals=[it["dims"][d] for d in dims]; vals+=vals[:1]
    ax.plot(ang,vals,color=c,lw=2,label=f"{it['name']} ({it['score']})")
    ax.fill(ang,vals,color=c,alpha=0.12)
ax.set_title("Top 3 Composite Leaders Across Criteria", color=NAVY, weight="bold", fontsize=14, pad=22)
ax.legend(loc="upper right", bbox_to_anchor=(1.28,1.13), frameon=False, fontsize=9)
fig.tight_layout(); fig.savefig("deliverables/assets/chart_radar.png", dpi=170, facecolor=PAPER, bbox_inches="tight"); plt.close()

print("\nCharts written: chart_bars.png, chart_heatmap.png, chart_radar.png")
print("Appendix data written: model_data.json")
print("TOP OVERALL:", INST[0]["name"], INST[0]["score"], "| #2", INST[1]["name"], INST[1]["score"])
