<script>
	// Title, sub line, Pre-visit Fact Sheet link, freshness line and the "may be out of date" notice.
	// Lives in a component so the site paths below are not rewritten with Evidence's base path.
	export let meta;
	const m = meta ?? {};

	// Warn readers when the monthly refresh has stopped: over 40 days allows for one late run.
	let staleText = '';
	import { onMount } from 'svelte';
	onMount(() => {
		const days = Math.floor((Date.now() - Date.parse(m.checked + 'T00:00:00+08:00')) / 864e5);
		if (days > 40)
			staleText = `This page may be out of date: last checked ${m.checked_label}, ${days} days ago. It normally refreshes early each month.`;
	});
</script>

<div class="pulse-head">
	<div>
		<h1 class="pulse-title">
			SME Workforce Pulse <span class="pulse-badge">Unofficial</span>
		</h1>
		<p class="pulse-sub">
			Job vacancies, vacancy rates and retrenchments in Singapore, by sector. Source: MOM Labour
			Market Survey via data.gov.sg.
		</p>
		<p class="pulse-companion">
			Meeting a company? Look it up on the
			<a href="/projects/uen-sheet/">Pre-visit Fact Sheet</a> for its ACRA record, sector figures and
			questions to ask.
		</p>
	</div>
	<div class="pulse-fresh" class:stale={staleText !== ''}>
		<span class="pulse-dot" aria-hidden="true" /><span>{m.fresh_line}</span>
	</div>
</div>
{#if staleText}<p class="pulse-stale" role="status">{staleText}</p>{/if}

<style>
	.pulse-head {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		justify-content: space-between;
		gap: 8px 24px;
		margin: 8px 0 16px;
	}
	.pulse-title {
		font-size: 26px;
		line-height: 1.2;
		margin: 0;
		font-weight: 700;
		letter-spacing: -0.01em;
	}
	.pulse-badge {
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		border: 1px solid currentColor;
		border-radius: 999px;
		padding: 1px 8px;
		opacity: 0.65;
		vertical-align: middle;
	}
	.pulse-sub,
	.pulse-companion {
		margin: 4px 0 0;
		font-size: 14px;
		opacity: 0.8;
	}
	.pulse-companion {
		font-size: 13px;
	}
	.pulse-companion a {
		color: var(--blue-700, #2a78d6);
		text-decoration: underline;
	}
	.pulse-fresh {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 13px;
		opacity: 0.85;
	}
	.pulse-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #2a78d6;
		flex: none;
	}
	.pulse-fresh.stale .pulse-dot {
		background: #b08a2e;
	}
	.pulse-stale {
		margin: 0 0 16px;
		padding: 10px 14px;
		border: 1px solid #d9c9a3;
		border-radius: 10px;
		background: #fbf7ee;
		color: #6b5a2e;
		font-size: 14px;
	}
	@media (prefers-color-scheme: dark) {
		.pulse-companion a {
			color: #7fb1ee;
		}
		.pulse-stale {
			background: #221e14;
			border-color: #5c4f2c;
			color: #d8c58f;
		}
	}
	@media (max-width: 560px) {
		.pulse-title {
			font-size: 22px;
		}
		.pulse-fresh {
			align-items: flex-start;
		}
	}
</style>
