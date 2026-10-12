"""Build index.html: bake the sector, course and SSIC data into template.html.

Run:  python3 ssic.py && python3 build.py
Reads (never writes) the sibling projects:
  ../sme-workforce-pulse/   build.py SECTORS, data/snapshot.json, data/manual.json, data/sctp.json
  ../skills-training-landscape/   data/latest.json; clean.py + sectors.py for the top courses
Writes data/baked.json and index.html. The company lookup itself happens in the browser at run
time; only the reference data is baked.
"""
import ast, collections, datetime, json, os, pathlib, re, sys

sys.dont_write_bytecode = True  # do not leave __pycache__ in the sibling folders

HERE = pathlib.Path(__file__).parent
DATA = HERE / "data"
# refresh.sh points these at fresh copies from the site repo; by default, the vault sibling folders
def sibling(*names):  # vault folder names first, then the site repo's tools/ names
    return next((HERE.parent / n for n in names if (HERE.parent / n).exists()), HERE.parent / names[0])
PULSE = pathlib.Path(os.environ.get("UEN_PULSE_DIR") or sibling("sme-workforce-pulse", "sme-pulse"))
LAND = pathlib.Path(os.environ.get("UEN_LAND_DIR") or sibling("skills-training-landscape", "skills-landscape"))
PMET = "professionals, managers, executives and technicians"

# 27 shard IDs, copied from data-findings.md (check.py re-reads that file and compares)
SHARDS = {
    "A": "d_8575e84912df3c28995b8e6e0e05205a", "B": "d_3a3807c023c61ddfba947dc069eb53f2", "C": "d_c0650f23e94c42e7a20921f4c5b75c24",
    "D": "d_acbc938ec77af18f94cecc4a7c9ec720", "E": "d_124a9bd407c7a25f8335b93b86e50fdd", "F": "d_4526d47d6714d3b052eed4a30b8b1ed6",
    "G": "d_b58303c68e9cf0d2ae93b73ffdbfbfa1", "H": "d_fa2ed456cf2b8597bb7e064b08fc3c7c", "I": "d_85518d970b8178975850457f60f1e738",
    "J": "d_478f45a9c541cbe679ca55d1cd2b970b", "K": "d_5573b0db0575db32190a2ad27919a7aa", "L": "d_a2141adf93ec2a3c2ec2837b78d6d46e",
    "M": "d_9af9317c646a1c881bb5591c91817cc6", "N": "d_67e99e6eabc4aad9b5d48663b579746a", "O": "d_5c4ef48b025fdfbc80056401f06e3df9",
    "P": "d_181005ca270b45408b4cdfc954980ca2", "Q": "d_4130f1d9d365d9f1633536e959f62bb7", "R": "d_2b8c54b2a490d2fa36b925289e5d9572",
    "S": "d_df7d2d661c0c11a7c367c9ee4bf896c1", "T": "d_72f37e5c5d192951ddc5513c2b134482", "U": "d_0cc5f52a1f298b916f317800251057f3",
    "V": "d_e97e8e7fc55b85a38babf66b0fa46b73", "W": "d_af2042c77ffaf0db5d75561ce9ef5688", "X": "d_1cd970d8351b42be4a308d628a6dd9d3",
    "Y": "d_31af23fdb79119ed185c256f03cb5773", "Z": "d_4e3db8955fdcda6f9944097bef3d2724", "Others": "d_300ddc8da4e8f7bdc1bfc62d0d99e2e7",
}
IDS = {"slim": "d_3f960c10fed6145404ca7b821f263b87", "other": "d_b1d2b840ab9e993570c037b706b39bb8"}


def pulse_sectors():
    tree = ast.parse((PULSE / "build.py").read_text())
    return next(ast.literal_eval(n.value) for n in ast.walk(tree)
                if isinstance(n, ast.Assign) and getattr(n.targets[0], "id", "") == "SECTORS")


def pulse_figures(sectors):
    snap = json.loads((PULSE / "data" / "snapshot.json").read_text())
    ds = snap["datasets"]
    quarters = sorted({r["q"] for r in ds["vacancies_total"]["data"]})
    L = len(quarters) - 1
    q, qya = quarters[L], quarters[L - 4]
    last4 = quarters[-4:]

    def at(key, industry, quarter):
        for r in ds[key]["data"]:
            if r["q"] == quarter and r.get("industry") == industry:
                return r["v"]

    def total(key, quarter):
        for r in ds[key]["data"]:
            if r["q"] == quarter:
                return r["v"]

    def pmet(key, industry, qs):
        vals = [r["v"] for r in ds[key]["data"] if r.get("industry") == industry and r.get("occupation") == PMET and r["q"] in qs]
        known = [v for v in vals if v is not None]
        return sum(known) if known else None

    out = {}
    for key, label, mom, _ in sectors:
        out[key] = {"vac": at("vacancies", mom, q), "vac_ya": at("vacancies", mom, qya),
                    "rate": at("vacancy_rate", mom, q), "rate_ya": at("vacancy_rate", mom, qya),
                    "ret": at("retrenched", mom, q), "ret_ya": at("retrenched", mom, qya),
                    "pmet_ret": pmet("retrenched_occ", mom, last4), "pmet_vac": pmet("vacancies_occ", mom, [q])}
    top = ["manufacturing", "construction", "services", "others"]
    nat = {"vac": total("vacancies_total", q), "vac_ya": total("vacancies_total", qya),
           "rate": total("vacancy_rate_total", q), "rate_ya": total("vacancy_rate_total", qya),
           "ret": total("retrenched_total", q), "ret_ya": total("retrenched_total", qya),
           "pmet_ret": sum(pmet("retrenched_occ", i, last4) or 0 for i in top),
           "pmet_vac": sum(pmet("vacancies_occ", i, [q]) or 0 for i in top)}
    return q, last4[0], out, nat, snap["fetched_at"][:10]


def top_courses(latest):
    """Top 8 courses by attendance per sector, recomputed from the Landscape's raw files."""
    sys.path.insert(0, str(LAND))
    try:
        import clean, sectors as sec
    except ImportError as e:
        raise SystemExit(f"Cannot import the Landscape code: {e}")
    try:
        courses, _, _ = clean.load()
    except FileNotFoundError:
        raise SystemExit("Landscape raw course files are missing. Run ../skills-training-landscape/fetch.py (or copy "
                         "directory.xlsx and runs.xlsx to its data/raw/), then run this build again.")
    by = collections.defaultdict(list)
    for c in courses:
        s, _ = sec.classify(c["title"], c["learn"] + " " + c["about"])
        if c["attendance"] is not None:
            by[s].append(c)
    out = {}
    for k, cs in by.items():
        cs.sort(key=lambda c: (-c["attendance"], c["title"]))
        out[k] = [[c["title"], c["provider"], int(c["attendance"])] for c in cs[:8]]
    all_cs = sorted((c for cs in by.values() for c in cs), key=lambda c: (-c["attendance"], c["title"]))
    out["all"] = [[c["title"], c["provider"], int(c["attendance"])] for c in all_cs[:8]]
    return out


def main():
    sectors = pulse_sectors()
    q, p_from, fig, nat, fetched = pulse_figures(sectors)
    latest = json.loads((LAND / "data" / "latest.json").read_text())
    ssic = json.loads((DATA / "ssic2025.json").read_text())
    smap = json.loads((DATA / "ssic-map.json").read_text())
    manual = json.loads((DATA / "manual.json").read_text())
    pm = json.loads((PULSE / "data" / "manual.json").read_text())
    sctp = json.loads((PULSE / "data" / "sctp.json").read_text())
    tops = top_courses(latest)

    def sctp_for(key):  # admin & support includes security programmes, as in the Pulse
        return [[p["inst"], p["title"]] for p in sctp["programmes"]
                if p["sector"] == key or (key == "admin" and p["sector"] == "security")]

    def course_block(group, titles):
        g = latest["groups"][group]
        return {"n": g["n"], "providers": g["providers"], "ai": g["ai"], "fee_median": g["fee_median"],
                "top": [[t[0], t[1], t[2]] for t in g["top"][:5]], "titles": titles}

    secs = {}
    for key, label, mom, _ in sectors:
        secs[key] = {"label": label, "mom": mom, "pulse": fig[key],
                     "courses": course_block(key, tops.get(key, [])), "sctp": sctp_for(key)}
    baked = {
        "built": datetime.date.today().isoformat(),
        "asof": {"pulse_q": q, "pmet_from": p_from, "courses": latest["datasets"]["directory"]["updated"][:10],
                 "acra": manual["acra_updated"], "built": datetime.date.today().isoformat(), "pulse_fetched": fetched},
        "ids": IDS, "shards": SHARDS,
        "ssic": ssic["codes"],
        "divTitle": ssic["divisions"],
        "divSector": {d: (k if k != "none" else "") for d, k in smap["divisions"].items()},
        "holding": smap["holding"], "ambiguous": smap["ambiguous"],
        "sectors": secs, "national": nat,
        "allCourses": course_block("all", tops["all"]),
        "imda": {k: pm[k] for k in ("source", "url", "retrieved", "sme_ai_adoption")},
        "sctpCollected": sctp["collected"], "sctpInst": [i["code"] for i in sctp["institutions"]],
        "datasets": [{"id": IDS["slim"], "title": "Entities Registered with ACRA"},
                     {"id": IDS["other"], "title": "Entities registered with other issuers"},
                     {"id": SHARDS["A"], "title": "ACRA Information on Corporate Entities"},
                     {"id": latest["datasets"]["directory"]["id"], "title": latest["datasets"]["directory"]["title"]}],
    }
    # the Pulse dataset list is read from its snapshot so the footer names the real datasets
    snap = json.loads((PULSE / "data" / "snapshot.json").read_text())["datasets"]
    seen = {d["id"] for d in baked["datasets"]}
    for key in ("vacancies", "vacancy_rate", "retrenched", "vacancies_occ", "retrenched_occ"):
        if snap[key]["id"] not in seen:
            baked["datasets"].append({"id": snap[key]["id"], "title": snap[key]["title"]}); seen.add(snap[key]["id"])
    blob = json.dumps(baked, separators=(",", ":"), ensure_ascii=False)
    (DATA / "baked.json").write_text(blob)
    html = (HERE / "template.html").read_text().replace("/*__DATA__*/null", blob)
    (HERE / "index.html").write_text(html)
    print(f"built index.html ({len(html.encode()) // 1024} KB; baked.json {len(blob) // 1024} KB), Pulse {q}, courses {baked['asof']['courses']}")


if __name__ == "__main__":
    main()
