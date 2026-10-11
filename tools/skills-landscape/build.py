"""Build index.html from the course files + the Pulse's MOM snapshot + template.html.

Run:  python3 build.py   (after fetch.py). `--page-only` re-inlines data/latest.json without
reclassifying (for template changes). Writes data/snapshots/YYYY-MM.json and data/latest.json
(aggregates only, no course rows), then inlines them into template.html -> index.html. The page
makes no network calls at runtime.
"""
import collections, datetime, json, pathlib, statistics, sys
from clean import load, TYPE_LABEL
from sectors import classify
from ai import is_ai

HERE = pathlib.Path(__file__).parent
DATA = HERE / "data"
# The Pulse's folder: sibling "sme-workforce-pulse" in the vault, "sme-pulse" in the site repo's tools/
PULSE = next(p for p in (HERE.parent / "sme-pulse", HERE.parent / "sme-workforce-pulse") if p.exists())

# Same keys, labels and MOM industry names as the Pulse (check.py confirms they match)
SECTORS = [
    ("manufacturing", "Manufacturing", "manufacturing"),
    ("construction", "Construction", "construction"),
    ("transport", "Transport & storage", "transportation and storage"),
    ("food", "Food & accommodation", "accommodation and food services"),
    ("health", "Health & social", "health and social services"),
    ("admin", "Admin & support", "administrative and support services"),
    ("security", "Security", "security and investigation"),
    ("retail", "Wholesale & retail", "wholesale and retail trade"),
    ("ict", "Info & comms", "information and communications"),
    ("finance", "Finance & insurance", "financial and insurance services"),
    ("realestate", "Real estate", "real estate services"),
    ("professional", "Professional services", "professional services"),
    ("publicedu", "Public admin & education", "public administration and education"),
    ("arts", "Arts & recreation", "arts, entertainment and recreation"),
]
PMET = "professionals, managers, executives and technicians"
HOURS = [(8, "1 day or less"), (40, "2–5 days"), (120, "6–15 days"), (400, "16–50 days"), (None, "Over 50 days")]
FEES = [(500, "Under $500"), (2000, "$500–1,999"), (5000, "$2,000–4,999"), (10000, "$5,000–9,999"), (None, "$10,000+")]
MODES = ["Part Time", "Full Time", "Full & part time", "Not stated"]


def band(v, bands):
    if v is None:
        return None
    for i, (top, _) in enumerate(bands):
        if top is None or v <= top:
            return i


def pulse_demand():
    """PMET vacancies by sector in the Pulse's latest quarter, read from its snapshot."""
    ds = json.loads((PULSE / "data" / "snapshot.json").read_text())["datasets"]["vacancies_occ"]
    q = ds["latest"]
    vac = {r["industry"]: r["v"] for r in ds["data"] if r["q"] == q and r.get("occupation") == PMET}
    return q, {k: vac.get(name) for k, _, name in SECTORS}


def summarise(cs, runs_by_ref, months):
    n = len(cs)
    fees = [c["fee"] for c in cs if c["fee"] is not None and c["type"] != "university"]
    prov = collections.Counter((c["uen"]) for c in cs)
    names = {c["uen"]: (c["provider"], c["type"]) for c in cs}
    ai_prov = collections.Counter(c["uen"] for c in cs if c["ai"])
    years = collections.defaultdict(lambda: [0, 0])
    for c in cs:
        if c["year"]:
            years[c["year"]][0] += 1
            years[c["year"]][1] += c["ai"]
    run_months = collections.Counter()
    for c in cs:
        for m in runs_by_ref.get(c["ref"], ()):
            run_months[m] += 1
    return {
        "n": n, "providers": len(prov), "ai": sum(c["ai"] for c in cs),
        "fee_median": statistics.median(fees) if fees else None, "fee_n": len(fees),
        "types": {t: sum(1 for c in cs if c["type"] == t) for t in TYPE_LABEL},
        "top": [[names[u][0], names[u][1], k] for u, k in prov.most_common(10)],
        "ai_top": [[names[u][0], k] for u, k in ai_prov.most_common(5)],
        "modes": [sum(1 for c in cs if c["commitment"] == m) for m in MODES],
        "hours": [sum(1 for c in cs if band(c["hours"], HOURS) == i) for i in range(len(HOURS))],
        "fees": [sum(1 for c in cs if c["type"] != "university" and band(c["fee"], FEES) == i) for i in range(len(FEES))],
        "years": {y: years[y] for y in sorted(years)},
        "runs": [run_months.get(m, 0) for m in months],
    }


def write_page(snap):
    history = []
    for f in sorted((DATA / "snapshots").glob("*.json")):
        s = json.loads(f.read_text())
        history.append({"month": f.stem, "n": s["groups"]["all"]["n"], "ai": s["groups"]["all"]["ai"]})
    page = {**snap, "history": history, "pulse_url": "../sme-pulse/"}
    html = (HERE / "template.html").read_text().replace("/*__DATA__*/null", json.dumps(page, separators=(",", ":")))
    (HERE / "index.html").write_text(html)
    return len(html)


if "--page-only" in sys.argv:
    print(f"built index.html ({write_page(json.loads((DATA / 'latest.json').read_text())) // 1024} KB) from latest.json")
    sys.exit()

courses, runs, stats = load()
for c in courses:
    c["sector"], c["basis"] = classify(c["title"], c["learn"] + " " + c["about"])
    c["ai"] = is_ai(c["title"])

today = datetime.date.today()
months = [f"{(today.year * 12 + today.month - 1 + i) // 12}-{(today.month - 1 + i) % 12 + 1:02d}" for i in range(12)]
runs_by_ref = collections.defaultdict(list)
for r in runs:
    if r["start"] and r["start"][:7] in months:
        runs_by_ref[r["ref"]].append(r["start"][:7])

checked = json.loads((DATA / "last-checked.json").read_text())
quarter, demand = pulse_demand()
groups = {"all": courses, **{k: [c for c in courses if c["sector"] == k] for k, _, _ in SECTORS},
          "general": [c for c in courses if c["sector"] == "general"]}
snap = {
    "built": today.isoformat(),
    "checked": checked["checked"],
    "datasets": checked["datasets"],
    "stats": stats,
    "mapped_by": dict(collections.Counter(c["basis"] for c in courses)),
    "type_labels": TYPE_LABEL,
    "hours_bands": [l for _, l in HOURS], "fee_bands": [l for _, l in FEES], "modes": MODES,
    "months": months,
    "runs_undated": stats["runs_undated"], "runs_total": stats["run_rows"],
    "demand_quarter": quarter,
    "sectors": [{"key": k, "label": lab, "pmet_open": demand[k]} for k, lab, _ in SECTORS],
    "groups": {k: summarise(cs, runs_by_ref, months) for k, cs in groups.items()},
}

(DATA / "snapshots").mkdir(exist_ok=True)
month_file = DATA / "snapshots" / f"{checked['datasets']['directory']['updated'][:7]}.json"
blob = json.dumps(snap, separators=(",", ":"))
month_file.write_text(blob)
(DATA / "latest.json").write_text(blob)

size = write_page(snap)
print(f"built index.html ({size // 1024} KB); snapshot {month_file.name} ({len(blob) // 1024} KB); "
      f"{stats['courses']:,} courses, {len(courses) - len(groups['general']):,} mapped; demand from Pulse {quarter}")
