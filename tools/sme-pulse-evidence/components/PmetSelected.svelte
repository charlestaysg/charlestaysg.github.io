<script>
	// One sentence about the chosen sector's PMET figures, with a plain-language reading.
	// Thresholds are deliberately coarse. row: {label, ret, vac}; to: label of the latest quarter.
	export let sector = 'all';
	export let row = null;
	export let to = '';

	const fmt = new Intl.NumberFormat('en-SG');

	function reading(ret, vac) {
		if (ret == null || vac == null) return '';
		if (vac >= 5 * ret)
			return ' Few PMETs are being let go and many roles are open, so this sector is a likely destination for people moving in from other sectors.';
		if (vac >= 0.9 * ret)
			return ' The sector is letting PMETs go while still hiring them, which points to a skills gap within the sector.';
		return ' More PMETs were retrenched than there are open PMET roles here, so moving into other sectors matters more.';
	}

	$: text = !row || sector === 'all'
		? ''
		: row.ret == null && row.vac == null
			? `${row.label}: MOM does not publish PMET figures for this sector (counts too small).`
			: `${row.label}: ${row.ret == null ? 'retrenchments not published' : fmt.format(row.ret) + ' PMETs retrenched in the past year'}; ${row.vac == null ? 'vacancies not published' : fmt.format(row.vac) + ' PMET roles open in ' + to}.` +
				reading(row.ret, row.vac);
</script>

{#if text}<p class="pm-sel">{text}</p>{/if}

<style>
	.pm-sel {
		font-size: 14px;
		margin: 10px 0;
		padding: 10px 12px;
		border-radius: 8px;
		background: rgba(127, 127, 127, 0.1);
	}
</style>
