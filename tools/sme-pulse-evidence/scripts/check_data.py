"""Independent check: recompute the headline figures from ../sme-pulse/data/raw/*.json
(not snapshot.json) and compare them with the CSVs in sources/pulse/.

Run:  python3 scripts/check_data.py [path/to/sme-pulse/data]    (after prep_data.py)
Same checks as ../sme-pulse/check.py, but against the CSVs the Evidence page reads.
Exits 1 if any line fails.
"""
import csv, json, pathlib, sys

HERE = pathlib.Path(__file__).resolve().parent
PROJECT = HERE.parent
DATA = pathlib.Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else (PROJECT.parent / "sme-pulse" / "data")
SRC = PROJECT / "sources" / "pulse"

raw = {p.stem: json.loads(p.read_text()) for p in (DATA / "raw").glob("*.json")}


def table(name):
    with open(SRC / name, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


series, sectors, pmet_total = table("series.csv"), table("sectors.csv"), table("pmet_total.csv")[0]
sctp_csv, meta = table("sctp_programmes.csv"), table("meta.csv")[0]
SECTORS = {s["sector"]: s for s in sectors}

quarters = sorted({r["quarter"] for r in raw["vacancies_total"]})
latest, prev = quarters[-1], quarters[-2]
last4 = quarters[-4:]


def val(key, q, industry=None):
    for r in raw[key]:
        if r["quarter"] == q and (industry is None or r.get("industry") == industry):
            v = next(r[k] for k in r if k not in ("quarter", "_id", "industry"))
            return None if v in ("-", "", None) else float(v)


def csv_val(scope, measure, q):
    for r in series:
        if r["scope"] == scope and r["measure"] == measure and r["quarter"] == q:
            return None if r["value"] == "" else float(r["value"])
    return "missing row"


def cell(x):
    return None if x in ("", None) else float(x)


fails = 0


def same(label, a, b):
    global fails
    ok = (a is None and b is None) or (isinstance(a, float) and isinstance(b, float) and abs(a - b) < 1e-9)
    fails += not ok
    print(("ok   " if ok else "FAIL ") + f"{label}: raw={a} csv={b}")


same("latest quarter", 1.0 if meta["latest_quarter"] == latest else 0.0, 1.0)
same("total vacancies", val("vacancies_total", latest), csv_val("all", "vac", latest))
same("total vacancy rate", val("vacancy_rate_total", latest), csv_val("all", "rate", latest))
same("total retrenched", val("retrenched_total", latest), csv_val("all", "ret", latest))
same("V/U ratio", val("vu_ratio", latest), csv_val("all", "vu", latest))
same("total vacancies prev qtr", val("vacancies_total", prev), csv_val("all", "vac", prev))
for key, s in SECTORS.items():
    same(f"{s['label']} vacancies", val("vacancies", latest, s["mom_industry"]), csv_val(key, "vac", latest))
    same(f"{s['label']} rate", val("vacancy_rate", latest, s["mom_industry"]), csv_val(key, "rate", latest))
    same(f"{s['label']} retrenched", val("retrenched", latest, s["mom_industry"]), csv_val(key, "ret", latest))

# PMET view, recomputed from the raw occupation tables
PMET = "professionals, managers, executives and technicians"


def occ_raw(key, ind, qs):
    known = []
    for r in raw[key]:
        if r["quarter"] in qs and r.get("industry") == ind and r.get("occupation") == PMET:
            v = next(r[c] for c in r if c not in ("quarter", "_id", "industry", "occupation"))
            if v not in ("-", "", None):
                known.append(float(v))
    return sum(known) if known else None


for key, s in SECTORS.items():
    same(f"{s['label']} PMET retrenched 4q", occ_raw("retrenched_occ", s["mom_industry"], last4), cell(s["pmet_retrenched"]))
    same(f"{s['label']} PMET vacancies", occ_raw("vacancies_occ", s["mom_industry"], last4[-1:]), cell(s["pmet_vacancies"]))
top = ("manufacturing", "construction", "services", "others")
same("PMET retrenched total", float(sum(occ_raw("retrenched_occ", i, last4) or 0 for i in top)), cell(pmet_total["retrenched"]))
same("PMET vacancies total", float(sum(occ_raw("vacancies_occ", i, last4[-1:]) or 0 for i in top)), cell(pmet_total["vacancies"]))
same("all retrenched 4q", float(sum(val("retrenched_total", q) for q in last4)), cell(pmet_total["all_retrenched"]))
same("PMET window starts", 1.0 if pmet_total["from_quarter"] == last4[0] and pmet_total["to_quarter"] == last4[-1] else 0.0, 1.0)
fails += cell(pmet_total["retrenched"]) > cell(pmet_total["all_retrenched"])  # PMET share can not exceed the whole

# SCTP: the CSV carries sctp.json unchanged, and every sector tag is known
sctp = json.loads((DATA / "sctp.json").read_text())
same("SCTP programme count", float(len(sctp["programmes"])), float(len(sctp_csv)))
same("SCTP institution count", float(len(sctp["institutions"])), float(meta["sctp_institutions"]))
same("SCTP titles unchanged", 1.0 if [p["title"] for p in sctp["programmes"]] == [r["title"] for r in sctp_csv] else 0.0, 1.0)
same("SCTP first course reference unchanged", 1.0 if [(p.get("refs") or [""])[0] for p in sctp["programmes"]] == [r["ref"] for r in sctp_csv] else 0.0, 1.0)
known = set(SECTORS) | {"cross", "other"}
bad = [p["title"] for p in sctp["programmes"] if p["sector"] not in known]
fails += bool(bad)
print(("ok   " if not bad else "FAIL ") + f"SCTP sector tags valid {bad or ''}")

# the series table has the same row count for every scope and measure
per = {}
for r in series:
    per[(r["scope"], r["measure"])] = per.get((r["scope"], r["measure"]), 0) + 1
ok = len(set(per.values())) == 1 and per.popitem()[1] == len(quarters)
fails += not ok
print(("ok   " if ok else "FAIL ") + f"every series has all {len(quarters)} quarters")

# sector components should add up to the published total (MOM rounds to the nearest 100)
parts = sum(val("vacancies", latest, n) or 0 for n in ("manufacturing", "construction", "services", "others"))
tot = val("vacancies_total", latest)
print(f"{'ok  ' if abs(parts - tot) <= 200 else 'WARN'} sum of top-level sectors {parts:.0f} vs total {tot:.0f}")
print("ALL CHECKS PASSED" if not fails else f"{fails} FAILED")
sys.exit(1 if fails else 0)
