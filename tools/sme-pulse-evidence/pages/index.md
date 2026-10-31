---
title: SME Workforce Pulse
full_width: true
hide_toc: true
---

<script>
    import PageIntro from '$lib/PageIntro.svelte';
    import SectorSelect from '$lib/SectorSelect.svelte';
    import KpiNotes from '$lib/KpiNotes.svelte';
    import SourceLine from '$lib/SourceLine.svelte';
    import PmetSelected from '$lib/PmetSelected.svelte';
    import SctpList from '$lib/SctpList.svelte';
    import SkillsLinks from '$lib/SkillsLinks.svelte';
    import SurveyCard from '$lib/SurveyCard.svelte';
    import PageFooter from '$lib/PageFooter.svelte';
</script>

```sql meta
-- Evidence reads date-looking text as dates; keep these as plain text
select * replace (
    strftime(checked, '%Y-%m-%d') as checked,
    strftime(fetched, '%Y-%m-%d') as fetched,
    strftime(sctp_collected, '%Y-%m-%d') as sctp_collected,
    strftime(imda_retrieved, '%Y-%m-%d') as imda_retrieved
) from pulse.meta
```

```sql sector_list
select sector, label from pulse.sectors order by sort
```

```sql sel
-- the chosen sector: key, label and the PMET figures
select 'all' as sector, 'All industries' as label, null::double as ret, null::double as vac
union all
select sector, label, pmet_retrenched, pmet_vacancies from pulse.sectors
```

```sql chosen
select * from ${sel} where sector = '${inputs.sector.value}'
```

```sql kpi
-- one row per headline figure for the chosen sector (V/U is always all of Singapore).
-- li = last quarter with a published value; cur / prev / yago = values at li, li-1 and li-4.
with s as (
    select measure, q_idx, quarter_label, value from pulse.series
    where (scope = '${inputs.sector.value}' and measure in ('vac', 'rate', 'ret'))
       or (scope = 'all' and measure = 'vu')
),
li as (
    select measure, max(q_idx) filter (where value is not null) as li from s group by measure
)
select
    li.measure,
    li.li,
    (select latest_idx from pulse.meta) as L,
    (select latest_label from pulse.meta) as latest_label,
    (select quarter_label from s where s.measure = li.measure and s.q_idx = li.li) as q_label,
    (select value from s where s.measure = li.measure and s.q_idx = li.li) as cur,
    (select value from s where s.measure = li.measure and s.q_idx = li.li - 1) as prev,
    (select value from s where s.measure = li.measure and s.q_idx = li.li - 4) as yago,
    (select value from s where s.measure = li.measure and s.q_idx = li.li) / (case when li.measure = 'rate' then 100 else 1 end) as cur_bv,
    d.url as src_url,
    d.title as src_title
from li
join pulse.datasets d on d.key = case
    when li.measure = 'vu' then 'vu_ratio'
    when '${inputs.sector.value}' = 'all' then case li.measure when 'vac' then 'vacancies_total' when 'rate' then 'vacancy_rate_total' else 'retrenched_total' end
    else case li.measure when 'vac' then 'vacancies' when 'rate' then 'vacancy_rate' else 'retrenched' end
end
```

```sql k_vac
select * from ${kpi} where measure = 'vac'
```

```sql k_rate
select * from ${kpi} where measure = 'rate'
```

```sql k_ret
select * from ${kpi} where measure = 'ret'
```

```sql k_vu
select * from ${kpi} where measure = 'vu'
```

```sql trend
-- chosen sector, measure and range. Rate is stored as a number like 2.9, shown as a percentage.
with p as (
    -- before the buttons have a value (the static pre-render), fall back to their defaults
    select case when '${inputs.measure}' in ('vac', 'rate', 'ret') then '${inputs.measure}' else 'vac' end as m,
           coalesce(try_cast('${inputs.range}' as integer), 40) as n
)
select
    period_start,
    quarter_label,
    case when measure = 'rate' then value / 100 else value end as value
from pulse.series, p
where scope = '${inputs.sector.value}'
  and measure = p.m
  and published_since_start = 'Started'
  and q_idx > (select latest_idx from pulse.meta) - p.n
order by period_start
```

```sql trend_info
-- first quarter with a published value for the chosen sector and measure
with p as (
    select case when '${inputs.measure}' in ('vac', 'rate', 'ret') then '${inputs.measure}' else 'vac' end as m
)
select min(q_idx) as first_idx, arg_min(quarter_label, q_idx) as first_label
from pulse.series, p
where scope = '${inputs.sector.value}' and measure = p.m and published_since_start = 'Started'
```

```sql trend_table
with p as (
    -- before the buttons have a value (the static pre-render), fall back to their defaults
    select case when '${inputs.measure}' in ('vac', 'rate', 'ret') then '${inputs.measure}' else 'vac' end as m,
           coalesce(try_cast('${inputs.range}' as integer), 40) as n
)
select
    quarter_label,
    case when value is null then '–'
         when measure = 'rate' then printf('%.1f%%', value)
         else format('{:,}', cast(value as bigint)) end as shown
from pulse.series, p
where scope = '${inputs.sector.value}'
  and measure = p.m
  and published_since_start = 'Started'
  and q_idx > (select latest_idx from pulse.meta) - p.n
order by period_start desc
```

```sql trend_src
with p as (
    -- before the buttons have a value (the static pre-render), fall back to their defaults
    select case when '${inputs.measure}' in ('vac', 'rate', 'ret') then '${inputs.measure}' else 'vac' end as m,
           coalesce(try_cast('${inputs.range}' as integer), 40) as n
)
select title, url from pulse.datasets, p
where key = case when '${inputs.sector.value}' = 'all'
    then case p.m when 'vac' then 'vacancies_total' when 'rate' then 'vacancy_rate_total' else 'retrenched_total' end
    else case p.m when 'vac' then 'vacancies' when 'rate' then 'vacancy_rate' else 'retrenched' end
end
```

```sql rate_bars
select
    s.label,
    case when s.sector = '${inputs.sector.value}' then null else r.value / 100 end as other,
    case when s.sector = '${inputs.sector.value}' then r.value / 100 end as selected
from pulse.sectors s
join pulse.series r on r.scope = s.sector and r.measure = 'rate' and r.q_idx = (select latest_idx from pulse.meta)
where r.value is not null
order by r.value desc
```

```sql all_rate
select value / 100 as rate from pulse.series
where scope = 'all' and measure = 'rate' and q_idx = (select latest_idx from pulse.meta)
```

```sql bars_src
select title, url from pulse.datasets where key = 'vacancy_rate'
```

```sql pm
select * from pulse.pmet_total
```

```sql pm_long
-- retrenched (past 4 quarters) and open roles (latest quarter) by sector, most retrenched first
with p as (
    select label || case when pmet_missing_quarters > 0 then ' *' else '' end as label,
           pmet_retrenched, pmet_vacancies, sort
    from pulse.sectors
    where pmet_retrenched is not null or pmet_vacancies is not null
)
select label, 'Retrenched, ' || (select from_label from pulse.pmet_total) || '–' || (select to_label from pulse.pmet_total) as measure,
       pmet_retrenched as value, coalesce(pmet_retrenched, 0) as ord from p
union all
select label, 'Open roles, ' || (select to_label from pulse.pmet_total), pmet_vacancies, coalesce(pmet_retrenched, 0) from p
order by ord desc, label, measure desc
```

```sql pm_table
select
    label,
    pmet_retrenched,
    pmet_vacancies,
    case when pmet_missing_quarters > 0 then 'Some quarters not published' else '' end as note
from pulse.sectors
where pmet_retrenched is not null or pmet_vacancies is not null
order by coalesce(pmet_retrenched, 0) desc
```

```sql pm_missing
select string_agg(label, ', ' order by sort) as names from pulse.sectors where pmet_missing_quarters > 0 and (pmet_retrenched is not null or pmet_vacancies is not null)
```

```sql pm_src
select title, url from pulse.datasets where key in ('retrenched_occ', 'vacancies_occ') order by key desc
```

```sql sc_table
-- SCTP programmes per sector next to PMET roles open (security is counted inside admin & support too)
select label || case when sector = 'security' then ' (part of admin & support)' else '' end as sector,
       sctp_programmes as programmes, pmet_vacancies as pmet_open, coalesce(pmet_vacancies, 0) as ord
from pulse.sectors
union all
select 'Any sector (cross-industry skills)', (select sctp_cross from pulse.meta), null, -1
union all
select 'Other', (select sctp_other from pulse.meta), null, -2
order by ord desc
```

```sql sc_list
select inst, title from pulse.sctp_programmes
where sector = '${inputs.sector.value}' or ('${inputs.sector.value}' = 'admin' and sector = 'security')
order by seq
```

```sql sc_inst
select code, name, url from pulse.sctp_institutions
```

```sql datasets
select title, url from pulse.datasets
```

<PageIntro meta={meta[0]} />

<SectorSelect sectors={sector_list} />

<div class="pulse-kpis">

<div class="pulse-card">
<KpiNotes part="head" row={k_vac[0]} label="Job vacancies" />
{#if k_vac[0].li === k_vac[0].L}
<BigValue data={k_vac} value=cur_bv fmt=num0 title=" " />
{/if}
<KpiNotes part="foot" row={k_vac[0]} label="Job vacancies" kind="n" />
</div>

<div class="pulse-card">
<KpiNotes part="head" row={k_rate[0]} label="Vacancy rate" />
{#if k_rate[0].li === k_rate[0].L}
<BigValue data={k_rate} value=cur_bv fmt=pct1 title=" " />
{/if}
<KpiNotes part="foot" row={k_rate[0]} label="Vacancy rate" kind="pp" gloss="Unfilled jobs as a share of all jobs (filled and unfilled)" />
</div>

<div class="pulse-card">
<KpiNotes part="head" row={k_ret[0]} label="Retrenchments" />
{#if k_ret[0].li === k_ret[0].L}
<BigValue data={k_ret} value=cur_bv fmt=num0 title=" " />
{/if}
<KpiNotes part="foot" row={k_ret[0]} label="Retrenchments" kind="n"
    advance={meta[0].advance_shown === 'Shown' && inputs.sector.value === 'all' ? { url: meta[0].advance_url, text: `${meta[0].advance_label} advance estimate: ${Number(meta[0].advance_retrenched).toLocaleString('en-SG')}${meta[0].advance_status === 'preliminary' ? ' (preliminary)' : ''}` } : null} />
</div>

<div class="pulse-card">
<KpiNotes part="head" row={k_vu[0]} label="Vacancies per jobseeker" />
<BigValue data={k_vu} value=cur_bv fmt=num2 title=" " />
<KpiNotes part="foot" row={k_vu[0]} label="Vacancies per jobseeker" kind="ratio" gloss="All of Singapore, not by sector. Above 1 means more open jobs than unemployed people." />
</div>

</div>

<div class="pulse-grid2">

<div class="pulse-card">

<h2 class="pulse-h2">{inputs.measure === 'rate' ? 'Job vacancy rate' : inputs.measure === 'ret' ? 'Retrenchments' : 'Job vacancies'} · {chosen[0].label}</h2>

<div class="pulse-hint">{chosen[0].sector === 'all' ? 'Quarterly, all industries.' : inputs.measure === 'rate' ? 'Quarterly. The chart on the right compares sectors.' : 'Quarterly. Switch to Rate to compare sectors.'}{trend_info[0].first_idx > 0 && chosen[0].sector !== 'all' ? ` Series starts ${trend_info[0].first_label} (current industry codes).` : ''}{inputs.measure === 'ret' && chosen[0].sector === 'security' ? ' Most quarters not published (small counts).' : ''}</div>

<ButtonGroup name=measure title="Measure">
    <ButtonGroupItem valueLabel="Vacancies" value="vac" default />
    <ButtonGroupItem valueLabel="Rate" value="rate" />
    <ButtonGroupItem valueLabel="Retrenched" value="ret" />
</ButtonGroup>

<ButtonGroup name=range title="Time range">
    <ButtonGroupItem valueLabel="5Y" value="20" />
    <ButtonGroupItem valueLabel="10Y" value="40" default />
    <ButtonGroupItem valueLabel="Max" value="9999" />
</ButtonGroup>

<LineChart
    data={trend}
    x=period_start
    xFmt="mmm yyyy"
    y=value
    yFmt={inputs.measure === 'rate' ? 'pct1' : 'num0'}
    yAxisTitle=false
    xAxisTitle=false
    yMin=0
    chartAreaHeight=440
>
    <ReferenceLine x="2020-04-01" label="Covid-19" hideValue=true />
</LineChart>

<Details title="Show table">

<DataTable data={trend_table} rows=8 rowShading=true>
    <Column id=quarter_label title="Quarter" />
    <Column id=shown title={inputs.measure === 'rate' ? 'Vacancy rate' : inputs.measure === 'ret' ? 'Retrenched' : 'Vacancies'} align=right />
</DataTable>

</Details>

<SourceLine rows={trend_src} />

</div>

<div class="pulse-card">

<h2 class="pulse-h2">Vacancy rate by sector</h2>

<div class="pulse-hint">{meta[0].latest_label}. Line marks all industries ({(all_rate[0].rate * 100).toFixed(1)}%).</div>

<BarChart
    data={rate_bars}
    x=label
    y={['other', 'selected']}
    type=stacked
    swapXY=true
    sort=false
    yFmt=pct1
    yAxisTitle=false
    xAxisTitle=false
    legend=false
    labels=true
    labelFmt=pct1
    stackTotalLabel=false
    yAxisLabels=false
    yGridlines=false
    xLabelWrap=true
    leftPadding={30}
    rightPadding={30}
    colorPalette={['#9bb0cc', '#2a78d6']}
    chartAreaHeight=380
>
    <ReferenceLine y={all_rate[0].rate} label="All industries" hideValue=true />
</BarChart>

<div class="pulse-hint">Security is part of admin &amp; support.</div>

<SourceLine rows={bars_src} />

</div>

</div>

<div class="pulse-card">

<h2 class="pulse-h2">PMETs: retrenched vs open roles</h2>

<div class="pulse-hint">Professionals, managers, executives and technicians. Retrenched is the total for {pm[0].from_label} to {pm[0].to_label}; open roles are vacancies at the end of {pm[0].to_label}. One is a year's total and the other a count on one day, so compare them side by side rather than as a ratio. A vacancy is not necessarily a fit for someone retrenched.</div>

<div class="pulse-two">
<div>
<BigValue data={pm} value=retrenched fmt=num0 title="PMETs retrenched, {pm[0].from_label}–{pm[0].to_label}" />
<div class="pulse-what">{Math.round(pm[0].retrenched / pm[0].all_retrenched * 100)}% of all {Number(pm[0].all_retrenched).toLocaleString('en-SG')} retrenchments</div>
</div>
<div>
<BigValue data={pm} value=vacancies fmt=num0 title="PMET vacancies open at the end of {pm[0].to_label}" />
</div>
</div>

<PmetSelected sector={chosen[0].sector} row={{ label: chosen[0].label, ret: chosen[0].ret, vac: chosen[0].vac }} to={pm[0].to_label} />

<BarChart
    data={pm_long}
    x=label
    y=value
    series=measure
    type=grouped
    swapXY=true
    sort=false
    yAxisTitle=false
    xAxisTitle=false
    labels=true
    labelFmt=num0
    legend=true
    seriesColors={{ [`Retrenched, ${pm[0].from_label}–${pm[0].to_label}`]: '#eb6834', [`Open roles, ${pm[0].to_label}`]: '#2a78d6' }}
    leftPadding={30}
    rightPadding={30}
    chartAreaHeight=560
/>

{#if pm_missing[0].names}
<div class="pulse-hint">* Some quarters not published: {pm_missing[0].names}. Totals use the quarters MOM published. Security is part of admin &amp; support; MOM does not publish its PMET figures (counts too small).</div>
{/if}

<Details title="Show table">

<DataTable data={pm_table} rows=20 rowShading=true>
    <Column id=label title="Sector" />
    <Column id=pmet_retrenched title="Retrenched, past 4 quarters" fmt=num0 />
    <Column id=pmet_vacancies title="Open roles, latest quarter" fmt=num0 />
    <Column id=note title="Note" />
</DataTable>

</Details>

<SourceLine rows={pm_src} />

</div>

<div class="pulse-card">

<h2 class="pulse-h2">Career-switch courses (SCTP) by sector</h2>

<div class="pulse-hint">SCTP programmes listed on the public course pages of the five polytechnics and ITE, collected on {meta[0].sctp_collected_label}. This counts programmes, not class places or intakes, so it shows where courses exist rather than how many people they train. The sector for each programme is our judgement from its title and listed job roles.</div>

<div class="pulse-two">
<div>
<BigValue data={meta} value=sctp_total fmt=num0 title="SCTP programmes across {meta[0].sctp_institutions} institutions" />
</div>
<div>
<BigValue data={meta} value=sctp_cross fmt=num0 title="teach skills used in any sector (marketing, HR, data, digital, sustainability)" />
<div class="pulse-what">{Math.round(meta[0].sctp_cross / meta[0].sctp_total * 100)}% of all SCTP programmes</div>
</div>
</div>

<DataTable data={sc_table} rows=20 rowShading=true>
    <Column id=sector title="Sector" />
    <Column id=programmes title="SCTP programmes" contentType=bar barColor="#2a78d6" backgroundColor="#00000000" />
    <Column id=pmet_open title="PMET roles open" fmt=num0 />
</DataTable>

<SctpList sector={chosen[0].sector} label={chosen[0].label} programmes={sc_list} institutions={sc_inst} collected={meta[0].sctp_collected_label} />

</div>

<div class="pulse-card">
<SkillsLinks sector={chosen[0].sector} label={chosen[0].label} />
</div>

<SurveyCard meta={meta[0]} />

<PageFooter meta={meta[0]} datasets={datasets} />

<style>
    .pulse-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 12px 0; }
    .pulse-grid2 { display: grid; grid-template-columns: 2fr 1fr; gap: 12px; margin-bottom: 12px; }
    .pulse-card { border: 1px solid rgba(127,127,127,.3); border-radius: 12px; padding: 16px; margin-bottom: 12px; min-width: 0; }
    .pulse-kpis .pulse-card, .pulse-grid2 .pulse-card { margin-bottom: 0; }
    .pulse-kpis .pulse-card { display: flex; flex-direction: column; }
    @media (max-width: 480px) { .pulse-kpis .pulse-card { padding: 14px 12px; } }
    .pulse-kpis :global(.kpi-src) { margin-top: auto; }
    .pulse-h2 { font-size: 15px; font-weight: 600; margin: 0; }
    .pulse-hint { font-size: 13px; opacity: .8; margin: 2px 0 8px; }
    .pulse-two { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 12px 0 4px; }
    .pulse-what { font-size: 13px; opacity: .8; }
    @media (max-width: 860px) { .pulse-grid2 { grid-template-columns: 1fr; } .pulse-kpis { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 560px) { .pulse-two { grid-template-columns: 1fr; } }
</style>
