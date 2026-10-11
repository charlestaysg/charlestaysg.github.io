"""Independent check: recompute headline figures from data/raw/*.json (not snapshot.json)
and compare with the numbers the built page shows. Run after build.py.
"""
import json, pathlib, re, sys

HERE = pathlib.Path(__file__).parent
raw = {p.stem: json.loads(p.read_text()) for p in (HERE / "data" / "raw").glob("*.json")}
page = json.loads(re.search(r"const D = (\{.*?\});\n", (HERE / "index.html").read_text()).group(1))
latest = max(r["quarter"] for r in raw["vacancies_total"])
prev = sorted({r["quarter"] for r in raw["vacancies_total"]})[-2]


def val(key, q, industry=None):
    for r in raw[key]:
        if r["quarter"] == q and (industry is None or r.get("industry") == industry):
            v = next(r[k] for k in r if k not in ("quarter", "_id", "industry"))
            return None if v in ("-", "", None) else float(v)


fails = 0
def same(label, a, b):
    global fails
    ok = (a is None and b is None) or (a is not None and b is not None and abs(a - b) < 1e-9)
    fails += not ok
    print(("ok   " if ok else "FAIL ") + f"{label}: raw={a} page={b}")

L = page["quarters"].index(latest)
same("total vacancies", val("vacancies_total", latest), page["total"]["vac"][L])
same("total vacancy rate", val("vacancy_rate_total", latest), page["total"]["rate"][L])
same("total retrenched", val("retrenched_total", latest), page["total"]["ret"][L])
same("V/U ratio", val("vu_ratio", latest), page["total"]["vu"][L])
same("total vacancies prev qtr", val("vacancies_total", prev), page["total"]["vac"][L - 1])
for s in page["sectors"]:
    same(f"{s['label']} vacancies", val("vacancies", latest, s["mom"]), s["vac"][L])
    same(f"{s['label']} rate", val("vacancy_rate", latest, s["mom"]), s["rate"][L])
    same(f"{s['label']} retrenched", val("retrenched", latest, s["mom"]), s["ret"][L])
# PMET view: recompute from the raw occupation tables
PMET = "professionals, managers, executives and technicians"
qs = sorted({r["quarter"] for r in raw["vacancies_total"]})[-4:]
def occ_raw(key, ind, quarters):
    known = []
    for r in raw[key]:
        if r["quarter"] in quarters and r.get("industry") == ind and r.get("occupation") == PMET:
            v = next(r[c] for c in r if c not in ("quarter", "_id", "industry", "occupation"))
            if v not in ("-", "", None):
                known.append(float(v))
    return sum(known) if known else None
for s in page["sectors"]:
    same(f"{s['label']} PMET retrenched 4q", occ_raw("retrenched_occ", s["mom"], qs), s["pmet"]["ret"])
    same(f"{s['label']} PMET vacancies", occ_raw("vacancies_occ", s["mom"], qs[-1:]), s["pmet"]["vac"])
top = ("manufacturing", "construction", "services", "others")
same("PMET retrenched total", sum(occ_raw("retrenched_occ", i, qs) or 0 for i in top), page["pmet"]["ret"])
same("PMET vacancies total", sum(occ_raw("vacancies_occ", i, qs[-1:]) or 0 for i in top), page["pmet"]["vac"])
same("all retrenched 4q", sum(val("retrenched_total", q) for q in qs), page["pmet"]["ret_all"])
# PMET share can't exceed the whole
fails += page["pmet"]["ret"] > page["pmet"]["ret_all"]

# sector components should add up to the published total (MOM rounds to the nearest 100)
parts = sum(val("vacancies", latest, n) or 0 for n in ("manufacturing", "construction", "services", "others"))
print(f"{'ok  ' if abs(parts - val('vacancies_total', latest)) <= 200 else 'WARN'} sum of top-level sectors {parts:.0f} vs total {val('vacancies_total', latest):.0f}")
print("ALL CHECKS PASSED" if not fails else f"{fails} FAILED")
sys.exit(1 if fails else 0)
