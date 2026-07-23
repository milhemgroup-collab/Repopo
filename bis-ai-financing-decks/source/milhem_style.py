"""Milhem Group chart style helpers (built from the milhem-group-charts-tables spec)."""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager as fm

# Brand palette
NAVY = "#1B365D"
GOLD = "#D4AF37"
CHARCOAL = "#36454F"
WHITE = "#FFFFFF"
ASH = "#F5F5F5"
GREEN = "#2E7D32"
RED = "#C62828"
SLATE = "#5B7DA8"
DGOLD = "#9C7A1E"
GRAYBLUE = "#7A8B99"
SEQ = [NAVY, GOLD, CHARCOAL, SLATE, DGOLD, GRAYBLUE, GREEN, RED]

# Register Carlito (Calibri-metric compatible)
for p in [
    "/usr/share/fonts/truetype/crosextra/Carlito-Regular.ttf",
    "/usr/share/fonts/truetype/crosextra/Carlito-Bold.ttf",
    "/usr/share/fonts/truetype/crosextra/Carlito-Italic.ttf",
    "/usr/share/fonts/truetype/crosextra/Carlito-BoldItalic.ttf",
]:
    try:
        fm.fontManager.addfont(p)
    except Exception:
        pass

def apply_milhem_style():
    plt.rcParams.update({
        "font.family": "Carlito",
        "font.size": 12,
        "axes.edgecolor": CHARCOAL,
        "axes.linewidth": 1.2,
        "axes.titlesize": 15,
        "axes.titleweight": "bold",
        "axes.titlecolor": NAVY,
        "axes.labelcolor": CHARCOAL,
        "axes.labelsize": 12,
        "axes.spines.top": False,
        "axes.spines.right": False,
        "xtick.color": CHARCOAL,
        "ytick.color": CHARCOAL,
        "xtick.labelsize": 11,
        "ytick.labelsize": 11,
        "text.color": CHARCOAL,
        "figure.facecolor": WHITE,
        "axes.facecolor": WHITE,
        "legend.frameon": False,
        "legend.fontsize": 11,
        "grid.color": CHARCOAL,
        "grid.alpha": 0.18,
        "grid.linewidth": 0.6,
        "grid.linestyle": "--",
    })

def brand_axes(ax, title=None, subtitle=None, source=None, ylabel=None, xlabel=None):
    # Title and subtitle are placed above the axes with a clear vertical gap so
    # they never collide (tight bbox on save keeps them in frame).
    if title:
        ax.text(0.0, 1.135, title, transform=ax.transAxes, fontsize=16,
                fontweight="bold", color=NAVY, ha="left", va="bottom")
    if subtitle:
        ax.text(0.0, 1.045, subtitle, transform=ax.transAxes, fontsize=10.5,
                color=CHARCOAL, ha="left", va="bottom")
    if ylabel:
        ax.set_ylabel(ylabel, fontsize=11.5, color=CHARCOAL)
    if xlabel:
        ax.set_xlabel(xlabel, fontsize=11.5, color=CHARCOAL)
    ax.yaxis.grid(True)
    ax.xaxis.grid(False)
    ax.set_axisbelow(True)
    if source:
        ax.figure.text(0.012, 0.015, source, fontsize=8.5, style="italic",
                       color=CHARCOAL, ha="left", va="bottom")

def save(fig, path, pad=0.9):
    fig.savefig(path, dpi=150, bbox_inches="tight", pad_inches=pad, facecolor=WHITE)
    plt.close(fig)
