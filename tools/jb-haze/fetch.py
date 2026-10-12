#!/usr/bin/env python3
"""Hourly data refresh for the JB haze page. Standard library only.

    python3 tools/jb-haze/fetch.py --out DIR

Writes latest.json, history.json, news.json and hotspots.json into DIR. Each stage is independent: if one
fails, the file already in DIR (the previous run's copy) is kept and the other stages still run.

Privacy: the APIMS query asks for an explicit allowlist of fields. It must never use outFields=*, which
returns station operators' names, phone numbers and e-mail addresses. Raw responses are never saved.
FIRMS_MAP_KEY is read from the environment only and is never printed.
"""
import argparse
import csv
import io
import json
import os
import sys
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import news_rules  # noqa: E402

MYT = timezone(timedelta(hours=8))
UA = "charlestaysg.github.io jb-haze (hourly)"
TIMEOUT = 20
RETRIES = 2
HISTORY_HOURS = 72

APIMS_QUERY = ("https://eqms.doe.gov.my/api3/publicmapproxy/PUBLIC_DISPLAY/CAQM_MCAQM_Current_Reading/"
               "MapServer/0/query")
APIMS_TREND = "https://eqms.doe.gov.my/api3/publicportalapims/datatrendchart"
JOHOR_STATE_ID = 1
# Allowlist. Never replace with "*".
OUT_FIELDS = ("STATION_ID,DATETIME,API,CLASS,PARAM_SELECTED,PM25_CONC,PM25_24H_AVG,PM10_CONC,PM10_24H_AVG,"
              "O3_CONC,NO2_CONC,SO2_CONC,CO_CONC,WIND_DIRECTION,WIND_SPEED,TEMPERATURE,RELATIVE_HUMIDITY,"
              "LATITUDE,LONGITUDE,STATION_LOCATION,STATION_CATEGORY,STATION_STATUS")

FIRMS_SOURCES = ["VIIRS_SNPP_NRT", "VIIRS_NOAA20_NRT", "VIIRS_NOAA21_NRT"]
FIRMS_BBOX = [95, -6, 120, 8]
FIRMS_URL = "https://firms.modaps.eosdis.nasa.gov/api/area/csv/%s/%s/%s/1"
SAT_CODE = {"N": "N", "N20": "1", "N21": "2"}
SAT_NAME = {"N": "Suomi NPP", "1": "NOAA-20", "2": "NOAA-21"}
MAX_POINTS = 3000

NEWS_FEEDS = [
    # (source, url, lang, indonesian)
    ("Malay Mail", "https://www.malaymail.com/feed/rss/malaysia", "en", False),
    ("The Straits Times", None, "en", False),  # placeholder removed below
    ("New Straits Times", "https://www.nst.com.my/feed", "en", False),
    ("Free Malaysia Today", "https://www.freemalaysiatoday.com/category/nation/feed/", "en", False),
    ("Berita Harian", "https://www.bharian.com.my/feed", "ms", False),
    ("Harian Metro", "https://www.hmetro.com.my/feed", "ms", False),
    ("Utusan Malaysia", "https://www.utusan.com.my/feed/", "ms", False),
    ("Kosmo!", "https://www.kosmo.com.my/feed/", "ms", False),
    ("FMT Bahasa", "https://www.freemalaysiatoday.com/category/bahasa/feed/", "ms", False),
    ("ANTARA", "https://en.antaranews.com/rss/news.xml", "en", True),
    ("ANTARA", "https://www.antaranews.com/rss/terkini.xml", "id", True),
    ("Tempo", "https://rss.tempo.co/", "en", True),
    ("detik", "https://news.detik.com/rss", "id", True),
]
NEWS_FEEDS = [f for f in NEWS_FEEDS if f[1]]


# ------------------------------------------------------------------ helpers
def http_get(url, accept=None):
    last = None
    for attempt in range(RETRIES):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, **({"Accept": accept} if accept else {})})
            with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
                return r.read()
        except Exception as e:  # never include the URL: FIRMS URLs carry a key
            last = e
    raise RuntimeError("request failed: %s" % type(last).__name__)


def epoch_ms_to_myt(ms):
    """APIMS MapServer DATETIME is MYT wall-clock stored as if it were UTC.
    Read the clock fields as UTC, then label them +08:00 (do not convert zones)."""
    naive = datetime.fromtimestamp(ms / 1000.0, tz=timezone.utc).replace(tzinfo=None)
    return naive.replace(tzinfo=MYT)


def trend_str_to_myt(s):
    """datatrendchart DATETIME ('2026-10-11T18:00:00') is already MYT wall-clock."""
    return datetime.strptime(s[:19], "%Y-%m-%dT%H:%M:%S").replace(tzinfo=MYT)


def iso_myt(dt):
    return dt.astimezone(MYT).strftime("%Y-%m-%dT%H:%M:%S+08:00")


def iso_utc_now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def num(v, lo=None, hi=None, digits=1):
    if v is None:
        return None
    try:
        x = float(v)
    except (TypeError, ValueError):
        return None
    if x != x or (lo is not None and x < lo) or (hi is not None and x > hi):
        return None
    return round(x, digits)


def load_json(path, default=None):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default


def save_json(path, obj):
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))
        f.write("\n")
    os.replace(tmp, path)


# ------------------------------------------------------------------ stage: latest
def parse_latest(payload, stations_meta):
    """payload: parsed APIMS JSON. Returns the latest.json dict."""
    meta = {s["id"]: s for s in stations_meta}
    out = []
    for feat in payload.get("features", []):
        a = feat.get("attributes", {})
        sid = a.get("STATION_ID")
        if sid not in meta:
            continue
        m = meta[sid]
        ms = a.get("DATETIME")
        ts = iso_myt(epoch_ms_to_myt(ms)) if ms else None
        out.append({
            "id": sid, "name": m["name"], "lat": m["lat"], "lng": m["lng"], "category": m.get("category", ""),
            "jb": bool(m.get("jb")), "ts": ts,
            "api": num(a.get("API"), 0, 600, 0), "cls": a.get("CLASS") if isinstance(a.get("CLASS"), str) else None,
            "param": a.get("PARAM_SELECTED") if isinstance(a.get("PARAM_SELECTED"), str) else None,
            "pm25": num(a.get("PM25_CONC"), 0, 1500), "pm25_24h": num(a.get("PM25_24H_AVG"), 0, 1500),
            "pm10": num(a.get("PM10_CONC"), 0, 2000), "pm10_24h": num(a.get("PM10_24H_AVG"), 0, 2000),
            "o3": num(a.get("O3_CONC"), 0, 2000), "no2": num(a.get("NO2_CONC"), 0, 2000),
            "so2": num(a.get("SO2_CONC"), 0, 2000), "co": num(a.get("CO_CONC"), 0, 200, 2),
            "windDir": num(a.get("WIND_DIRECTION"), 0, 360, 0), "windSpeed": num(a.get("WIND_SPEED"), 0, 100),
            "temp": num(a.get("TEMPERATURE"), -5, 60),
            # APIMS reports 0 for a missing humidity sensor; treat as no reading.
            "rh": num(a.get("RELATIVE_HUMIDITY"), 1, 100, 0),
            "status": a.get("STATION_STATUS"),
        })
    if not out:
        raise RuntimeError("no stations parsed")
    out.sort(key=lambda s: s["id"])
    times = [s["ts"] for s in out if s["ts"]]
    return {"generated": iso_utc_now(), "source": "DOE Malaysia APIMS",
            "readingTime": max(times) if times else None, "stations": out}


def stage_latest(out_dir, stations_meta):
    params = urllib.parse.urlencode({
        "f": "json", "where": "STATE_NAME='Johor'", "outFields": OUT_FIELDS, "returnGeometry": "false"})
    payload = json.loads(http_get(APIMS_QUERY + "?" + params).decode("utf-8"))
    latest = parse_latest(payload, stations_meta)
    del payload  # raw response is never written anywhere
    save_json(os.path.join(out_dir, "latest.json"), latest)
    return latest


# ------------------------------------------------------------------ stage: history
def hour_floor(dt):
    return dt.replace(minute=0, second=0, microsecond=0)


def fetch_trend(at):
    qs = "stateid=%d&datetime=%s&" % (JOHOR_STATE_ID, at.strftime("%Y-%m-%dT%H:00:00"))
    data = json.loads(http_get(APIMS_TREND + "?" + qs).decode("utf-8"))
    rows = []
    for r in data.get("highcharts_bar", []):
        try:
            rows.append((r["STATION_ID"], trend_str_to_myt(r["DATETIME"]), num(r.get("API"), 0, 600, 0)))
        except Exception:
            continue
    return rows


def merge_history(prev, latest, trend_rows, hours=HISTORY_HOURS):
    """Rebuild a fixed hour-aligned window ending at the latest reading hour. null = missing."""
    ts = [s["ts"] for s in latest["stations"] if s["ts"]]
    end = hour_floor(datetime.strptime(max(ts)[:19], "%Y-%m-%dT%H:%M:%S").replace(tzinfo=MYT))
    start = end - timedelta(hours=hours - 1)
    stations = {s["id"]: {"api": [None] * hours, "pm25": [None] * hours} for s in latest["stations"]}

    def idx(dt):
        i = int(round((hour_floor(dt) - start).total_seconds() / 3600.0))
        return i if 0 <= i < hours else None

    if prev and prev.get("start") and prev.get("stations"):
        pstart = datetime.strptime(prev["start"][:19], "%Y-%m-%dT%H:%M:%S").replace(tzinfo=MYT)
        for sid, series in prev["stations"].items():
            if sid not in stations:
                continue
            for key in ("api", "pm25"):
                for j, v in enumerate(series.get(key, [])):
                    i = idx(pstart + timedelta(hours=j))
                    if i is not None and v is not None:
                        stations[sid][key][i] = v
    for sid, dt, api in trend_rows:
        i = idx(dt)
        if sid in stations and i is not None and api is not None:
            stations[sid]["api"][i] = api
    for s in latest["stations"]:
        if not s["ts"]:
            continue
        i = idx(datetime.strptime(s["ts"][:19], "%Y-%m-%dT%H:%M:%S").replace(tzinfo=MYT))
        if i is None:
            continue
        if s["api"] is not None:
            stations[s["id"]]["api"][i] = s["api"]
        if s["pm25"] is not None:
            stations[s["id"]]["pm25"][i] = s["pm25"]
    return {"generated": iso_utc_now(), "tz": "+08:00", "start": iso_myt(start), "hours": hours,
            "stations": stations}


def stage_history(out_dir, latest):
    path = os.path.join(out_dir, "history.json")
    prev = load_json(path)
    end = hour_floor(datetime.strptime(latest["readingTime"][:19], "%Y-%m-%dT%H:%M:%S").replace(tzinfo=MYT))
    rows = fetch_trend(end)
    if not prev:  # first run: backfill a longer window
        for back in (24, 48):
            try:
                rows += fetch_trend(end - timedelta(hours=back))
            except Exception as e:
                print("history backfill -%dh failed: %s" % (back, e))
    hist = merge_history(prev, latest, rows)
    save_json(path, hist)
    return hist


# ------------------------------------------------------------------ stage: news
def parse_rss(xml_bytes, source, lang, indonesian):
    root = ET.fromstring(xml_bytes)
    items = []
    for el in root.iter("item"):
        def tx(tag):
            n = el.find(tag)
            return (n.text or "").strip() if n is not None and n.text else ""
        try:
            when = parsedate_to_datetime(tx("pubDate"))
            if when.tzinfo is None:
                when = when.replace(tzinfo=timezone.utc)
        except Exception:
            continue
        desc = tx("description")
        import re
        desc = re.sub(r"<[^>]*>", " ", desc)
        items.append({"title": re.sub(r"<[^>]*>", "", tx("title")), "description": " ".join(desc.split())[:500],
                      "link": tx("link"), "source": source, "lang": lang, "source_indonesian": indonesian,
                      "published": when.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")})
    return [i for i in items if i["title"] and i["link"]]


def stage_news(out_dir):
    items, feeds = [], []
    for source, url, lang, indo in NEWS_FEEDS:
        try:
            got = parse_rss(http_get(url, "application/rss+xml, application/xml, text/xml"), source, lang, indo)
            items += got
            feeds.append({"s": source, "ok": True})
        except Exception as e:
            print("news feed %s failed: %s" % (source, type(e).__name__))
            feeds.append({"s": source, "ok": False})
    if not any(f["ok"] for f in feeds):
        raise RuntimeError("all news feeds failed")
    tabs = news_rules.organise(items)
    save_json(os.path.join(out_dir, "news.json"), {"generated": iso_utc_now(), "tabs": tabs, "feeds": feeds})


# ------------------------------------------------------------------ stage: hotspots
def load_regions():
    with open(os.path.join(HERE, "regions.json"), encoding="utf-8") as f:
        return json.load(f)


def region_of(lat, lon, regions):
    for key in regions["order"]:
        for s, w, n, e in regions["regions"][key]["boxes"]:
            if s <= lat <= n and w <= lon <= e:
                return key
    return "other"


def parse_firms_csv(text):
    """Returns [(lat, lon, conf 'h'|'n', frp, datetime_myt, sat_code)]. Low confidence is dropped."""
    out = []
    for row in csv.DictReader(io.StringIO(text)):
        try:
            conf = (row.get("confidence") or "").strip().lower()[:1]
            if conf not in ("h", "n"):
                continue
            t = (row.get("acq_time") or "").zfill(4)
            when = datetime.strptime(row["acq_date"] + t, "%Y-%m-%d%H%M").replace(tzinfo=timezone.utc)
            out.append((round(float(row["latitude"]), 3), round(float(row["longitude"]), 3), conf,
                        round(float(row.get("frp") or 0), 1), when.astimezone(MYT),
                        SAT_CODE.get((row.get("satellite") or "").strip(), "N")))
        except Exception:
            continue
    return out


def build_hotspots(rows, regions, now=None):
    now = now or datetime.now(MYT)
    rows = [r for r in rows if now - r[4] <= timedelta(hours=24, minutes=30)]
    seen, uniq = set(), []
    for r in rows:
        k = (r[0], r[1], r[4].strftime("%Y%m%d%H%M"))
        if k not in seen:
            seen.add(k)
            uniq.append(r)
    counts = {k: {"h": 0, "n": 0} for k in regions["order"]}
    passes = {}
    for lat, lon, conf, frp, when, sat in uniq:
        counts[region_of(lat, lon, regions)][conf] += 1
        if sat not in passes or when > passes[sat][0]:
            passes[sat] = (when,)
    counts = {k: v for k, v in counts.items() if v["h"] or v["n"]}
    uniq.sort(key=lambda r: r[3], reverse=True)
    truncated = len(uniq) > MAX_POINTS
    pts = [[lat, lon, conf, frp, when.strftime("%H%M"), sat] for lat, lon, conf, frp, when, sat in uniq[:MAX_POINTS]]
    return {"generated": iso_utc_now(), "mode": "points", "window": "24h", "bbox": FIRMS_BBOX,
            "sources": FIRMS_SOURCES, "timeNote": "point times are MYT (HHMM)",
            "passes": {SAT_NAME[k]: v[0].strftime("%H%M") for k, v in passes.items()},
            "counts": counts, "total": len(uniq), "truncated": truncated, "points": pts}


def stage_hotspots(out_dir):
    path = os.path.join(out_dir, "hotspots.json")
    key = os.environ.get("FIRMS_MAP_KEY", "").strip()
    if not key:
        save_json(path, {"generated": iso_utc_now(), "mode": "wms", "window": "24h", "bbox": FIRMS_BBOX,
                         "sources": [], "passes": {}, "counts": {}, "total": 0, "truncated": False, "points": []})
        return
    rows, ok = [], 0
    bbox = ",".join(str(x) for x in FIRMS_BBOX)
    for src in FIRMS_SOURCES:
        try:
            text = http_get(FIRMS_URL % (key, src, bbox)).decode("utf-8", "replace")
            if text.lstrip().startswith("latitude"):
                rows += parse_firms_csv(text)
                ok += 1
            else:
                print("hotspots %s: unexpected response" % src)
        except Exception as e:
            print("hotspots %s failed: %s" % (src, e))
    if not ok:
        raise RuntimeError("no FIRMS source answered")
    save_json(path, build_hotspots(rows, load_regions()))


# ------------------------------------------------------------------ main
def find_stations_meta(out_dir):
    for d in (out_dir, os.path.join(HERE, "..", "..", "projects", "jb-haze", "data")):
        data = load_json(os.path.join(d, "stations.json"))
        if data:
            return data
    raise RuntimeError("stations.json not found")


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--out", required=True, help="output directory (previous files here are kept on failure)")
    args = ap.parse_args(argv)
    os.makedirs(args.out, exist_ok=True)
    failures = []
    stations_meta = find_stations_meta(args.out)
    latest = None
    try:
        latest = stage_latest(args.out, stations_meta)
        print("latest: %d stations, reading %s" % (len(latest["stations"]), latest["readingTime"]))
    except Exception as e:
        failures.append("latest")
        print("latest FAILED: %s" % e)
        latest = load_json(os.path.join(args.out, "latest.json"))
    if latest and latest.get("readingTime"):
        try:
            stage_history(args.out, latest)
            print("history: ok")
        except Exception as e:
            failures.append("history")
            print("history FAILED: %s" % e)
    for name, fn in (("news", lambda: stage_news(args.out)), ("hotspots", lambda: stage_hotspots(args.out))):
        try:
            fn()
            print("%s: ok" % name)
        except Exception as e:
            failures.append(name)
            print("%s FAILED: %s" % (name, e))
    if failures:
        print("stages failed (previous files kept): %s" % ", ".join(failures))
    return 0 if len(failures) < 4 else 1


if __name__ == "__main__":
    sys.exit(main())
