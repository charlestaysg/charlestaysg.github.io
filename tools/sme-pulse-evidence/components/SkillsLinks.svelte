<script>
	// "Skills to train for": Skills Framework, Jobs Transformation Map and course-search links per sector.
	// Names as listed at jobsandskills.swda.gov.sg/frameworks/sector-information (checked 11 Oct 2026).
	// pdf: file under SFW_BASE; page: a web page used instead where the portal links to one.
	// If a link breaks, fix the URL here (it is the same list as SKILLS in ../sme-pulse/template.html).
	export let sector = 'all';
	export let label = 'All industries';

	const SFW_BASE = 'https://jobsandskills.skillsfuture.gov.sg/resources/skills-framework-sector/';
	const DEMAND_DASH =
		'https://jobsandskills.swda.gov.sg/data-and-tools/dashboards/job-skills-demand-trends-dashboard';
	const SFW_INDEX = 'https://jobsandskills.swda.gov.sg/frameworks/sector-information';
	const JTM = 'https://www.wsg.gov.sg/home/employers-industry-partners/jobs-transformation-maps/';
	const SKILLS = {
		manufacturing: [
			{ n: 'Precision Engineering', pdf: 'Precision-Engineering.pdf' },
			{ n: 'Electronics', pdf: 'Electronics.pdf' },
			{ n: 'Food Manufacturing', pdf: 'Food-Manufacturing.pdf' }
		],
		construction: [{ n: 'Built Environment', pdf: 'Built-environment.pdf' }],
		transport: [
			{ n: 'Logistics', pdf: 'Logistics.pdf' },
			{ n: 'Public Transport', pdf: 'Public-Transport.pdf' }
		],
		food: [
			{
				n: 'Food Services',
				page: JTM + 'jobs-transformation-map-singapore-food-services-industry',
				kind: 'Jobs Transformation Map (WSG)'
			},
			{ n: 'Hotel and Accommodation Services', pdf: 'Hotel-and-Accommodation%20Services.pdf' }
		],
		health: [
			{ n: 'Healthcare', pdf: 'Healthcare.pdf' },
			{ n: 'Social Service', pdf: 'Social-Service.pdf' }
		],
		admin: [
			{ n: 'Security', pdf: 'Security.pdf' },
			{ n: 'Environmental Services', pdf: 'Environmental-Services.pdf' }
		],
		security: [{ n: 'Security', pdf: 'Security.pdf' }],
		retail: [
			{ n: 'Retail', pdf: 'Retail.pdf' },
			{ n: 'Wholesale Trade', pdf: 'Wholesale-Trade.pdf' }
		],
		ict: [
			{
				n: 'Infocomm Technology',
				page: JTM + 'jobs-transformation-map-ict-and-media-jobs-in-singapore',
				kind: 'Jobs Transformation Map (WSG)'
			}
		],
		finance: [{ n: 'Financial Services', pdf: 'Financial-Services.pdf' }],
		publicedu: [{ n: 'Training and Adult Education', pdf: 'Training-and-Adult-Education.pdf' }]
	};
	const courseUrl = (q) => 'https://courses.myskillsfuture.gov.sg/search?q=' + encodeURIComponent(q);

	$: list = SKILLS[sector];
	$: links = (() => {
		const out = [];
		if (list) {
			for (const f of list) {
				out.push(
					f.pdf
						? { href: SFW_BASE + f.pdf, title: `${f.n}: Skills Framework`, sub: 'PDF download · job roles, skills and career paths' }
						: { href: f.page, title: `${f.n}: ${f.kind}`, sub: 'Web page · how jobs and skills in the sector are changing' }
				);
				out.push({ href: courseUrl(f.n), title: `${f.n}: courses`, sub: 'MySkillsFuture course search' });
			}
		} else {
			out.push({ href: SFW_INDEX, title: 'Skills Frameworks for 38 sectors', sub: 'SWDA Jobs-Skills Portal' });
		}
		out.push({
			href: DEMAND_DASH,
			title: 'Jobs-Skills Demand Trends dashboard',
			sub: 'Hiring demand and in-demand skills by job role. Pick the sector inside the dashboard.'
		});
		return out;
	})();
	$: heading = sector === 'all' ? 'Skills to train for' : `Skills to train for · ${label}`;
	$: hint = list
		? `Where hiring is tight, these SWDA (SkillsFuture) resources show the job roles and skills employers in this sector ask for. Skills Framework sectors don't match MOM's industry groups exactly.`
		: sector === 'all'
			? 'Pick a sector above for its Skills Framework and courses.'
			: `No single Skills Framework matches ${label}; browse the frameworks for all 38 sectors.`;
</script>

<h2 class="sk-h">{heading}</h2>
<p class="sk-hint">{hint}</p>
<div class="sk-links">
	{#each links as l}
		<a href={l.href} rel="noopener">{l.title} ↗<small>{l.sub}</small></a>
	{/each}
</div>

<style>
	.sk-h {
		font-size: 15px;
		font-weight: 600;
		margin: 0;
	}
	.sk-hint {
		font-size: 13px;
		opacity: 0.8;
		margin: 2px 0 0;
	}
	.sk-links {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: 8px;
		margin-top: 12px;
	}
	.sk-links a {
		display: block;
		border: 1px solid rgba(127, 127, 127, 0.3);
		border-radius: 8px;
		padding: 10px 12px;
		text-decoration: none;
		font-size: 14px;
		line-height: 1.35;
	}
	.sk-links a:hover {
		border-color: #2a78d6;
	}
	.sk-links small {
		display: block;
		font-size: 12px;
		margin-top: 2px;
		opacity: 0.65;
	}
</style>
