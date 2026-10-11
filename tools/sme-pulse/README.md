# SME Workforce Pulse

One-page dashboard of Singapore job vacancies, vacancy rates and retrenchments by sector (MOM data via data.gov.sg), plus hand-entered IMDA survey figures. Unofficial teaching example.

## Files
- `fetch.py` — downloads 9 MOM datasets (paged, 10,000 rows per call) from data.gov.sg (no API key; calls spaced for the rate limit) → `data/raw/`, `data/snapshot.json`
- `data/manual.json` — hand-entered IMDA survey figures; check against the source before each rebuild
- `template.html` — the page; `build.py` inlines the data → `index.html` (no network calls at runtime)
- `check.py` — recomputes every headline figure from `data/raw/` and compares it with the page

## Refresh
Automatic: `.github/workflows/sme-pulse-refresh.yml` runs on the 2nd of each month (and on demand from the Actions tab). It fetches; keeps the new snapshot only if the MOM data changed; writes the check date to `data/last-checked.json` (shown on the page as "checked …"); rebuilds; runs `check.py`; and commits. A failed fetch or check stops the run and leaves the live page as it was. The monthly commit also stops GitHub disabling the schedule after 60 days without repo activity.

Manual (from this folder):
```
python3 fetch.py && python3 build.py && python3 check.py && cp index.html ../../projects/sme-pulse/ && rm index.html
```
`data/manual.json` (IMDA survey figures) is never refreshed automatically — update it by hand when IMDA publishes a new report.

## Datasets
| Key | data.gov.sg ID | Title |
|---|---|---|
| vacancies | d_3f17bbf67d31d4d402caa8755eb74afc | Number of Job Vacancy by Industry - Quarterly |
| vacancy_rate | d_fe705c7af162331d36cc31193f8f50c9 | Job Vacancy Rate by Industry - Quarterly |
| retrenched | d_61d92d31ca400be135190614277da825 | Number of Retrenched Employees by Industry - Quarterly |
| vu_ratio | d_80c0cf251ee9a26d240808297f52c820 | Job Vacancy to Unemployed Person Ratio - Quarterly |
| vacancies_total | d_59a34aef12e0ecf666de5746e50586e8 | Number of Job Vacancy - Quarterly |
| vacancy_rate_total | d_c57f5cd0558e429e2ac055d83030e75f | Job Vacancy Rate - Quarterly |
| retrenched_total | d_000d49cda016c13522d7d5be6a050f59 | Number of Retrenched Employees - Quarterly |
| retrenched_occ | d_cdde7c4701d917ae58aa63e4015490aa | Number of Retrenched Employees by Industry and Occupation - Quarterly |
| vacancies_occ | d_d3f02543c4d0dd197c56637eefc32624 | Number of Job Vacancy by Industry and Occupation - Quarterly |

Licence: Singapore Open Data Licence v1.0 (attribution in the page footer).
