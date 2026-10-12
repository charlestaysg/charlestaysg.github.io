# UEN fact sheet: data findings (verified 11 Oct 2026)

## 1. Datasets (data.gov.sg, ACRA, Open Data Licence, updated monthly; last 16 Sep 2026)
Collection 2 "ACRA Information on Corporate Entities": 27 CSV datastores (A-Z + Others), 2,117,243 rows total, ~700 MB raw.
Shard IDs: A d_8575e84912df3c28995b8e6e0e05205a | B d_3a3807c023c61ddfba947dc069eb53f2 | C d_c0650f23e94c42e7a20921f4c5b75c24 | D d_acbc938ec77af18f94cecc4a7c9ec720 | E d_124a9bd407c7a25f8335b93b86e50fdd | F d_4526d47d6714d3b052eed4a30b8b1ed6 | G d_b58303c68e9cf0d2ae93b73ffdbfbfa1 | H d_fa2ed456cf2b8597bb7e064b08fc3c7c | I d_85518d970b8178975850457f60f1e738 | J d_478f45a9c541cbe679ca55d1cd2b970b | K d_5573b0db0575db32190a2ad27919a7aa | L d_a2141adf93ec2a3c2ec2837b78d6d46e | M d_9af9317c646a1c881bb5591c91817cc6 | N d_67e99e6eabc4aad9b5d48663b579746a | O d_5c4ef48b025fdfbc80056401f06e3df9 | P d_181005ca270b45408b4cdfc954980ca2 | Q d_4130f1d9d365d9f1633536e959f62bb7 | R d_2b8c54b2a490d2fa36b925289e5d9572 | S d_df7d2d661c0c11a7c367c9ee4bf896c1 | T d_72f37e5c5d192951ddc5513c2b134482 | U d_0cc5f52a1f298b916f317800251057f3 | V d_e97e8e7fc55b85a38babf66b0fa46b73 | W d_af2042c77ffaf0db5d75561ce9ef5688 | X d_1cd970d8351b42be4a308d628a6dd9d3 | Y d_31af23fdb79119ed185c256f03cb5773 | Z d_4e3db8955fdcda6f9944097bef3d2724 | Others (digit/symbol-first names) d_300ddc8da4e8f7bdc1bfc62d0d99e2e7
Row counts: S 234k, C 141k, T 142k, A 175k, M 124k, P 100k, B/H/L ~94k, ... Z 18k, X 13k, Q 12k, Others 22k.
Columns (53): uen, issuance_agency_id, entity_name, entity_type_description, business_constitution_description, company_type_description, paf_constitution_description, entity_status_description, registration_incorporation_date, uen_issue_date, address_type, block, street_name, level_no, unit_no, building_name, postal_code, other_address_line1/2, account_due_date, annual_return_date, primary_ssic_code, primary_ssic_description, primary_user_described_activity, secondary_ssic_code, secondary_ssic_description, secondary_user_described_activity, no_of_officers, former_entity_name1-15, uen_of_audit_firm1-5 + name_of_audit_firm1-5. All text; missing = literal "na". Date format YYYY-MM-DD.
**Slim UEN index (better first hop):** d_3f960c10fed6145404ca7b821f263b87 "Entities Registered with ACRA", ONE table, 2,120,264 rows, 233 MB. Cols: uen, issuance_agency_desc, uen_status_desc (Registered/Deregistered), entity_name, entity_type_desc, uen_issue_date, reg_street_name, reg_postal_code. No SSIC. Companion d_b1d2b840ab9e993570c037b706b39bb8 = other issuers (societies, SLA, etc.), 23,190 rows.

## 2. Live per-UEN lookup from a browser: YES
- datastore_search with filters={"uen":"..."} works. Response sends `access-control-allow-origin: *`. No key needed.
- No way to infer the shard from the UEN, but the shard IS the first letter of entity_name. So: call 1 = d_3f96... by uen (name, status, type, postal; ~0.5 s); call 2 = shard of name[0].upper() (or Others if not A-Z) filtered by uen (SSIC, secondary SSIC, reg date; ~0.35 s). Total ~1 s, 2 calls. Works for NUS 200604346E, SIA 197200078R, DBS 196800306E, sole-prop 53250767C. Unknown UEN returns total 0 (not an error).
- Throttle: a loop of 27 distinct calls at 4 s spacing got 4x HTTP 429 (limit nearer 1 per 5 s sustained, 4 per 10 s burst); fine for single lookups, add retry/back-off on 429. Identical queries are cached 5 min (cache-control max-age=300), repeat latency ~60 ms. Limit is per client IP, so each user's own browser has its own allowance.
- Not found: statutory boards, schools, ministries (e.g. Republic Polytechnic T08GB0039F is absent from both ACRA sets; query other issuers dataset d_b1d2... for T..GB/ societies; no SSIC there). Show "not in ACRA register" message.

## 4. SSIC
- ACRA's codes are **SSIC 2025** (all 40,000 sampled rows are valid 2025 codes; 360 of 10,218 live rows are 2025-only codes, e.g. 85609, 42100, 85507). Use the 2025 table, not 2020.
- Official tables (SingStat, XLSX, no API; no data.gov.sg dataset found): SSIC 2025 Classification Structure https://www.singstat.gov.sg/files/d72a3cb8-16c9-49c6-aec6-8b7360831072.xlsx (1,694 codes; 988 five-digit; parsed with stdlib zipfile). SSIC 2020: .../files/f24bd895-d6b9-4fbc-9e90-d663eb456dd9.xlsx. 2025-to-2020 correspondence: .../files/4a0ea430-dcdc-450b-903e-c867f7dac8ce.xlsx.
- Gotchas: primary_ssic_description is "na" for ~69% of rows (large companies, newer filings): do not rely on it, look up the code. Some codes lose the leading zero (106 of 40,000 are 4 digits, e.g. 1421): zfill(5). secondary code "na" for 46%. Status strings: "Live Company" and "Live" (sole-props); others Terminated, Struck Off, Cancelled, Ceased Registration, Deregistered etc.

Proposed mapping by SSIC 2025 division to Pulse keys:
- manufacturing: 10-32 (also 35 utilities, 36-39 water/waste, 01-03, 08-09: not in Pulse; flag "other", or manufacturing for 35-39 as MOM lumps them in "other industries")
- construction: 41-43
- retail: 46, 47 (wholesale and retail)
- transport: 49-53 (53 courier included)
- food: 55, 56
- ict: 58-63 (publishing 58, content 59-60, telecoms, software, info services)
- finance: 64-66
- realestate: 68
- professional: 69-75 (legal, accounting, HQ/consultancy, architecture/engineering, R&D, advertising, vet)
- admin: 77, 78, 79, 81, 82
- security: 80
- publicedu: 84, 85
- health: 86-88
- arts: 90-93
- no key: 94 (membership orgs), 95-96 (repair, personal services such as hair/beauty), 97, 99, 01-03, 08-09, 35-39, 92? (gambling sits in arts per MOM: keep in arts)
Ambiguities to flag: 70100 head offices and 64202 holding companies (shells; sector of operating business unknown); 46 trading firms vs manufacturing; 47 vs 96 beauty/hair; 62 vs 58/59 (digital media); 85 private tuition and enrichment (education vs arts/sports); 53 couriers; 82 and 74 catch-alls; 77 rentals; 86 vs 87/88 (health vs social); 94-96 largest unmapped bucket, show "no Pulse sector".
Course keyword mapping: ../skills-landscape/sectors.py uses the same 14 keys (plus "general"), so match on key directly.

