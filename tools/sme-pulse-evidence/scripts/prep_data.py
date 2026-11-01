"""Turn the SME Workforce Pulse data files into tidy CSVs for Evidence.

Reads  ../sme-pulse/data/   snapshot.json, sctp.json, manual.json, last-checked.json
       (fetch.py makes snapshot.json, sctp_build.py makes sctp.json, manual.json and last-checked.json
       are kept by hand; this script never fetches)
Writes sources/pulse/*.csv  (Evidence reads the folder through connection.yaml, type: csv)

Run:  python3 scripts/prep_data.py [path/to/sme-pulse/data]

The sector list, the PMET occupation name and the top-level groups are read from
../sme-pulse/build.py (SECTORS, PMET, TOP), so the two builds can not drift apart.
Python 3 standard library only. The CSVs are written to a temporary folder first and
moved into place only when everything worked, so a failure leaves the old CSVs alone.
"""
import ast, csv, json, pathlib, shutil, sys, tempfile

HERE = pathlib.Path(__file__).resolve().parent
PROJECT = HERE.parent
DATA = pathlib.Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else (PROJECT.parent / "sme-pulse" / "data")
BUILD_PY = DATA.parent / "build.py"
OUT = PROJECT / "sources" / "pulse"


def read_constants(path):
    """Pull SECTORS, PMET and TOP out of build.py without running it (it writes index.html)."""
    want, found = {"SECTORS", "PMET", "TOP"}, {}
    for node in ast.parse(path.read_text()).body:
        if isinstance(node, ast.Assign) and len(node.targets) == 1 and getattr(node.targets[0], "id", None) in want:
            found[node.targets[0].id] = ast.literal_eval(node.value)
    missing = want - set(found)
    if missing:
        raise SystemExit(f"{path}: could not find {sorted(missing)}")
    return found["SECTORS"], found["PMET"], found["TOP"]


MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def nice_date(iso):
    y, m, d = iso[:10].split("-")
    return f"{int(d)} {MONTHS[int(m) - 1]} {y}"


def qlabel(q):
    return q.replace("-", " ")


def qstart(q):
    y, n = q.split("-Q")
    return f"{y}-{(int(n) - 1) * 3 + 1:02d}-01"


def num(v):
    """Whole numbers without a trailing .0; None as an empty cell."""
    if v is None:
        return ""
    return int(v) if float(v).is_integer() else v


def write(folder, name, header, rows):
    with open(folder / name, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(header)
        w.writerows(rows)
    print(f"  {name}: {len(rows)} rows")


def main():
    SECTORS, PMET, TOP = read_constants(BUILD_PY)
    snap = json.loads((DATA / "snapshot.json").read_text())
    manual = json.loads((DATA / "manual.json").read_text())
    sctp = json.loads((DATA / "sctp.json").read_text())
    lc = DATA / "last-checked.json"
    checked = json.loads(lc.read_text())["checked"] if lc.exists() else snap["fetched_at"][:10]
    ds = snap["datasets"]

    quarters = sorted({r["q"] for r in ds["vacancies_total"]["data"]})
    idx = {q: i for i, q in enumerate(quarters)}
    latest = quarters[-1]

    def series(key, industry=None):
        out = [None] * len(quarters)
        for r in ds[key]["data"]:
            if industry is None or r.get("industry") == industry:
                out[idx[r["q"]]] = r["v"]
        return out

    # ---- series.csv: one row per scope, measure and quarter (blank = not published).
    # published_since_start says whether the series has begun by that quarter (Started / Not started).
    scopes = [("all", "All industries", None)] + [(k, lab, name) for k, lab, name, _ in SECTORS]
    rows = []
    for key, label, mom in scopes:
        if mom is None:
            sets = {"vac": series("vacancies_total"), "rate": series("vacancy_rate_total"),
                    "ret": series("retrenched_total"), "vu": series("vu_ratio")}
        else:
            sets = {"vac": series("vacancies", mom), "rate": series("vacancy_rate", mom),
                    "ret": series("retrenched", mom)}
        for measure, vals in sets.items():
            first = next((i for i, v in enumerate(vals) if v is not None), len(vals))
            for i, q in enumerate(quarters):
                rows.append([key, label, measure, q, qlabel(q), i, qstart(q), num(vals[i]), "Started" if i >= first else "Not started"])

    # ---- PMET view: retrenchments over the last 4 quarters vs open vacancies in the latest quarter
    last4 = quarters[-4:]

    def occ(key, industry, qs):
        vals = [r["v"] for r in ds[key]["data"]
                if r.get("industry") == industry and r.get("occupation") == PMET and r["q"] in qs]
        known = [v for v in vals if v is not None]
        return (sum(known) if known else None), len(qs) - len(known)

    def pmet_row(industry):
        ret, missing = occ("retrenched_occ", industry, last4)
        vac, _ = occ("vacancies_occ", industry, [latest])
        return ret, missing, vac

    # ---- SCTP: admin & support includes security programmes, as MOM's industry grouping does
    progs = sctp["programmes"]
    inst = {i["code"]: i for i in sctp["institutions"]}

    def sctp_count(key):
        return sum(1 for p in progs if p["sector"] == key or (key == "admin" and p["sector"] == "security"))

    sector_rows = []
    for n, (k, lab, name, _chip) in enumerate(SECTORS):
        ret, missing, vac = pmet_row(name)
        sector_rows.append([k, lab, name, n + 1, num(ret), missing, num(vac), sctp_count(k)])

    pm = {"ret": sum(pmet_row(i)[0] or 0 for i in TOP), "vac": sum(pmet_row(i)[2] or 0 for i in TOP),
          "ret_all": sum(r["v"] or 0 for r in ds["retrenched_total"]["data"] if r["q"] in last4)}
    pmet_rows = [[last4[0], last4[-1], qlabel(last4[0]), qlabel(last4[-1]), num(pm["ret"]), num(pm["vac"]), num(pm["ret_all"])]]

    sctp_rows = [[n + 1, p["inst"], inst[p["inst"]]["name"], inst[p["inst"]]["url"], p["title"], p["sector"], (p.get("refs") or [""])[0]]
                 for n, p in enumerate(progs)]
    inst_rows = [[i["code"], i["name"], i["url"], sum(1 for p in progs if p["inst"] == i["code"])] for i in sctp["institutions"]]
    cross = sum(1 for p in progs if p["sector"] == "cross")

    dataset_rows = [[k, d["id"], d["title"], f"https://data.gov.sg/datasets/{d['id']}/view"] for k, d in ds.items()]

    # ---- meta.csv: one row. Flags are words (Shown / Hidden), not Yes / No, because DuckDB reads Yes/No as boolean.
    adv = manual.get("mom_advance")
    show_adv = bool(adv and adv["quarter"] > latest)  # quarters sort as text
    fresh = f"Data as of {qlabel(latest)} · checked {nice_date(checked)}"
    if show_adv:
        fresh += f" · full {qlabel(adv['quarter']).split(' ')[1]} figures due {adv['full_report_due']}"
    imda = manual["sme_ai_adoption"]
    meta = {
        "latest_quarter": latest, "latest_label": qlabel(latest), "latest_idx": len(quarters) - 1,
        "checked": checked, "checked_label": nice_date(checked),
        "fetched": snap["fetched_at"][:10], "fetched_label": nice_date(snap["fetched_at"]),
        "fresh_line": fresh,
        "advance_shown": "Shown" if show_adv else "Hidden",
        "advance_quarter": adv["quarter"] if adv else "", "advance_label": qlabel(adv["quarter"]) if adv else "",
        "advance_retrenched": num(adv["retrenched"]) if adv else "",
        "advance_status": ("preliminary" if adv.get("preliminary") else "final") if adv else "",
        "advance_url": adv["url"] if adv else "", "advance_source": adv["source"] if adv else "",
        "advance_full_report_due": adv["full_report_due"] if adv else "",
        "sctp_collected": sctp["collected"], "sctp_collected_label": nice_date(sctp["collected"]),
        "sctp_dataset_url": f"https://data.gov.sg/datasets/{sctp['source']['id']}/view" if sctp.get("source") else "",
        "sctp_total": len(progs), "sctp_institutions": len(inst_rows), "sctp_cross": cross,
        "imda_source": manual["source"], "imda_url": manual["url"], "imda_retrieved": manual["retrieved"],
        "imda_retrieved_label": nice_date(manual["retrieved"]),
        "imda_year_a": imda[0]["year"], "imda_pct_a": imda[0]["pct"],
        "imda_year_b": imda[1]["year"], "imda_pct_b": imda[1]["pct"],
        "imda_need_upskilling_pct": manual["workers_need_ai_upskilling_pct"],
        "imda_trained_pct": manual["workers_trained_past_year_pct"],
    }

    tmp = pathlib.Path(tempfile.mkdtemp(prefix=".prep-", dir=PROJECT / "sources"))
    try:
        print(f"Reading {DATA}")
        write(tmp, "series.csv", ["scope", "scope_label", "measure", "quarter", "quarter_label", "q_idx", "period_start", "value", "published_since_start"], rows)
        write(tmp, "sectors.csv", ["sector", "label", "mom_industry", "sort", "pmet_retrenched", "pmet_missing_quarters", "pmet_vacancies", "sctp_programmes"], sector_rows)
        write(tmp, "pmet_total.csv", ["from_quarter", "to_quarter", "from_label", "to_label", "retrenched", "vacancies", "all_retrenched"], pmet_rows)
        write(tmp, "sctp_programmes.csv", ["seq", "inst", "inst_name", "inst_url", "title", "sector", "ref"], sctp_rows)
        write(tmp, "sctp_institutions.csv", ["code", "name", "url", "programmes"], inst_rows)
        write(tmp, "datasets.csv", ["key", "id", "title", "url"], dataset_rows)
        write(tmp, "meta.csv", list(meta), [list(meta.values())])
        (tmp / "connection.yaml").write_text("name: pulse\ntype: csv\noptions: {}\n")
        OUT.mkdir(parents=True, exist_ok=True)
        for f in tmp.iterdir():
            shutil.move(str(f), str(OUT / f.name))
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    print(f"Wrote {OUT}  (latest {latest}, fetched {meta['fetched']}, checked {checked})")


if __name__ == "__main__":
    main()
