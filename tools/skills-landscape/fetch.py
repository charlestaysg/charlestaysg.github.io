"""Fetch the MySkillsFuture course files from data.gov.sg for the Skills Training Landscape page.

Run:  python3 fetch.py [--force]
Reads each dataset's lastUpdatedAt and compares it with data/last-checked.json ("changed").
Downloads the XLSX files to data/raw/ (not committed) unless they are already here and nothing
changed. Writes data/last-checked.json either way. No API key needed; calls are spaced for the
anonymous rate limit (about 1 call / 4 s).
"""
import json, sys, time, urllib.request, datetime, pathlib

HERE = pathlib.Path(__file__).parent
RAW = HERE / "data" / "raw"
RAW.mkdir(parents=True, exist_ok=True)
CHECKED = HERE / "data" / "last-checked.json"

DATASETS = {
    "directory": ("d_b5802b76f409764c16dde4bf2feb19cd", "MySkillsFuture Course Directory"),
    "runs": ("d_60e4423c61d7bbe3c4cf07552197987b", "MySkillsFuture Course Run"),
}
META = "https://api-production.data.gov.sg/v2/public/api/datasets/{}/metadata"
INIT = "https://api-open.data.gov.sg/v1/public/api/datasets/{}/initiate-download"
POLL = "https://api-open.data.gov.sg/v1/public/api/datasets/{}/poll-download"
UA = {"User-Agent": "curl/8.7.1"}  # the API returns 403 to Python's default user agent
GAP = 5


def get(url, as_json=True):
    for attempt in range(5):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120) as r:
                return json.load(r) if as_json else r.read()
        except Exception as e:  # 429 or transient error: back off
            print(f"  retry {attempt + 1}: {e}")
            time.sleep(12 * (attempt + 1))
    raise SystemExit(f"failed: {url.split('?')[0]}")


def download(rid):
    get(INIT.format(rid))
    for _ in range(10):
        time.sleep(GAP)
        url = get(POLL.format(rid))["data"].get("url")
        if url:
            return get(url, as_json=False)
    raise SystemExit(f"download never became ready: {rid}")


prev = json.loads(CHECKED.read_text()) if CHECKED.exists() else {}
meta = {}
for key, (rid, title) in DATASETS.items():
    m = get(META.format(rid))["data"]
    meta[key] = {"id": rid, "title": m["name"], "publisher": m["managedBy"], "updated": m["lastUpdatedAt"]}
    time.sleep(GAP)

changed = any(prev.get("datasets", {}).get(k, {}).get("updated") != meta[k]["updated"] for k in DATASETS)
have_raw = all((RAW / f"{k}.xlsx").exists() for k in DATASETS)
print("new data published since last check" if changed else "no new data since last check")
if have_raw and not changed and "--force" not in sys.argv:
    print("raw files already here; nothing downloaded")
else:  # on GitHub the raw files are never kept, so they are downloaded every run
    for key, (rid, title) in DATASETS.items():
        print(f"downloading {title}")
        blob = download(rid)
        (RAW / f"{key}.xlsx").write_bytes(blob)
        print(f"  {len(blob) // 1024} KB, published {meta[key]['updated'][:10]}")
        time.sleep(GAP)

CHECKED.write_text(json.dumps({"checked": datetime.date.today().isoformat(), "changed": changed,
                               "datasets": meta}, indent=1))
