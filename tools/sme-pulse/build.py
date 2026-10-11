"""Build index.html from data/snapshot.json + data/manual.json + template.html.

Run:  python3 build.py   (after fetch.py). The page has its data inlined, so it needs no
network calls at runtime and works on GitHub Pages, as a Claude artifact, or as a file.
"""
import json, pathlib, datetime

HERE = pathlib.Path(__file__).parent
snap = json.loads((HERE / "data" / "snapshot.json").read_text())
manual = json.loads((HERE / "data" / "manual.json").read_text())
# written by the monthly GitHub Actions run on every check, changed data or not
lc_path = HERE / "data" / "last-checked.json"
checked = json.loads(lc_path.read_text())["checked"] if lc_path.exists() else snap["fetched_at"][:10]
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


# PMET view: retrenchments summed over the last 4 quarters vs open vacancies in the latest quarter
PMET = "professionals, managers, executives and technicians"
last4 = quarters[-4:]


def occ(key, industry, qs):
    vals = [r["v"] for r in ds[key]["data"]
            if r.get("industry") == industry and r.get("occupation") == PMET and r["q"] in qs]
    known = [v for v in vals if v is not None]
    return (sum(known) if known else None), len(qs) - len(known)


def pmet_row(industry):
    ret, ret_missing = occ("retrenched_occ", industry, last4)
    vac, _ = occ("vacancies_occ", industry, [quarters[-1]])
    return {"ret": ret, "ret_missing": ret_missing, "vac": vac}


TOP = ["manufacturing", "construction", "services", "others"]  # top-level groups that add up to the total
pmet_total = {"ret": sum(pmet_row(i)["ret"] or 0 for i in TOP), "vac": sum(pmet_row(i)["vac"] or 0 for i in TOP),
              "ret_all": sum(r["v"] or 0 for r in ds["retrenched_total"]["data"] if r["q"] in last4)}

data = {
    "quarters": quarters,
    "fetched": snap["fetched_at"][:10],
    "checked": checked,
    "latest": quarters[-1],
    "total": {"vac": series("vacancies_total"), "rate": series("vacancy_rate_total"),
              "ret": series("retrenched_total"), "vu": series("vu_ratio")},
    "sectors": [{"key": k, "label": lab, "mom": name, "chip": chip,
                 "vac": series("vacancies", name), "rate": series("vacancy_rate", name),
                 "ret": series("retrenched", name), "pmet": pmet_row(name)} for k, lab, name, chip in SECTORS],
    "pmet": {"from": last4[0], "to": last4[-1], **pmet_total},
    "datasets": [{"id": d["id"], "title": d["title"]} for d in ds.values()],
    "manual": manual,
}

html = (HERE / "template.html").read_text().replace("/*__DATA__*/null", json.dumps(data, separators=(",", ":")))
(HERE / "index.html").write_text(html)
print(f"built index.html ({len(html) // 1024} KB), latest {data['latest']}, fetched {data['fetched']}, checked {data['checked']}")
