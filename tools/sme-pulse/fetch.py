"""Fetch MOM labour-market snapshots from data.gov.sg for the SME Workforce Pulse dashboard.

Run:  python3 fetch.py
Writes data/raw/<name>.json and data/snapshot.json. No API key needed; calls are spaced
to stay inside the anonymous datastore_search limit (4 calls / 10 s).
"""
import json, time, urllib.request, datetime, pathlib

HERE = pathlib.Path(__file__).parent
RAW = HERE / "data" / "raw"
RAW.mkdir(parents=True, exist_ok=True)

DATASETS = {
    "vacancies": ("d_3f17bbf67d31d4d402caa8755eb74afc", "Number of Job Vacancy by Industry - Quarterly", "job_vacancy"),
    "vacancy_rate": ("d_fe705c7af162331d36cc31193f8f50c9", "Job Vacancy Rate by Industry - Quarterly", "job_vacancy_rate"),
    "retrenched": ("d_61d92d31ca400be135190614277da825", "Number of Retrenched Employees by Industry - Quarterly", "retrench"),
    "vu_ratio": ("d_80c0cf251ee9a26d240808297f52c820", "Job Vacancy to Unemployed Person Ratio - Quarterly", "jv_to_ue"),
    "vacancies_total": ("d_59a34aef12e0ecf666de5746e50586e8", "Number of Job Vacancy - Quarterly", None),
    "vacancy_rate_total": ("d_c57f5cd0558e429e2ac055d83030e75f", "Job Vacancy Rate - Quarterly", "job_vacancy_rate"),
    "retrenched_total": ("d_000d49cda016c13522d7d5be6a050f59", "Number of Retrenched Employees - Quarterly", "retrench"),
}
URL = "https://data.gov.sg/api/action/datastore_search?resource_id={}&limit=10000"


def get(rid):
    for attempt in range(5):
        try:
            with urllib.request.urlopen(URL.format(rid), timeout=60) as r:
                return json.load(r)["result"]["records"]
        except Exception as e:  # 429 or transient error: back off
            print(f"  retry {attempt + 1} for {rid}: {e}")
            time.sleep(12 * (attempt + 1))
    raise SystemExit(f"failed: {rid}")


def num(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None  # MOM uses "-" for not available


snapshot = {"fetched_at": datetime.datetime.now().isoformat(timespec="minutes"), "datasets": {}}
for key, (rid, title, col) in DATASETS.items():
    print(f"fetching {title}")
    rows = get(rid)
    (RAW / f"{key}.json").write_text(json.dumps(rows))
    if col is None:  # value column name not known in advance: the one field that isn't quarter/_id
        col = next(k for k in rows[0] if k not in ("quarter", "_id", "industry"))
    tidy = [{"q": r["quarter"], **({"industry": r["industry"]} if "industry" in r else {}), "v": num(r[col])} for r in rows]
    snapshot["datasets"][key] = {"id": rid, "title": title, "rows": len(tidy),
                                 "latest": max(r["q"] for r in tidy), "data": tidy}
    time.sleep(6)

(HERE / "data" / "snapshot.json").write_text(json.dumps(snapshot))
for k, d in snapshot["datasets"].items():
    print(f"{k}: {d['rows']} rows, latest {d['latest']}")
