<script>
	// SCTP programmes for the chosen sector, grouped by institution, plus the landscape link.
	// programmes: rows of {inst, title, ref}; institutions: rows of {code, name, url}.
	// ref is the first course reference number; the title links to that course on MySkillsFuture.
	export let sector = 'all';
	export let label = '';
	export let programmes = [];
	export let institutions = [];
	export let collected = '';
	export let datasetUrl = '';

	const LANDSCAPE = '/projects/skills-landscape/';
	const COURSE_URL = 'https://courses.myskillsfuture.gov.sg/courses/';
	$: mine = Array.from(programmes ?? []);
	$: groups = Array.from(institutions ?? [])
		.filter((i) => mine.some((p) => p.inst === i.code))
		.map((i) => ({ ...i, items: mine.filter((p) => p.inst === i.code) }));
	$: landscapeHref = LANDSCAPE + (sector !== 'all' ? '?sector=' + sector : '');
	$: landscapeText =
		sector !== 'all'
			? `All ${label} courses on MySkillsFuture, not just SCTPs, on the Skills Training Landscape →`
			: 'All SkillsFuture-listed courses by sector, not just SCTPs, on the Skills Training Landscape →';
</script>

{#if sector === 'all'}
	<p class="sc-hint">
		Pick a sector above to list its SCTP programmes. List from {#if datasetUrl}<a href={datasetUrl} rel="noopener">SkillsFuture's course directory</a>{:else}SkillsFuture's course directory{/if}
		(SWDA, data.gov.sg); institution pages: {#each Array.from(institutions ?? []) as i, n}{#if n > 0},
			{/if}<a href={i.url} rel="noopener">{i.code}</a>{/each}.
	</p>
{:else if mine.length === 0}
	<p class="sc-sel">
		{label}: no SCTP programme from the six institutions is listed in SkillsFuture's course directory
		as of {collected}. Other training providers also run SCTPs; check MySkillsFuture.
	</p>
{:else}
	<p class="sc-sel">
		{label}: {mine.length} SCTP programme{mine.length > 1 ? 's' : ''} found.
	</p>
	{#each groups as g}
		<h3 class="sc-h"><a href={g.url} rel="noopener">{g.name} ↗</a></h3>
		<ul class="sc-ul">
			{#each g.items as p}<li>{#if p.ref}<a href={COURSE_URL + p.ref} rel="noopener">{p.title}</a>{:else}{p.title}{/if}</li>{/each}
		</ul>
	{/each}
{/if}
<a class="sc-landscape" href={landscapeHref}>{landscapeText}</a>

<style>
	.sc-hint {
		font-size: 13px;
		opacity: 0.85;
		margin: 12px 0 0;
	}
	.sc-hint a,
	.sc-h a,
	.sc-ul a {
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.sc-sel {
		font-size: 14px;
		margin: 12px 0 0;
		padding: 10px 12px;
		border-radius: 8px;
		background: rgba(127, 127, 127, 0.1);
	}
	.sc-h {
		font-size: 13px;
		font-weight: 600;
		margin: 12px 0 4px;
	}
	.sc-ul {
		margin: 0;
		padding-left: 18px;
		font-size: 13px;
		opacity: 0.85;
		list-style: disc;
	}
	.sc-landscape {
		display: inline-block;
		margin-top: 10px;
		font-size: 13px;
		color: #2a78d6;
	}
	@media (prefers-color-scheme: dark) {
		.sc-landscape {
			color: #7fb1ee;
		}
	}
</style>
