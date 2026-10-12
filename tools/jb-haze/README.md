# JB haze data tools

Feeds `projects/jb-haze/` (Johor Bahru haze page). Standard library only; Python 3.9 or later.

| File | Role |
|---|---|
| `fetch.py` | Hourly refresh: APIMS readings, 72-hour history, haze headlines, FIRMS hotspots |
| `check.py` | Sanity checks (ranges, size caps, forbidden-key scan, freshness) |
| `news_rules.py` | Headline classification into the three tabs, Singapore-only drop, de-duplication |
| `regions.json` | Coarse boxes for hotspot counts by region (approximate) |
| `test_jb_haze.py` | Unit tests: `python3 tools/jb-haze/test_jb_haze.py` |

## How the data gets to the page

`.github/workflows/jb-haze-refresh.yml` runs at :25 every hour, builds the four JSON files and
force-pushes them as a single commit to the orphan branch `jb-haze-data`. The page reads
`https://raw.githubusercontent.com/charlestaysg/charlestaysg.github.io/jb-haze-data/<file>`.
On localhost it reads `projects/jb-haze/data/` instead. Copies of the four files also sit in
`projects/jb-haze/data/` on main as a seed and fallback; refresh them by hand with:

    python3 tools/jb-haze/fetch.py --out projects/jb-haze/data

## Privacy rule for APIMS

The query asks for an explicit allowlist of fields (`OUT_FIELDS` in `fetch.py`). Never use `outFields=*`:
it returns station operators' names, phone numbers and e-mail addresses. Raw responses are never saved, and
`check.py` fails on any key that looks like `OP_`, `ENG_`, phone, e-mail, `LOT_INFO` or `PLACE`.

## Hotspots

Set the repository secret `FIRMS_MAP_KEY` (free key from NASA FIRMS). Without it `hotspots.json` has
`"mode": "wms"` and the page draws NASA GIBS' keyless VIIRS fire overlay instead of points (the FIRMS WMS itself
now requires a key). The same fallback applies when the file is missing or older than 36 hours. The key is read from the
environment only.

## Times

APIMS epoch timestamps are Malaysia wall-clock time stored as if UTC: read the clock fields, label them +08:00.
The history trend endpoint already returns MYT strings.
