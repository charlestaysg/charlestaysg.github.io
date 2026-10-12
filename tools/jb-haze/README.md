# JB haze data tools

Feeds `projects/jb-haze/` (Johor Bahru haze page). Standard library only; Python 3.9 or later.

| File | Role |
|---|---|
| `fetch.py` | Hourly backup refresh (GitHub Action): APIMS readings, 72-hour history, haze headlines, FIRMS hotspots |
| `check.py` | Sanity checks (ranges, size caps, forbidden-key scan, freshness) |
| `news_rules.py` | Headline classification into the three tabs, Singapore-only drop, de-duplication |
| `regions.json` | Coarse boxes for hotspot counts by region (approximate) |
| `test_jb_haze.py` | Unit tests: `python3 tools/jb-haze/test_jb_haze.py` |

## How the data gets to the page

**Live path (default).** When a visitor opens the page, `app.js` fetches `latest`, `history` and `news` from a small
Cloudflare Worker (`jb-haze-api`, source in `~/projects/cf-jb-haze`, deployed to workers.dev). APIMS and the Malaysian
feeds send no CORS headers, so the browser cannot call them directly. The Worker is a JavaScript port of `fetch.py`
(`parse_latest`, `carry_forward`, `merge_history`) and `news_rules.py`, with the same field allowlist and the same
forbidden-key check (it answers 502 rather than return a key that looks like `OP_`, `ENG_`, phone or e-mail). Answers are cached
(about 5 minutes for readings and history, 15 minutes for news), so the sources see a few requests an hour whatever the
traffic; a stale cached copy is served if a source fails. A station with no reading yet keeps its last good one for up to 3 hours.
History PM2.5 cannot be rebuilt live, so the Worker merges in the data-branch `history.json` and its own last copy.
Hotspots are not served by the Worker. Page order: Worker (6 s timeout) -> data branch -> seed files; the status line says
"backup copy" only when it used a fallback. Test the fallback with `?noworker=1`. Localhost uses the Worker too, unless `?local=1`.

**Backup path.**

`.github/workflows/jb-haze-refresh.yml` runs at :17 every hour (GitHub sometimes skips scheduled runs), builds the four JSON files and
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
