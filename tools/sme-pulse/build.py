"""Build index.html from data/snapshot.json + data/manual.json + template.html.

Run:  python3 build.py   (after fetch.py). The page has its data inlined, so it needs no
network calls at runtime and works on GitHub Pages, as a Claude artifact, or as a file.
"""
import json, pathlib, datetime

HERE = pathlib.Path(__file__).parent
snap = json.loads((HERE / "data" / "snapshot.json").read_text())
manual = json.loads((HERE / "data" / "manual.json").read_text())
ds = snap["datasets"]

# key, short label, MOM industry name, show as filter chip?
SECTORS = [
    ("manufacturing", "Manufacturing", "manufacturing", True),
    ("construction", "Construction", "construction", True),
    ("transport", "Transport & storage", "transportation and storage", True),
    ("food", "Food & accommodation", "accommodation and food services", True),
    ("health", "Health & social", "health and social services", True),
    ("admin", "Admin & support", "administrative and support services", True),
    ("security", "Security", "security and investigation", True),
    ("retail", "Wholesale & retail", "wholesale and retail trade", False),
    ("ict", "Info & comms", "information and communications", False),
    ("finance", "Finance & insurance", "financial and insurance services", False),
    ("realestate", "Real estate", "real estate services", False),
    ("professional", "Professional services", "professional services", False),
    ("publicedu", "Public admin & education", "public administration and education", False),
    ("arts", "Arts & recreation", "arts, entertainment and recreation", False),
]

quarters = sorted({r["q"] for r in ds["vacancies_total"]["data"]})
idx = {q: i for i, q in enumerate(quarters)}


def series(key, industry=None):
    out = [None] * len(quarters)
    for r in ds[key]["data"]:
        if industry is None or r.get("industry") == industry:
            out[idx[r["q"]]] = r["v"]
    return out


data = {
    "quarters": quarters,
    "fetched": snap["fetched_at"][:10],
    "latest": quarters[-1],
    "total": {"vac": series("vacancies_total"), "rate": series("vacancy_rate_total"),
              "ret": series("retrenched_total"), "vu": series("vu_ratio")},
    "sectors": [{"key": k, "label": lab, "mom": name, "chip": chip,
                 "vac": series("vacancies", name), "rate": series("vacancy_rate", name),
                 "ret": series("retrenched", name)} for k, lab, name, chip in SECTORS],
    "datasets": [{"id": d["id"], "title": d["title"]} for d in ds.values()],
    "manual": manual,
}

html = (HERE / "template.html").read_text().replace("/*__DATA__*/null", json.dumps(data, separators=(",", ":")))
(HERE / "index.html").write_text(html)
print(f"built index.html ({len(html) // 1024} KB), latest {data['latest']}, fetched {data['fetched']}")
