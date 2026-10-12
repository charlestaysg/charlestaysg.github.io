#!/usr/bin/env python3
"""Sanity checks for the JB haze data files. Usage: check.py DIR. Exit 1 on any failure."""
import json
import os
import re
import sys
from datetime import datetime, timedelta, timezone

MYT = timezone(timedelta(hours=8))
FORBIDDEN = re.compile(r"OP_|ENG_|PHONE|EMAIL|LOT_INFO|PLACE", re.I)
CAPS = {"latest.json": 10_000, "history.json": 40_000, "news.json": 30_000, "hotspots.json": 200_000}
FILES = list(CAPS)


def walk_keys(o):
    if isinstance(o, dict):
        for k, v in o.items():
            yield k
            yield from walk_keys(v)
    elif isinstance(o, list):
        for v in o:
            yield from walk_keys(v)


def main(d):
    errs, warns = [], []
    data = {}
    for name in FILES:
        p = os.path.join(d, name)
        try:
            raw = open(p, "rb").read()
            data[name] = json.loads(raw)
        except Exception as e:
            errs.append("%s: cannot read/parse (%s)" % (name, type(e).__name__))
            continue
        if len(raw) > CAPS[name]:
            errs.append("%s: %d bytes exceeds cap %d" % (name, len(raw), CAPS[name]))
        bad = [k for k in walk_keys(data[name]) if FORBIDDEN.search(str(k))]
        if bad:
            errs.append("%s: forbidden keys %s" % (name, sorted(set(bad))[:5]))
    latest = data.get("latest.json")
    if latest:
        st = latest.get("stations", [])
        if len(st) != 8:
            errs.append("latest: expected 8 stations, got %d" % len(st))
        for s in st:
            if s.get("api") is not None and not (0 <= s["api"] <= 500):
                errs.append("latest: %s API %s out of range" % (s["id"], s["api"]))
            if s.get("pm25") is not None and not (0 <= s["pm25"] <= 1000):
                errs.append("latest: %s PM2.5 %s out of range" % (s["id"], s["pm25"]))
        try:
            age = datetime.now(MYT) - datetime.strptime(latest["readingTime"][:19], "%Y-%m-%dT%H:%M:%S").replace(tzinfo=MYT)
            h = age.total_seconds() / 3600
            if h > 6:
                errs.append("latest: reading is %.1f h old" % h)
            elif h > 2:
                warns.append("latest: reading is %.1f h old" % h)
        except Exception:
            errs.append("latest: bad readingTime")
    hist = data.get("history.json")
    if hist:
        n = hist.get("hours")
        for sid, ser in hist.get("stations", {}).items():
            for k in ("api", "pm25"):
                if len(ser.get(k, [])) != n:
                    errs.append("history: %s.%s length %d != %s" % (sid, k, len(ser.get(k, [])), n))
            for v in ser.get("api", []):
                if v is not None and not (0 <= v <= 500):
                    errs.append("history: %s API %s out of range" % (sid, v))
    news = data.get("news.json")
    if news:
        for tab, items in news.get("tabs", {}).items():
            for it in items:
                if not str(it.get("u", "")).startswith("https://"):
                    errs.append("news: non-https link in %s" % tab)
    hs = data.get("hotspots.json")
    if hs and hs.get("mode") not in ("points", "wms"):
        errs.append("hotspots: bad mode")
    for w in warns:
        print("WARN", w)
    for e in errs:
        print("FAIL", e)
    print("check: %s" % ("FAILED" if errs else "ok"))
    return 1 if errs else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "."))
