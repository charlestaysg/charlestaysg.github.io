"""Check the built Course Finder against the raw SWDA files and the Skills Training Landscape. Exit 1 on any failure.

Run:  python3 check.py   (after build.py)
Course counts, runs and ratings are recounted straight from the XLSX with plain openpyxl, not through
clean.py. Sector assignment uses the Landscape's rules (sectors.py) and must match its latest.json.
"""
import collections, gzip, json, pathlib, re, sys
import openpyxl

HERE = pathlib.Path(__file__).parent
SL = HERE.parent / "skills-landscape"
OUT = HERE / "out"
PULSE = next(p for p in (HERE.parent / "sme-pulse", HERE.parent / "sme-workforce-pulse") if p.exists())
PROV = json.loads((SL / "data" / "providers.json").read_text())
LATEST = json.loads((SL / "data" / "latest.json").read_text())
META = json.loads((HERE / "data" / "meta.json").read_text())
fails = []


def check(name, ok, detail=""):
    print(f"{'PASS' if ok else 'FAIL'}  {name}{'  ' + detail if detail else ''}")
    if not ok:
        fails.append(name)


def sheet(name):
    it = openpyxl.load_workbook(SL / "data" / "raw" / f"{name}.xlsx", read_only=True).active.iter_rows(values_only=True)
    head = next(it)
    return [dict(zip(head, r)) for r in it]


html = (OUT / "index.html").read_text()
m = re.search(r"const D = (\{.*?\});\n", html)
page = json.loads(m.group(1)) if m else {}
check("page carries data/meta.json", page == META)
check("no template placeholders left", "/*__" not in html)

files = {p.stem: json.loads(p.read_text(encoding="utf-8")) for p in (OUT / "data").glob("*.json")}
keys = [s["key"] for s in META["sectors"]]
check("one data file per sector, plus general", sorted(files) == sorted(keys), f"{len(files)} files")
check("14 sectors plus cross-sector", len(keys) == 15 and keys[-1] == "general")

# --- sizes ---
page_kb = len(html.encode()) / 1024
check("page under 100 KB", page_kb < 100, f"{page_kb:.1f} KB")
big = []
print("\nfile sizes (raw / gzip):")
print(f"  index.html  {page_kb:.1f} KB / {len(gzip.compress(html.encode())) / 1024:.1f} KB")
for k in keys:
    raw = (OUT / "data" / f"{k}.json").read_bytes()
    gz = len(gzip.compress(raw))
    print(f"  data/{k}.json  {len(raw) / 1024:.0f} KB / {gz / 1024:.0f} KB")
    if len(raw) > 2_500_000:
        big.append(k)
tot_raw = sum((OUT / "data" / f"{k}.json").stat().st_size for k in keys)
print(f"  all data files  {tot_raw / 1024:.0f} KB raw\n")
check("each data file under 2.5 MB", not big, ", ".join(big))

# --- schema: no free text beyond title and provider name ---
rows_all = [(k, r) for k in keys for r in files[k]["c"]]
nf = len(files[keys[0]]["f"])
bad = [r[0] for _, r in rows_all if len(r) != nf or not isinstance(r[9], list) or len(r[9]) > META["max_dates"]
       or not all(re.fullmatch(r"\d{4}-\d{2}-\d{2}", d) for d in r[9])]
check("every row has the expected shape and ISO dates", not bad, str(bad[:3]))
check("fields are the agreed list", files[keys[0]]["f"] == ["ref", "title", "provider", "hours", "mode", "fee", "stars", "respondents", "ai", "dates", "runs"])
dates_ok = all(d >= META["built"] and r[9] == sorted(r[9]) and r[10] >= len(r[9]) for _, r in rows_all for d in r[9])
check("run dates are on or after the build date and sorted", dates_ok)

# --- privacy: no email or phone-like numbers ---
blob = "\n".join((OUT / "data" / f"{k}.json").read_text(encoding="utf-8") for k in keys)
meta_text = json.dumps({k: v for k, v in page.items() if k not in ("datasets", "vacancy_dataset")})
email = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[A-Za-z]{2,}")
phone = re.compile(r"(?<![\d.])\d{8}(?![\d.])")
check("no email address in any output", not (email.search(blob) or email.search(html)),
      str(email.findall(blob)[:3] + email.findall(html)[:3]))
check("no 8-digit phone-like number in the data or inlined metadata", not (phone.search(blob) or phone.search(meta_text)),
      str(phone.findall(blob)[:5]))

# --- directory, counted independently ---
first = {}
for r in sheet("directory"):
    first.setdefault(str(r["coursereferencenumber"]).strip(), r)
n = len(first)
univ = set(PROV["university"])


def ptype(uen):
    uen = uen.strip().upper()
    return "ihl" if uen in PROV["ihl"] else "university" if uen in univ else \
        "public" if any(uen.startswith(p) for p in PROV["public_prefixes"]) else "private"


want = collections.Counter(ptype(str(r["trainingprovideruen"])) for r in first.values())
got = collections.Counter()
for k in keys:
    t = files[k]["t"]
    for r in files[k]["c"]:
        got[t[files[k]["p"][r[2]][1]]] += 1
check("course count per provider type matches the XLSX", got == want, f"output {dict(got)} vs XLSX {dict(want)}")
refs = [r[0] for _, r in rows_all]
check("every course appears in exactly one sector file",
      len(refs) == len(set(refs)) == n and set(refs) == set(first), f"{len(refs):,} rows, {len(set(refs)):,} unique, {n:,} in XLSX")
off = {k: (len(files[k]["c"]), LATEST["groups"][k]["n"]) for k in keys if len(files[k]["c"]) != LATEST["groups"][k]["n"]}
check("sector counts equal the Skills Landscape's latest.json", not off, f"differences: {off}" if off else "")
check("meta sector counts equal the files", all(s["n"] == len(files[s["key"]]["c"]) for s in META["sectors"]))
check("AI-flag count equals the Landscape's", sum(r[8] for _, r in rows_all) == LATEST["groups"]["all"]["ai"],
      f"{sum(r[8] for _, r in rows_all):,}")

# fees, hours, ratings against the XLSX
def f(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None
mism = 0
for k, r in rows_all:
    x = first[r[0]]
    if (f(x["full_course_fee"]) != r[5] and not (r[5] is None and f(x["full_course_fee"]) is None)) or \
       f(x["number_of_hours"]) != r[3] or f(x["courseratings_stars"]) != r[6] or \
       (None if f(x["courseratings_noofrespondents"]) is None else int(f(x["courseratings_noofrespondents"]))) != r[7]:
        mism += 1
check("fee, hours, rating stars and respondents match the XLSX", mism == 0, f"{mism} mismatches")

# --- runs, counted independently ---
runs = sheet("runs")
built = META["built"]
up = collections.defaultdict(list)
for x in runs:
    s = x["courserunstartdate"]
    ref = str(x["coursereferencenumber"]).strip()
    if s and str(s)[:10] >= built and ref in first:
        up[ref].append(str(s)[:10])
mism = sum(1 for _, r in rows_all if r[10] != len(up.get(r[0], [])) or r[9] != sorted(up.get(r[0], []))[:META["max_dates"]])
check("upcoming run dates and counts match runs.xlsx", mism == 0, f"{mism} mismatches")
check("courses with a dated run", META["courses_dated"] == len(up), f"{len(up):,} of {n:,}")
undated = sum(1 for x in runs if not x["courserunstartdate"])
check("undated share matches runs.xlsx", META["runs_undated"] == undated and META["runs_total"] == len(runs), f"{undated:,} of {len(runs):,}")

# --- Pulse ---
snap = json.loads((PULSE / "data" / "snapshot.json").read_text())["datasets"]["vacancies_occ"]
pm = {r["industry"]: r["v"] for r in snap["data"]
      if r["q"] == snap["latest"] and r.get("occupation") == "professionals, managers, executives and technicians"}
names = {s["key"]: s["pmet_open"] for s in LATEST["sectors"]}
check("open PMET roles match the Landscape and the Pulse snapshot",
      META["demand_quarter"] == snap["latest"] == LATEST["demand_quarter"]
      and all(s["pmet_open"] == names.get(s["key"]) for s in META["sectors"] if s["key"] != "general"), snap["latest"])
check("sector keys and labels match the Landscape",
      [(s["key"], s["label"]) for s in META["sectors"][:-1]] == [(s["key"], s["label"]) for s in LATEST["sectors"]])

# --- links ---
ok_ref = all(re.fullmatch(r"[A-Za-z]+-\d{6,14}", r) for r in refs)
check("every course link would match https://courses.myskillsfuture.gov.sg/courses/<ref>", ok_ref)
allowed = [r"https://courses\.myskillsfuture\.gov\.sg/courses/", r"https://step\.polite\.edu\.sg/",
           r"https://data\.gov\.sg/datasets/(d_[0-9a-f]{32}/view|\$\{[A-Za-z_.]+\}/view)", r"https://data\.gov\.sg/open-data-licence",
           r"https://www\.linkedin\.com/in/charlestay"]
urls = set(re.findall(r"https?://[^\s\"'`<>)]+", html))
stray = sorted(u for u in urls if not any(re.fullmatch(a + r".*" if a.endswith("/courses/") else a, u) for a in allowed))
check("every URL in the page is on the allowed list (STEP is the home page only)", not stray, str(stray))
check("STEP link is exactly https://step.polite.edu.sg/", "https://step.polite.edu.sg/" in html and "www.step" not in html)

print(f"\n{len(fails)} failure(s)" if fails else "\nall checks passed")
sys.exit(1 if fails else 0)
