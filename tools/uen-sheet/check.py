"""Check the built page against the Pulse, the Landscape and the SSIC table. Exit 1 on any failure.

Run:  python3 check.py   (after ssic.py and build.py)
Sector figures are recomputed from the Pulse snapshot and course totals read from the Landscape's
latest.json. The course list is read live from the Course Finder's per-sector files, so this checks
that every sector has a file in the shape the page expects.
"""
import ast, json, os, pathlib, re, sys

sys.dont_write_bytecode = True
HERE = pathlib.Path(__file__).parent
# refresh.sh points these at fresh copies from the site repo; by default, the vault sibling folders
def sibling(*names):  # vault folder names first, then the site repo's tools/ names
    return next((HERE.parent / n for n in names if (HERE.parent / n).exists()), HERE.parent / names[0])
PULSE = pathlib.Path(os.environ.get("UEN_PULSE_DIR") or sibling("sme-workforce-pulse", "sme-pulse"))
LAND = pathlib.Path(os.environ.get("UEN_LAND_DIR") or sibling("skills-training-landscape", "skills-landscape"))
FINDER = pathlib.Path(os.environ.get("UEN_FINDER_DIR") or sibling("course-finder"))
FINDER_OUT = pathlib.Path(os.environ.get("UEN_FINDER_OUT") or HERE.parent.parent / "projects" / "course-finder" / "data")
fails = []


def check(name, ok, detail=""):
    print(f"{'PASS' if ok else 'FAIL'}  {name}{'  ' + detail if detail else ''}")
    if not ok:
        fails.append(name)


html = (HERE / "index.html").read_text()
baked = json.loads((HERE / "data" / "baked.json").read_text())
m = re.search(r"const D = (\{.*?\});\nconst fmt", html, re.S)
page = json.loads(m.group(1)) if m else {}
check("page carries baked.json unchanged", page == baked)
check("no unreplaced placeholders", "/*__" not in html)
size = len(html.encode())
check("page under 200 KB", size < 200_000, f"{size // 1024} KB")
check("no external scripts", not re.search(r"<script[^>]+src=", html))

# sectors vs the Pulse
tree = ast.parse((PULSE / "build.py").read_text())
ps = next(ast.literal_eval(n.value) for n in ast.walk(tree)
          if isinstance(n, ast.Assign) and getattr(n.targets[0], "id", "") == "SECTORS")
check("sector keys and labels match the Pulse build.py",
      [(k, v["label"]) for k, v in baked["sectors"].items()] == [(k, l) for k, l, _, _ in ps])
check("MOM names match the Pulse", all(baked["sectors"][k]["mom"] == mom for k, _, mom, _ in ps))

ds = json.loads((PULSE / "data" / "snapshot.json").read_text())["datasets"]
quarters = sorted({r["q"] for r in ds["vacancies_total"]["data"]})
q, qya = quarters[-1], quarters[-5]
check("Pulse quarter is the latest", baked["asof"]["pulse_q"] == q, q)


def val(key, industry, quarter, occ=None):
    for r in ds[key]["data"]:
        if r["q"] == quarter and r.get("industry") == industry and r.get("occupation") == occ:
            return r["v"]


bad = []
PM = "professionals, managers, executives and technicians"
for k, _, mom, _ in ps:
    p = baked["sectors"][k]["pulse"]
    exp = {"vac": val("vacancies", mom, q), "vac_ya": val("vacancies", mom, qya), "rate": val("vacancy_rate", mom, q),
           "rate_ya": val("vacancy_rate", mom, qya), "ret": val("retrenched", mom, q), "ret_ya": val("retrenched", mom, qya),
           "pmet_vac": val("vacancies_occ", mom, q, PM)}
    exp = {a: b for a, b in exp.items()}
    got = {a: p[a] for a in exp}
    r4 = [val("retrenched_occ", mom, x, PM) for x in quarters[-4:]]
    r4 = [v for v in r4 if v is not None]
    if got != exp or p["pmet_ret"] != (sum(r4) if r4 else None):
        bad.append(k)
check("sector figures equal the Pulse snapshot", not bad, str(bad) if bad else "")
nat = baked["national"]
check("national rate and vacancies equal the Pulse snapshot",
      nat["rate"] == next(r["v"] for r in ds["vacancy_rate_total"]["data"] if r["q"] == q)
      and nat["vac"] == next(r["v"] for r in ds["vacancies_total"]["data"] if r["q"] == q))

# courses vs Landscape latest.json
latest = json.loads((LAND / "data" / "latest.json").read_text())
bad = [k for k in baked["sectors"] if any(
    baked["sectors"][k]["courses"][f] != latest["groups"][k][f] for f in ("n", "providers", "ai", "fee_median"))]
check("course n/providers/ai/fee_median equal Landscape latest.json", not bad, str(bad) if bad else "")
check("national course figures equal latest.json", all(baked["allCourses"][f] == latest["groups"]["all"][f] for f in ("n", "providers", "ai", "fee_median")))
check("course date matches Landscape", baked["asof"]["courses"] == latest["datasets"]["directory"]["updated"][:10])

# Course Finder files the page reads at run time
FIELDS = ["ref", "title", "provider", "hours", "mode", "fee", "stars", "respondents", "ai", "dates", "runs"]
fmeta = json.loads((FINDER / "data" / "meta.json").read_text())
check("Course Finder sector keys equal the sheet's", [s["key"] for s in fmeta["sectors"] if s["key"] != "general"] == list(baked["sectors"]))
check("rating threshold equals the Course Finder's", baked["finder"]["min_respondents"] == fmeta["min_respondents"])
bad = []
for k in list(baked["sectors"]) + ["general"]:
    f = FINDER_OUT / f"{k}.json"
    if not f.exists():
        bad.append(f"{k}: missing"); continue
    j = json.loads(f.read_text())
    if j.get("f") != FIELDS or not j.get("c") or any(str(r[2]) not in j["p"] for r in j["c"]):
        bad.append(f"{k}: shape")
check("every sector has a Course Finder file in the expected shape", not bad, str(bad) if bad else "")

# SSIC
smap = json.loads((HERE / "data" / "ssic-map.json").read_text())
ssic = json.loads((HERE / "data" / "ssic2025.json").read_text())
keys = set(baked["sectors"]) | {"none"}
check("every SSIC division maps to a sector key or none", set(smap["divisions"]) == set(ssic["divisions"])
      and all(v in keys for v in smap["divisions"].values()))
check("every five-digit code has a division in the map", all(c[:2] in smap["divisions"] for c in ssic["codes"]))
check("holding codes exist in the SSIC 2025 table", all(c in ssic["codes"] for c in smap["holding"]))
check("ambiguous divisions exist in the table", all(d in ssic["divisions"] for d in smap["ambiguous"]))
check("page SSIC table equals ssic2025.json", baked["ssic"] == ssic["codes"])
check("no division mapped to manufacturing outside 10-32", all(d in [f"{i:02d}" for i in range(10, 33)] for d, k in smap["divisions"].items() if k == "manufacturing"))

# shards vs data-findings.md
text = (HERE / "data-findings.md").read_text()
found = dict(re.findall(r"(?:^|\| |: )([A-Z]|Others)(?: \(digit/symbol-first names\))? (d_[0-9a-f]{32})", text.split("Row counts")[0]))
check("27 shard IDs present", len(baked["shards"]) == 27)
check("shard IDs equal data-findings.md", found == baked["shards"], f"{len(found)} parsed")

# page-level rules
low = html.lower()
check("no RP/NACE branding in the page", not re.search(r"republic polytechnic|nace@rp|\bnace\b", re.sub(r'"(sctp|top|titles)":\[\[.*?\]\],?', "", low.split("<script>")[0])) )
hype = ["leverage", "seamless", "unlock", "empower", "robust", "delve"]
body = re.sub(r"const D = .*?;\nconst fmt", "const fmt", html, flags=re.S)
check("no hype words", not [w for w in hype if re.search(r"\b" + w, body.lower())])
check("sessionStorage only used inside try/catch", html.count("sessionStorage") == 2 and "try {" in html)

print(f"\n{len(fails)} failure(s)" if fails else "\nall checks passed")
sys.exit(1 if fails else 0)
