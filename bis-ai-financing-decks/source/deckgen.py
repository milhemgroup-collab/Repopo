"""Milhem Group deck-as-PDF engine. Builds 16:9 landscape HTML slides that
chromium renders to PDF. Enforces branding, numbering, footers, source lines
and a no-em-dash check centrally."""
import base64, os, html

NAVY="#1B365D"; GOLD="#D4AF37"; CHARCOAL="#36454F"; ASH="#F5F5F5"; WHITE="#FFFFFF"
GREEN="#2E7D32"; RED="#C62828"; SLATE="#5B7DA8"

BUILD=os.path.dirname(os.path.abspath(__file__))

def _b64(path):
    with open(path,"rb") as f:
        return base64.b64encode(f.read()).decode()

LOGO_URI="data:image/png;base64,"+_b64(os.path.join(BUILD,"milhem-logo.png"))

def chart_uri(name):
    return "data:image/png;base64,"+_b64(os.path.join(BUILD,"charts",name))

CSS = f"""
@page {{ size: 13.333in 7.5in; margin: 0; }}
* {{ box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
html,body {{ margin:0; padding:0; font-family:'Carlito','Calibri','Helvetica',sans-serif; color:{CHARCOAL}; }}
.slide {{ position:relative; width:13.333in; height:7.5in; overflow:hidden; page-break-after:always;
          background:{WHITE}; }}
.slide:last-child {{ page-break-after:auto; }}

/* ---- TITLE SLIDE ---- */
.title-slide {{ background:{NAVY}; display:flex; flex-direction:column; align-items:center;
                justify-content:center; text-align:center; padding:0 1.1in; }}
.logo-plate {{ background:{WHITE}; padding:20px 34px; border-radius:6px; margin-bottom:40px; }}
.logo-plate img {{ width:300px; height:auto; display:block; }}
.title-slide h1 {{ color:{WHITE}; font-size:41px; font-weight:700; margin:0 0 16px 0; line-height:1.14; letter-spacing:.2px; }}
.gold-rule {{ height:2px; background:{GOLD}; border:0; width:190px; margin:16px auto; }}
.title-slide .sub {{ color:{GOLD}; font-size:18px; font-weight:600; margin:6px 0 26px 0; line-height:1.35; max-width:9.4in; }}
.title-slide .meta {{ color:#C9D3E0; font-size:13.5px; line-height:1.7; }}
.title-slide .tag {{ position:absolute; top:34px; right:44px; color:#8FA2BC; font-size:11px; letter-spacing:2px; text-transform:uppercase; }}

/* ---- DIVIDER ---- */
.divider {{ background:{NAVY}; display:flex; flex-direction:column; justify-content:center; padding:0 1.0in; }}
.divider .kicker {{ color:{GOLD}; font-size:14px; letter-spacing:3px; text-transform:uppercase; margin-bottom:14px; }}
.divider h2 {{ color:{WHITE}; font-size:34px; font-weight:700; margin:0 0 22px 0; }}
.divider ol {{ list-style:none; padding:0; margin:14px 0 0 0; columns:1; }}
.divider li {{ color:#AEBBCE; font-size:16px; padding:7px 0 7px 22px; position:relative; }}
.divider li.cur {{ color:{WHITE}; font-weight:700; }}
.divider li.cur:before {{ content:''; position:absolute; left:0; top:12px; width:11px; height:11px; background:{GOLD}; border-radius:2px; }}
.divider li.done:before {{ content:''; position:absolute; left:2px; top:14px; width:7px; height:7px; background:#5B7DA8; border-radius:50%; }}

/* ---- CONTENT ---- */
.content {{ padding:0.42in 0.55in 0.30in 0.55in; display:flex; flex-direction:column; }}
.chead {{ display:flex; justify-content:space-between; align-items:flex-start; }}
.chead h3 {{ color:{NAVY}; font-size:25px; font-weight:700; margin:0; line-height:1.1; max-width:10.7in; }}
.chead .htag {{ color:{CHARCOAL}; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; margin-top:5px; }}
.chead img {{ width:118px; height:auto; margin-top:2px; }}
.internal-badge {{ display:inline-block; background:{RED}; color:#fff; font-size:10px; font-weight:700; letter-spacing:1.5px;
                   padding:3px 9px; border-radius:3px; margin-top:7px; }}
.accent {{ height:2px; background:{GOLD}; border:0; margin:9px 0 12px 0; }}
.body {{ flex:1; min-height:0; }}

/* bullets */
ul.b {{ margin:2px 0; padding:0; list-style:none; }}
ul.b > li {{ position:relative; padding:0 0 0 22px; margin:0 0 9px 0; font-size:15.5px; line-height:1.32; color:{CHARCOAL}; }}
ul.b > li:before {{ content:''; position:absolute; left:0; top:8px; width:8px; height:8px; background:{NAVY}; border-radius:2px; }}
ul.b > li b {{ color:{NAVY}; }}
ul.b.gold > li:before {{ background:{GOLD}; }}
.lead {{ font-size:16px; color:{NAVY}; font-weight:600; margin:0 0 12px 0; line-height:1.3; }}

/* two column */
.cols {{ display:flex; gap:26px; height:100%; }}
.col {{ flex:1; min-width:0; }}
.colhdr {{ background:{NAVY}; color:#fff; font-weight:700; font-size:14px; padding:7px 12px; border-radius:3px 3px 0 0; }}
.colbox {{ border:1px solid #Dfe3e8; border-top:0; padding:12px 14px; border-radius:0 0 3px 3px; height:calc(100% - 34px); }}

/* callout */
.callout {{ background:#FBF6E6; border-left:5px solid {GOLD}; padding:12px 16px; margin:10px 0; font-size:15px; color:{CHARCOAL}; border-radius:2px; }}
.callout b {{ color:{NAVY}; }}
.callout.center {{ text-align:center; font-size:16px; }}

/* tables */
table.mt {{ border-collapse:collapse; width:100%; font-size:13px; }}
table.mt th {{ background:{NAVY}; color:#fff; font-weight:700; text-align:left; padding:7px 10px; font-size:12.5px; }}
table.mt td {{ padding:6px 10px; border-bottom:1px solid #E2E5E9; color:{CHARCOAL}; vertical-align:top; }}
table.mt tr:nth-child(even) td {{ background:{ASH}; }}
table.mt td.num, table.mt th.num {{ text-align:right; }}
table.mt tr.key td {{ background:#FBF6E6; border-top:2px solid {GOLD}; border-bottom:2px solid {GOLD}; font-weight:600; }}
table.mt td b {{ color:{NAVY}; }}

/* kpi cards */
.kpis {{ display:flex; gap:16px; margin:6px 0; }}
.kpi {{ flex:1; border:1px solid #E2E5E9; border-left:4px solid {GOLD}; border-radius:4px; padding:11px 14px; background:#fff; }}
.kpi .v {{ font-size:27px; font-weight:700; color:{NAVY}; line-height:1; }}
.kpi .l {{ font-size:11.5px; color:{CHARCOAL}; margin-top:6px; line-height:1.25; }}

/* flow */
.flow {{ display:flex; align-items:stretch; gap:0; margin:14px 0; }}
.fstep {{ flex:1; background:{NAVY}; color:#fff; font-size:12.5px; font-weight:600; text-align:center;
          padding:12px 8px; position:relative; margin-right:16px; border-radius:3px; display:flex; align-items:center; justify-content:center; line-height:1.25; }}
.fstep:last-child {{ margin-right:0; background:{GOLD}; color:{NAVY}; }}
.fstep:not(:last-child):after {{ content:''; position:absolute; right:-14px; top:50%; transform:translateY(-50%);
    border-top:9px solid transparent; border-bottom:9px solid transparent; border-left:14px solid {NAVY}; z-index:2; }}
.flow.gold .fstep {{ background:#25456f; }}

/* circular diagram (4 node) */
.circflow {{ display:flex; align-items:center; justify-content:center; gap:0; margin:16px 0; }}
.cnode {{ background:{NAVY}; color:#fff; border-radius:6px; padding:14px 16px; font-size:13px; font-weight:600; text-align:center; width:2.1in; line-height:1.3; }}
.cnode.gold {{ background:{GOLD}; color:{NAVY}; }}
.carrow {{ color:{GOLD}; font-size:13px; font-weight:700; padding:0 14px; text-align:center; white-space:nowrap; }}
.carrow span {{ display:block; font-size:22px; color:{CHARCOAL}; }}

/* quadrant */
.quad {{ display:grid; grid-template-columns:1fr 1fr; grid-template-rows:1fr 1fr; gap:12px; height:100%; }}
.qc {{ border:1.5px solid #DDE1E6; border-radius:6px; padding:14px 16px; background:{ASH}; }}
.qc.hot {{ border:2.5px solid {GOLD}; background:#FBF6E6; }}
.qc .qn {{ font-size:12px; color:{CHARCOAL}; font-weight:700; letter-spacing:1px; }}
.qc h4 {{ color:{NAVY}; font-size:17px; margin:6px 0 6px 0; }}
.qc p {{ font-size:12.5px; margin:0; line-height:1.3; }}
.qc .flag {{ float:right; background:{GOLD}; color:{NAVY}; font-size:10px; font-weight:700; padding:2px 8px; border-radius:3px; }}

/* chart */
.chartwrap {{ text-align:center; height:100%; display:flex; flex-direction:column; justify-content:center; }}
.chartwrap img {{ max-width:100%; max-height:100%; object-fit:contain; margin:0 auto; }}
.chartcap {{ font-size:12px; color:{CHARCOAL}; margin-top:4px; }}

/* triptych */
.trip {{ display:flex; gap:16px; }}
.trip .p {{ flex:1; }}
.trip .p img {{ width:100%; border:1px solid #E2E5E9; border-radius:3px; }}
.trip .p .cap {{ font-size:12px; color:{CHARCOAL}; margin-top:7px; line-height:1.3; }}
.trip .p .cap b {{ color:{NAVY}; }}

.grid2 {{ display:flex; gap:22px; align-items:center; height:100%; }}
.grid2 .g {{ flex:1; min-width:0; }}
.grid2 img {{ width:100%; }}

/* notes + footer */
.notes {{ border-top:1.5px solid {GOLD}; margin-top:8px; padding-top:5px; }}
.notes .nl {{ font-size:9px; font-weight:700; letter-spacing:1.5px; color:{GOLD}; text-transform:uppercase; }}
.notes .nt {{ font-size:9.5px; line-height:1.32; color:{CHARCOAL}; font-style:italic; margin-top:1px; }}
.foot {{ display:flex; justify-content:space-between; align-items:center; border-top:1px solid #E2E5E9; margin-top:6px; padding-top:4px; }}
.foot .src {{ font-size:8px; color:#5b6672; font-style:italic; max-width:10.4in; }}
.foot .pg {{ font-size:8px; color:#5b6672; white-space:nowrap; }}
"""

def esc(s): return html.escape(s, quote=False)

class Deck:
    def __init__(self, title):
        self.title=title
        self.slides=[]
        self._content_count=0
        self.total=0
    def add(self, html_str, is_content=False):
        self.slides.append(html_str)
    # ---- slide builders ----
    def title_slide(self, title, subtitle, meta_lines, tag="Milhem Group Properties"):
        meta="<br>".join(esc(m) for m in meta_lines)
        h=(f'<section class="slide title-slide">'
           f'<div class="tag">{esc(tag)}</div>'
           f'<div class="logo-plate"><img src="{LOGO_URI}"></div>'
           f'<h1>{title}</h1>'
           f'<hr class="gold-rule"><div class="sub">{subtitle}</div>'
           f'<div class="meta">{meta}</div></section>')
        self.slides.append(h)
    def divider(self, kicker, heading, sections, cur):
        lis=""
        for i,s in enumerate(sections):
            cls="cur" if i==cur else ("done" if i<cur else "")
            lis+=f'<li class="{cls}">{esc(s)}</li>'
        h=(f'<section class="slide divider"><div class="kicker">{esc(kicker)}</div>'
           f'<h2>{heading}</h2><ol>{lis}</ol></section>')
        self.slides.append(h)
    def content(self, title, body, source, notes, htag=None, internal=False):
        self._content_count+=1
        tag_html=f'<div class="htag">{esc(htag)}</div>' if htag else ''
        if internal:
            tag_html+='<div class="internal-badge">INTERNAL</div>'
        # placeholder for page number filled at render
        h=(f'<section class="slide content">'
           f'<div class="chead"><div><h3>{title}</h3>{tag_html}</div>'
           f'<img src="{LOGO_URI}"></div><hr class="accent">'
           f'<div class="body">{body}</div>'
           f'<div class="notes"><div class="nl">Speaker notes</div><div class="nt">{notes}</div></div>'
           f'<div class="foot"><div class="src">{source}</div>'
           f'<div class="pg">Confidential - Milhem Group &middot; Slide {{PG}} of {{TOT}}</div></div>'
           f'</section>')
        self.slides.append(h)
    def render(self, path):
        doc_total=len(self.slides)
        out=[]
        for i,s in enumerate(self.slides, start=1):
            s=s.replace("{PG}",str(i)).replace("{TOT}",str(doc_total))
            out.append(s)
        full=(f'<!doctype html><html><head><meta charset="utf-8"><title>{esc(self.title)}</title>'
              f'<style>{CSS}</style></head><body>{"".join(out)}</body></html>')
        with open(path,"w") as f:
            f.write(full)
        # em-dash check
        em = full.count("—")
        return doc_total, em

# ---- content helpers ----
def bullets(items, gold=False):
    lis="".join(f"<li>{x}</li>" for x in items)
    return f'<ul class="b{" gold" if gold else ""}">{lis}</ul>'

def lead(text): return f'<p class="lead">{text}</p>'

def callout(text, center=False):
    return f'<div class="callout{" center" if center else ""}">{text}</div>'

def chart(name, cap=None):
    c=f'<div class="chartcap">{cap}</div>' if cap else ''
    return f'<div class="chartwrap"><img src="{chart_uri(name)}">{c}</div>'

def table(headers, rows, numcols=(), key_rows=()):
    th="".join(f'<th class="{"num" if i in numcols else ""}">{h}</th>' for i,h in enumerate(headers))
    trs=""
    for r_i,r in enumerate(rows):
        cls=' class="key"' if r_i in key_rows else ''
        tds="".join(f'<td class="{"num" if i in numcols else ""}">{c}</td>' for i,c in enumerate(r))
        trs+=f'<tr{cls}>{tds}</tr>'
    return f'<table class="mt"><thead><tr>{th}</tr></thead><tbody>{trs}</tbody></table>'

def kpis(cards):
    cs="".join(f'<div class="kpi"><div class="v">{v}</div><div class="l">{l}</div></div>' for v,l in cards)
    return f'<div class="kpis">{cs}</div>'

def flow(steps):
    fs="".join(f'<div class="fstep">{s}</div>' for s in steps)
    return f'<div class="flow">{fs}</div>'

def two_col(lh, lbody, rh, rbody):
    return (f'<div class="cols"><div class="col"><div class="colhdr">{lh}</div>'
            f'<div class="colbox">{lbody}</div></div>'
            f'<div class="col"><div class="colhdr">{rh}</div>'
            f'<div class="colbox">{rbody}</div></div></div>')

def grid2(left, right):
    return f'<div class="grid2"><div class="g">{left}</div><div class="g">{right}</div></div>'
