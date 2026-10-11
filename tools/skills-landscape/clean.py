"""Read and tidy the MySkillsFuture course files. Imported by build.py and check.py.

Run on its own to print totals:  python3 clean.py
"""
import collections, json, pathlib, re, statistics
import openpyxl

HERE = pathlib.Path(__file__).parent
RAW = HERE / "data" / "raw"
PROVIDERS = json.loads((HERE / "data" / "providers.json").read_text())
JUNK = re.compile(r"_x000D_|\r")
TYPE_LABEL = {"ihl": "Polytechnic / ITE", "university": "University", "public": "Public agency", "private": "Private & other"}


def text(v):
    if v is None:
        return ""
    return re.sub(r"[ \t]+", " ", JUNK.sub("", str(v))).strip()


def num(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def rows(name):
    ws = openpyxl.load_workbook(RAW / f"{name}.xlsx", read_only=True).active
    it = ws.iter_rows(values_only=True)
    head = next(it)
    return [dict(zip(head, r)) for r in it]


def provider_type(uen):
    for t in ("ihl", "university"):
        if uen in PROVIDERS[t]:
            return t
    return "public" if any(uen.startswith(p) for p in PROVIDERS["public_prefixes"]) else "private"


def load():
    """Return (courses, runs, stats). One course per reference number; providers grouped by UEN."""
    raw = rows("directory")
    # A course offered in more than one mode appears once per mode, identical apart from
    # training_commitment, so repeated reference numbers are merged, not dropped.
    modes = collections.defaultdict(set)
    for r in raw:
        modes[text(r["coursereferencenumber"])].update(
            m.strip() for m in text(r["training_commitment"]).split(" and ") if m.strip())
    courses, seen, dupes = [], set(), 0
    for r in raw:
        ref = text(r["coursereferencenumber"])
        if ref in seen:
            dupes += 1
            continue
        seen.add(ref)
        m = modes[ref]
        uen = text(r["trainingprovideruen"]).upper()
        courses.append({
            "ref": ref, "title": text(r["coursetitle"]), "uen": uen, "alias": text(r["trainingprovideralias"]),
            "type": provider_type(uen),
            "fee": num(r["full_course_fee"]), "hours": num(r["number_of_hours"]),
            "commitment": ("Full & part time" if len(m) > 1 else m.pop() if m else "Not stated"),
            "attendance": num(r["attendancecount"]),
            "about": text(r["about_this_course"]), "learn": text(r["what_you_learn"]),
            "year": int(ref[4:8]) if re.match(r"[A-Z]+-\d{4}", ref) else None,
        })
    # one display name per UEN: the most frequent alias, title-cased if shouted
    names = collections.defaultdict(collections.Counter)
    for c in courses:
        names[c["uen"]][c["alias"]] += 1
    display = {}
    for uen, cnt in names.items():
        fixed = PROVIDERS["ihl"].get(uen) or PROVIDERS["university"].get(uen) or PROVIDERS["names"].get(uen)
        best = fixed or cnt.most_common(1)[0][0]
        display[uen] = best.title().replace("Pte. Ltd.", "Pte Ltd") if best.isupper() else best
    for c in courses:
        c["provider"] = display[c["uen"]]

    runs = []
    for r in rows("runs"):
        start = r["courserunstartdate"]
        runs.append({"ref": text(r["coursereferencenumber"]), "uen": text(r["trainingprovideruen"]).upper(),
                     "start": str(start)[:10] if start else None, "mode": text(r["mode_of_training"]) or None})

    stats = {"directory_rows": len(raw), "courses": len(courses), "duplicate_rows": dupes,
             "providers": len(display), "aliases_merged": sum(1 for v in names.values() if len(v) > 1),
             "run_rows": len(runs), "runs_undated": sum(1 for r in runs if not r["start"])}
    return courses, runs, stats


if __name__ == "__main__":
    courses, runs, s = load()
    print(f"directory rows {s['directory_rows']:,} -> {s['courses']:,} unique courses ({s['duplicate_rows']} repeat rows merged)")
    print(f"providers (by UEN) {s['providers']:,}; {s['aliases_merged']} had more than one spelling")
    print(f"course runs {s['run_rows']:,}; undated {s['runs_undated']:,} ({s['runs_undated'] / s['run_rows']:.0%})")
    by_type = collections.Counter(c["type"] for c in courses)
    print("by provider type:", ", ".join(f"{TYPE_LABEL[t]} {n:,}" for t, n in by_type.most_common()))
    fees = [c["fee"] for c in courses if c["fee"] is not None]
    fees_x = [c["fee"] for c in courses if c["fee"] is not None and c["type"] != "university"]
    print(f"median full fee: all ${statistics.median(fees):,.0f}; excluding universities ${statistics.median(fees_x):,.0f}")
    print("commitment:", dict(collections.Counter(c["commitment"] for c in courses).most_common()))
    top = collections.Counter(c["provider"] for c in courses).most_common(10)
    print("top 10 providers:", "; ".join(f"{p} {n:,}" for p, n in top))
    print("text junk left:", sum(1 for c in courses if "_x000D_" in c["about"] + c["learn"]))
