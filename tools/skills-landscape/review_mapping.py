"""Step 2 review: run the sector rules over every course and the Pulse's 81 SCTPs.

Run:  python3 review_mapping.py  -> prints a summary and writes mapping-review.md
"""
import collections, json, pathlib, random
from clean import load
from sectors import classify, PRIORITY

HERE = pathlib.Path(__file__).parent
PULSE = next(p for p in (HERE.parent / "sme-pulse", HERE.parent / "sme-workforce-pulse") if p.exists())
SCTP = PULSE / "data" / "sctp.json"
LABEL = {"manufacturing": "Manufacturing", "construction": "Construction", "transport": "Transport & storage",
         "food": "Food & accommodation", "health": "Health & social", "admin": "Admin & support",
         "security": "Security", "retail": "Wholesale & retail", "ict": "Info & comms",
         "finance": "Finance & insurance", "realestate": "Real estate", "professional": "Professional services",
         "publicedu": "Public admin & education", "arts": "Arts & recreation", "general": "General / cross-sector"}

courses, runs, stats = load()
for c in courses:
    c["sector"], c["basis"] = classify(c["title"], c["learn"] + " " + c["about"])

n = len(courses)
by = collections.Counter(c["sector"] for c in courses)
basis = collections.Counter(c["basis"] for c in courses)
mapped = n - by["general"]

sctp = json.loads(SCTP.read_text())["programmes"]
agree, rows = 0, []
for p in sctp:
    got, _ = classify(p["title"])
    want = "general" if p["sector"] in ("cross", "other") else p["sector"]
    ok = got == want
    agree += ok
    if not ok:
        rows.append(f"| {p['title']} | {LABEL.get(want, want)} | {LABEL[got]} |")

random.seed(11)
out = [f"# Sector mapping review ({stats['courses']:,} courses)", "",
       f"- **Mapped to a sector:** {mapped:,} ({mapped / n:.0%}). From the title {basis['title']:,}; "
       f"from course text {basis['text']:,}.",
       f"- **General / cross-sector:** {by['general']:,} ({by['general'] / n:.0%})",
       f"- **Agreement with your SCTP tags:** {agree} of {len(sctp)} ({agree / len(sctp):.0%})", "",
       "## Courses per sector", "", "| Sector | Courses | Share |", "|---|---:|---:|"]
for k in PRIORITY + ["general"]:
    out.append(f"| {LABEL[k]} | {by[k]:,} | {by[k] / n:.1%} |")
out += ["", "## SCTPs where the rules disagree with your tag", "", "| Programme | Your tag | Rules say |", "|---|---|---|"] + rows
out += ["", "## Ten random courses per sector", "",
        "Mark any that are wrong. (T) = matched on title, (X) = matched on course text.", ""]
for k in sorted(PRIORITY, key=lambda k: LABEL[k]) + ["general"]:
    pool = [c for c in courses if c["sector"] == k]
    out.append(f"### {LABEL[k]} ({len(pool):,})")
    for c in random.sample(pool, min(10, len(pool))):
        tag = {"title": "T", "text": "X", "none": "-"}[c["basis"]]
        out.append(f"- ({tag}) {c['title']} — *{c['provider']}*")
    out.append("")
(HERE / "mapping-review.md").write_text("\n".join(out))
print("\n".join(out[:6]))
print("\n".join(out[8:8 + len(PRIORITY) + 3]))
