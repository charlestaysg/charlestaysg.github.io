# Pre-visit fact sheet

Type a Singapore company's UEN or name; the page fetches its public ACRA record from data.gov.sg in the browser, places it in one of the SME Workforce Pulse's 14 sectors, and shows that sector's hiring figures (from `../sme-pulse/`), course totals (from `../skills-landscape/`), a course list read live from the Course Finder's per-sector files (`projects/course-finder/data/<sector>.json`; courses whose titles share a word with the company's SSIC activity come first) and rule-based questions to ask. Prints to one A4 page. Unofficial; ACRA is the official source.

## Files
- `template.html` — the page; `build.py` bakes the sector, course-total and SSIC data into it → `index.html`, copied to `projects/uen-sheet/`. It also reads the ACRA "last updated" date from the data.gov.sg metadata API.
- `ssic.py` — turns SingStat's SSIC 2025 table (XLSX) into `data/ssic2025.json`; run only when SingStat publishes a new edition
- `data/ssic-map.json` — SSIC division → sector, holding-company codes, codes flagged "confirm sector on the day"
- `data/manual.json` — fallback ACRA "last updated" date, used only if the metadata API call fails
- `data-findings.md` — dataset IDs and API notes (`check.py` compares the 27 shard IDs against it)
- `check.py` — recomputes every baked figure from the Pulse and Landscape data, checks that every sector has a Course Finder file in the shape the page reads, and checks the page

## Refresh
Automatic: `.github/workflows/uen-sheet-refresh.yml` runs on the 4th of each month, after the Pulse (2nd) and Landscape and Course Finder (3rd) refreshes. It rebuilds, runs `check.py` and commits. A failed build or check stops the run and leaves the live page as it was.

Manual (from this folder):
```
python3 build.py && python3 check.py && cp index.html ../../projects/uen-sheet/ && rm index.html
```

## Update by hand
| What | File | When |
|---|---|---|
| Fallback ACRA date | `data/manual.json` | Only if the build warns that the metadata API call failed |
| SSIC table | `ssic.py` → `data/ssic2025.json` | New SSIC edition only |
| Sector mapping notes | `data/ssic-map.json` | If a mapping looks wrong in use |

The company lookup is live: nothing about the companies looked up is stored or sent anywhere except data.gov.sg. The course list is read from this site's own Course Finder files.
