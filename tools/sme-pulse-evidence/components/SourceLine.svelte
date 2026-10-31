<script>
	// "Source: MOM, <dataset> and <dataset> (data.gov.sg)". rows: [{title, url}]
	export let rows = [];
</script>

<p class="srcline">
	Source: MOM, {#each Array.from(rows ?? []) as r, i}{#if i > 0}{' and '}{/if}<a href={r.url} rel="noopener">{r.title}</a>{/each} (data.gov.sg)
</p>

<style>
	.srcline {
		font-size: 12px;
		margin: 8px 0 0;
		opacity: 0.8;
	}
	.srcline a {
		text-decoration: underline;
		text-underline-offset: 2px;
	}
</style>
