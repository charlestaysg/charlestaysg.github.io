# Course Finder

Lists individual SkillsFuture-listed courses by sector, so an SME owner can pick a course to send staff on. It uses the same data, cleaning and sector rules as the Skills Training Landscape (which shows aggregates only), so the two pages agree. Data: MySkillsFuture Course Directory and Course Run (Skills and Workforce Development Agency, via data.gov.sg). Unofficial teaching example.

## Files
- `build.py`: reads the Landscape's XLSX files through `../skills-landscape/clean.py`, classifies each course with the Landscape's `sectors.py` and `ai.py`, and reads the sector list, length bands and fee bands from the Landscape's `build.py` (without running it). Writes to `out/` (not committed):
  - `out/index.html`: the page, with small metadata inlined from `data/meta.json`;
  - `out/data/<sector>.json`: one file per sector, plus `general` (shown as "Cross-sector"). The page loads a file when you pick that sector, and loads all of them the first time you type a keyword.

  `--page-only` rebuilds `out/index.html` from `data/meta.json` after a template change (no raw files needed).
- `template.html`: the page. Styling matches the Landscape and the Pulse.
- `check.py`: recounts straight from the XLSX files, without `clean.py`, and exits 1 on any failure (see Checks).
- `data/meta.json`: the metadata the page inlines (build date, check date, dataset ids, sector counts, open PMET roles). Committed; it is small.

## What is kept per course
Reference number, title, provider name and type, hours, study mode, full fee before subsidies, rating stars and number of respondents, AI flag, up to 3 upcoming run start dates plus the count of upcoming runs. No description, "what you learn", entry requirements or contact details. Each course links to `https://courses.myskillsfuture.gov.sg/courses/<reference>`. Polytechnic and ITE cards also link to the STEP home page `https://stms.polite.edu.sg/` (the old `step.polite.edu.sg` address redirects there) and nothing deeper (STEP's terms do not allow links to inner pages). Each card shows its reference number. When SWDA lists the same course twice (same title, provider, hours, mode and fee under two references), each card names the other listing, because the funding behind them can differ.

Links into the page: `?sector=<key>` picks a sector and `?q=<words>` runs a keyword search across every sector. The page keeps both in the address bar as you use it.

Each sector file is `{"f": field names, "t": type names, "p": {provider id: [name, type index]}, "c": [rows]}`. A row is `[ref, title, provider id, hours, mode index, full fee, stars, respondents, ai, dates, upcoming runs]`.

"Next class" is worked out in the browser, in Singapore time, from the stored dates, so it stays right between monthly refreshes. Stored dates that have passed are skipped.

## Refresh
Part of `.github/workflows/skills-landscape-refresh.yml`: after the Landscape builds and checks, the Course Finder builds, checks and is copied to `projects/course-finder/` (the page and the `data/` folder). The workflow commits `tools/course-finder/data` and `projects/course-finder`. A failure stops the run and leaves the live pages as they were.

Manual run, with the raw files already fetched by `../skills-landscape/fetch.py`:
```
pip install openpyxl
python3 build.py && python3 check.py && mkdir -p ../../projects/course-finder && cp -R out/. ../../projects/course-finder/
```
The Landscape's `build.py` and `check.py` should run first, because `check.py` here compares against the Landscape's `data/latest.json`.

## Checks
`check.py` fails unless:
- course counts per provider type recounted from the XLSX match the output;
- every course is in exactly one sector file, and each sector's count equals the Landscape's `latest.json`;
- fee, hours, rating and upcoming-run data match the XLSX files;
- the AI-flag count equals the Landscape's, and open PMET roles equal the Landscape's and the Pulse's;
- no output contains an email address or an 8-digit phone-like number;
- every URL in the page is on the allowed list, and the STEP link is the home page only;
- no template placeholders are left.

It also prints the page size and each data file's size, raw and gzipped.

## Update by hand
| What | File | When | How |
|---|---|---|---|
| Provider types, display names | `../skills-landscape/data/providers.json` | Rarely (see the Landscape README) | Edit there; both pages pick it up |
| Sector rules, AI test | `../skills-landscape/sectors.py`, `ai.py` | As the Landscape's README says | Edit there, rebuild both pages |
| Sector list, bands | `../skills-landscape/build.py` | Only when the Pulse's list changes | Edit there; this page reads it |
| Minimum respondents for showing a rating | `build.py` (`min_respondents` in `meta`) | Optional | Change and rebuild |

## Known limits
- **Dates:** about 43% of course runs in the source have no start date, and only about one course in six has a dated run from the build date, so "no date listed" is common and does not mean no class.
- **Sectors:** matched by keywords, so some courses sit in the wrong sector. About half the courses are Cross-sector.
- **Fees:** only the full fee before subsidies. The source does not say which subsidy its net fee assumes.
- **Class places:** a listed course is not a class place. Entry requirements and funding are on the MySkillsFuture page.
- **Size:** the Cross-sector file is about 1.5 MB (about 330 KB gzipped); a keyword search loads every sector file (about 3 MB, about 600 KB gzipped).
- **Local preview:** the page loads its data with `fetch`, so open it through a local server (`python3 -m http.server` in `out/`), not straight from disk.

Licence: code under MIT (see `LICENSE` at the repo root). Data: Singapore Open Data Licence v1.0 (attribution in the page footer).
