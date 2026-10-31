<script>
	import '@evidence-dev/tailwind/fonts.css';
	import '../app.css';
	import { EvidenceDefaultLayout } from '@evidence-dev/core-components';
	export let data;
</script>

<!-- Slim site bar: the same links as the hand-built page. These are plain site paths, so they
     do not get Evidence's base path added (only +page.md files do). -->
<nav class="sitebar" aria-label="Site">
	<div class="sb-in">
		<a class="me" href="/">Charles Tay</a>
		<a href="/#work">Work</a><a href="/#news">News</a><a href="/#about">About</a><a href="/#toolkit"
			>Toolkit</a
		><a href="/#contact">Contact</a>
		<a class="tb-ext" href="https://www.linkedin.com/in/charlestay" rel="noopener">LinkedIn ↗</a>
	</div>
</nav>

<!-- One page: no sidebar, header, breadcrumbs or contents list. -->
<EvidenceDefaultLayout
	{data}
	neverShowQueries={true}
	hideSidebar={true}
	hideHeader={true}
	hideBreadcrumbs={true}
	hideTOC={true}
	builtWithEvidence={false}
	fullWidth={true}
	maxWidth="1100px"
>
	<slot slot="content" />
</EvidenceDefaultLayout>

<p class="site-disclaimer">
	Shared in a personal capacity, not on behalf of or recommended by my employer. Not professional
	advice. Install and try any tool at your own risk: back up your data first and watch out for
	malware. <a href="/disclaimer/">Full disclaimer</a>.
</p>

<style>
	/* The page draws its own title with the Unofficial badge; hide the one Evidence adds from the front matter. */
	:global(h1.title) {
		display: none;
	}
	.sitebar,
	.sitebar :global(*) {
		box-sizing: border-box;
	}
	.sitebar {
		position: relative;
		z-index: 1200;
		display: block;
		width: auto;
		padding: 10px 16px;
		background: #f3f6fa;
		border-bottom: 1px solid #d6dee9;
		font: 14px/1.4 'IBM Plex Mono', ui-monospace, 'SF Mono', Menlo, monospace;
	}
	.sb-in {
		max-width: 860px;
		margin: 0 auto;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 4px 18px;
	}
	.sitebar a {
		display: inline;
		padding: 0;
		border: 0;
		background: none;
		color: #0b1324;
		text-decoration: none;
		white-space: nowrap;
	}
	.sitebar a:hover {
		color: #148a4e;
	}
	.sitebar .me {
		font: 900 18px/1.2 Barlow, 'Helvetica Neue', Arial, sans-serif;
		letter-spacing: -0.02em;
		margin-right: auto;
	}
	.sitebar .tb-ext {
		color: #148a4e;
	}
	@media (prefers-color-scheme: dark) {
		.sitebar {
			background: #0b1324;
			border-color: #1f2a40;
		}
		.sitebar a {
			color: #e6edf7;
		}
		.sitebar a:hover,
		.sitebar .tb-ext {
			color: #3ddc84;
		}
	}
	@media (max-width: 640px) {
		.sitebar {
			font-size: 13px;
			padding: 8px 16px;
		}
		.sb-in {
			gap: 2px 14px;
		}
		.sitebar .tb-ext {
			display: none;
		}
	}
	@media (max-width: 480px) {
		.sitebar .me {
			flex-basis: 100%;
		}
	}
	.site-disclaimer {
		max-width: 1100px;
		margin: 0 auto;
		padding: 16px 16px 32px;
		font-size: 13px;
		line-height: 1.5;
		opacity: 0.75;
	}
</style>
