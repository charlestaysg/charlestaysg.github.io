<script>
	// Data licence, IMDA line and the unofficial / not-live notes. Same text as the hand-built page.
	export let meta;
	export let datasets = [];
	const m = meta ?? {};
</script>

<footer class="pulse-foot">
	<p>
		Contains information from {#each Array.from(datasets) as d, i}{#if i > 0}; {/if}<a href={d.url}
				>{d.title}</a
			>{/each}, accessed on {m.fetched} from data.gov.sg, which is made available under the terms of
		the
		<a href="https://data.gov.sg/open-data-licence">Singapore Open Data Licence version 1.0</a>.
		Original source: Labour Market Survey, Manpower Research &amp; Statistics Department, Ministry of
		Manpower.
	</p>
	<p>Survey figures: <a href={m.imda_url} rel="noopener">{m.imda_source}</a>.</p>
	<p>
		This is an unofficial teaching example, not a product of MOM, IMDA or any government agency.
		Figures were fetched on {m.fetched_label} and are not live. The page checks data.gov.sg for new MOM
		figures each month (last checked {m.checked_label}); MOM publishes each quarter a few months after
		it ends. Not advice.
	</p>
</footer>

<style>
	.pulse-foot {
		font-size: 12px;
		line-height: 1.6;
		margin-top: 20px;
		opacity: 0.85;
	}
	.pulse-foot p {
		margin: 0 0 8px;
	}
	.pulse-foot a {
		text-decoration: underline;
		text-underline-offset: 2px;
	}
</style>
