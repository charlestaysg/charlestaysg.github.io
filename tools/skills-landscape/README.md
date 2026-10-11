# Skills Training Landscape

The supply side of the SME Workforce Pulse. It shows what SkillsFuture-listed training exists for each sector, who runs it, what form it takes, and how much of it is AI-related, next to the open PMET roles from the Pulse. Data: MySkillsFuture Course Directory and Course Run (Skills and Workforce Development Agency, via data.gov.sg). Unofficial teaching example.

## Files
- `fetch.py`: reads each dataset's `lastUpdatedAt` and records whether it changed in `data/last-checked.json`. It downloads the two XLSX files to `data/raw/` (gitignored, about 16 MB) unless they are already there and nothing changed. Downloads use a signed URL (initiate, then poll), a `User-Agent: curl/…` header (the API refuses Python's default) and 5 s between calls.
- `clean.py`:
  - reads the XLSX files with openpyxl;
  - merges repeat rows, because a course offered in more than one mode is listed once per mode;
  - strips `_x000D_`;
  - groups providers by UEN;
  - sets each provider's type from `data/providers.json`.
- `sectors.py`: keyword rules that map each course to one of the Pulse's 14 sectors, or to "general".
  - The title is checked first.
  - The course text counts only when it points clearly to one sector.
  - Delivery-mode notes in titles are ignored.
  - The rules follow the Pulse's hand-tagged SCTPs; for example, facilities management goes under admin and media under Info & comms.
- `ai.py`: the AI-related test, a regular expression on the title.
- `build.py`: classifies every course, then aggregates by sector into `data/snapshots/<data-month>.json` and `data/latest.json` (about 18 KB, no course rows). It reads open PMET roles from `../sme-pulse/data/snapshot.json` and inlines everything into `template.html` → `index.html`. `--page-only` re-inlines `latest.json` after a template change.
- `check.py`: recounts courses, providers, fees, AI courses, provider types and runs straight from the XLSX files, without `clean.py`. It also:
  - re-runs the sector rules and checks the counts add up;
  - requires 90% or more agreement with the Pulse's SCTP tags;
  - confirms the sector list and PMET figures match the Pulse;
  - checks that the page carries `latest.json`.

  It exits 1 on any failure.
- `review_mapping.py`: writes `mapping-review.md`, which shows coverage, agreement with the SCTP tags and 10 random course titles per sector. Use it when changing `sectors.py`.
- `data/providers.json`: hand-kept list of provider types (polytechnics and ITE, universities, public-agency UEN prefixes) and display-name fixes.

## Refresh
`.github/workflows/skills-landscape-refresh.yml` runs on the 3rd of each month, the day after the Pulse refresh. It fetches, builds, checks, copies the page to `projects/skills-landscape/`, and commits the snapshot and the page. A failure stops the run and leaves the live page as it was. One snapshot is kept per data month, so a month-by-month series builds up over time.

Manual run, from this folder:
```
pip install openpyxl
python3 fetch.py && python3 build.py && python3 check.py && cp index.html ../../projects/skills-landscape/ && rm index.html
```

## Update by hand
Everything from SWDA's course files and MOM's open roles refreshes on its own (see Refresh). These parts don't:

| What | File | When | How |
|---|---|---|---|
| Provider types and display names | `data/providers.json` | Rarely: when a new university or public agency starts listing courses, or a shouted name reads badly | Add the UEN under `ihl`, `university` or `names`; rebuild |
| Sector keyword rules | `sectors.py` | Optional: if the "sector found for X%" figure drops, or `review_mapping.py` samples look wrong | Edit the keywords, run `review_mapping.py`, check the samples and the SCTP agreement (must stay at 90%+), rebuild |
| AI-related test | `ai.py` | When new AI terms become common in course titles | Edit the pattern; check a sample of matches by eye |
| Sector list | `build.py` (`SECTORS`) | Only when the Pulse's list changes | Copy it from `../sme-pulse/build.py`; `check.py` fails until they match |

After any hand edit: `python3 build.py && python3 check.py`, then copy `index.html` to `projects/skills-landscape/`. Needs the raw files: run `python3 fetch.py` first.

## Known limits
- **Sector coverage:** a sector is found for 48% of courses (Sep 2026 data). The rest teach cross-sector skills.
- **AI-related courses:** only titles are tested, so AI taught inside broader courses is missed.
- **Courses by year registered:** courses that were withdrawn are gone from the source, so older years are undercounted.
- **Undated runs:** 43% of course runs have no date.
- **Fees:** only the full fee before subsidies is used. The source doesn't state which subsidy its net fee assumes.

Licence: code under MIT (see `LICENSE` at the repo root). Data: Singapore Open Data Licence v1.0 (attribution in the page footer).
