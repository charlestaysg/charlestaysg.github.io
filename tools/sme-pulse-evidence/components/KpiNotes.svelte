<script>
	// The text around one headline figure: label, quarter, changes, gloss, advance estimate, source link.
	// row comes from the `kpi` query: li (last published idx), L (latest idx), latest_label, q_label
	// (quarter of li), cur, prev, yago (values at li, li-1, li-4), src_url, src_title.
	export let row;
	export let label;
	export let kind = 'n'; // n = count, pp = percentage points, ratio = 2 decimals
	export let gloss = '';
	export let advance = null; // {url, text} or null
	export let part = 'all'; // 'head' shows label + quarter; 'foot' shows changes, gloss and source

	const fmt = new Intl.NumberFormat('en-SG');
	const f = {
		n: (v) => fmt.format(v),
		pp: (v) => v.toFixed(1) + '%',
		ratio: (v) => v.toFixed(2)
	}[kind];

	function change(a, b) {
		if (a == null || b == null) return null;
		const d = a - b;
		const arrow = d > 0 ? '▲ ' : d < 0 ? '▼ ' : '';
		if (kind === 'pp') return arrow + Math.abs(d).toFixed(1) + ' pts';
		if (kind === 'ratio') return arrow + Math.abs(d).toFixed(2);
		const pct = b ? (d / b) * 100 : 0;
		return arrow + fmt.format(Math.abs(d)) + ` (${Math.abs(pct).toFixed(0)}%)`;
	}

	$: published = row && row.li === row.L;
	$: isVu = kind === 'ratio';
	$: qoq = row ? change(row.cur, row.prev) : null;
	$: yoy = row ? change(row.cur, row.yago) : null;
	// when the latest quarter is not published, cur / q_label hold the last published figure
	$: lastPublished = row && row.cur != null && !published ? f(row.cur) + ' in ' + row.q_label : '';
	$: headQuarter = published || isVu ? row?.q_label : row?.latest_label;
</script>

{#if row}
	{#if part === 'head'}
		<div class="kpi-lab"><span>{label}</span><span class="kpi-q">{headQuarter}</span></div>
	{:else}
		{#if published || isVu}
			<div class="kpi-delta">
				{#if qoq}{qoq} vs last quarter{/if}
				{#if qoq && yoy}<br />{/if}
				{#if yoy}{yoy} vs a year ago{/if}
			</div>
			{#if gloss}<div class="kpi-gloss">{gloss}</div>{/if}
		{:else}
			<div class="kpi-na">Not published</div>
			<div class="kpi-gloss">
				MOM does not publish this figure for {row.latest_label} (counts too small to report).{lastPublished
					? ' Last published: ' + lastPublished + '.'
					: ''}
			</div>
		{/if}
		{#if advance}
			<div class="kpi-adv"><a href={advance.url} rel="noopener">{advance.text}</a></div>
		{/if}
		<div class="kpi-src">
			<a href={row.src_url} rel="noopener" title="MOM, {row.src_title} (data.gov.sg)">Source ↗</a>
		</div>
	{/if}
{/if}

<style>
	.kpi-lab {
		font-size: 13px;
		display: flex;
		justify-content: space-between;
		gap: 8px;
		opacity: 0.85;
	}
	@media (max-width: 480px) {
		.kpi-lab {
			flex-direction: column;
			gap: 2px;
		}
	}
	.kpi-q {
		font-size: 12px;
		white-space: nowrap;
		opacity: 0.75;
	}
	.kpi-delta {
		font-size: 13px;
		opacity: 0.85;
	}
	.kpi-gloss {
		font-size: 12px;
		opacity: 0.7;
		margin-top: 2px;
	}
	.kpi-na {
		font-size: 18px;
		font-weight: 500;
		opacity: 0.85;
		padding: 9px 0 5px;
	}
	.kpi-adv {
		font-size: 12px;
		margin-top: 4px;
	}
	.kpi-adv a,
	.kpi-src a {
		text-decoration: underline;
		text-underline-offset: 2px;
		opacity: 0.85;
	}
	.kpi-src {
		font-size: 12px;
		padding-top: 8px;
	}
</style>
