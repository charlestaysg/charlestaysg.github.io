<script>
	// IMDA survey figures, entered by hand in ../sme-pulse/data/manual.json.
	export let meta;
	const m = meta ?? {};
</script>

<section class="survey" aria-labelledby="sv">
	<span class="pill">Survey figures · entered by hand</span>
	<h2 id="sv">AI at work: adoption is rising faster than training</h2>
	<div class="sgrid">
		<div>
			<div class="big">{m.imda_pct_b}%</div>
			<div class="what">of SMEs used AI in {m.imda_year_b}</div>
			<div class="was">up from {m.imda_pct_a}% in {m.imda_year_a}</div>
		</div>
		<div>
			<div class="big">{m.imda_need_upskilling_pct}%</div>
			<div class="what">of workers say they need AI upskilling</div>
		</div>
		<div>
			<div class="big">{m.imda_trained_pct}%</div>
			<div class="what">of workers had AI training in the past year</div>
		</div>
	</div>
	<p class="cap">
		<a href={m.imda_url} rel="noopener">{m.imda_source}</a>. These are survey results, not part of the
		quarterly MOM series, and are not broken down by the sector filter above. Entered by hand on {m.imda_retrieved}.
	</p>
</section>

<style>
	.survey {
		background: #fbf7ee;
		border: 1.5px dashed #d9c9a3;
		border-radius: 12px;
		padding: 16px;
		margin: 12px 0;
		color: #2b2820;
	}
	.pill {
		display: inline-block;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.03em;
		color: #6b5a2e;
		border: 1px solid #d9c9a3;
		border-radius: 999px;
		padding: 1px 8px;
		margin-bottom: 8px;
	}
	h2 {
		font-size: 15px;
		font-weight: 600;
		margin: 0 0 10px;
	}
	.sgrid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16px;
	}
	.big {
		font-size: 28px;
		font-weight: 600;
		line-height: 1.1;
	}
	.what {
		font-size: 13px;
		opacity: 0.85;
	}
	.was {
		font-size: 12px;
		opacity: 0.65;
	}
	.cap {
		font-size: 12px;
		margin: 12px 0 0;
		opacity: 0.85;
	}
	.cap a {
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	@media (prefers-color-scheme: dark) {
		.survey {
			background: #221e14;
			border-color: #5c4f2c;
			color: #efe6cf;
		}
		.pill {
			color: #d8c58f;
			border-color: #5c4f2c;
		}
	}
	@media (max-width: 560px) {
		.sgrid {
			grid-template-columns: 1fr;
		}
	}
</style>
