"""Put the same quick-link bar at the top of every page.

The link list lives here only. Run after adding a page or changing a link:

    python3 tools/sync-topbar.py            # write the bar into every page
    python3 tools/sync-topbar.py --check    # list pages missing the bar or out of date (exit 1)

The bar sits between <!-- topbar:start --> and <!-- topbar:end --> right after <body>.
Pages that load the shared styles.css use its .topbar rules. Pages with their own styling
(dashboards, tools, the haze and heat apps) get a self-contained .sitebar with its CSS inline.
Templates under tools/*/template.html are included so the GitHub Actions rebuilds keep the bar.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKIP = {"members/index.html", "anime/index.html"}  # unlisted pages
START, END = "<!-- topbar:start -->", "<!-- topbar:end -->"

# Pages whose body has top padding: pull the bar up to the top edge.
PAGE_CSS = {
    "projects/models-as-insider-risks/index.html":
        ".sitebar{margin-top:-48px;margin-bottom:32px}@media (max-width:560px){.sitebar{margin-top:-32px;margin-bottom:24px}}",
    "projects/sausage-dog-password/index.html": ".sitebar{margin-top:-48px;margin-bottom:24px}",
    "projects/sausage-dog-password/momo/index.html": ".sitebar{margin-top:-48px;margin-bottom:24px}",
}

# (label, home-page section). Order follows the sections on the home page.
LINKS = [("Work", "work"), ("News", "news"), ("About", "about"), ("Toolkit", "toolkit"), ("Contact", "contact")]
LINKEDIN = "https://www.linkedin.com/in/charlestay"

SOLO_CSS = """<style>
.sitebar,.sitebar *{box-sizing:border-box}
.sitebar{position:relative;z-index:1200;display:block;width:auto;margin:0 calc(50% - 50vw);padding:10px 16px;background:#F3F6FA;border-bottom:1px solid #D6DEE9;font:14px/1.4 "IBM Plex Mono",ui-monospace,"SF Mono",Menlo,monospace}
.sitebar .sb-in{max-width:860px;margin:0 auto;padding:0;display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 18px}
.sitebar a{display:inline;padding:0;border:0;background:none;color:#0B1324;text-decoration:none;white-space:nowrap}
.sitebar a:hover{color:#148A4E}
.sitebar .me{font:900 18px/1.2 Barlow,"Helvetica Neue",Arial,sans-serif;letter-spacing:-.02em;margin-right:auto}
.sitebar .tb-ext{color:#148A4E}
@media (prefers-color-scheme:dark){.sitebar{background:#0B1324;border-color:#1F2A40}.sitebar a{color:#E6EDF7}.sitebar a:hover,.sitebar .tb-ext{color:#3DDC84}}
@media (max-width:640px){.sitebar{font-size:13px;padding:8px 16px}.sitebar .sb-in{gap:2px 14px}.sitebar .tb-ext{display:none}}
@media (max-width:480px){.sitebar .me{flex-basis:100%}}
</style>"""


def pages():
    for p in sorted(ROOT.rglob("*.html")):
        rel = p.relative_to(ROOT).as_posix()
        if rel.startswith((".git/", "node_modules/")) or "/node_modules/" in rel or rel in SKIP:
            continue
        if rel.startswith("tools/") and not rel.endswith("/template.html"):
            continue  # build output; the published copy lives under projects/
        yield p, rel


def uses_shared_css(path, html):
    for href in re.findall(r'<link[^>]+rel="stylesheet"[^>]+href="([^"?]+)', html):
        if href.startswith(("http:", "https:")):
            continue
        target = (ROOT / href.lstrip("/")) if href.startswith("/") else (path.parent / href)
        if target.resolve() == (ROOT / "styles.css").resolve():
            return True
    return False


def bar(home, shared, extra=""):
    pre = "" if home else "/"
    links = "".join(f'<a href="{pre}#{a}">{label}</a>' for label, a in LINKS)
    me = '<a class="me" href="#top">Charles Tay</a>' if home else '<a class="me" href="/">Charles Tay</a>'
    cls, inner = ("topbar", "wrap") if shared else ("sitebar", "sb-in")
    nav = (f'<nav class="{cls}" aria-label="Site">\n  <div class="{inner}">\n    {me}\n    {links}\n'
           f'    <a class="tb-ext" href="{LINKEDIN}" rel="noopener">LinkedIn ↗</a>\n  </div>\n</nav>')
    css = SOLO_CSS.replace("</style>", extra + "\n</style>") if extra else SOLO_CSS
    return f"{START}\n{nav if shared else css + chr(10) + nav}\n{END}"


def render(path, rel, html):
    want = bar(rel == "index.html", uses_shared_css(path, html), PAGE_CSS.get(rel, ""))
    if START in html:
        return re.sub(re.escape(START) + r".*?" + re.escape(END), lambda m: want, html, count=1, flags=re.S)
    if rel == "index.html":  # first run: replace the hand-written bar
        html = re.sub(r'<nav class="topbar" aria-label="Site">.*?</nav>\n', "", html, count=1, flags=re.S)
    m = re.search(r"<body[^>]*>\n?", html)
    if not m:
        raise SystemExit(f"{rel}: no <body> tag")
    return html[:m.end()] + want + "\n" + html[m.end():]


def main():
    check = "--check" in sys.argv
    stale = []
    for path, rel in pages():
        html = path.read_text()
        new = render(path, rel, html)
        if new != html:
            stale.append(rel)
            if not check:
                path.write_text(new)
    if check:
        for rel in stale:
            print(f"missing or out of date: {rel}")
        print(f"{len(stale)} page(s) need the bar" if stale else "all pages have the bar")
        sys.exit(1 if stale else 0)
    print(f"updated {len(stale)} page(s)")


if __name__ == "__main__":
    main()
