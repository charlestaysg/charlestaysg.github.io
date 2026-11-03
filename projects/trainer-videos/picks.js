// Built by tools/build-hn-picks.py. Do not edit by hand.
window.TOPICS = ["Learning and teaching", "Thinking, writing and speaking", "Mentoring, coaching and feedback", "Managing and leading people", "Careers and work", "How AI works", "AI and the future of work", "Making things (craft and engineering stories)"];
window.METHOD_HTML = "<p><b>Idea.</b> Instead of YouTube&#x27;s own ranking, count how many different Hacker News (HN) commenters independently point other people to the same video. A video makes the list only if at least three different commenters linked it.</p><p><b>Source.</b> The public HN search API (Algolia), comments only, from 25 February 2007 to 2 November 2026. Collected on 3 November 2026.</p><p><b>Queries.</b> &quot;youtube.com&quot; and &quot;youtu.be&quot;, each split into time slices small enough to return every match (no slice was reported over the 1,000-result limit; the one query that returned exactly 1,000, &quot;youtube workshop&quot;, may be capped). Then 48 topic queries of the form &quot;youtube + word&quot;: talk, lecture, mentoring, mentor, coaching, feedback, management, manager, leadership, teaching, teacher, students, tutor, learning, how to learn, study, education, curriculum, memory, training, workshop, facilitation, onboarding, apprenticeship, career, career advice, burnout, hiring, interview, negotiation, meetings, writing, presentation, public speaking, productivity, note taking, motivation, psychology, critical thinking, deliberate practice, spaced repetition, explain, machine learning, neural network, LLM, AI, automation, future of work.</p><p><b>Counts.</b></p><ul><li>485,647 comment rows fetched; 338,913 distinct comments after removing repeats across queries.</li><li>261,982 of those comments link to a YouTube video, covering 189,311 distinct video IDs (watch, youtu.be, embed, shorts and mobile links).</li><li>12,827 videos were linked by at least 3 different commenters. For each, we counted distinct comments, distinct commenters and distinct HN stories.</li><li>YouTube&#x27;s oEmbed check removed 874 of those as private, removed or blocked (555 not found, 236 forbidden, 83 unauthorised), leaving 11,953. Duration and upload date came from yt-dlp; 3 more picks were dropped because yt-dlp reported them blocked by copyright claims.</li><li>167 videos are in the final list. The other 11,786 available videos were left out as off-topic or not chosen.</li></ul><p><b>Choosing and sorting.</b> Titles and channels of the 11,953 videos were screened by keyword and channel patterns for each topic, then judged by hand on title, channel and a look at how commenters introduced the link. Music, trailers, comedy sketches, game clips, news clips, product demos and pure programming tutorials were excluded. Each kept video has one topic. The lines &quot;why&quot; and &quot;use_in_class&quot; are written for this list, not copied from comments.</p><p><b>Limits.</b></p><ul><li>HN readers lean towards programming and science, so mentoring, coaching and feedback are thinly covered (3 videos).</li><li>The hand review was thorough for the highest-ranked videos and for titles matching learning, leadership, career and mentoring words. Videos with only 3 commenters and no matching title words were not reviewed, so some on-topic videos will be missing.</li><li>HN search counts are estimates, and recommendations come from a self-selected group of commenters. A high count means many people point to a video, not that it is good teaching material; check it before use.</li><li>Videos can be removed or blocked later.</li></ul><p>Counts per topic: Learning and teaching 40; Thinking, writing and speaking 37; How AI works 24; AI and the future of work 20; Managing and leading people 19; Careers and work 18; Making things 6; Mentoring, coaching and feedback 3.</p>";
window.PICKS = [
{
"id": "u6XAPnuFjJc",
"title": "RSA ANIMATE: Drive: The surprising truth about what motivates us",
"channel": "Royal Society of Arts",
"duration": 648,
"uploaded": "2010-04-01",
"topic": "Managing and leading people",
"why": "Animated RSA summary of Dan Pink's argument that autonomy, mastery and purpose motivate better than bonuses.",
"use_in_class": "Show to open a session on motivating teams.",
"authors": 87,
"comments": 104,
"first_seen": "2010-05-23",
"last_seen": "2026-03-15",
"hn": [
"https://news.ycombinator.com/item?id=47387359",
"https://news.ycombinator.com/item?id=46319251",
"https://news.ycombinator.com/item?id=44494004"
]
},
{
"id": "PUv66718DII",
"title": "Bret Victor - Inventing on Principle",
"channel": "Rui Oliveira",
"duration": 3260,
"uploaded": "2012-02-22",
"topic": "Thinking, writing and speaking",
"why": "Bret Victor shows how making ideas visible and instantly editable changes how creators think.",
"use_in_class": "Use to discuss immediate feedback in learning design.",
"authors": 63,
"comments": 66,
"first_seen": "2012-02-29",
"last_seen": "2026-06-24",
"hn": [
"https://news.ycombinator.com/item?id=48665452",
"https://news.ycombinator.com/item?id=46935767",
"https://news.ycombinator.com/item?id=46507877"
]
},
{
"id": "UF8uR6Z6KLc",
"title": "Steve Jobs' 2005 Stanford Commencement Address",
"channel": "Stanford",
"duration": 904,
"uploaded": "2008-03-08",
"topic": "Careers and work",
"why": "Steve Jobs's 2005 graduation speech about dropping out, loss and finding work you love.",
"use_in_class": "Pick one of his three stories for a career reflection exercise.",
"authors": 52,
"comments": 56,
"first_seen": "2008-05-16",
"last_seen": "2026-08-25",
"hn": [
"https://news.ycombinator.com/item?id=49436333",
"https://news.ycombinator.com/item?id=46096913",
"https://news.ycombinator.com/item?id=42942834"
]
},
{
"id": "ji5_MqicxSo",
"title": "Randy Pausch's Last Lecture: Achieving Your Childhood Dreams",
"channel": "Carnegie Mellon University",
"duration": 4587,
"uploaded": "2007-12-20",
"topic": "Careers and work",
"why": "Randy Pausch's final university lecture on pursuing childhood dreams, helping others and using time well.",
"use_in_class": "Show an extract to open a talk on purpose and mentoring.",
"authors": 49,
"comments": 56,
"first_seen": "2008-03-16",
"last_seen": "2025-06-07",
"hn": [
"https://news.ycombinator.com/item?id=44211666",
"https://news.ycombinator.com/item?id=43233246",
"https://news.ycombinator.com/item?id=41483388"
]
},
{
"id": "8pTEmbeENF4",
"title": "Bret Victor   The Future of Programming",
"channel": "Joey Reid",
"duration": 1975,
"uploaded": "2013-07-31",
"topic": "Thinking, writing and speaking",
"why": "Bret Victor's performance talk, set in 1973, on not locking in your ways of working.",
"use_in_class": "Use as a model of a creative, well-structured talk.",
"authors": 49,
"comments": 55,
"first_seen": "2013-07-31",
"last_seen": "2026-10-06",
"hn": [
"https://news.ycombinator.com/item?id=49984179",
"https://news.ycombinator.com/item?id=48309546",
"https://news.ycombinator.com/item?id=45978393"
]
},
{
"id": "oKg1hTOQXoY",
"title": "Alan Kay at OOPSLA 1997 - The computer revolution hasnt happened yet",
"channel": "Jeff Gonis",
"duration": 3873,
"uploaded": "2013-02-12",
"topic": "Thinking, writing and speaking",
"why": "Alan Kay's keynote arguing the computer revolution has not happened yet, with thoughts on thinking and learning.",
"use_in_class": "Use for a discussion on the gap between tools and learning.",
"authors": 44,
"comments": 73,
"first_seen": "2013-04-08",
"last_seen": "2026-10-30",
"hn": [
"https://news.ycombinator.com/item?id=50303948",
"https://news.ycombinator.com/item?id=48649580",
"https://news.ycombinator.com/item?id=46172277"
]
},
{
"id": "vtIzMaLkCaM",
"title": "LEADERSHIP LAB: The Craft of Writing Effectively",
"channel": "UChicago Social Sciences",
"duration": 4911,
"uploaded": "2014-06-26",
"topic": "Thinking, writing and speaking",
"why": "Larry McEnerney's lecture on writing for the reader's needs rather than your own.",
"use_in_class": "Use in writing workshops on reader-focused structure.",
"authors": 38,
"comments": 57,
"first_seen": "2019-01-26",
"last_seen": "2026-10-07",
"hn": [
"https://news.ycombinator.com/item?id=49995814",
"https://news.ycombinator.com/item?id=48314304",
"https://news.ycombinator.com/item?id=47812880"
]
},
{
"id": "MFzDaBzBlL0",
"title": "The Backwards Brain Bicycle - Smarter Every Day 133",
"channel": "SmarterEveryDay",
"duration": 478,
"uploaded": "2015-04-24",
"topic": "Learning and teaching",
"why": "Smarter Every Day on a bicycle that steers backwards, showing how hard it is to unlearn a habit.",
"use_in_class": "Use to show unlearning in a hands-on session.",
"authors": 35,
"comments": 37,
"first_seen": "2015-05-31",
"last_seen": "2025-11-07",
"hn": [
"https://news.ycombinator.com/item?id=45845260",
"https://news.ycombinator.com/item?id=45765245",
"https://news.ycombinator.com/item?id=45326122"
]
},
{
"id": "Unzc731iCUY",
"title": "How to Speak",
"channel": "MIT OpenCourseWare",
"duration": 3822,
"uploaded": "2019-12-20",
"topic": "Thinking, writing and speaking",
"why": "MIT's Patrick Winston on how to speak: the opening, props and a delivery people remember.",
"use_in_class": "Show as a primer before learners prepare a talk.",
"authors": 34,
"comments": 39,
"first_seen": "2019-12-31",
"last_seen": "2026-05-05",
"hn": [
"https://news.ycombinator.com/item?id=48016747",
"https://news.ycombinator.com/item?id=46263429",
"https://news.ycombinator.com/item?id=45555951"
]
},
{
"id": "qbIk7-JPB2c",
"title": "Sparks of AGI: early experiments with GPT-4",
"channel": "Sebastien Bubeck",
"duration": 2912,
"uploaded": "2023-04-06",
"topic": "How AI works",
"why": "Microsoft researcher's talk on early tests showing what GPT-4 could do beyond predicting the next word.",
"use_in_class": "Use clips to open a debate on what AI can and cannot do.",
"authors": 33,
"comments": 43,
"first_seen": "2023-04-09",
"last_seen": "2026-07-09",
"hn": [
"https://news.ycombinator.com/item?id=48842839",
"https://news.ycombinator.com/item?id=46113482",
"https://news.ycombinator.com/item?id=45615177"
]
},
{
"id": "vJG698U2Mvo",
"title": "selective attention test",
"channel": "Daniel Simons",
"duration": 82,
"uploaded": "2010-03-10",
"topic": "Thinking, writing and speaking",
"why": "Short video test where viewers miss an obvious gorilla while counting passes.",
"use_in_class": "Run it live to show the limits of attention.",
"authors": 33,
"comments": 34,
"first_seen": "2011-02-28",
"last_seen": "2025-07-20",
"hn": [
"https://news.ycombinator.com/item?id=44627052",
"https://news.ycombinator.com/item?id=44474968",
"https://news.ycombinator.com/item?id=42986529"
]
},
{
"id": "3LopI4YeC4I",
"title": "Why Being Delusional is a Superpower",
"channel": "Veritasium",
"duration": 724,
"uploaded": "2020-08-28",
"topic": "Careers and work",
"why": "Veritasium on why overconfident people sometimes take risks that pay off, and the evidence behind it.",
"use_in_class": "Use to discuss confidence and risk-taking in careers.",
"authors": 32,
"comments": 39,
"first_seen": "2020-08-29",
"last_seen": "2025-07-23",
"hn": [
"https://news.ycombinator.com/item?id=44664901",
"https://news.ycombinator.com/item?id=41168325",
"https://news.ycombinator.com/item?id=40211577"
]
},
{
"id": "zjkBMFhNj_g",
"title": "[1hr Talk] Intro to Large Language Models",
"channel": "Andrej Karpathy",
"duration": 3588,
"uploaded": "2023-11-23",
"topic": "How AI works",
"why": "Karpathy's one-hour plain tour of what a large language model is and how it is trained.",
"use_in_class": "Show before a session on AI at work to give everyone a shared base.",
"authors": 32,
"comments": 35,
"first_seen": "2023-11-23",
"last_seen": "2026-06-25",
"hn": [
"https://news.ycombinator.com/item?id=48679374",
"https://news.ycombinator.com/item?id=48643652",
"https://news.ycombinator.com/item?id=45429754"
]
},
{
"id": "7xTGNNLPyMI",
"title": "Deep Dive into LLMs like ChatGPT",
"channel": "Andrej Karpathy",
"duration": 12683,
"uploaded": "2025-02-05",
"topic": "How AI works",
"why": "Three-and-a-half-hour walk through how ChatGPT-style models are built; the usual follow-on to Karpathy's short talk.",
"use_in_class": "Set as optional homework for staff who want depth on AI.",
"authors": 31,
"comments": 32,
"first_seen": "2025-02-15",
"last_seen": "2026-08-24",
"hn": [
"https://news.ycombinator.com/item?id=49422202",
"https://news.ycombinator.com/item?id=48477207",
"https://news.ycombinator.com/item?id=48422356"
]
},
{
"id": "meiU6TxysCg",
"title": "Two Monkeys Were Paid Unequally: Excerpt from Frans de Waal's TED Talk",
"channel": "TED Blog Video",
"duration": 164,
"uploaded": "2013-04-04",
"topic": "Managing and leading people",
"why": "Frans de Waal's clip of monkeys reacting to unequal pay for the same task.",
"use_in_class": "Use to discuss fairness and pay in teams.",
"authors": 28,
"comments": 31,
"first_seen": "2014-05-23",
"last_seen": "2026-09-18",
"hn": [
"https://news.ycombinator.com/item?id=49756520",
"https://news.ycombinator.com/item?id=42338371",
"https://news.ycombinator.com/item?id=42338367"
]
},
{
"id": "aircAruvnKk",
"title": "But what is a neural network? | Deep learning chapter 1",
"channel": "3Blue1Brown",
"duration": 1120,
"uploaded": "2017-10-05",
"topic": "How AI works",
"why": "Animated first chapter of a neural network series, showing how a network learns to read handwritten digits.",
"use_in_class": "Play ten minutes to explain machine learning without maths.",
"authors": 23,
"comments": 23,
"first_seen": "2017-10-19",
"last_seen": "2026-04-16",
"hn": [
"https://news.ycombinator.com/item?id=47794487",
"https://news.ycombinator.com/item?id=45892406",
"https://news.ycombinator.com/item?id=45227436"
]
},
{
"id": "hVimVzgtD6w",
"title": "The best stats you've ever seen | Hans Rosling",
"channel": "TED",
"duration": 1236,
"uploaded": "2007-01-16",
"topic": "Thinking, writing and speaking",
"why": "Hans Rosling uses animated data to challenge assumptions about the world.",
"use_in_class": "Use as a model of explaining data with a story.",
"authors": 23,
"comments": 23,
"first_seen": "2013-12-17",
"last_seen": "2026-07-23",
"hn": [
"https://news.ycombinator.com/item?id=49027958",
"https://news.ycombinator.com/item?id=48050390",
"https://news.ycombinator.com/item?id=46252564"
]
},
{
"id": "zDZFcDGpL4U",
"title": "RSA ANIMATE: Changing Education Paradigms",
"channel": "Royal Society of Arts",
"duration": 700,
"uploaded": "2010-10-14",
"topic": "Learning and teaching",
"why": "RSA animation of Sir Ken Robinson's case that schools were designed for another era.",
"use_in_class": "Use to start a debate on modern learning design.",
"authors": 22,
"comments": 27,
"first_seen": "2011-04-24",
"last_seen": "2026-07-08",
"hn": [
"https://news.ycombinator.com/item?id=48837616",
"https://news.ycombinator.com/item?id=45532937",
"https://news.ycombinator.com/item?id=43594247"
]
},
{
"id": "9eyFDBPk4Yw",
"title": "Admiral Grace Hopper Explains the Nanosecond",
"channel": "funbury",
"duration": 124,
"uploaded": "2012-03-01",
"topic": "Learning and teaching",
"why": "Grace Hopper hands out lengths of wire to show how far light travels in a nanosecond.",
"use_in_class": "Use as a model of explaining an abstract idea with a prop.",
"authors": 22,
"comments": 26,
"first_seen": "2020-01-16",
"last_seen": "2026-09-20",
"hn": [
"https://news.ycombinator.com/item?id=49774745",
"https://news.ycombinator.com/item?id=44599750",
"https://news.ycombinator.com/item?id=43784859"
]
},
{
"id": "42QuXLucH3Q",
"title": "Is Most Published Research Wrong?",
"channel": "Veritasium",
"duration": 742,
"uploaded": "2016-08-11",
"topic": "Thinking, writing and speaking",
"why": "Veritasium on why many published research findings fail to hold up.",
"use_in_class": "Use to teach critical reading of evidence.",
"authors": 22,
"comments": 24,
"first_seen": "2017-04-17",
"last_seen": "2026-06-07",
"hn": [
"https://news.ycombinator.com/item?id=48437592",
"https://news.ycombinator.com/item?id=46293125",
"https://news.ycombinator.com/item?id=45083610"
]
},
{
"id": "rhgwIhB58PA",
"title": "The Biggest Myth In Education",
"channel": "Veritasium",
"duration": 867,
"uploaded": "2021-07-09",
"topic": "Learning and teaching",
"why": "Veritasium on why 'learning styles' are a myth and what research says works in teaching.",
"use_in_class": "Use to challenge learning-styles beliefs in train-the-trainer sessions.",
"authors": 22,
"comments": 24,
"first_seen": "2021-09-10",
"last_seen": "2024-09-05",
"hn": [
"https://news.ycombinator.com/item?id=41453800",
"https://news.ycombinator.com/item?id=40903505",
"https://news.ycombinator.com/item?id=39636550"
]
},
{
"id": "wjZofJX0v4M",
"title": "Transformers, the tech behind LLMs | Deep Learning Chapter 5",
"channel": "3Blue1Brown",
"duration": 1634,
"uploaded": "2024-04-01",
"topic": "How AI works",
"why": "Animated explanation of transformers, the design behind chatbots, and how they turn text into predictions.",
"use_in_class": "Follow the neural network video with this to show how chatbots predict words.",
"authors": 22,
"comments": 22,
"first_seen": "2024-04-02",
"last_seen": "2026-09-22",
"hn": [
"https://news.ycombinator.com/item?id=49800758",
"https://news.ycombinator.com/item?id=48400517",
"https://news.ycombinator.com/item?id=47830832"
]
},
{
"id": "5ESJH1NLMLs",
"title": "Children Of The Magenta Line",
"channel": "Mossie Fly",
"duration": 1532,
"uploaded": "2019-05-27",
"topic": "AI and the future of work",
"why": "Training film on pilots losing manual skill by leaning on automation; HN readers cite it when talking about over-reliance on AI.",
"use_in_class": "Use to discuss which tasks staff should keep doing by hand.",
"authors": 19,
"comments": 26,
"first_seen": "2020-02-12",
"last_seen": "2026-10-30",
"hn": [
"https://news.ycombinator.com/item?id=50310682",
"https://news.ycombinator.com/item?id=50307393",
"https://news.ycombinator.com/item?id=50128273"
]
},
{
"id": "k2h2lvhzMDc",
"title": "Ed Catmull, Pixar: Keep Your Crises Small",
"channel": "Stanford Graduate School of Business",
"duration": 3251,
"uploaded": "2009-07-28",
"topic": "Managing and leading people",
"why": "Pixar's Ed Catmull on keeping small problems small, running creative teams and learning from failure.",
"use_in_class": "Use extracts on candid feedback and team culture.",
"authors": 18,
"comments": 21,
"first_seen": "2010-01-11",
"last_seen": "2019-03-02",
"hn": [
"https://news.ycombinator.com/item?id=19287160",
"https://news.ycombinator.com/item?id=14805930",
"https://news.ycombinator.com/item?id=13575700"
]
},
{
"id": "mScpHTIi-kM",
"title": "Once you understand game theory, you understand the world.",
"channel": "Veritasium",
"duration": 1638,
"uploaded": "2023-12-23",
"topic": "Thinking, writing and speaking",
"why": "Veritasium on game theory and how incentives shape choices.",
"use_in_class": "Use to prompt discussion on incentives in teams.",
"authors": 18,
"comments": 18,
"first_seen": "2023-12-24",
"last_seen": "2026-04-13",
"hn": [
"https://news.ycombinator.com/item?id=47755499",
"https://news.ycombinator.com/item?id=47198243",
"https://news.ycombinator.com/item?id=45034452"
]
},
{
"id": "Cj4y0EUlU-Y",
"title": "Feynman: How to think 1 of 2  FUN TO IMAGINE 11",
"channel": "Christopher Sykes",
"duration": 384,
"uploaded": "2009-01-24",
"topic": "Thinking, writing and speaking",
"why": "Feynman talks about how he thinks through problems.",
"use_in_class": "Use as a prompt to compare how people think.",
"authors": 16,
"comments": 18,
"first_seen": "2011-06-21",
"last_seen": "2024-06-22",
"hn": [
"https://news.ycombinator.com/item?id=40757810",
"https://news.ycombinator.com/item?id=40593833",
"https://news.ycombinator.com/item?id=37579229"
]
},
{
"id": "tWr39Q9vBgo",
"title": "Richard Feynman on Pseudoscience",
"channel": "Jacob Edward",
"duration": 113,
"uploaded": "2016-04-17",
"topic": "Thinking, writing and speaking",
"why": "Feynman on how to tell science from pseudoscience.",
"use_in_class": "Use to teach spotting weak claims.",
"authors": 16,
"comments": 18,
"first_seen": "2016-08-01",
"last_seen": "2026-07-20",
"hn": [
"https://news.ycombinator.com/item?id=48972874",
"https://news.ycombinator.com/item?id=48261769",
"https://news.ycombinator.com/item?id=44729047"
]
},
{
"id": "X2wLP0izeJE",
"title": "Ira Glass on Storytelling 3",
"channel": "warphotography",
"duration": 320,
"uploaded": "2009-07-11",
"topic": "Thinking, writing and speaking",
"why": "Ira Glass on the gap between taste and skill in creative work and how to close it.",
"use_in_class": "Use with early-career learners starting to create.",
"authors": 16,
"comments": 16,
"first_seen": "2017-01-23",
"last_seen": "2026-06-30",
"hn": [
"https://news.ycombinator.com/item?id=48731987",
"https://news.ycombinator.com/item?id=47685154",
"https://news.ycombinator.com/item?id=44468503"
]
},
{
"id": "fKy7ljRr0AA",
"title": "May 1, 1969: Fred Rogers testifies before the Senate Subcommittee on Communications",
"channel": "Road Less Marveled",
"duration": 411,
"uploaded": "2015-02-08",
"topic": "Thinking, writing and speaking",
"why": "Fred Rogers's calm 1969 plea to the US Senate to fund children's television.",
"use_in_class": "Show as a model of persuasive speaking with sincerity.",
"authors": 16,
"comments": 16,
"first_seen": "2015-12-08",
"last_seen": "2026-04-15",
"hn": [
"https://news.ycombinator.com/item?id=47780445",
"https://news.ycombinator.com/item?id=46226677",
"https://news.ycombinator.com/item?id=39125503"
]
},
{
"id": "9QMGAtxUlAc",
"title": "Principles of Technology Leadership | Bryan Cantrill | Monktoberfest 2017",
"channel": "RedMonk Tech Events",
"duration": 3082,
"uploaded": "2017-12-08",
"topic": "Managing and leading people",
"why": "Bryan Cantrill on setting company values and principles and why they guide hard decisions.",
"use_in_class": "Use to run a values-setting exercise with a team.",
"authors": 15,
"comments": 20,
"first_seen": "2017-12-09",
"last_seen": "2025-02-05",
"hn": [
"https://news.ycombinator.com/item?id=42952958",
"https://news.ycombinator.com/item?id=37105342",
"https://news.ycombinator.com/item?id=30374551"
]
},
{
"id": "ML4tw_UzqZE",
"title": "Building The World's First Computer - Greeks, Clocks and Rockets - Antikythera Mechanism Episode 1",
"channel": "Clickspring",
"duration": 412,
"uploaded": "2017-01-27",
"topic": "Making things (craft and engineering stories)",
"why": "A skilled machinist begins a replica of the Antikythera mechanism, an ancient Greek analogue computer.",
"use_in_class": "Use to show craft mastery through patient practice.",
"authors": 15,
"comments": 16,
"first_seen": "2018-01-23",
"last_seen": "2024-12-16",
"hn": [
"https://news.ycombinator.com/item?id=42433469",
"https://news.ycombinator.com/item?id=39894746",
"https://news.ycombinator.com/item?id=38614704"
]
},
{
"id": "cDA3_5982h8",
"title": "Exact Instructions Challenge - THIS is why my kids hate me. | Josh Darnit",
"channel": "Josh Darnit",
"duration": 443,
"uploaded": "2017-01-26",
"topic": "Learning and teaching",
"why": "A father tests how literally his children follow instructions for making a sandwich.",
"use_in_class": "Run the activity to teach clear instructions.",
"authors": 15,
"comments": 16,
"first_seen": "2017-02-18",
"last_seen": "2025-06-27",
"hn": [
"https://news.ycombinator.com/item?id=44399053",
"https://news.ycombinator.com/item?id=43854801",
"https://news.ycombinator.com/item?id=43659631"
]
},
{
"id": "vKA4w2O61Xo",
"title": "The Most Common Cognitive Bias",
"channel": "Veritasium",
"duration": 284,
"uploaded": "2014-02-24",
"topic": "Thinking, writing and speaking",
"why": "Veritasium on confirmation bias and why people seek evidence that agrees with them.",
"use_in_class": "Use as a warm-up on confirmation bias.",
"authors": 15,
"comments": 15,
"first_seen": "2015-02-12",
"last_seen": "2024-10-23",
"hn": [
"https://news.ycombinator.com/item?id=41924078",
"https://news.ycombinator.com/item?id=38745238",
"https://news.ycombinator.com/item?id=36436851"
]
},
{
"id": "oTugjssqOT0",
"title": "Randy Pausch Lecture: Time Management",
"channel": "Carnegie Mellon University",
"duration": 4582,
"uploaded": "2008-02-06",
"topic": "Careers and work",
"why": "Randy Pausch's practical talk on time: priorities, delegation and handling interruptions.",
"use_in_class": "Use as a base for a time management workshop.",
"authors": 14,
"comments": 16,
"first_seen": "2009-01-05",
"last_seen": "2021-12-23",
"hn": [
"https://news.ycombinator.com/item?id=29664348",
"https://news.ycombinator.com/item?id=25787615",
"https://news.ycombinator.com/item?id=25786824"
]
},
{
"id": "iG9CE55wbtY",
"title": "Do schools kill creativity? | Sir Ken Robinson | TED",
"channel": "TED",
"duration": 1203,
"uploaded": "2007-01-07",
"topic": "Learning and teaching",
"why": "Sir Ken Robinson's TED talk on how schools can stifle creativity.",
"use_in_class": "Use to open a discussion on creativity in training.",
"authors": 14,
"comments": 15,
"first_seen": "2010-11-29",
"last_seen": "2025-06-02",
"hn": [
"https://news.ycombinator.com/item?id=44157511",
"https://news.ycombinator.com/item?id=41932946",
"https://news.ycombinator.com/item?id=39666740"
]
},
{
"id": "5eW6Eagr9XA",
"title": "The Expert Myth",
"channel": "Veritasium",
"duration": 1078,
"uploaded": "2022-08-02",
"topic": "Learning and teaching",
"why": "Veritasium on what makes real expertise and when expert judgement can be trusted.",
"use_in_class": "Use to discuss feedback and practice in building skill.",
"authors": 14,
"comments": 15,
"first_seen": "2022-08-05",
"last_seen": "2026-06-09",
"hn": [
"https://news.ycombinator.com/item?id=48461667",
"https://news.ycombinator.com/item?id=46030689",
"https://news.ycombinator.com/item?id=45261595"
]
},
{
"id": "YnWhqhNdYyk",
"title": "CppCon 2015: Kate Gregory “Stop Teaching C\"",
"channel": "CppCon",
"duration": 3611,
"uploaded": "2015-10-19",
"topic": "Learning and teaching",
"why": "Kate Gregory argues that starting C++ learners on old C habits holds them back.",
"use_in_class": "Use to discuss where to start when sequencing a course.",
"authors": 13,
"comments": 21,
"first_seen": "2016-01-01",
"last_seen": "2025-03-09",
"hn": [
"https://news.ycombinator.com/item?id=43311369",
"https://news.ycombinator.com/item?id=38447599",
"https://news.ycombinator.com/item?id=31158996"
]
},
{
"id": "-4Yp3j_jk8Q",
"title": "Leslie Lamport: Thinking Above the Code",
"channel": "Microsoft Research",
"duration": 3590,
"uploaded": "2014-07-15",
"topic": "Thinking, writing and speaking",
"why": "Leslie Lamport argues that thinking clearly before writing code is the real work.",
"use_in_class": "Use to teach planning before doing.",
"authors": 13,
"comments": 15,
"first_seen": "2015-03-30",
"last_seen": "2026-05-09",
"hn": [
"https://news.ycombinator.com/item?id=48075169",
"https://news.ycombinator.com/item?id=45213153",
"https://news.ycombinator.com/item?id=33012568"
]
},
{
"id": "n8m7lFQ3njk",
"title": "Analogy as the Core of Cognition",
"channel": "Stanford",
"duration": 4117,
"uploaded": "2009-09-11",
"topic": "Thinking, writing and speaking",
"why": "Douglas Hofstadter argues that analogy is at the heart of thinking.",
"use_in_class": "Use to discuss teaching with analogies.",
"authors": 13,
"comments": 14,
"first_seen": "2011-12-18",
"last_seen": "2025-07-02",
"hn": [
"https://news.ycombinator.com/item?id=44445637",
"https://news.ycombinator.com/item?id=43796533",
"https://news.ycombinator.com/item?id=30217451"
]
},
{
"id": "5MgBikgcWnY",
"title": "The first 20 hours -- how to learn anything | Josh Kaufman | TEDxCSU",
"channel": "TEDx Talks",
"duration": 1167,
"uploaded": "2013-03-14",
"topic": "Learning and teaching",
"why": "Josh Kaufman's talk on learning a new skill in about twenty hours of focused practice.",
"use_in_class": "Show to introduce a self-directed learning project.",
"authors": 13,
"comments": 14,
"first_seen": "2014-03-01",
"last_seen": "2024-01-31",
"hn": [
"https://news.ycombinator.com/item?id=39207079",
"https://news.ycombinator.com/item?id=39086716",
"https://news.ycombinator.com/item?id=34425897"
]
},
{
"id": "bZQun8Y4L2A",
"title": "State of GPT | BRK216HFS",
"channel": "Microsoft Developer",
"duration": 2560,
"uploaded": "2023-05-25",
"topic": "How AI works",
"why": "Karpathy's Build 2023 talk on the stages used to train an assistant like ChatGPT and how to use one well.",
"use_in_class": "Show the training-stages slide to explain why chatbots behave as they do.",
"authors": 13,
"comments": 13,
"first_seen": "2023-05-26",
"last_seen": "2025-02-03",
"hn": [
"https://news.ycombinator.com/item?id=42913862",
"https://news.ycombinator.com/item?id=42259017",
"https://news.ycombinator.com/item?id=39074086"
]
},
{
"id": "EYPapE-3FRw",
"title": "Feynman on Scientific Method.",
"channel": "seabala",
"duration": 599,
"uploaded": "2011-02-18",
"topic": "Thinking, writing and speaking",
"why": "Feynman on the scientific method: guess, test, and drop what fails.",
"use_in_class": "Use as a short intro to testing assumptions.",
"authors": 12,
"comments": 16,
"first_seen": "2012-06-08",
"last_seen": "2026-01-13",
"hn": [
"https://news.ycombinator.com/item?id=46599281",
"https://news.ycombinator.com/item?id=41583999",
"https://news.ycombinator.com/item?id=40131701"
]
},
{
"id": "jkrNMKz9pWU",
"title": "A Hackers' Guide to Language Models",
"channel": "Jeremy Howard",
"duration": 5473,
"uploaded": "2023-09-24",
"topic": "How AI works",
"why": "Jeremy Howard's practical guide to using and prompting language models, aimed at people who write code.",
"use_in_class": "Pick sections for staff who want to prompt better.",
"authors": 12,
"comments": 14,
"first_seen": "2023-09-24",
"last_seen": "2024-11-27",
"hn": [
"https://news.ycombinator.com/item?id=42259017",
"https://news.ycombinator.com/item?id=40481194",
"https://news.ycombinator.com/item?id=40477084"
]
},
{
"id": "WO2X3oZEJOA",
"title": "Glitch Tokens - Computerphile",
"channel": "Computerphile",
"duration": 1168,
"uploaded": "2023-03-07",
"topic": "How AI works",
"why": "Computerphile on odd 'glitch tokens' that make language models misbehave, and what that says about how they read text.",
"use_in_class": "Use as a short example of why chatbots fail in strange ways.",
"authors": 12,
"comments": 13,
"first_seen": "2023-03-07",
"last_seen": "2024-05-12",
"hn": [
"https://news.ycombinator.com/item?id=40332991",
"https://news.ycombinator.com/item?id=40003611",
"https://news.ycombinator.com/item?id=37535147"
]
},
{
"id": "u4ZoJKF_VuA",
"title": "Start with why -- how great leaders inspire action | Simon Sinek | TEDxPugetSound",
"channel": "TEDx Talks",
"duration": 1081,
"uploaded": "2009-09-29",
"topic": "Managing and leading people",
"why": "Simon Sinek's talk on leaders who explain why they do things before what and how.",
"use_in_class": "Use as a base for discussing purpose and messaging.",
"authors": 12,
"comments": 13,
"first_seen": "2013-11-10",
"last_seen": "2024-01-08",
"hn": [
"https://news.ycombinator.com/item?id=38909329",
"https://news.ycombinator.com/item?id=38797705",
"https://news.ycombinator.com/item?id=37061027"
]
},
{
"id": "0SARbwvhupQ",
"title": "Google I/O 2009 - The Myth of the Genius Programmer",
"channel": "Google for Developers",
"duration": 3316,
"uploaded": "2009-06-02",
"topic": "Managing and leading people",
"why": "Talk arguing that the lone-genius myth harms teams and that open collaboration produces better work.",
"use_in_class": "Use in team collaboration and feedback workshops.",
"authors": 12,
"comments": 12,
"first_seen": "2011-04-27",
"last_seen": "2024-01-17",
"hn": [
"https://news.ycombinator.com/item?id=39034779",
"https://news.ycombinator.com/item?id=34409088",
"https://news.ycombinator.com/item?id=18543785"
]
},
{
"id": "L_Guz73e6fw",
"title": "Sam Altman: OpenAI CEO on GPT-4, ChatGPT, and the Future of AI | Lex Fridman Podcast #367",
"channel": "Lex Fridman",
"duration": 8636,
"uploaded": "2023-03-25",
"topic": "AI and the future of work",
"why": "Lex Fridman's long interview with Sam Altman on GPT-4, ChatGPT and where OpenAI thinks AI is heading.",
"use_in_class": "Use short clips to hear how an AI company leader frames the future.",
"authors": 12,
"comments": 12,
"first_seen": "2023-03-25",
"last_seen": "2026-10-21",
"hn": [
"https://news.ycombinator.com/item?id=50183351",
"https://news.ycombinator.com/item?id=36129416",
"https://news.ycombinator.com/item?id=35523319"
]
},
{
"id": "r8RxkpUvxK0",
"title": "Moishe Lettvin - What I Learned Doing 250 Interviews at Google",
"channel": "Etsy Eng (Etsy Engineering)",
"duration": 3624,
"uploaded": "2014-05-21",
"topic": "Careers and work",
"why": "A Google engineer's lessons from interviewing 250 candidates, on what separates strong from weak applicants.",
"use_in_class": "Use in interview-skills coaching for jobseekers.",
"authors": 11,
"comments": 16,
"first_seen": "2016-10-26",
"last_seen": "2025-11-02",
"hn": [
"https://news.ycombinator.com/item?id=45793634",
"https://news.ycombinator.com/item?id=40976153",
"https://news.ycombinator.com/item?id=40806738"
]
},
{
"id": "u404SLJj7ig",
"title": "Netscape Mozilla Documentary 1998 - 2000 ProJect Code Rush  - creative common licence",
"channel": "znoopy2k",
"duration": 3369,
"uploaded": "2009-07-15",
"topic": "Making things (craft and engineering stories)",
"why": "Documentary on Netscape's last years as its engineers prepared the open-source Mozilla under strain.",
"use_in_class": "Use to discuss team stress and change.",
"authors": 11,
"comments": 11,
"first_seen": "2011-02-11",
"last_seen": "2013-12-10",
"hn": [
"https://news.ycombinator.com/item?id=6880115",
"https://news.ycombinator.com/item?id=4276050",
"https://news.ycombinator.com/item?id=3933946"
]
},
{
"id": "LCEmiRjPEtQ",
"title": "Andrej Karpathy: Software Is Changing (Again)",
"channel": "Y Combinator",
"duration": 2371,
"uploaded": "2025-06-19",
"topic": "AI and the future of work",
"why": "Karpathy's talk on software moving from hand-written code to prompts and agents.",
"use_in_class": "Use to start a discussion on how job tasks may shift.",
"authors": 10,
"comments": 10,
"first_seen": "2025-06-19",
"last_seen": "2025-09-21",
"hn": [
"https://news.ycombinator.com/item?id=45323302",
"https://news.ycombinator.com/item?id=45153342",
"https://news.ycombinator.com/item?id=44942098"
]
},
{
"id": "eMlx5fFNoYc",
"title": "Attention in transformers, step-by-step | Deep Learning Chapter 6",
"channel": "3Blue1Brown",
"duration": 1569,
"uploaded": "2024-04-07",
"topic": "How AI works",
"why": "Animated walk through attention, the step that lets a language model weigh the words around each word.",
"use_in_class": "Use for curious learners who have already seen the transformer chapter.",
"authors": 10,
"comments": 10,
"first_seen": "2024-04-15",
"last_seen": "2026-06-12",
"hn": [
"https://news.ycombinator.com/item?id=48510295",
"https://news.ycombinator.com/item?id=48321181",
"https://news.ycombinator.com/item?id=44272185"
]
},
{
"id": "fW8amMCVAJQ",
"title": "First Follower: Leadership Lessons from Dancing Guy",
"channel": "Derek Sivers",
"duration": 177,
"uploaded": "2010-02-11",
"topic": "Managing and leading people",
"why": "Derek Sivers's three-minute clip showing how the first follower turns a lone dancer into a movement.",
"use_in_class": "Show to start a discussion on leaders and followers.",
"authors": 10,
"comments": 10,
"first_seen": "2016-06-30",
"last_seen": "2026-09-15",
"hn": [
"https://news.ycombinator.com/item?id=49715642",
"https://news.ycombinator.com/item?id=46455478",
"https://news.ycombinator.com/item?id=43481432"
]
},
{
"id": "ga_7j72CVlc",
"title": "Richard Feynman: \"What's the name of a bird?\"",
"channel": "Yves Messer",
"duration": 99,
"uploaded": "2013-09-27",
"topic": "Thinking, writing and speaking",
"why": "Feynman on the difference between knowing the name of a thing and knowing the thing.",
"use_in_class": "Use to discuss recall versus understanding.",
"authors": 10,
"comments": 10,
"first_seen": "2016-03-22",
"last_seen": "2026-01-31",
"hn": [
"https://news.ycombinator.com/item?id=46834644",
"https://news.ycombinator.com/item?id=41096909",
"https://news.ycombinator.com/item?id=38574138"
]
},
{
"id": "wxL4ElboiuA",
"title": "The Art of Making a Nixie Tube",
"channel": "Dalibor Farný",
"duration": 2270,
"uploaded": "2016-09-29",
"topic": "Making things (craft and engineering stories)",
"why": "A craftsman makes a Nixie display tube by hand from start to finish.",
"use_in_class": "Use to show a craft skill from start to finish.",
"authors": 10,
"comments": 10,
"first_seen": "2017-03-06",
"last_seen": "2026-06-15",
"hn": [
"https://news.ycombinator.com/item?id=48548443",
"https://news.ycombinator.com/item?id=47233391",
"https://news.ycombinator.com/item?id=35380793"
]
},
{
"id": "Gj8IA6xOpSk",
"title": "The call to learn | Clifford Stoll",
"channel": "TED",
"duration": 1071,
"uploaded": "2008-03-27",
"topic": "Learning and teaching",
"why": "Clifford Stoll's energetic TED talk on curiosity and the value of learning.",
"use_in_class": "Use as an energetic opener for a learning session.",
"authors": 10,
"comments": 10,
"first_seen": "2009-01-22",
"last_seen": "2025-06-23",
"hn": [
"https://news.ycombinator.com/item?id=44356979",
"https://news.ycombinator.com/item?id=41331845",
"https://news.ycombinator.com/item?id=21835048"
]
},
{
"id": "rrkrvAUbU9Y",
"title": "The puzzle of motivation | Dan Pink | TED",
"channel": "TED",
"duration": 1117,
"uploaded": "2009-08-25",
"topic": "Managing and leading people",
"why": "Dan Pink's TED talk on why money motivates routine tasks but not creative ones.",
"use_in_class": "Use for a quick start on motivation and reward design.",
"authors": 10,
"comments": 10,
"first_seen": "2010-03-22",
"last_seen": "2026-02-10",
"hn": [
"https://news.ycombinator.com/item?id=46960956",
"https://news.ycombinator.com/item?id=46834602",
"https://news.ycombinator.com/item?id=36655280"
]
},
{
"id": "5ODzO7Lz_pw",
"title": "Thomas Thwaites: How I built a toaster -- from scratch",
"channel": "TED",
"duration": 682,
"uploaded": "2011-01-14",
"topic": "Making things (craft and engineering stories)",
"why": "Thomas Thwaites tries to build a toaster from raw materials and finds how complex everyday things are.",
"use_in_class": "Use to show how little we understand about everyday things.",
"authors": 10,
"comments": 10,
"first_seen": "2019-07-15",
"last_seen": "2025-07-04",
"hn": [
"https://news.ycombinator.com/item?id=44465407",
"https://news.ycombinator.com/item?id=43247790",
"https://news.ycombinator.com/item?id=42362785"
]
},
{
"id": "IlU-zDU6aQ0",
"title": "Marty Lobdell - Study Less Study Smart",
"channel": "Pierce College District WA",
"duration": 3595,
"uploaded": "2011-07-22",
"topic": "Learning and teaching",
"why": "College psychology teacher Marty Lobdell's lecture on study methods that have evidence behind them.",
"use_in_class": "Hand to learners as a study skills primer.",
"authors": 9,
"comments": 14,
"first_seen": "2015-08-05",
"last_seen": "2024-08-24",
"hn": [
"https://news.ycombinator.com/item?id=41338230",
"https://news.ycombinator.com/item?id=39329273",
"https://news.ycombinator.com/item?id=38791680"
]
},
{
"id": "NHopJHSlVo4",
"title": "Keep your goals to yourself | Derek Sivers",
"channel": "TED",
"duration": 226,
"uploaded": "2010-09-02",
"topic": "Careers and work",
"why": "Derek Sivers's three-minute talk arguing that telling people your goals can make you less likely to reach them.",
"use_in_class": "Use as a quick debate starter on goal setting.",
"authors": 9,
"comments": 12,
"first_seen": "2010-10-02",
"last_seen": "2023-11-15",
"hn": [
"https://news.ycombinator.com/item?id=38275460",
"https://news.ycombinator.com/item?id=37534631",
"https://news.ycombinator.com/item?id=34249486"
]
},
{
"id": "oUaOucZRlmE",
"title": "Bret Victor - Media for Thinking the Unthinkable",
"channel": "Colin McDonnell",
"duration": 2372,
"uploaded": "2015-06-17",
"topic": "Thinking, writing and speaking",
"why": "Bret Victor on tools that help people see and think about complex ideas.",
"use_in_class": "Use to discuss visual representations in teaching.",
"authors": 9,
"comments": 9,
"first_seen": "2015-11-09",
"last_seen": "2026-01-08",
"hn": [
"https://news.ycombinator.com/item?id=46546255",
"https://news.ycombinator.com/item?id=36082773",
"https://news.ycombinator.com/item?id=34525815"
]
},
{
"id": "2HMPRXstSvQ",
"title": "Geoff Hinton: On Radiology",
"channel": "Creative Destruction Lab",
"duration": 84,
"uploaded": "2016-11-24",
"topic": "AI and the future of work",
"why": "One-minute clip of Geoffrey Hinton saying radiologists would soon be replaced, a prediction people still argue about.",
"use_in_class": "Use as a case on how to judge confident predictions about jobs.",
"authors": 9,
"comments": 9,
"first_seen": "2017-05-21",
"last_seen": "2026-09-18",
"hn": [
"https://news.ycombinator.com/item?id=49758147",
"https://news.ycombinator.com/item?id=48553054",
"https://news.ycombinator.com/item?id=45177269"
]
},
{
"id": "8S0FDjFBj8o",
"title": "How to sound smart in your TEDx Talk | Will Stephen | TEDxNewYork",
"channel": "TEDx Talks",
"duration": 356,
"uploaded": "2015-01-15",
"topic": "Thinking, writing and speaking",
"why": "Will Stephen's comic TEDx talk sounds clever while saying little, showing how delivery tricks work.",
"use_in_class": "Use to teach what makes a talk persuasive.",
"authors": 9,
"comments": 9,
"first_seen": "2015-05-20",
"last_seen": "2026-10-26",
"hn": [
"https://news.ycombinator.com/item?id=50246777",
"https://news.ycombinator.com/item?id=43333307",
"https://news.ycombinator.com/item?id=41763949"
]
},
{
"id": "dxk8b9rSKOo",
"title": "Velocity 2011:  Jon Jenkins, \"Velocity Culture\"",
"channel": "O'Reilly",
"duration": 914,
"uploaded": "2011-06-20",
"topic": "Managing and leading people",
"why": "An Amazon engineer describes the culture of speed that let the company ship software at huge scale.",
"use_in_class": "Use to talk about how team culture shapes delivery.",
"authors": 9,
"comments": 9,
"first_seen": "2011-09-07",
"last_seen": "2018-06-07",
"hn": [
"https://news.ycombinator.com/item?id=17254116",
"https://news.ycombinator.com/item?id=13838205",
"https://news.ycombinator.com/item?id=8689828"
]
},
{
"id": "tbDDYKRFjhk",
"title": "Does AI Actually Boost Developer Productivity? (100k Devs Study) - Yegor Denisov-Blanch, Stanford",
"channel": "AI Engineer",
"duration": 1092,
"uploaded": "2025-07-23",
"topic": "AI and the future of work",
"why": "Stanford researcher's study of around 100,000 developers on whether AI tools really raise productivity.",
"use_in_class": "Use to discuss evidence versus claims about AI productivity.",
"authors": 8,
"comments": 13,
"first_seen": "2025-08-10",
"last_seen": "2026-01-04",
"hn": [
"https://news.ycombinator.com/item?id=46483419",
"https://news.ycombinator.com/item?id=46311295",
"https://news.ycombinator.com/item?id=46224082"
]
},
{
"id": "pqzcCfUglws",
"title": "The Psychology of Human Misjudgement - Charlie Munger Full Speech",
"channel": "BuffettMungerWisdom",
"duration": 4582,
"uploaded": "2013-01-14",
"topic": "Thinking, writing and speaking",
"why": "Charlie Munger's talk on the psychological biases behind bad decisions.",
"use_in_class": "Use to teach bias in decision-making.",
"authors": 8,
"comments": 10,
"first_seen": "2014-06-19",
"last_seen": "2023-11-28",
"hn": [
"https://news.ycombinator.com/item?id=38451393",
"https://news.ycombinator.com/item?id=29388570",
"https://news.ycombinator.com/item?id=24099747"
]
},
{
"id": "HZGCoVF3YvM",
"title": "Bayes theorem, the geometry of changing beliefs",
"channel": "3Blue1Brown",
"duration": 911,
"uploaded": "2019-12-22",
"topic": "Thinking, writing and speaking",
"why": "3Blue1Brown explains Bayes's theorem as updating beliefs with evidence.",
"use_in_class": "Use to teach updating views as evidence arrives.",
"authors": 8,
"comments": 9,
"first_seen": "2019-12-27",
"last_seen": "2024-07-20",
"hn": [
"https://news.ycombinator.com/item?id=41019774",
"https://news.ycombinator.com/item?id=40061758",
"https://news.ycombinator.com/item?id=38098456"
]
},
{
"id": "l7TONauJGfc",
"title": "NVC Marshall Rosenberg - San Francisco Workshop - FULL ENGLISH SUBTITLES TRANSCRIPTION",
"channel": "Centrum Nadania",
"duration": 11157,
"uploaded": "2015-10-27",
"topic": "Mentoring, coaching and feedback",
"why": "Marshall Rosenberg runs a long workshop on nonviolent communication, a method for stating needs and hearing others.",
"use_in_class": "Use short sections to practise giving and receiving feedback.",
"authors": 8,
"comments": 9,
"first_seen": "2019-03-26",
"last_seen": "2026-01-07",
"hn": [
"https://news.ycombinator.com/item?id=46520860",
"https://news.ycombinator.com/item?id=34312781",
"https://news.ycombinator.com/item?id=32248841"
]
},
{
"id": "_ivqWN4L3zU",
"title": "Building a Cathedral without Science or Mathematics: The Engineering Method Explained",
"channel": "engineerguy",
"duration": 714,
"uploaded": "2023-05-09",
"topic": "Making things (craft and engineering stories)",
"why": "Bill Hammack explains how builders raised cathedrals without formal science, using rules of thumb.",
"use_in_class": "Use as a case on learning by apprenticeship and rules of thumb.",
"authors": 8,
"comments": 8,
"first_seen": "2023-05-16",
"last_seen": "2026-06-30",
"hn": [
"https://news.ycombinator.com/item?id=48729631",
"https://news.ycombinator.com/item?id=45847563",
"https://news.ycombinator.com/item?id=40562766"
]
},
{
"id": "zAFcV7zuUDA",
"title": "How to tie your shoes | Terry Moore",
"channel": "TED",
"duration": 179,
"uploaded": "2011-05-20",
"topic": "Learning and teaching",
"why": "Two-minute TED talk showing a better way to tie shoelaces.",
"use_in_class": "Use as a model of a short, memorable demonstration.",
"authors": 8,
"comments": 8,
"first_seen": "2015-09-11",
"last_seen": "2026-06-04",
"hn": [
"https://news.ycombinator.com/item?id=48398756",
"https://news.ycombinator.com/item?id=36657188",
"https://news.ycombinator.com/item?id=34579750"
]
},
{
"id": "hER0Qp6QJNU",
"title": "Simon Sinek on Millennials in the Workplace",
"channel": "David Crossman",
"duration": 901,
"uploaded": "2016-10-29",
"topic": "Managing and leading people",
"why": "Simon Sinek's interview on how younger staff see work and what managers can do about it.",
"use_in_class": "Use to prompt a discussion on mixed-age teams.",
"authors": 8,
"comments": 8,
"first_seen": "2017-01-17",
"last_seen": "2018-11-22",
"hn": [
"https://news.ycombinator.com/item?id=18509935",
"https://news.ycombinator.com/item?id=17826148",
"https://news.ycombinator.com/item?id=16459021"
]
},
{
"id": "g1ib43q3uXQ",
"title": "\"How to teach programming (and other things)?\" by Felienne Hermans",
"channel": "Strange Loop Conference",
"duration": 3129,
"uploaded": "2019-09-14",
"topic": "Learning and teaching",
"why": "Felienne Hermans on what research says about teaching programming and learning in general.",
"use_in_class": "Use extracts for evidence-based teaching methods.",
"authors": 7,
"comments": 11,
"first_seen": "2019-12-08",
"last_seen": "2026-06-05",
"hn": [
"https://news.ycombinator.com/item?id=48407038",
"https://news.ycombinator.com/item?id=29053501",
"https://news.ycombinator.com/item?id=24339299"
]
},
{
"id": "hJP5GqnTrNo",
"title": "How AI Could Save (Not Destroy) Education | Sal Khan | TED",
"channel": "TED",
"duration": 937,
"uploaded": "2023-05-01",
"topic": "Learning and teaching",
"why": "Sal Khan on how AI tutors and teaching assistants could help students and teachers.",
"use_in_class": "Use to discuss AI tutoring in training design.",
"authors": 7,
"comments": 10,
"first_seen": "2023-05-02",
"last_seen": "2026-02-17",
"hn": [
"https://news.ycombinator.com/item?id=47051631",
"https://news.ycombinator.com/item?id=44526681",
"https://news.ycombinator.com/item?id=40981589"
]
},
{
"id": "b0Ti-gkJiXc",
"title": "How To Tell Someone They Sound Racist",
"channel": "Jay Smooth",
"duration": 180,
"uploaded": "2008-07-21",
"topic": "Mentoring, coaching and feedback",
"why": "Jay Smooth on how to tell someone their words came across badly by focusing on what was said, not who they are.",
"use_in_class": "Use to practise raising a difficult point with a colleague.",
"authors": 7,
"comments": 10,
"first_seen": "2011-07-11",
"last_seen": "2021-12-27",
"hn": [
"https://news.ycombinator.com/item?id=29704952",
"https://news.ycombinator.com/item?id=27345528",
"https://news.ycombinator.com/item?id=26161437"
]
},
{
"id": "jPhJbKBuNnA",
"title": "I tried using AI. It scared me.",
"channel": "Tom Scott",
"duration": 949,
"uploaded": "2023-02-13",
"topic": "AI and the future of work",
"why": "Tom Scott describes using AI tools and why the experience unsettled him.",
"use_in_class": "Use as a short personal starter for a discussion of AI worries.",
"authors": 7,
"comments": 9,
"first_seen": "2023-02-13",
"last_seen": "2026-02-16",
"hn": [
"https://news.ycombinator.com/item?id=47031475",
"https://news.ycombinator.com/item?id=44128993",
"https://news.ycombinator.com/item?id=41854924"
]
},
{
"id": "arj7oStGLkU",
"title": "Inside the Mind of a Master Procrastinator | Tim Urban | TED",
"channel": "TED",
"duration": 844,
"uploaded": "2016-04-06",
"topic": "Careers and work",
"why": "Tim Urban's funny look at procrastination and the panic that gets work done at the last minute.",
"use_in_class": "Use as a warm-up before a session on planning.",
"authors": 7,
"comments": 9,
"first_seen": "2016-04-17",
"last_seen": "2023-05-15",
"hn": [
"https://news.ycombinator.com/item?id=35952165",
"https://news.ycombinator.com/item?id=30001847",
"https://news.ycombinator.com/item?id=29991108"
]
},
{
"id": "_Qd3erAPI9w",
"title": "Survivor Bias",
"channel": "2veritasium",
"duration": 526,
"uploaded": "2016-05-10",
"topic": "Thinking, writing and speaking",
"why": "Veritasium on survivorship bias, with the wartime aeroplane armour example.",
"use_in_class": "Use as a quick lesson on bias in evidence.",
"authors": 7,
"comments": 9,
"first_seen": "2016-08-28",
"last_seen": "2022-06-05",
"hn": [
"https://news.ycombinator.com/item?id=31630486",
"https://news.ycombinator.com/item?id=27127777",
"https://news.ycombinator.com/item?id=18049230"
]
},
{
"id": "P_fHJIYENdI",
"title": "AlphaFold - The Most Useful Thing AI Has Ever Done",
"channel": "Veritasium",
"duration": 1491,
"uploaded": "2025-02-10",
"topic": "How AI works",
"why": "Veritasium on AlphaFold, the system that predicts protein shapes, and why it counts as a real scientific win for AI.",
"use_in_class": "Show as an example of AI doing useful work beyond chat.",
"authors": 7,
"comments": 8,
"first_seen": "2025-02-10",
"last_seen": "2026-07-29",
"hn": [
"https://news.ycombinator.com/item?id=49100055",
"https://news.ycombinator.com/item?id=45393202",
"https://news.ycombinator.com/item?id=43455118"
]
},
{
"id": "fOGdb1CTu5c",
"title": "Computer Scientist Explains One Concept in 5 Levels of Difficulty | WIRED",
"channel": "WIRED",
"duration": 1356,
"uploaded": "2022-01-18",
"topic": "Learning and teaching",
"why": "A computer scientist explains one idea to five audiences, from a child to an expert.",
"use_in_class": "Use as a model of explaining at different levels.",
"authors": 7,
"comments": 8,
"first_seen": "2022-01-23",
"last_seen": "2026-07-02",
"hn": [
"https://news.ycombinator.com/item?id=48762205",
"https://news.ycombinator.com/item?id=47305958",
"https://news.ycombinator.com/item?id=44458289"
]
},
{
"id": "R9c-_neaxeU",
"title": "MENACE: the pile of matchboxes which can learn",
"channel": "Stand-up Maths",
"duration": 839,
"uploaded": "2017-11-14",
"topic": "How AI works",
"why": "Matt Parker builds MENACE, a pile of matchboxes that learns to play noughts and crosses.",
"use_in_class": "Run the matchbox game in class to show machines learning from reward.",
"authors": 7,
"comments": 8,
"first_seen": "2018-06-15",
"last_seen": "2026-01-09",
"hn": [
"https://news.ycombinator.com/item?id=46549382",
"https://news.ycombinator.com/item?id=44670381",
"https://news.ycombinator.com/item?id=39589184"
]
},
{
"id": "5eqRuVp65eY",
"title": "AI can't cross this line and we don't know why.",
"channel": "Welch Labs",
"duration": 1447,
"uploaded": "2024-09-13",
"topic": "How AI works",
"why": "Welch Labs video on a limit that AI model performance seems to run into, with visual explanations.",
"use_in_class": "Use to discuss why more data and size do not fix everything.",
"authors": 7,
"comments": 7,
"first_seen": "2024-10-15",
"last_seen": "2026-06-08",
"hn": [
"https://news.ycombinator.com/item?id=48440054",
"https://news.ycombinator.com/item?id=46671844",
"https://news.ycombinator.com/item?id=45105790"
]
},
{
"id": "tNmgmwEtoWE",
"title": "Debunking Devin: \"First AI Software Engineer\" Upwork lie exposed!",
"channel": "Internet of Bugs",
"duration": 1516,
"uploaded": "2024-04-09",
"topic": "AI and the future of work",
"why": "A reviewer checks the claims made for an 'AI software engineer' demo and finds they do not hold up.",
"use_in_class": "Use to practise checking the claims made for AI products.",
"authors": 7,
"comments": 7,
"first_seen": "2024-04-30",
"last_seen": "2026-09-10",
"hn": [
"https://news.ycombinator.com/item?id=49647006",
"https://news.ycombinator.com/item?id=42387661",
"https://news.ycombinator.com/item?id=41609216"
]
},
{
"id": "099cHWSbAL8",
"title": "How to crash an airplane – Nickolas Means | The Lead Developer UK 2016",
"channel": "LeadDev",
"duration": 2593,
"uploaded": "2017-04-26",
"topic": "Managing and leading people",
"why": "Nickolas Means uses an aeroplane accident to show how teams miss warning signs and how to prevent that.",
"use_in_class": "Use as a case study on safety culture and speaking up.",
"authors": 7,
"comments": 7,
"first_seen": "2019-07-28",
"last_seen": "2024-01-29",
"hn": [
"https://news.ycombinator.com/item?id=39174669",
"https://news.ycombinator.com/item?id=33988222",
"https://news.ycombinator.com/item?id=28582593"
]
},
{
"id": "d95J8yzvjbQ",
"title": "The Thinking Game | Full documentary | Tribeca Film Festival official selection",
"channel": "Google DeepMind",
"duration": 5047,
"uploaded": "2025-11-25",
"topic": "Making things (craft and engineering stories)",
"why": "Documentary on DeepMind's path to AlphaGo and AlphaFold.",
"use_in_class": "Use extracts on how a research team works.",
"authors": 7,
"comments": 7,
"first_seen": "2025-11-30",
"last_seen": "2026-05-16",
"hn": [
"https://news.ycombinator.com/item?id=48161777",
"https://news.ycombinator.com/item?id=47956378",
"https://news.ycombinator.com/item?id=46663082"
]
},
{
"id": "0xS68sl2D70",
"title": "Veritasium: What Everyone Gets Wrong About AI and Learning – Derek Muller Explains",
"channel": "Perimeter Institute for Theoretical Physics",
"duration": 4510,
"uploaded": "2025-04-08",
"topic": "Learning and teaching",
"why": "Derek Muller argues that AI will help learning less than people hope unless learners still put in effort.",
"use_in_class": "Use to discuss the limits of AI in learning.",
"authors": 7,
"comments": 7,
"first_seen": "2025-04-20",
"last_seen": "2026-06-05",
"hn": [
"https://news.ycombinator.com/item?id=48415838",
"https://news.ycombinator.com/item?id=48323903",
"https://news.ycombinator.com/item?id=47789725"
]
},
{
"id": "viJt_DXTfwA",
"title": "ChatGPT with Rob Miles - Computerphile",
"channel": "Computerphile",
"duration": 2161,
"uploaded": "2023-02-01",
"topic": "How AI works",
"why": "Computerphile talks with AI safety researcher Rob Miles about how ChatGPT works and where it goes wrong.",
"use_in_class": "Use to introduce hallucination and the limits of chatbots.",
"authors": 6,
"comments": 9,
"first_seen": "2023-02-01",
"last_seen": "2023-04-13",
"hn": [
"https://news.ycombinator.com/item?id=35553179",
"https://news.ycombinator.com/item?id=35553083",
"https://news.ycombinator.com/item?id=35159095"
]
},
{
"id": "eVtCO84MDj8",
"title": "Khan Academy and the Effectiveness of Science Videos",
"channel": "Veritasium",
"duration": 484,
"uploaded": "2011-03-17",
"topic": "Learning and teaching",
"why": "Veritasium on why science videos often fail to teach and what makes some of them work.",
"use_in_class": "Use when designing video material for learners.",
"authors": 6,
"comments": 9,
"first_seen": "2011-06-08",
"last_seen": "2024-08-24",
"hn": [
"https://news.ycombinator.com/item?id=41338230",
"https://news.ycombinator.com/item?id=39329273",
"https://news.ycombinator.com/item?id=34625370"
]
},
{
"id": "OWJCfOvochA",
"title": "Quantum Computing Expert Explains One Concept in 5 Levels of Difficulty | WIRED",
"channel": "WIRED",
"duration": 1167,
"uploaded": "2018-06-25",
"topic": "Learning and teaching",
"why": "A quantum computing expert explains the topic to five audiences, from child to peer.",
"use_in_class": "Use to practise explaining a topic at five levels.",
"authors": 6,
"comments": 8,
"first_seen": "2019-01-02",
"last_seen": "2021-11-17",
"hn": [
"https://news.ycombinator.com/item?id=29248466",
"https://news.ycombinator.com/item?id=29247698",
"https://news.ycombinator.com/item?id=23033284"
]
},
{
"id": "7vsCAM17O-M",
"title": "The Classroom Only Works for One Kid in the Room",
"channel": "CGP Grey",
"duration": 344,
"uploaded": "2012-11-05",
"topic": "Learning and teaching",
"why": "CGP Grey on why a single classroom cannot suit every learner.",
"use_in_class": "Use to open a talk on differentiated teaching.",
"authors": 6,
"comments": 8,
"first_seen": "2013-03-03",
"last_seen": "2024-07-07",
"hn": [
"https://news.ycombinator.com/item?id=40896060",
"https://news.ycombinator.com/item?id=40023893",
"https://news.ycombinator.com/item?id=36421921"
]
},
{
"id": "AD4b-52jtos",
"title": "Hamming, Intro to The Art of Doing Science and Engineering: Learning to Learn (March 28, 1995)",
"channel": "securitylectures",
"duration": 2822,
"uploaded": "2012-08-26",
"topic": "Learning and teaching",
"why": "Richard Hamming's opening lecture on learning to learn and aiming for great work.",
"use_in_class": "Use as a reading-list prompt in mentoring talks.",
"authors": 6,
"comments": 7,
"first_seen": "2014-04-14",
"last_seen": "2024-01-20",
"hn": [
"https://news.ycombinator.com/item?id=39063813",
"https://news.ycombinator.com/item?id=24056436",
"https://news.ycombinator.com/item?id=19250494"
]
},
{
"id": "d0yGdNEWdn0",
"title": "How to learn any language in six months | Chris Lonsdale | TEDxLingnanUniversity",
"channel": "TEDx Talks",
"duration": 1106,
"uploaded": "2013-11-20",
"topic": "Learning and teaching",
"why": "Chris Lonsdale's talk on principles for picking up a language quickly.",
"use_in_class": "Use to start a talk on immersive learning.",
"authors": 6,
"comments": 7,
"first_seen": "2014-12-28",
"last_seen": "2019-08-26",
"hn": [
"https://news.ycombinator.com/item?id=20804765",
"https://news.ycombinator.com/item?id=20635280",
"https://news.ycombinator.com/item?id=19826028"
]
},
{
"id": "21EYKqUsPfg",
"title": "Richard Sutton – Father of RL thinks LLMs are a dead end",
"channel": "Dwarkesh Patel",
"duration": 4029,
"uploaded": "2025-09-26",
"topic": "How AI works",
"why": "Dwarkesh Patel interviews reinforcement learning pioneer Richard Sutton, who doubts language models lead to general AI.",
"use_in_class": "Use as a counterview when discussing AI hype.",
"authors": 6,
"comments": 7,
"first_seen": "2025-10-11",
"last_seen": "2026-10-02",
"hn": [
"https://news.ycombinator.com/item?id=49938661",
"https://news.ycombinator.com/item?id=49084023",
"https://news.ycombinator.com/item?id=48781814"
]
},
{
"id": "lXUZvyajciY",
"title": "Andrej Karpathy — “We’re summoning ghosts, not building animals”",
"channel": "Dwarkesh Patel",
"duration": 8768,
"uploaded": "2025-10-17",
"topic": "AI and the future of work",
"why": "Dwarkesh Patel interviews Andrej Karpathy on what AI agents can do now and how long the rest may take.",
"use_in_class": "Use extracts to temper hype in an AI-at-work talk.",
"authors": 6,
"comments": 6,
"first_seen": "2025-10-18",
"last_seen": "2026-03-08",
"hn": [
"https://news.ycombinator.com/item?id=47296006",
"https://news.ycombinator.com/item?id=45790609",
"https://news.ycombinator.com/item?id=45679811"
]
},
{
"id": "ne6tB2KiZuk",
"title": "Bobby McFerrin Demonstrates the Power of the Pentatonic Scale | World Science Festival",
"channel": "World Science Festival",
"duration": 184,
"uploaded": "2009-07-23",
"topic": "Learning and teaching",
"why": "Bobby McFerrin gets an audience to sing a pentatonic scale without being taught it.",
"use_in_class": "Use as an icebreaker that shows learning by doing.",
"authors": 6,
"comments": 6,
"first_seen": "2016-03-31",
"last_seen": "2026-09-06",
"hn": [
"https://news.ycombinator.com/item?id=49590496",
"https://news.ycombinator.com/item?id=38840195",
"https://news.ycombinator.com/item?id=36077781"
]
},
{
"id": "1Evwgu369Jw",
"title": "Brené Brown on Empathy",
"channel": "Royal Society of Arts",
"duration": 173,
"uploaded": "2013-12-10",
"topic": "Managing and leading people",
"why": "Brené Brown's animated short on the difference between empathy and sympathy.",
"use_in_class": "Show in coaching sessions before practising empathic replies.",
"authors": 6,
"comments": 6,
"first_seen": "2013-12-28",
"last_seen": "2020-10-31",
"hn": [
"https://news.ycombinator.com/item?id=24948552",
"https://news.ycombinator.com/item?id=18938428",
"https://news.ycombinator.com/item?id=16893408"
]
},
{
"id": "qpoRO378qRY",
"title": "Full interview: \"Godfather of artificial intelligence\" talks impact and potential of AI",
"channel": "CBS Mornings",
"duration": 2550,
"uploaded": "2023-03-25",
"topic": "AI and the future of work",
"why": "CBS interview with Geoffrey Hinton on the risks and effects of advanced AI.",
"use_in_class": "Use to start a discussion on AI risk from a leading researcher.",
"authors": 6,
"comments": 6,
"first_seen": "2023-03-31",
"last_seen": "2023-05-13",
"hn": [
"https://news.ycombinator.com/item?id=35930093",
"https://news.ycombinator.com/item?id=35783702",
"https://news.ycombinator.com/item?id=35779911"
]
},
{
"id": "_8yVOC4ciXc",
"title": "GPT3: An Even Bigger Language Model - Computerphile",
"channel": "Computerphile",
"duration": 1556,
"uploaded": "2020-07-01",
"topic": "How AI works",
"why": "Computerphile on GPT-3 and why scaling up language models worked so well.",
"use_in_class": "Use as a short history of how large language models arrived.",
"authors": 6,
"comments": 6,
"first_seen": "2020-07-04",
"last_seen": "2023-02-08",
"hn": [
"https://news.ycombinator.com/item?id=34707914",
"https://news.ycombinator.com/item?id=34248453",
"https://news.ycombinator.com/item?id=28370895"
]
},
{
"id": "cKxRvEZd3Mw",
"title": "Hello World - Machine Learning Recipes #1",
"channel": "Google for Developers",
"duration": 412,
"uploaded": "2016-03-30",
"topic": "How AI works",
"why": "Six-minute Google introduction to machine learning, training a simple classifier on example data.",
"use_in_class": "Show as the shortest introduction to learning from examples.",
"authors": 6,
"comments": 6,
"first_seen": "2016-04-21",
"last_seen": "2017-05-23",
"hn": [
"https://news.ycombinator.com/item?id=14402822",
"https://news.ycombinator.com/item?id=12714957",
"https://news.ycombinator.com/item?id=12623864"
]
},
{
"id": "IRVdiHu1VCc",
"title": "Learning from dirty jobs | Mike Rowe",
"channel": "TED",
"duration": 1203,
"uploaded": "2009-03-05",
"topic": "Careers and work",
"why": "Mike Rowe on what dirty jobs taught him about skilled trades and how we talk about work.",
"use_in_class": "Use to discuss how trades and skills are perceived.",
"authors": 6,
"comments": 6,
"first_seen": "2012-03-21",
"last_seen": "2018-07-13",
"hn": [
"https://news.ycombinator.com/item?id=17526038",
"https://news.ycombinator.com/item?id=9365140",
"https://news.ycombinator.com/item?id=9206098"
]
},
{
"id": "-6HOdHEeosc",
"title": "Lecture #1: Introduction — Brandon Sanderson on Writing Science Fiction and Fantasy",
"channel": "Brandon Sanderson",
"duration": 3832,
"uploaded": "2020-01-22",
"topic": "Thinking, writing and speaking",
"why": "Brandon Sanderson's first writing class lecture at BYU on how to build stories.",
"use_in_class": "Use for storytelling skills in presentations.",
"authors": 6,
"comments": 6,
"first_seen": "2021-06-07",
"last_seen": "2023-02-21",
"hn": [
"https://news.ycombinator.com/item?id=34888500",
"https://news.ycombinator.com/item?id=34592410",
"https://news.ycombinator.com/item?id=30831029"
]
},
{
"id": "bxe2T-V8XRs",
"title": "Neural Networks Demystified [Part 1: Data and Architecture]",
"channel": "Welch Labs",
"duration": 187,
"uploaded": "2014-11-04",
"topic": "How AI works",
"why": "First part of a short series that builds a small neural network step by step.",
"use_in_class": "Use for staff who want to see a network built from scratch.",
"authors": 6,
"comments": 6,
"first_seen": "2015-02-28",
"last_seen": "2018-02-04",
"hn": [
"https://news.ycombinator.com/item?id=16303708",
"https://news.ycombinator.com/item?id=14552606",
"https://news.ycombinator.com/item?id=11875263"
]
},
{
"id": "N9c7_8Gp7gI",
"title": "Rethinking CS Education | Alan Kay, CrossRoads 2015",
"channel": "Infosys Foundation USA",
"duration": 4231,
"uploaded": "2015-12-03",
"topic": "Learning and teaching",
"why": "Alan Kay on how computing is taught and what children could do with the right tools.",
"use_in_class": "Use extracts on learning by building.",
"authors": 6,
"comments": 6,
"first_seen": "2016-01-19",
"last_seen": "2019-07-23",
"hn": [
"https://news.ycombinator.com/item?id=20506329",
"https://news.ycombinator.com/item?id=17515727",
"https://news.ycombinator.com/item?id=13142840"
]
},
{
"id": "IACHfKmZMr8",
"title": "Vibe Coding Is The Future",
"channel": "Y Combinator",
"duration": 1893,
"uploaded": "2025-03-05",
"topic": "AI and the future of work",
"why": "Y Combinator partners discuss 'vibe coding', building software by prompting an AI.",
"use_in_class": "Use to show how AI is changing technical work.",
"authors": 6,
"comments": 6,
"first_seen": "2025-03-09",
"last_seen": "2025-08-06",
"hn": [
"https://news.ycombinator.com/item?id=44807985",
"https://news.ycombinator.com/item?id=44804434",
"https://news.ycombinator.com/item?id=43774366"
]
},
{
"id": "XFDM1ip5HdU",
"title": "What does it feel like to invent math?",
"channel": "3Blue1Brown",
"duration": 907,
"uploaded": "2015-08-14",
"topic": "Thinking, writing and speaking",
"why": "3Blue1Brown on how it feels to discover mathematics, and how that differs from how it is taught.",
"use_in_class": "Use to discuss discovery learning.",
"authors": 6,
"comments": 6,
"first_seen": "2016-07-16",
"last_seen": "2024-10-30",
"hn": [
"https://news.ycombinator.com/item?id=42001434",
"https://news.ycombinator.com/item?id=37980696",
"https://news.ycombinator.com/item?id=27313850"
]
},
{
"id": "aFwVf5a3pZM",
"title": "LEADERSHIP LAB: Writing Beyond the Academy 1.23.15",
"channel": "UChicago Social Sciences",
"duration": 4614,
"uploaded": "2015-02-18",
"topic": "Thinking, writing and speaking",
"why": "Second University of Chicago writing lecture, on writing beyond academic audiences.",
"use_in_class": "Use as a follow-on to the Craft of Writing lecture.",
"authors": 5,
"comments": 8,
"first_seen": "2020-07-15",
"last_seen": "2025-07-24",
"hn": [
"https://news.ycombinator.com/item?id=44671346",
"https://news.ycombinator.com/item?id=33371879",
"https://news.ycombinator.com/item?id=31782007"
]
},
{
"id": "BrK7X_XlGB8",
"title": "A visual guide to Bayesian thinking",
"channel": "Julia Galef",
"duration": 685,
"uploaded": "2015-07-16",
"topic": "Thinking, writing and speaking",
"why": "Julia Galef's visual guide to Bayesian thinking.",
"use_in_class": "Use to teach updating beliefs with a visual.",
"authors": 5,
"comments": 6,
"first_seen": "2016-03-14",
"last_seen": "2023-06-27",
"hn": [
"https://news.ycombinator.com/item?id=36495199",
"https://news.ycombinator.com/item?id=28230232",
"https://news.ycombinator.com/item?id=19206855"
]
},
{
"id": "ugvHCXCOmm4",
"title": "Dario Amodei: Anthropic CEO on Claude, AGI & the Future of AI & Humanity | Lex Fridman Podcast #452",
"channel": "Lex Fridman",
"duration": 18900,
"uploaded": "2024-11-11",
"topic": "AI and the future of work",
"why": "Five-hour Lex Fridman conversation with Anthropic's chief executive Dario Amodei on AI progress and its effects.",
"use_in_class": "Pick one chapter for a discussion on AI and society.",
"authors": 5,
"comments": 6,
"first_seen": "2024-11-14",
"last_seen": "2025-04-30",
"hn": [
"https://news.ycombinator.com/item?id=43842175",
"https://news.ycombinator.com/item?id=43723475",
"https://news.ycombinator.com/item?id=43011277"
]
},
{
"id": "IJEaMtNN_dM",
"title": "The Hidden Rules of Conversation",
"channel": "Tom Scott",
"duration": 332,
"uploaded": "2020-05-04",
"topic": "Thinking, writing and speaking",
"why": "Tom Scott on the unwritten rules of conversation, such as turn-taking and pauses.",
"use_in_class": "Use to discuss listening in coaching.",
"authors": 5,
"comments": 6,
"first_seen": "2020-08-05",
"last_seen": "2026-05-19",
"hn": [
"https://news.ycombinator.com/item?id=48196245",
"https://news.ycombinator.com/item?id=37409033",
"https://news.ycombinator.com/item?id=35333087"
]
},
{
"id": "UBVV8pch1dM",
"title": "The Science of Thinking",
"channel": "Veritasium",
"duration": 730,
"uploaded": "2017-03-02",
"topic": "Thinking, writing and speaking",
"why": "Veritasium on fast and slow thinking and why intuition errs.",
"use_in_class": "Use to open a session on decision-making.",
"authors": 5,
"comments": 6,
"first_seen": "2017-03-08",
"last_seen": "2025-08-09",
"hn": [
"https://news.ycombinator.com/item?id=44851206",
"https://news.ycombinator.com/item?id=41812988",
"https://news.ycombinator.com/item?id=21906226"
]
},
{
"id": "9X68dm92HVI",
"title": "Are we in control of our decisions? | Dan Ariely",
"channel": "TED",
"duration": 1046,
"uploaded": "2009-05-19",
"topic": "Thinking, writing and speaking",
"why": "Dan Ariely on how choices are shaped by defaults and framing.",
"use_in_class": "Use for exercises on how choices are presented.",
"authors": 5,
"comments": 5,
"first_seen": "2011-05-16",
"last_seen": "2017-04-28",
"hn": [
"https://news.ycombinator.com/item?id=14216316",
"https://news.ycombinator.com/item?id=11009211",
"https://news.ycombinator.com/item?id=5391206"
]
},
{
"id": "lIW5jBrrsS0",
"title": "BOOKSTORES: How to Read More Books in the Golden Age of Content",
"channel": "Max Joseph",
"duration": 2271,
"uploaded": "2019-04-23",
"topic": "Learning and teaching",
"why": "Max Joseph on reading more books and building a reading habit.",
"use_in_class": "Use to start a talk on a reading routine.",
"authors": 5,
"comments": 5,
"first_seen": "2020-04-13",
"last_seen": "2026-02-28",
"hn": [
"https://news.ycombinator.com/item?id=47198754",
"https://news.ycombinator.com/item?id=39857876",
"https://news.ycombinator.com/item?id=34254312"
]
},
{
"id": "Ilg3gGewQ5U",
"title": "Backpropagation, intuitively | Deep Learning Chapter 3",
"channel": "3Blue1Brown",
"duration": 767,
"uploaded": "2017-11-03",
"topic": "How AI works",
"why": "Animated chapter on backpropagation, the way a neural network corrects its mistakes.",
"use_in_class": "Use to explain learning from errors with a visual.",
"authors": 5,
"comments": 5,
"first_seen": "2017-11-04",
"last_seen": "2024-10-06",
"hn": [
"https://news.ycombinator.com/item?id=41754867",
"https://news.ycombinator.com/item?id=26669456",
"https://news.ycombinator.com/item?id=17409429"
]
},
{
"id": "iv-5mZ_9CPY",
"title": "But how do AI images and videos actually work? | Guest video by Welch Labs",
"channel": "3Blue1Brown",
"duration": 2240,
"uploaded": "2025-07-25",
"topic": "How AI works",
"why": "Guest video on 3Blue1Brown explaining how AI makes images and video from noise.",
"use_in_class": "Use to demystify image generators in a creative skills session.",
"authors": 5,
"comments": 5,
"first_seen": "2025-08-13",
"last_seen": "2026-08-31",
"hn": [
"https://news.ycombinator.com/item?id=49506086",
"https://news.ycombinator.com/item?id=48992887",
"https://news.ycombinator.com/item?id=48442554"
]
},
{
"id": "MCBdcNA_FsI",
"title": "China’s Dark Factories: So Automated, They Don't Need Lights | WSJ",
"channel": "The Wall Street Journal",
"duration": 336,
"uploaded": "2025-07-18",
"topic": "AI and the future of work",
"why": "WSJ report on Chinese factories so automated that they run with the lights off.",
"use_in_class": "Use to discuss which jobs automation removes.",
"authors": 5,
"comments": 5,
"first_seen": "2025-08-03",
"last_seen": "2026-10-12",
"hn": [
"https://news.ycombinator.com/item?id=50057128",
"https://news.ycombinator.com/item?id=49045314",
"https://news.ycombinator.com/item?id=46806800"
]
},
{
"id": "IHZwWFHWa-w",
"title": "Gradient descent, how neural networks learn | Deep Learning Chapter 2",
"channel": "3Blue1Brown",
"duration": 1233,
"uploaded": "2017-10-16",
"topic": "How AI works",
"why": "Animated chapter on gradient descent, the method by which neural networks improve.",
"use_in_class": "Use to show that AI 'learning' means adjusting numbers.",
"authors": 5,
"comments": 5,
"first_seen": "2017-11-04",
"last_seen": "2024-10-23",
"hn": [
"https://news.ycombinator.com/item?id=41926020",
"https://news.ycombinator.com/item?id=23085192",
"https://news.ycombinator.com/item?id=15689936"
]
},
{
"id": "1CIpzeNxIhU",
"title": "How AI Image Generators Work (Stable Diffusion / Dall-E) - Computerphile",
"channel": "Computerphile",
"duration": 1070,
"uploaded": "2022-10-04",
"topic": "How AI works",
"why": "Computerphile explains how image generators such as Stable Diffusion and DALL-E turn text into pictures.",
"use_in_class": "Show to explain AI image tools to non-technical staff.",
"authors": 5,
"comments": 5,
"first_seen": "2022-10-05",
"last_seen": "2025-05-20",
"hn": [
"https://news.ycombinator.com/item?id=44036483",
"https://news.ycombinator.com/item?id=39467038",
"https://news.ycombinator.com/item?id=34646071"
]
},
{
"id": "4Q_mY54hjM0",
"title": "Intuition Pumps and Other Tools for Thinking | Daniel Dennett | Talks at Google",
"channel": "Talks at Google",
"duration": 3704,
"uploaded": "2013-05-22",
"topic": "Thinking, writing and speaking",
"why": "Daniel Dennett at Google on simple thinking tools he calls intuition pumps.",
"use_in_class": "Use as a source of thinking tools for debates.",
"authors": 5,
"comments": 5,
"first_seen": "2013-05-29",
"last_seen": "2024-04-19",
"hn": [
"https://news.ycombinator.com/item?id=40089125",
"https://news.ycombinator.com/item?id=29713558",
"https://news.ycombinator.com/item?id=21156027"
]
},
{
"id": "hhiLw5Q_UFg",
"title": "John Schulman - Reinforcement Learning from Human Feedback: Progress and Challenges",
"channel": "UC Berkeley EECS",
"duration": 3812,
"uploaded": "2023-04-20",
"topic": "How AI works",
"why": "OpenAI co-founder John Schulman's Berkeley lecture on learning from human feedback, which shapes how chatbots answer.",
"use_in_class": "Use for advanced learners curious how human ratings shape chatbots.",
"authors": 5,
"comments": 5,
"first_seen": "2023-04-24",
"last_seen": "2023-07-11",
"hn": [
"https://news.ycombinator.com/item?id=36682860",
"https://news.ycombinator.com/item?id=36079491",
"https://news.ycombinator.com/item?id=36013980"
]
},
{
"id": "9LmdUz3rOQU",
"title": "Pointing and Calling Japanese Safety Standard at Railway Companies & Toyota (HD)",
"channel": "AllAboutLean.com",
"duration": 236,
"uploaded": "2014-01-05",
"topic": "Careers and work",
"why": "Short film of Japanese rail and factory staff pointing at and calling out each check as a safety routine.",
"use_in_class": "Show as a concrete example of a habit that prevents errors.",
"authors": 5,
"comments": 5,
"first_seen": "2018-04-02",
"last_seen": "2022-04-15",
"hn": [
"https://news.ycombinator.com/item?id=31042922",
"https://news.ycombinator.com/item?id=19689573",
"https://news.ycombinator.com/item?id=19687128"
]
},
{
"id": "qWFScmtiC44",
"title": "Talk: Video Games and the Future of Education",
"channel": "Jonathan Blow",
"duration": 9868,
"uploaded": "2020-07-20",
"topic": "Learning and teaching",
"why": "Jonathan Blow on how video games teach and what education could borrow from them.",
"use_in_class": "Use to explore game-based learning.",
"authors": 5,
"comments": 5,
"first_seen": "2020-09-22",
"last_seen": "2023-04-09",
"hn": [
"https://news.ycombinator.com/item?id=35499767",
"https://news.ycombinator.com/item?id=34817232",
"https://news.ycombinator.com/item?id=33355190"
]
},
{
"id": "160F8F8mXlo",
"title": "Why ChatGPT Can't Draw a Full Glass of Wine",
"channel": "Alex O'Connor",
"duration": 1255,
"uploaded": "2025-02-22",
"topic": "How AI works",
"why": "Alex O'Connor explores why image models struggle to draw a glass of wine that is truly full.",
"use_in_class": "Use as a quick example of AI blind spots from training data.",
"authors": 5,
"comments": 5,
"first_seen": "2025-02-24",
"last_seen": "2025-09-24",
"hn": [
"https://news.ycombinator.com/item?id=45363902",
"https://news.ycombinator.com/item?id=43788094",
"https://news.ycombinator.com/item?id=43479027"
]
},
{
"id": "21EiKfQYZXc",
"title": "Andrew Ng: Artificial Intelligence is the New Electricity",
"channel": "Stanford Graduate School of Business",
"duration": 5264,
"uploaded": "2017-02-02",
"topic": "AI and the future of work",
"why": "Andrew Ng's Stanford talk comparing AI's coming effect to that of electricity.",
"use_in_class": "Use to start a talk on AI across industries.",
"authors": 4,
"comments": 9,
"first_seen": "2017-02-03",
"last_seen": "2019-02-07",
"hn": [
"https://news.ycombinator.com/item?id=19106163",
"https://news.ycombinator.com/item?id=16043756",
"https://news.ycombinator.com/item?id=15030188"
]
},
{
"id": "lnA9DMvHtfI",
"title": "Large Language Models from scratch",
"channel": "Graphics in 5 Minutes",
"duration": 505,
"uploaded": "2022-07-17",
"topic": "How AI works",
"why": "Eight-minute animated outline of how large language models are built from scratch.",
"use_in_class": "Use as a short opener before a longer AI session.",
"authors": 4,
"comments": 6,
"first_seen": "2023-01-05",
"last_seen": "2024-03-21",
"hn": [
"https://news.ycombinator.com/item?id=39778114",
"https://news.ycombinator.com/item?id=35981641",
"https://news.ycombinator.com/item?id=35977022"
]
},
{
"id": "97Ob0xR0Ut8",
"title": "Bill Nye Demonstrates Distance Between Planets",
"channel": "grinc333",
"duration": 257,
"uploaded": "2008-08-25",
"topic": "Learning and teaching",
"why": "Bill Nye lays out a string of beads to show the real distances between planets.",
"use_in_class": "Use as a model of teaching scale with a simple prop.",
"authors": 4,
"comments": 5,
"first_seen": "2012-04-22",
"last_seen": "2016-08-20",
"hn": [
"https://news.ycombinator.com/item?id=12328402",
"https://news.ycombinator.com/item?id=7617019",
"https://news.ycombinator.com/item?id=7341986"
]
},
{
"id": "oFfVt3S51T4",
"title": "Cursor Team: Future of Programming with AI | Lex Fridman Podcast #447",
"channel": "Lex Fridman",
"duration": 8944,
"uploaded": "2024-10-06",
"topic": "AI and the future of work",
"why": "Lex Fridman interviews the Cursor team about programming with AI assistants.",
"use_in_class": "Use clips to show how skilled workers team up with AI.",
"authors": 4,
"comments": 5,
"first_seen": "2024-10-29",
"last_seen": "2025-04-17",
"hn": [
"https://news.ycombinator.com/item?id=43723291",
"https://news.ycombinator.com/item?id=43119163",
"https://news.ycombinator.com/item?id=42048399"
]
},
{
"id": "dk60sYrU2RU",
"title": "New experiments in self-teaching | Sugata Mitra",
"channel": "TED",
"duration": 1045,
"uploaded": "2010-09-07",
"topic": "Learning and teaching",
"why": "Sugata Mitra's experiments in which children teach themselves using a shared computer.",
"use_in_class": "Use to discuss self-directed learning and its limits.",
"authors": 4,
"comments": 5,
"first_seen": "2010-11-28",
"last_seen": "2017-11-16",
"hn": [
"https://news.ycombinator.com/item?id=15710421",
"https://news.ycombinator.com/item?id=13500057",
"https://news.ycombinator.com/item?id=6593746"
]
},
{
"id": "50L44hEtVos",
"title": "Alan Kay on Learning",
"channel": "eucroix",
"duration": 634,
"uploaded": "2008-01-25",
"topic": "Learning and teaching",
"why": "Short Alan Kay clip on what learning is and how it differs from schooling.",
"use_in_class": "Use as a prompt in a discussion on adult learning.",
"authors": 4,
"comments": 4,
"first_seen": "2014-04-06",
"last_seen": "2021-12-11",
"hn": [
"https://news.ycombinator.com/item?id=29524749",
"https://news.ycombinator.com/item?id=12944281",
"https://news.ycombinator.com/item?id=12528545"
]
},
{
"id": "WITLR_qSPXk",
"title": "Automation Dependency - Part One, by Capt. VanderBurgh (restored)",
"channel": "flightcrewguide.com",
"duration": 688,
"uploaded": "2021-02-20",
"topic": "AI and the future of work",
"why": "Airline captain's talk on how reliance on cockpit automation wears down pilot skills.",
"use_in_class": "Use as a plain case study of skill fade.",
"authors": 4,
"comments": 4,
"first_seen": "2022-01-01",
"last_seen": "2025-07-11",
"hn": [
"https://news.ycombinator.com/item?id=44527405",
"https://news.ycombinator.com/item?id=43058669",
"https://news.ycombinator.com/item?id=31478682"
]
},
{
"id": "60OVlfAUPJg",
"title": "Conrad Wolfram: Teaching kids real math with computers",
"channel": "TED",
"duration": 1159,
"uploaded": "2010-11-15",
"topic": "Learning and teaching",
"why": "Conrad Wolfram argues that maths lessons should let computers calculate and teach problem solving.",
"use_in_class": "Use to ask what skills to teach when tools exist.",
"authors": 4,
"comments": 4,
"first_seen": "2012-09-01",
"last_seen": "2020-04-14",
"hn": [
"https://news.ycombinator.com/item?id=22866758",
"https://news.ycombinator.com/item?id=6409919",
"https://news.ycombinator.com/item?id=4679838"
]
},
{
"id": "RKK7wGAYP6k",
"title": "How Language Shapes the Way We Think | Lera Boroditsky | TED",
"channel": "TED",
"duration": 853,
"uploaded": "2018-05-02",
"topic": "Thinking, writing and speaking",
"why": "Lera Boroditsky's research on how the language you speak shapes how you think.",
"use_in_class": "Use with multilingual groups to discuss language.",
"authors": 4,
"comments": 4,
"first_seen": "2019-02-05",
"last_seen": "2026-01-19",
"hn": [
"https://news.ycombinator.com/item?id=46676723",
"https://news.ycombinator.com/item?id=20333477",
"https://news.ycombinator.com/item?id=19085001"
]
},
{
"id": "itWxXyCfW5s",
"title": "Jerry Seinfeld Interview: How to Write a Joke | The New York Times",
"channel": "The New York Times",
"duration": 302,
"uploaded": "2012-12-20",
"topic": "Thinking, writing and speaking",
"why": "Jerry Seinfeld shows how he writes a joke, word by word.",
"use_in_class": "Use to show how careful editing sharpens writing.",
"authors": 4,
"comments": 4,
"first_seen": "2017-05-15",
"last_seen": "2019-12-25",
"hn": [
"https://news.ycombinator.com/item?id=21878096",
"https://news.ycombinator.com/item?id=17754832",
"https://news.ycombinator.com/item?id=17704297"
]
},
{
"id": "20TAkcy3aBY",
"title": "Jon Stewart On The False Promises of AI | The Daily Show",
"channel": "The Daily Show",
"duration": 895,
"uploaded": "2024-04-02",
"topic": "AI and the future of work",
"why": "Jon Stewart satirises the big promises made about AI and what it will do for workers.",
"use_in_class": "Use for a light but pointed start to an AI debate.",
"authors": 4,
"comments": 4,
"first_seen": "2024-04-03",
"last_seen": "2025-04-30",
"hn": [
"https://news.ycombinator.com/item?id=43839871",
"https://news.ycombinator.com/item?id=40347584",
"https://news.ycombinator.com/item?id=39923189"
]
},
{
"id": "-MTRxRO5SRA",
"title": "Let's teach for mastery -- not test scores | Sal Khan",
"channel": "TED",
"duration": 650,
"uploaded": "2016-09-26",
"topic": "Learning and teaching",
"why": "Sal Khan on teaching for mastery rather than test scores.",
"use_in_class": "Use to discuss mastery-based learning in programme design.",
"authors": 4,
"comments": 4,
"first_seen": "2016-12-03",
"last_seen": "2018-08-01",
"hn": [
"https://news.ycombinator.com/item?id=17667152",
"https://news.ycombinator.com/item?id=16148484",
"https://news.ycombinator.com/item?id=13368165"
]
},
{
"id": "gcS04BI2sbk",
"title": "Reinventing Organizations",
"channel": "Reinventing Organizations",
"duration": 6172,
"uploaded": "2014-08-30",
"topic": "Managing and leading people",
"why": "Talk based on Frederic Laloux's book on organisations run without traditional management layers.",
"use_in_class": "Use to explore alternatives to hierarchy in a leadership class.",
"authors": 4,
"comments": 4,
"first_seen": "2014-11-26",
"last_seen": "2020-09-05",
"hn": [
"https://news.ycombinator.com/item?id=24383909",
"https://news.ycombinator.com/item?id=9790813",
"https://news.ycombinator.com/item?id=8673838"
]
},
{
"id": "ReRcHdeUG9Y",
"title": "Simon Sinek: Why Leaders Eat Last",
"channel": "99U",
"duration": 2750,
"uploaded": "2013-12-04",
"topic": "Managing and leading people",
"why": "Simon Sinek on why good leaders look after their teams first.",
"use_in_class": "Use to start a talk on servant leadership.",
"authors": 4,
"comments": 4,
"first_seen": "2014-06-24",
"last_seen": "2017-12-26",
"hn": [
"https://news.ycombinator.com/item?id=16009364",
"https://news.ycombinator.com/item?id=12759913",
"https://news.ycombinator.com/item?id=10830233"
]
},
{
"id": "KClAPipnKqw",
"title": "Technical leadership and glue work - Tanya Reilly | #LeadDevNewYork",
"channel": "LeadDev",
"duration": 1699,
"uploaded": "2019-05-10",
"topic": "Managing and leading people",
"why": "Tanya Reilly on 'glue work', the unseen coordination that holds teams together and can harm careers.",
"use_in_class": "Use to talk about recognising unseen team work.",
"authors": 4,
"comments": 4,
"first_seen": "2020-11-17",
"last_seen": "2022-02-15",
"hn": [
"https://news.ycombinator.com/item?id=30348058",
"https://news.ycombinator.com/item?id=25467464",
"https://news.ycombinator.com/item?id=25121686"
]
},
{
"id": "WSKi8HfcxEk",
"title": "The Rise of the Machines – Why Automation is Different this Time",
"channel": "Kurzgesagt – In a Nutshell",
"duration": 657,
"uploaded": "2017-06-08",
"topic": "AI and the future of work",
"why": "Kurzgesagt on why automation may hit jobs differently this time than in past waves.",
"use_in_class": "Use to open a debate on automation and employment.",
"authors": 4,
"comments": 4,
"first_seen": "2017-06-10",
"last_seen": "2022-12-15",
"hn": [
"https://news.ycombinator.com/item?id=34003174",
"https://news.ycombinator.com/item?id=17336945",
"https://news.ycombinator.com/item?id=15337612"
]
},
{
"id": "SpPhm7S9vsQ",
"title": "We Let AI Run a Vending Machine. It Lost All the Money. | WSJ",
"channel": "The Wall Street Journal",
"duration": 559,
"uploaded": "2025-12-18",
"topic": "AI and the future of work",
"why": "WSJ reporters let an AI agent run a vending machine in their office, and it loses money.",
"use_in_class": "Use as a light example of AI agents' limits in real work.",
"authors": 4,
"comments": 4,
"first_seen": "2025-12-18",
"last_seen": "2026-10-23",
"hn": [
"https://news.ycombinator.com/item?id=50216559",
"https://news.ycombinator.com/item?id=49590464",
"https://news.ycombinator.com/item?id=49236258"
]
},
{
"id": "3MYEtQ5Zdn8",
"title": "Why \"scout mindset\" is crucial to good judgment | Julia Galef | TEDxPSU",
"channel": "TEDx Talks",
"duration": 706,
"uploaded": "2016-04-04",
"topic": "Thinking, writing and speaking",
"why": "Julia Galef on 'scout mindset': looking for what is true rather than defending your view.",
"use_in_class": "Use to teach open-minded questioning.",
"authors": 4,
"comments": 4,
"first_seen": "2020-11-28",
"last_seen": "2022-11-22",
"hn": [
"https://news.ycombinator.com/item?id=33710882",
"https://news.ycombinator.com/item?id=28136664",
"https://news.ycombinator.com/item?id=27814974"
]
},
{
"id": "e3msMuwqp-o",
"title": "31 Hamming, Learning to Learn: You and Your Research, 6 June 1995",
"channel": "Hamming on Hamming: Learning to Learn",
"duration": 2664,
"uploaded": "2018-03-04",
"topic": "Learning and teaching",
"why": "Richard Hamming on learning how to learn in research and careers.",
"use_in_class": "Use for senior learners planning self-directed growth.",
"authors": 3,
"comments": 10,
"first_seen": "2019-05-26",
"last_seen": "2024-01-19",
"hn": [
"https://news.ycombinator.com/item?id=39058099",
"https://news.ycombinator.com/item?id=35777029",
"https://news.ycombinator.com/item?id=35777019"
]
},
{
"id": "1OzxYK2-qsI",
"title": "Measuring the Impact of AI on Developer Productivity at Meta",
"channel": "Develocity",
"duration": 2774,
"uploaded": "2025-10-10",
"topic": "AI and the future of work",
"why": "Conference talk on how Meta measured the effect of AI tools on developer productivity.",
"use_in_class": "Use to show how an employer tests the benefits of AI.",
"authors": 3,
"comments": 8,
"first_seen": "2025-12-20",
"last_seen": "2026-01-09",
"hn": [
"https://news.ycombinator.com/item?id=46558751",
"https://news.ycombinator.com/item?id=46551878",
"https://news.ycombinator.com/item?id=46551814"
]
},
{
"id": "5zkC9IMQmYA",
"title": "High Altitude Leadership | Chris Warner | Talks at Google",
"channel": "Talks at Google",
"duration": 3641,
"uploaded": "2009-01-10",
"topic": "Managing and leading people",
"why": "Mountaineer Chris Warner on leading under pressure at altitude.",
"use_in_class": "Use for a discussion on decisions and teamwork under stress.",
"authors": 3,
"comments": 5,
"first_seen": "2010-05-20",
"last_seen": "2014-04-24",
"hn": [
"https://news.ycombinator.com/item?id=7639053",
"https://news.ycombinator.com/item?id=4944663",
"https://news.ycombinator.com/item?id=1979426"
]
},
{
"id": "pN34FNbOKXc",
"title": "The Power of belief -- mindset and success | Eduardo Briceno | TEDxManhattanBeach",
"channel": "TEDx Talks",
"duration": 652,
"uploaded": "2012-11-19",
"topic": "Learning and teaching",
"why": "Eduardo Briceno on how believing that ability can grow changes performance.",
"use_in_class": "Use to introduce growth mindset in training.",
"authors": 3,
"comments": 5,
"first_seen": "2014-02-22",
"last_seen": "2020-05-31",
"hn": [
"https://news.ycombinator.com/item?id=23373786",
"https://news.ycombinator.com/item?id=12235899",
"https://news.ycombinator.com/item?id=12228793"
]
},
{
"id": "4kLPyV8lBbs",
"title": "\"Understanding Burnout,\" Prof. Christina Maslach (U.C. Berkeley)",
"channel": "Thriving In Science",
"duration": 4350,
"uploaded": "2014-12-12",
"topic": "Careers and work",
"why": "Psychologist Christina Maslach, who built the standard burnout measure, explains what burnout is and what causes it.",
"use_in_class": "Use to ground a staff wellbeing session in research.",
"authors": 3,
"comments": 4,
"first_seen": "2016-07-27",
"last_seen": "2019-07-02",
"hn": [
"https://news.ycombinator.com/item?id=20333431",
"https://news.ycombinator.com/item?id=18896522",
"https://news.ycombinator.com/item?id=12986670"
]
},
{
"id": "kikzjTfos0s",
"title": "On Bullsh*t Jobs | David Graeber | Meaningless Jobs | Royal Society of Arts | Lecture",
"channel": "Royal Society of Arts",
"duration": 3428,
"uploaded": "2018-05-17",
"topic": "Careers and work",
"why": "David Graeber's RSA talk on jobs that the workers themselves think are pointless.",
"use_in_class": "Use to open a debate on meaningful work.",
"authors": 3,
"comments": 4,
"first_seen": "2020-12-02",
"last_seen": "2026-07-28",
"hn": [
"https://news.ycombinator.com/item?id=49090494",
"https://news.ycombinator.com/item?id=30454326",
"https://news.ycombinator.com/item?id=26353228"
]
},
{
"id": "dfl8Xt8W09A",
"title": "The Checklist Manifesto",
"channel": "Microsoft Research",
"duration": 3546,
"uploaded": "2016-08-17",
"topic": "Managing and leading people",
"why": "Talk on Atul Gawande's argument that simple checklists prevent costly mistakes in hospitals and elsewhere.",
"use_in_class": "Use to introduce checklists in a process improvement session.",
"authors": 3,
"comments": 4,
"first_seen": "2019-04-17",
"last_seen": "2022-09-07",
"hn": [
"https://news.ycombinator.com/item?id=32747851",
"https://news.ycombinator.com/item?id=28052722",
"https://news.ycombinator.com/item?id=20294340"
]
},
{
"id": "CjVQJdIrDJ0",
"title": "Thinking, Fast and Slow | Daniel Kahneman | Talks at Google",
"channel": "Talks at Google",
"duration": 3746,
"uploaded": "2011-11-11",
"topic": "Thinking, writing and speaking",
"why": "Daniel Kahneman at Google on fast and slow thinking.",
"use_in_class": "Use as the longer version for a bias session.",
"authors": 3,
"comments": 4,
"first_seen": "2011-12-27",
"last_seen": "2023-12-27",
"hn": [
"https://news.ycombinator.com/item?id=38780015",
"https://news.ycombinator.com/item?id=20816597",
"https://news.ycombinator.com/item?id=9105255"
]
},
{
"id": "Yv4tI6939q0",
"title": "\"Keynote: Drop Your Tools – Does Expertise have a Dark Side?\" - Dr Sean Brady (LCA 2020)",
"channel": "linux.conf.au",
"duration": 2878,
"uploaded": "2020-01-14",
"topic": "Learning and teaching",
"why": "Keynote by engineer Sean Brady asking whether expertise can blind people to new ways of working.",
"use_in_class": "Use to discuss unlearning among experienced staff.",
"authors": 3,
"comments": 3,
"first_seen": "2020-01-16",
"last_seen": "2020-12-09",
"hn": [
"https://news.ycombinator.com/item?id=25355030",
"https://news.ycombinator.com/item?id=22143227",
"https://news.ycombinator.com/item?id=22061189"
]
},
{
"id": "Eg_ToU7m1MI",
"title": "Alan Kay: A powerful idea about teaching ideas",
"channel": "TED",
"duration": 1238,
"uploaded": "2008-03-10",
"topic": "Learning and teaching",
"why": "Alan Kay on how powerful ideas are best taught through making and playing.",
"use_in_class": "Use to discuss learning through projects.",
"authors": 3,
"comments": 3,
"first_seen": "2009-07-07",
"last_seen": "2024-06-19",
"hn": [
"https://news.ycombinator.com/item?id=40733438",
"https://news.ycombinator.com/item?id=17990016",
"https://news.ycombinator.com/item?id=692481"
]
},
{
"id": "vBmavNoChZc",
"title": "Amazon founder and CEO Jeff Bezos delivers graduation speech at Princeton University",
"channel": "princetonacademics",
"duration": 1124,
"uploaded": "2010-06-11",
"topic": "Careers and work",
"why": "Jeff Bezos's Princeton graduation speech on choices, cleverness and kindness.",
"use_in_class": "Use as a short reflective piece for graduating learners.",
"authors": 3,
"comments": 3,
"first_seen": "2010-07-05",
"last_seen": "2018-12-12",
"hn": [
"https://news.ycombinator.com/item?id=18668605",
"https://news.ycombinator.com/item?id=1487851",
"https://news.ycombinator.com/item?id=1487667"
]
},
{
"id": "dmeRQN9z504",
"title": "Andy Matuschak — The reason most learning tools fail",
"channel": "Dwarkesh Patel",
"duration": 8560,
"uploaded": "2023-07-12",
"topic": "Learning and teaching",
"why": "Andy Matuschak, interviewed by Dwarkesh Patel, on why most learning tools fail to change what people retain.",
"use_in_class": "Use when designing follow-up and spaced practice.",
"authors": 3,
"comments": 3,
"first_seen": "2024-01-28",
"last_seen": "2025-01-06",
"hn": [
"https://news.ycombinator.com/item?id=42616856",
"https://news.ycombinator.com/item?id=41387248",
"https://news.ycombinator.com/item?id=39167820"
]
},
{
"id": "vd2dtkMINIw",
"title": "Barbara Oakley | Learning How to Learn | Talks at Google",
"channel": "Talks at Google",
"duration": 4122,
"uploaded": "2015-02-22",
"topic": "Learning and teaching",
"why": "Barbara Oakley at Google on how the brain learns, including focused and relaxed thinking.",
"use_in_class": "Use to introduce learner techniques such as chunking and recall.",
"authors": 3,
"comments": 3,
"first_seen": "2015-11-30",
"last_seen": "2022-06-14",
"hn": [
"https://news.ycombinator.com/item?id=31737141",
"https://news.ycombinator.com/item?id=27442391",
"https://news.ycombinator.com/item?id=10650143"
]
},
{
"id": "IIMu1PGbG-0",
"title": "Cal Newport: \"Follow Your Passion\" Is Bad Advice",
"channel": "99U",
"duration": 1319,
"uploaded": "2015-09-18",
"topic": "Careers and work",
"why": "Cal Newport argues that 'follow your passion' is poor advice and that skill is what builds a good career.",
"use_in_class": "Use to challenge assumptions in career coaching.",
"authors": 3,
"comments": 3,
"first_seen": "2016-09-10",
"last_seen": "2018-07-13",
"hn": [
"https://news.ycombinator.com/item?id=17526149",
"https://news.ycombinator.com/item?id=12560242",
"https://news.ycombinator.com/item?id=12470331"
]
},
{
"id": "RQaW2bFieo8",
"title": "Derek Muller: The key to effective educational science videos",
"channel": "TEDTalentSearch",
"duration": 380,
"uploaded": "2012-06-25",
"topic": "Learning and teaching",
"why": "Derek Muller on what makes educational science videos work.",
"use_in_class": "Use when planning learning videos.",
"authors": 3,
"comments": 3,
"first_seen": "2013-11-28",
"last_seen": "2021-08-22",
"hn": [
"https://news.ycombinator.com/item?id=28267562",
"https://news.ycombinator.com/item?id=9416840",
"https://news.ycombinator.com/item?id=6816039"
]
},
{
"id": "eVkIKm9pkPY",
"title": "Ditching the rules to build a team that lasts | Bryan Cantrill, Steve Tuck (Oxide)",
"channel": "Software Misadventures Podcast",
"duration": 7588,
"uploaded": "2024-07-23",
"topic": "Managing and leading people",
"why": "Bryan Cantrill and Steve Tuck on running a company without rigid rules and building a team that lasts.",
"use_in_class": "Use extracts in a session on building trust in teams.",
"authors": 3,
"comments": 3,
"first_seen": "2024-09-12",
"last_seen": "2026-06-26",
"hn": [
"https://news.ycombinator.com/item?id=48683739",
"https://news.ycombinator.com/item?id=48679187",
"https://news.ycombinator.com/item?id=41518794"
]
},
{
"id": "AdKUJxjn-R8",
"title": "Forget big change, start with a tiny habit: BJ Fogg at TEDxFremont",
"channel": "TEDx Talks",
"duration": 1043,
"uploaded": "2012-12-05",
"topic": "Careers and work",
"why": "BJ Fogg explains how very small habits can build lasting change.",
"use_in_class": "Use to design small practice steps for learners after a course.",
"authors": 3,
"comments": 3,
"first_seen": "2014-01-01",
"last_seen": "2017-12-28",
"hn": [
"https://news.ycombinator.com/item?id=16022981",
"https://news.ycombinator.com/item?id=12513323",
"https://news.ycombinator.com/item?id=6996749"
]
},
{
"id": "km2Hd_xgo9Q",
"title": "How to Negotiate Your Job Offer - Prof. Deepak Malhotra (Harvard Business School)",
"channel": "Deepak Malhotra",
"duration": 3863,
"uploaded": "2012-11-20",
"topic": "Careers and work",
"why": "Harvard's Deepak Malhotra on negotiating a job offer step by step.",
"use_in_class": "Use in career workshops on pay and offer negotiation.",
"authors": 3,
"comments": 3,
"first_seen": "2014-05-08",
"last_seen": "2015-09-27",
"hn": [
"https://news.ycombinator.com/item?id=10286552",
"https://news.ycombinator.com/item?id=8909015",
"https://news.ycombinator.com/item?id=7716399"
]
},
{
"id": "eIho2S0ZahI",
"title": "How to Speak So That People Want to Listen | Julian Treasure | TED",
"channel": "TED",
"duration": 598,
"uploaded": "2014-06-27",
"topic": "Thinking, writing and speaking",
"why": "Julian Treasure on voice habits that make speakers easier to listen to.",
"use_in_class": "Use to practise speaking techniques.",
"authors": 3,
"comments": 3,
"first_seen": "2015-05-11",
"last_seen": "2022-08-10",
"hn": [
"https://news.ycombinator.com/item?id=32413566",
"https://news.ycombinator.com/item?id=21583184",
"https://news.ycombinator.com/item?id=9522862"
]
},
{
"id": "wX78iKhInsc",
"title": "How to escape education's death valley | Sir Ken Robinson | TED",
"channel": "TED",
"duration": 1151,
"uploaded": "2013-05-10",
"topic": "Learning and teaching",
"why": "Sir Ken Robinson on how to rebuild education around students' strengths.",
"use_in_class": "Use as a follow-up to his creativity talk.",
"authors": 3,
"comments": 3,
"first_seen": "2013-12-02",
"last_seen": "2022-05-29",
"hn": [
"https://news.ycombinator.com/item?id=31545285",
"https://news.ycombinator.com/item?id=14559198",
"https://news.ycombinator.com/item?id=6836515"
]
},
{
"id": "nTFEUsudhfs",
"title": "Let's use video to reinvent education | Salman Khan",
"channel": "TED",
"duration": 1227,
"uploaded": "2011-03-09",
"topic": "Learning and teaching",
"why": "Salman Khan on using short videos to reshape lessons and free up class time.",
"use_in_class": "Use to discuss flipped classrooms.",
"authors": 3,
"comments": 3,
"first_seen": "2011-04-17",
"last_seen": "2012-04-16",
"hn": [
"https://news.ycombinator.com/item?id=3849534",
"https://news.ycombinator.com/item?id=3117305",
"https://news.ycombinator.com/item?id=2455230"
]
},
{
"id": "PJjmw9TRB7s",
"title": "RailsConf 2015 - Implementing a Strong Code-Review Culture",
"channel": "Confreaks",
"duration": 2268,
"uploaded": "2015-04-30",
"topic": "Mentoring, coaching and feedback",
"why": "Derek Prior on reviewing code kindly and usefully; the advice carries over to any peer feedback.",
"use_in_class": "Use to teach how to give peer feedback.",
"authors": 3,
"comments": 3,
"first_seen": "2016-03-15",
"last_seen": "2025-12-22",
"hn": [
"https://news.ycombinator.com/item?id=46350458",
"https://news.ycombinator.com/item?id=18220689",
"https://news.ycombinator.com/item?id=11292019"
]
},
{
"id": "bOf4EMN6-XA",
"title": "Seymour Papert 1983",
"channel": "Cynthia Solomon",
"duration": 487,
"uploaded": "2007-05-25",
"topic": "Learning and teaching",
"why": "Seymour Papert in 1983 on children learning by programming computers.",
"use_in_class": "Use to discuss learning by making.",
"authors": 3,
"comments": 3,
"first_seen": "2014-11-13",
"last_seen": "2017-01-26",
"hn": [
"https://news.ycombinator.com/item?id=13492724",
"https://news.ycombinator.com/item?id=10189187",
"https://news.ycombinator.com/item?id=8602145"
]
},
{
"id": "qwOdU02SE0w",
"title": "So Good They Can't Ignore You | Cal Newport | Talks at Google",
"channel": "Talks at Google",
"duration": 2424,
"uploaded": "2012-10-24",
"topic": "Careers and work",
"why": "Cal Newport's Google talk on why building rare skills beats chasing passion.",
"use_in_class": "Show to start a skills-first career planning session.",
"authors": 3,
"comments": 3,
"first_seen": "2013-10-14",
"last_seen": "2018-07-13",
"hn": [
"https://news.ycombinator.com/item?id=17525980",
"https://news.ycombinator.com/item?id=12470331",
"https://news.ycombinator.com/item?id=6548370"
]
},
{
"id": "f60dheI4ARg",
"title": "Steve Jobs talks about managing people",
"channel": "ragni",
"duration": 146,
"uploaded": "2010-06-12",
"topic": "Managing and leading people",
"why": "Short clip of Steve Jobs on how he manages people and sets standards.",
"use_in_class": "Use as a starter for a debate on management styles.",
"authors": 3,
"comments": 3,
"first_seen": "2013-07-30",
"last_seen": "2021-07-02",
"hn": [
"https://news.ycombinator.com/item?id=27711263",
"https://news.ycombinator.com/item?id=13681161",
"https://news.ycombinator.com/item?id=6126524"
]
},
{
"id": "XgRlrBl-7Yg",
"title": "The riddle of experience vs. memory | Daniel Kahneman",
"channel": "TED",
"duration": 1237,
"uploaded": "2010-03-01",
"topic": "Thinking, writing and speaking",
"why": "Daniel Kahneman on why we remember experiences differently from how we lived them.",
"use_in_class": "Use to think about how learners remember a course.",
"authors": 3,
"comments": 3,
"first_seen": "2010-04-07",
"last_seen": "2019-06-02",
"hn": [
"https://news.ycombinator.com/item?id=20078110",
"https://news.ycombinator.com/item?id=10166234",
"https://news.ycombinator.com/item?id=1246982"
]
},
{
"id": "fxbCHn6gE3U",
"title": "The surprising habits of original thinkers | Adam Grant | TED",
"channel": "TED",
"duration": 925,
"uploaded": "2016-04-26",
"topic": "Careers and work",
"why": "Adam Grant on how people who produce original ideas behave, including procrastination and self-doubt.",
"use_in_class": "Use as a lead-in to creativity and innovation sessions.",
"authors": 3,
"comments": 3,
"first_seen": "2018-01-03",
"last_seen": "2021-09-28",
"hn": [
"https://news.ycombinator.com/item?id=28679716",
"https://news.ycombinator.com/item?id=28069146",
"https://news.ycombinator.com/item?id=16061925"
]
},
{
"id": "-vZXgApsPCQ",
"title": "What I Learned from 100 Days of Rejection | Jia Jiang | TED",
"channel": "TED",
"duration": 932,
"uploaded": "2017-01-06",
"topic": "Careers and work",
"why": "Jia Jiang's talk on turning fear of rejection into a 100-day experiment.",
"use_in_class": "Use to prompt a discussion on handling rejection at work.",
"authors": 3,
"comments": 3,
"first_seen": "2018-08-15",
"last_seen": "2025-02-23",
"hn": [
"https://news.ycombinator.com/item?id=43145637",
"https://news.ycombinator.com/item?id=30752694",
"https://news.ycombinator.com/item?id=17769806"
]
},
{
"id": "IkdziSLYzHw",
"title": "Will AI outsmart human intelligence? - with 'Godfather of AI' Geoffrey Hinton",
"channel": "The Royal Institution",
"duration": 2835,
"uploaded": "2025-07-22",
"topic": "AI and the future of work",
"why": "Geoffrey Hinton's Royal Institution lecture on whether AI could outsmart people.",
"use_in_class": "Use for a longer talk on AI risk for interested staff.",
"authors": 3,
"comments": 3,
"first_seen": "2025-08-12",
"last_seen": "2025-11-03",
"hn": [
"https://news.ycombinator.com/item?id=45805599",
"https://news.ycombinator.com/item?id=45720269",
"https://news.ycombinator.com/item?id=44882291"
]
}
];
