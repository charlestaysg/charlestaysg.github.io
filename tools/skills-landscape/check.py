"""Check the built page against the raw course files. Exit 1 on any failure.

Run:  python3 check.py   (after build.py)
Counts, fees, AI and runs are recomputed straight from the XLSX with plain openpyxl, not through
clean.py, so a bug in the cleaning step shows up here. Sector counts are recomputed with the same
rules (sectors.py is the method, not something to second-guess) and must add up.
"""
import ast, collections, datetime, json, pathlib, re, statistics, sys
import openpyxl
from ai import AI
from sectors import classify, PRIORITY
from clean import text  # same text tidy-up as the build; counting below does not use clean.py

HERE = pathlib.Path(__file__).parent
RAW = HERE / "data" / "raw"
PULSE = next(p for p in (HERE.parent / "sme-pulse", HERE.parent / "sme-workforce-pulse") if p.exists())
PROV = json.loads((HERE / "data" / "providers.json").read_text())
fails = []


def check(name, ok, detail=""):
    print(f"{'PASS' if ok else 'FAIL'}  {name}{'  ' + detail if detail else ''}")
    if not ok:
        fails.append(name)


def sheet(name):
    it = openpyxl.load_workbook(RAW / f"{name}.xlsx", read_only=True).active.iter_rows(values_only=True)
    head = next(it)
    return [dict(zip(head, r)) for r in it]


# the page must carry exactly latest.json
html = (HERE / "index.html").read_text()
latest = json.loads((HERE / "data" / "latest.json").read_text())
m = re.search(r"const D = (\{.*?\});\n", html)
page = json.loads(m.group(1)) if m else {}
check("page carries latest.json", all(page.get(k) == v for k, v in latest.items()))
check("page size under 150 KB", len(html) < 150_000, f"{len(html) // 1024} KB")
check("no template placeholders left", "/*__" not in html)
G = latest["groups"]

# --- directory, counted independently ---
rows = sheet("directory")
first = {}
for r in rows:
    first.setdefault(str(r["coursereferencenumber"]).strip(), r)
n = len(first)
check("unique courses", G["all"]["n"] == n, f"{n:,}")
uens = {str(r["trainingprovideruen"]).strip().upper() for r in first.values()}
check("providers by UEN", G["all"]["providers"] == len(uens), f"{len(uens)}")
ai = sum(1 for r in first.values() if AI.search(str(r["coursetitle"] or "")))
check("AI-related courses", G["all"]["ai"] == ai, f"{ai:,} ({ai / n:.1%})")
univ = set(PROV["university"])
fees = [float(r["full_course_fee"]) for r in first.values()
        if str(r["trainingprovideruen"]).strip().upper() not in univ and r["full_course_fee"] not in (None, "")]
check("median full fee, universities left out", G["all"]["fee_median"] == statistics.median(fees), f"${statistics.median(fees):,.0f}")
types = collections.Counter("ihl" if u in PROV["ihl"] else "university" if u in univ else
                            "public" if any(u.startswith(p) for p in PROV["public_prefixes"]) else "private"
                            for u in (str(r["trainingprovideruen"]).strip().upper() for r in first.values()))
check("provider-type counts", G["all"]["types"] == {t: types[t] for t in G["all"]["types"]})
check("mode counts add up", sum(G["all"]["modes"]) == n)
check("hours bands add up", sum(G["all"]["hours"]) == sum(1 for r in first.values() if r["number_of_hours"] not in (None, "")))

# --- sectors: same rules, must add up and match ---
by = collections.Counter()
for r in first.values():
    by[classify(text(r["coursetitle"]), text(r["what_you_learn"]) + " " + text(r["about_this_course"]))[0]] += 1
off = {k: (G[k]["n"], by[k]) for k in PRIORITY + ["general"] if G[k]["n"] != by[k]}
check("sector counts match the rules", not off, f"page vs recount: {off}" if off else "")
check("sector counts add up to all courses", sum(G[k]["n"] for k in PRIORITY + ["general"]) == n)
mapped = n - by["general"]
check("sector found for at least 40% of courses", mapped / n >= 0.40, f"{mapped / n:.0%}")

# rules vs the Pulse's hand-tagged SCTPs
sctp = json.loads((PULSE / "data" / "sctp.json").read_text())["programmes"]
agree = sum(classify(p["title"])[0] == ("general" if p["sector"] in ("cross", "other") else p["sector"]) for p in sctp)
check("rules agree with hand-tagged SCTPs (90%+)", agree / len(sctp) >= 0.90, f"{agree}/{len(sctp)}")

# --- runs, counted independently ---
runs = sheet("runs")
undated = sum(1 for r in runs if not r["courserunstartdate"])
check("undated runs", latest["runs_undated"] == undated, f"{undated:,} of {len(runs):,}")
months = latest["months"]
listed = set(first)
per_month = collections.Counter(str(r["courserunstartdate"])[:7] for r in runs
                                if r["courserunstartdate"] and str(r["coursereferencenumber"]).strip() in listed)
check("runs per month", G["all"]["runs"] == [per_month[m] for m in months])
built = datetime.date.fromisoformat(latest["built"])
check("run window starts in the build month", months[0] == built.strftime("%Y-%m"))

# --- agreement with the Pulse ---
tree = ast.parse((PULSE / "build.py").read_text())
pulse_sectors = next(ast.literal_eval(n.value) for n in ast.walk(tree)
                     if isinstance(n, ast.Assign) and getattr(n.targets[0], "id", "") == "SECTORS")
check("sector keys and labels match the Pulse",
      [(s["key"], s["label"]) for s in latest["sectors"]] == [(k, l) for k, l, _, _ in pulse_sectors])
snap = json.loads((PULSE / "data" / "snapshot.json").read_text())["datasets"]["vacancies_occ"]
names = {k: name for k, _, name, _ in pulse_sectors}
pm = {r["industry"]: r["v"] for r in snap["data"]
      if r["q"] == snap["latest"] and r.get("occupation") == "professionals, managers, executives and technicians"}
check("PMET open roles match the Pulse snapshot",
      latest["demand_quarter"] == snap["latest"] and all(s["pmet_open"] == pm.get(names[s["key"]]) for s in latest["sectors"]),
      snap["latest"])

print(f"\n{len(fails)} failure(s)" if fails else "\nall checks passed")
sys.exit(1 if fails else 0)
