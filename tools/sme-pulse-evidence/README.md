# SME Workforce Pulse (Evidence)

Singapore job vacancies, vacancy rates and retrenchments by sector (MOM data via data.gov.sg), plus hand-entered IMDA survey figures. This is a rebuild in Evidence (evidence.dev, classic markdown project, v40) of the hand-built one-page dashboard in `../sme-pulse/`. Unofficial teaching example.

Prototype, Nov 2026. It reads the data files of the old page unchanged; nothing here fetches data.

## How to run

You need Node 18 or later and Python 3 (standard library only, no pip installs).

```bash
npm ci                  # once (npm install also works)
npm run refresh         # CSVs from ../sme-pulse/data, then load them into Evidence
npm run check           # compare the CSVs with the raw data.gov.sg files; every line must say ok
npm run dev             # work on the page
npm run build:strict    # production build into build/, fails on any query error
```

| Script | What it does |
|---|---|
| `npm run prep` | `scripts/prep_data.py`: writes `sources/pulse/*.csv` |
| `npm run refresh` | prep, then `evidence sources` (loads the CSVs). Run after any data change |
| `npm run check` | `scripts/check_data.py`: recomputes the headline figures from `../sme-pulse/data/raw/*.json` and compares them with the CSVs |
| `npm run dev` | dev server. Shows each query above the page; the build does not |
| `npm run build` / `build:strict` | static site in `build/` |

Usage tracking is switched off (`evidence.settings.json`, `scripts/telemetry-off.cjs` and the `postinstall` script). Leave those alone.

## Where it is served

`evidence.config.yaml` sets `deployment.basePath: /projects/sme-pulse`, where it replaces the hand-built page. Change that one line to move it (for example to `/projects/sme-pulse-evidence` for a side-by-side copy) and rebuild; `SITE_DIR` in `.github/workflows/sme-pulse-refresh.yml` (repo root) must match. All asset and data links in `build/` follow it (tested with both values). Copy the whole `build/` folder to the matching place in the site repo; the page does not work from `file://` or from a different folder.

Links to other pages on the site (`/`, `/#work`, `/disclaimer/`, `/projects/uen-sheet/`, `/projects/skills-landscape/`) are plain site paths, so they do not move with the base path. Evidence adds the base path to every link in a `pages/*.md` file, so those links live in `pages/+layout.svelte` and in `components/`, which it leaves alone.

## Data chain

```
../sme-pulse/fetch.py (data.gov.sg)  ─> ../sme-pulse/data/{raw/*.json, snapshot.json}
../sme-pulse/sctp_build.py (Course Finder data) ─> ../sme-pulse/data/sctp.json
../sme-pulse/data/{manual,last-checked}.json (manual.json hand-kept)
                          └─> scripts/prep_data.py ─> sources/pulse/*.csv ─> evidence sources ─> pages
```

`prep_data.py` ports `build.py` of the old page. It reads `SECTORS`, `PMET` and `TOP` out of `../sme-pulse/build.py` (parsed, not run), so the sector list has one home. It writes to a temporary folder and moves the CSVs into `sources/pulse/` only if everything worked, so a failure leaves the old CSVs as they were. Pass another data folder as the first argument if the data lives elsewhere.

| File in `sources/pulse/` | Content |
|---|---|
| `series.csv` | One row per scope (`all` or a sector key), measure (`vac`, `rate`, `ret`, and `vu` for all of Singapore) and quarter. Blank value = not published. `rate` is a number like 2.9 |
| `sectors.csv` | The 14 sectors with PMET retrenched (last 4 quarters), PMET open roles, quarters not published, and SCTP programme count |
| `pmet_total.csv` | The PMET window and the three totals |
| `sctp_programmes.csv`, `sctp_institutions.csv` | The SCTP programmes (with the first course reference, which the page links to) and the six institutions, exactly as in `sctp.json` |
| `datasets.csv` | The nine data.gov.sg datasets (id, title, link) used for every source line |
| `meta.csv` | One row: latest quarter, check and fetch dates, the advance estimate, SCTP and IMDA figures, and the freshness line |
| `connection.yaml` | `type: csv`, so Evidence reads the folder |

Yes/no flags are words (`Started` / `Not started`, `Shown` / `Hidden`), because DuckDB reads a Yes/No column as a boolean.

`check_data.py` does what `../sme-pulse/check.py` does, but against the CSVs: totals, rates, retrenched, vacancies per jobseeker, each sector, the PMET figures, the SCTP count and sector tags, and that every series has every quarter.

## Files

- `pages/index.md`: the page. Queries first, then the layout.
- `pages/+layout.svelte`: slim site bar (same links as the other pages), no Evidence sidebar, header or contents list, light and dark follow the visitor's system, and the personal disclaimer line.
- `components/`: `PageIntro` (title, Unofficial badge, fact sheet link, freshness line, out-of-date notice), `KpiNotes` (changes, gloss, advance estimate, source link under each headline figure), `SectorSelect`, `SourceLine`, `PmetSelected`, `SctpList`, `SkillsLinks`, `SurveyCard`, `PageFooter`.
- `svelte.config.js`: stops the build failing on links to other pages of the site (see Quirks).
- The monthly refresh workflow lives at the repo root: `.github/workflows/sme-pulse-refresh.yml`.

## What changed from the hand-built page

Same sections, wording, logic and links. Where Evidence works differently:

- **Sector picker.** Evidence cannot cross-filter on a click, so the row of sector buttons is a **Sector** drop-down list ("All industries" first, then the 14 sectors; `components/SectorSelect.svelte`, a native select that fills the same `inputs.sector` value as Evidence's Dropdown). Clicking a bar or table row no longer selects a sector.
- **Trend chart.** Measure (Vacancies / Rate / Retrenched) and range (5Y / 10Y / Max) are button groups. The Covid-19 marker is kept. Hover and arrow-key reading is Evidence's own tooltip. "Show table" is a collapsible table. The grey lines for other sectors on the Rate view are gone; the bar chart beside it compares sectors.
- **Vacancy rate by sector.** Horizontal bars with a dashed line at the all-industries rate. The chosen sector's bar is dark blue, the rest grey.
- **PMETs.** The two summary figures, the explanation, the chosen sector's sentence, a grouped bar chart (orange retrenched, blue open roles) and a table with the "some quarters not published" notes (marked with * in the chart).
- **SCTP.** Counts by sector sit next to PMET roles open in one table, with bars. The programme list for the chosen sector is grouped by institution with links, as before.
- **Page weight.** The old page was one 86 KB file. This one loads DuckDB in the browser (see Quirks).

## Quirks

- **Size.** `build/` is about 87 MB, but a visitor downloads about 8 MB (the DuckDB engine, 7 MB compressed) plus the page. Almost all of it is two DuckDB wasm files; each visitor loads only one. They are the same file from month to month, so Git stores them once. The first paint of the charts takes a second or two longer than the old page.
- **Base path in `pages/*.md`.** Evidence rewrites `href="/..."` and `src="/..."` in page files (and also `href={...}`, which would break). Keep links in components or the layout.
- **Links off the base path.** The build crawler follows every link. `svelte.config.js` skips links outside the base path so `build:strict` does not fail on `/`, `/disclaimer/` and the like. A broken link inside the base path still fails the build.
- **Button group values.** A `ButtonGroup` input is a plain value (`inputs.measure`); a `Dropdown` input has `.value` (`inputs.sector.value`). The queries fall back to the defaults for the static pre-render, when the buttons have no value yet.
- **Dates.** Evidence reads date-looking text in a CSV as a date, so `index.md` turns those columns back into text (`strftime`) before showing them.
- **`rows=all` on a `DataTable` with `<Column>` tags** rendered empty cells in this version, so the tables use `rows=20`.
- **`?sector=<key>` links work.** `SectorSelect` reads the address on load (in the browser, since the page is prerendered) and starts on that sector; changing the list updates the address with `history.replaceState` and removes the parameter for All industries. The page briefly shows All industries before it switches.
- **Why not Evidence's Dropdown.** Typing in its search box and pressing Enter does not pick the highlighted sector, and it cannot be started on a sector from the address. The native select fixes both.
- **Service worker message.** The browser console may show a failed service worker registration (`fix-tprotocol-service-worker.js`) when served from a plain static server. Evidence's own file; the page works without it.
- **Skills links** live in `components/SkillsLinks.svelte` (same list as `SKILLS` in `../sme-pulse/template.html`). Fix a broken link there and rebuild.
- **"Built with Evidence"** footer is switched off in `+layout.svelte` (`builtWithEvidence={false}`).
- Evidence is MIT licensed. Data and licence notes are the same as `../sme-pulse/README.md`.

## Refreshing

The monthly refresh (fetch, keep the snapshot only if MOM data changed, record the check date, check, build, replace the live folder, commit) is in `.github/workflows/sme-pulse-refresh.yml` at the repo root. By hand, from the site repo root:

```bash
cd tools/sme-pulse && python3 fetch.py && python3 sctp_build.py && cd ../sme-pulse-evidence
npm run refresh && npm run check && npm run build:strict
rm -rf ../../projects/sme-pulse && cp -R build ../../projects/sme-pulse
```

`data/manual.json` (IMDA figures, MOM advance estimate) is still updated by hand, as described in `../sme-pulse/README.md`. `data/sctp.json` is rebuilt by `../sme-pulse/sctp_build.py` from the Course Finder's data (the workflow runs it before the check); run it first if you refresh by hand. The advance estimate line hides itself once data.gov.sg has that quarter.
