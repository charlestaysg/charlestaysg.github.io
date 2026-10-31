<script>
	// The Sector picker. It writes the same value the Evidence Dropdown would
	// ($inputs.sector = {value, label, rawValues}), so every query keeps using ${inputs.sector.value}.
	// A native select, because Evidence's Dropdown does not select the highlighted option when you
	// type in its search box and press Enter. It also reads ?sector=<key> on load (client side; the
	// page is prerendered) and keeps the address in step, as the hand-built page did.
	import { getInputContext } from '@evidence-dev/sdk/utils/svelte';
	import { onMount } from 'svelte';

	export let sectors = []; // rows of {sector, label}, in display order
	export let name = 'sector';

	const inputs = getInputContext();
	const ALL = { sector: 'all', label: 'All industries' };

	let current = 'all';
	let wantFromUrl = null; // key found in the address, applied once the list is known
	const list = () => [ALL, ...Array.from(sectors ?? [])];
	$: options = list();

	function publish(key) {
		const o = list().find((x) => x.sector === key) ?? ALL;
		current = o.sector;
		$inputs[name] = { label: o.label, value: o.sector, rawValues: [{ label: o.label, value: o.sector }] };
	}
	publish('all'); // also sets the value for the static pre-render

	function syncUrl(key) {
		try {
			const u = new URL(location.href);
			if (key === 'all') u.searchParams.delete(name);
			else u.searchParams.set(name, key);
			history.replaceState(history.state, '', u);
		} catch (e) {}
	}

	function onChange(e) {
		publish(e.currentTarget.value);
		syncUrl(current);
	}

	onMount(() => {
		try {
			wantFromUrl = new URLSearchParams(location.search).get(name);
		} catch (e) {}
	});

	$: if (wantFromUrl && options.some((o) => o.sector === wantFromUrl)) {
		publish(wantFromUrl);
		wantFromUrl = null;
	}
</script>

<label class="sector-pick">
	<span class="lab">Sector</span>
	<select value={current} on:change={onChange} aria-label="Sector">
		{#each options as o}<option value={o.sector}>{o.label}</option>{/each}
	</select>
</label>

<style>
	.sector-pick {
		display: inline-flex;
		align-items: center;
		gap: 0;
		border: 1px solid rgba(127, 127, 127, 0.4);
		border-radius: 6px;
		font-size: 13px;
		margin: 6px 0;
		overflow: hidden;
	}
	.lab {
		padding: 6px 10px;
		font-weight: 500;
		border-right: 1px solid rgba(127, 127, 127, 0.3);
		opacity: 0.85;
	}
	select {
		font: inherit;
		color: inherit;
		background: transparent;
		border: 0;
		padding: 6px 10px;
		cursor: pointer;
		max-width: 70vw;
	}
	select:focus-visible {
		outline: 2px solid #2a78d6;
		outline-offset: -2px;
	}
	select option {
		color: #0b0b0b;
		background: #fff;
	}
	@media (prefers-color-scheme: dark) {
		select option {
			color: #fff;
			background: #1a1a19;
		}
	}
</style>
