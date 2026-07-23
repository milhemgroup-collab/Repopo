# -*- coding: utf-8 -*-
"""Convert a generated deck HTML into clean, copy-pasteable Markdown.
One slide per section, delimited by '---', with real Markdown tables,
speaker-notes blocks and source lines. Chart images are mapped back to
their filenames under source/charts/."""
import base64, os, re, sys
from bs4 import BeautifulSoup, NavigableString, Tag

BUILD = os.path.dirname(os.path.abspath(__file__))

def b64_of(path):
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode()

LOGO_B64 = b64_of(os.path.join(BUILD, "milhem-logo.png"))
CHART_MAP = {}
for fn in os.listdir(os.path.join(BUILD, "charts")):
    if fn.endswith(".png"):
        CHART_MAP[b64_of(os.path.join(BUILD, "charts", fn))] = fn

def inline(node):
    """Render inline content of a tag to Markdown (bold/italic/links/entities)."""
    if node is None:
        return ""
    out = []
    for c in node.children if isinstance(node, Tag) else [node]:
        if isinstance(c, NavigableString):
            out.append(str(c))
        elif isinstance(c, Tag):
            if c.name in ("b", "strong"):
                out.append(f"**{inline(c).strip()}**")
            elif c.name in ("i", "em"):
                out.append(f"*{inline(c).strip()}*")
            elif c.name == "br":
                out.append(" ")
            elif c.name == "a":
                out.append(f"[{inline(c).strip()}]({c.get('href','')})")
            else:
                out.append(inline(c))
    return re.sub(r"[ \t]+", " ", "".join(out)).replace(" ,", ",").strip()

def img_ref(tag):
    src = tag.get("src", "")
    if src.startswith("data:") and "," in src:
        data = src.split(",", 1)[1]
    else:
        data = ""
    if data == LOGO_B64:
        return None
    name = CHART_MAP.get(data)
    if name:
        return f"![{name}](source/charts/{name})"
    return None

def md_table(tbl):
    heads = [inline(th) for th in tbl.select("thead th")]
    lines = ["| " + " | ".join(heads) + " |",
             "|" + "|".join(["---"] * len(heads)) + "|"]
    for tr in tbl.select("tbody tr"):
        cells = [inline(td).replace("|", "\\|") for td in tr.find_all("td")]
        lines.append("| " + " | ".join(cells) + " |")
    return "\n".join(lines)

def walk(node, out):
    """Emit Markdown for a body-level node into the out list."""
    if isinstance(node, NavigableString):
        t = str(node).strip()
        if t:
            out.append(t)
        return
    cls = set(node.get("class", []))
    if node.name == "ul" and "b" in cls:
        for li in node.find_all("li", recursive=False):
            out.append(f"- {inline(li)}")
        out.append("")
    elif node.name == "p" and "lead" in cls:
        out.append(f"**{inline(node)}**"); out.append("")
    elif node.name == "table":
        out.append(md_table(node)); out.append("")
    elif "callout" in cls:
        out.append(f"> {inline(node)}"); out.append("")
    elif "flow" in cls:
        steps = [inline(s) for s in node.select(".fstep")]
        out.append("**Flow:** " + " -> ".join(steps)); out.append("")
    elif "kpis" in cls:
        for k in node.select(".kpi"):
            v = inline(k.select_one(".v")); l = inline(k.select_one(".l"))
            out.append(f"- **{v}** - {l}")
        out.append("")
    elif "quad" in cls:
        for qc in node.select(".qc"):
            qn = inline(qc.select_one(".qn"))
            h = inline(qc.select_one("h4"))
            p = inline(qc.select_one("p"))
            flag = qc.select_one(".flag")
            mark = " [COVERED]" if flag else ""
            out.append(f"- **{h}**{mark} ({qn}): {p}")
        out.append("")
    elif "circflow" in cls:
        parts = []
        for ch in node.children:
            if isinstance(ch, Tag):
                if "cnode" in ch.get("class", []):
                    parts.append(inline(ch))
                elif "carrow" in ch.get("class", []):
                    lab = inline(ch).replace("→", "").strip()
                    parts.append(f"--({lab})-->" if lab else "-->")
        out.append("**Flow:** " + " ".join(parts)); out.append("")
    elif "chartwrap" in cls:
        img = node.find("img")
        ref = img_ref(img) if img else None
        cap = node.select_one(".chartcap")
        if ref:
            out.append(ref)
        if cap:
            out.append(f"*{inline(cap)}*")
        out.append("")
    elif "trip" in cls:
        for p in node.select(".p"):
            img = p.find("img"); ref = img_ref(img) if img else None
            if ref: out.append(ref)
            capd = p.select_one(".cap")
            if capd: out.append(f"*{inline(capd)}*")
        out.append("")
    elif "cols" in cls:
        for col in node.select(".col"):
            hdr = col.select_one(".colhdr"); box = col.select_one(".colbox")
            if hdr:
                out.append(f"**{inline(hdr)}**"); out.append("")
            if box:
                for ch in box.children:
                    if isinstance(ch, Tag):
                        walk(ch, out)
    elif "grid2" in cls:
        for g in node.select(".g"):
            for ch in g.children:
                if isinstance(ch, Tag):
                    walk(ch, out)
    elif node.name == "img":
        ref = img_ref(node)
        if ref:
            out.append(ref); out.append("")
    elif node.name in ("div", "section"):
        # Recurse only into block-level children; a div holding text plus inline
        # tags (b/i/a) is a leaf paragraph, rendered with inline() so its prose
        # stays intact.
        block_children = [c for c in node.children
                          if isinstance(c, Tag) and c.name in ("div", "section", "ul", "ol", "table", "p")]
        if block_children:
            for ch in block_children:
                walk(ch, out)
        else:
            t = inline(node)
            if t:
                out.append(t); out.append("")
    else:
        t = inline(node)
        if t:
            out.append(t); out.append("")

def convert(html_path, title, subtitle):
    soup = BeautifulSoup(open(html_path, encoding="utf-8").read(), "html.parser")
    slides = soup.select("section.slide")
    md = [f"# {title}", "", f"_{subtitle}_", "",
          f"Slides: {len(slides)}. Recreated BIS charts are referenced by filename under `source/charts/`.", "", "---", ""]
    n = 0
    for s in slides:
        cls = set(s.get("class", []))
        if "title-slide" in cls:
            h1 = inline(s.select_one("h1"))
            sub = inline(s.select_one(".sub"))
            meta = " / ".join(inline(m) for m in [s.select_one(".meta")] if m)
            md += [f"## Title slide", "", f"**{h1}**", "", sub, "", meta, "", "---", ""]
        elif "divider" in cls:
            kick = inline(s.select_one(".kicker"))
            h2 = inline(s.select_one("h2"))
            items = [inline(li) for li in s.select("ol li")]
            md += [f"## {kick}: {h2}", ""]
            md += [f"{i+1}. {t}" for i, t in enumerate(items)]
            md += ["", "---", ""]
        else:
            n += 1
            title_t = inline(s.select_one(".chead h3"))
            htag = s.select_one(".htag"); htag_t = inline(htag) if htag else ""
            internal = s.select_one(".internal-badge")
            body = s.select_one(".body")
            notes = s.select_one(".notes .nt")
            src = s.select_one(".foot .src")
            head = f"## Slide {n}: {title_t}"
            md.append(head)
            if htag_t:
                md.append(f"_{htag_t}_" + ("  **[INTERNAL]**" if internal else ""))
            md.append("")
            out = []
            if body:
                for ch in body.children:
                    if isinstance(ch, Tag):
                        walk(ch, out)
            # collapse multiple blanks
            cleaned = []
            for line in out:
                if line == "" and (not cleaned or cleaned[-1] == ""):
                    continue
                cleaned.append(line)
            md += cleaned
            if notes:
                md += ["", f"**Speaker notes:** {inline(notes)}"]
            if src:
                md += ["", f"_{inline(src)}_"]
            md += ["", "---", ""]
    return "\n".join(md).rstrip() + "\n"

decks = [
    ("deck1.html", "deck1.md",
     "Circular Money: The BIS on AI Financing Fragility",
     "Evidence from the BIS Annual Economic Report 2026, Chapter I: Progress and Peril (28 June 2026). Milhem Group Properties."),
    ("deck2.html", "deck2.md",
     "From Cash Flows to Debt: Inside the AI Financing Shift",
     "A deep dive on BIS Bulletin No. 120 (Aldasoro, Doerr and Rees, 7 January 2026), companion to the AER 2026 Chapter I briefing. Milhem Group Properties."),
]
for html_name, md_name, t, sub in decks:
    text = convert(os.path.join(BUILD, html_name), t, sub)
    with open(os.path.join(BUILD, md_name), "w", encoding="utf-8") as f:
        f.write(text)
    print(f"{md_name}: {len(text.splitlines())} lines, em-dashes={text.count(chr(8212))}")
