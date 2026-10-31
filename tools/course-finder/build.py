"""Build the Course Finder page and its per-sector course files.

Run:  python3 build.py   (after ../skills-landscape/fetch.py has put the XLSX files in its data/raw/)
      python3 build.py --page-only   re-inlines data/meta.json into template.html (after a template change)

Reuses the Skills Training Landscape's cleaning, sector rules and AI test by import, so both pages
agree. Writes to out/ (not committed; the workflow copies it to projects/course-finder/):
  out/index.html        the page, with small metadata inlined
  out/data/<sector>.json  one file per sector (and "general"), loaded on demand by the page
and data/meta.json (committed, small): the metadata the page inlines.

Kept per course: reference number, title, provider, hours, study mode, full fee, rating stars and
respondents, AI flag, up to 3 upcoming run start dates. No description, entry-requirement or contact text.
"""
import ast, collections, datetime, json, pathlib, sys

HERE = pathlib.Path(__file__).parent
SL = HERE.parent / "skills-landscape"
sys.path.insert(0, str(SL))
from clean import load, rows, text, num as fnum, TYPE_LABEL  # noqa: E402
from sectors import classify        # noqa: E402
from ai import is_ai                # noqa: E402

DATA = HERE / "data"
OUT = HERE / "out"
PULSE = next(p for p in (HERE.parent / "sme-pulse", HERE.parent / "sme-workforce-pulse") if p.exists())
SG = datetime.timezone(datetime.timedelta(hours=8))
TYPES = ["ihl", "university", "public", "private"]
MAX_DATES = 3
FIELDS = ["ref", "title", "provider", "hours", "mode", "fee", "stars", "respondents", "ai", "dates", "runs"]


def landscape_consts():
    """SECTORS, PMET, HOURS, FEES, MODES from the Landscape's build.py, read without running it."""
    tree = ast.parse((SL / "build.py").read_text())
    want = {"SECTORS", "PMET", "HOURS", "FEES", "MODES"}
    return {n.targets[0].id: ast.literal_eval(n.value) for n in tree.body
            if isinstance(n, ast.Assign) and getattr(n.targets[0], "id", "") in want}


def pulse_demand(sectors):
    ds = json.loads((PULSE / "data" / "snapshot.json").read_text())["datasets"]["vacancies_occ"]
    q = ds["latest"]
    vac = {r["industry"]: r["v"] for r in ds["data"] if r["q"] == q and r.get("occupation") == C["PMET"]}
    return q, {k: vac.get(name) for k, _, name in sectors}, {"id": ds["id"], "title": ds["title"]}


def b36(i):
    s = ""
    while True:
        i, r = divmod(i, 36)
        s = "0123456789abcdefghijklmnopqrstuvwxyz"[r] + s
        if not i:
            return s


def num(v):
    return int(v) if v is not None and float(v) == int(v) else v


def write_page(meta):
    html = (HERE / "template.html").read_text().replace("/*__DATA__*/null", json.dumps(meta, separators=(",", ":")))
    OUT.mkdir(exist_ok=True)
    (OUT / "index.html").write_text(html)
    return len(html)


C = landscape_consts()

if "--page-only" in sys.argv:
    print(f"built out/index.html ({write_page(json.loads((DATA / 'meta.json').read_text())) // 1024} KB) from meta.json")
    sys.exit()

courses, runs, stats = load()
today = datetime.datetime.now(SG).date().isoformat()

# clean.py does not carry the rating columns, so read them here (first row per course reference)
ratings = {}
for r in rows("directory"):
    ratings.setdefault(text(r["coursereferencenumber"]), (fnum(r["courseratings_stars"]), fnum(r["courseratings_noofrespondents"])))

upcoming = collections.defaultdict(list)
for r in runs:
    if r["start"] and r["start"] >= today:
        upcoming[r["ref"]].append(r["start"])

# provider ids: base 36 over display name order, so files stay stable between builds
by_uen = {}
for c in courses:
    by_uen[c["uen"]] = (c["provider"], c["type"])
order = sorted(by_uen, key=lambda u: (by_uen[u][0].lower(), u))
pid = {u: b36(i) for i, u in enumerate(order)}

MODE_IDX = {m: i for i, m in enumerate(C["MODES"])}
groups = collections.defaultdict(list)
for c in courses:
    c["sector"], _ = classify(c["title"], c["learn"] + " " + c["about"])
    d = sorted(upcoming.get(c["ref"], []))
    stars, resp = ratings.get(c["ref"], (None, None))
    resp = int(resp) if resp is not None else None
    groups[c["sector"]].append([
        c["ref"], c["title"], pid[c["uen"]], num(c["hours"]), MODE_IDX[c["commitment"]], num(c["fee"]),
        num(stars), resp, 1 if is_ai(c["title"]) else 0, d[:MAX_DATES], len(d)])

keys = [k for k, _, _ in C["SECTORS"]] + ["general"]
(OUT / "data").mkdir(parents=True, exist_ok=True)
for old in (OUT / "data").glob("*.json"):
    old.unlink()
files = {}
for k in keys:
    rows = sorted(groups.get(k, []), key=lambda r: (r[1].lower(), r[0]))
    used = sorted({r[2] for r in rows})
    inv = {v: u for u, v in pid.items()}
    blob = {"f": FIELDS, "t": TYPES, "p": {i: [by_uen[inv[i]][0], TYPES.index(by_uen[inv[i]][1])] for i in used}, "c": rows}
    text = json.dumps(blob, separators=(",", ":"), ensure_ascii=False)
    (OUT / "data" / f"{k}.json").write_text(text, encoding="utf-8")
    files[k] = {"n": len(rows), "dated": sum(1 for r in rows if r[10])}

checked = json.loads((SL / "data" / "last-checked.json").read_text())
quarter, demand, vac_ds = pulse_demand(C["SECTORS"])
label = {k: lab for k, lab, _ in C["SECTORS"]}
label["general"] = "Cross-sector"
meta = {
    "built": today,
    "checked": checked["checked"],
    "datasets": checked["datasets"],
    "vacancy_dataset": vac_ds,
    "demand_quarter": quarter,
    "type_order": TYPES, "type_labels": TYPE_LABEL,
    "hours_bands": [list(b) for b in C["HOURS"]], "fee_bands": [list(b) for b in C["FEES"]], "modes": C["MODES"],
    "min_respondents": 10, "max_dates": MAX_DATES,
    "runs_total": stats["run_rows"], "runs_undated": stats["runs_undated"],
    "courses_total": len(courses), "courses_dated": sum(f["dated"] for f in files.values()),
    "sectors": [{"key": k, "label": label[k], "pmet_open": demand.get(k), "n": files[k]["n"], "dated": files[k]["dated"]}
                for k in keys],
    "pulse_url": "../sme-pulse/", "landscape_url": "../skills-landscape/",
}
(DATA / "meta.json").write_text(json.dumps(meta, indent=1))
size = write_page(meta)
print(f"built out/index.html ({size / 1024:.1f} KB); {len(courses):,} courses in {len(keys)} files; "
      f"{meta['courses_dated']:,} with an upcoming dated run (from {today}); demand from Pulse {quarter}")
