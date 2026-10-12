# Pre-visit fact sheet

Type a Singapore company's UEN or name; the page fetches its public ACRA record from data.gov.sg in the browser, places it in one of the SME Workforce Pulse's 14 sectors, and shows that sector's hiring figures (from `../sme-pulse/`), training supply (from `../skills-landscape/`) and rule-based questions to ask. Prints to one A4 page. Unofficial; ACRA is the official source.

## Files
- `template.html` — the page; `build.py` bakes the sector, course and SSIC data into it → `index.html`, copied to `projects/uen-sheet/`
- `ssic.py` — turns SingStat's SSIC 2025 table (XLSX) into `data/ssic2025.json`; run only when SingStat publishes a new edition
- `data/ssic-map.json` — SSIC division → sector, holding-company codes, codes flagged "confirm sector on the day"
- `data/manual.json` — ACRA "last updated" date, entered by hand
- `data-findings.md` — dataset IDs and API notes (`check.py` compares the 27 shard IDs against it)
- `check.py` — recomputes every baked figure from the Pulse and Landscape data and checks the page

## Refresh
Automatic: `.github/workflows/uen-sheet-refresh.yml` runs on the 4th of each month, after the Pulse (2nd) and Landscape (3rd) refreshes. It downloads the course file, rebuilds, runs `check.py` and commits only if the data changed. A failed build or check stops the run and leaves the live page as it was.

Manual (from this folder; needs `../skills-landscape/data/raw/directory.xlsx`):
```
python3 build.py && python3 check.py && cp index.html ../../projects/uen-sheet/ && rm index.html
```

## Update by hand
| What | File | When |
|---|---|---|
| ACRA "last updated" date | `data/manual.json` | When the date shown on the page drifts; read it from the data.gov.sg dataset page |
| SSIC table | `ssic.py` → `data/ssic2025.json` | New SSIC edition only |
| Sector mapping notes | `data/ssic-map.json` | If a mapping looks wrong in use |

The company lookup is live: nothing about the companies looked up is stored or sent anywhere except data.gov.sg.
