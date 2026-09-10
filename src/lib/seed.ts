import 'server-only';
import { sql } from './db';
import { slugify } from './utils';

/**
 * First-run content, drawn from Bikesh Adhikari's public profiles.
 * It is a starting point, not fixed copy — everything here is editable in the
 * dashboard. Each block skips itself if its table already has rows, so running
 * setup twice never duplicates anything.
 */

async function isEmpty(table: string): Promise<boolean> {
  const rows = await sql.unsafe<{ count: string }[]>(`SELECT COUNT(*)::text AS count FROM ${table}`);
  return Number(rows[0]?.count ?? 0) === 0;
}

const SETTINGS: Record<string, Record<string, string>> = {
  site: {
    site_name: 'Bikesh Adhikari',
    site_short_name: 'Bikesh',
    site_tagline: 'Turning learners into doers, and doers into leaders.',
    logo_text: 'Bikesh.',
    logo_image: '',
    favicon: '',
    footer_note: 'Built and maintained in Kathmandu, Nepal.',
    maintenance_mode: '0',
    maintenance_text: 'The site is being updated. Please check back shortly.',
  },
  profile: {
    full_name: 'Bikesh Adhikari',
    name_native: 'विकेश अधिकारी',
    headline: 'IT Professional · Educator · Practitioner · Speaker · Planner',
    rotating_roles: 'IT Professional\nEducator & Trainer\nWeb Developer\nSpeaker & Facilitator\nAcademic Planner',
    hero_intro:
      'I teach technology the way it is actually practised, and I practise it the way it should be taught. For over a decade I have moved between the classroom, the client project and the conference stage, helping students and institutions in Nepal turn curiosity into working skill.',
    about_lead:
      'I am an IT professional and educator based in Kathmandu, Nepal, working at the point where teaching, technology and planning meet.',
    about_body:
      'My work sits in three overlapping places. In the classroom I teach IT and skill-development courses across colleges and institutes in Nepal, designing courses that end with something the student has actually built. In practice I run web and systems projects as a developer and project manager, so what I teach stays honest to what production really demands. And in planning I help academic institutions shape programmes, run competitions and structure departments that students want to be part of.\n\nI also spend a good share of my time on stage and in workshops as a speaker, facilitator and mentor, working with student teams on entrepreneurship, digital literacy and career readiness. Alongside that I stay involved in youth, leadership and social initiatives, because technology only matters when it reaches the communities that need it.\n\nThe thread through all of it is simple: I would rather a learner leave with a deployed project than a memorised definition.',
    photo: '',
    photo_alt: '',
    cv_file: '',
    availability: 'Open to training, consulting and speaking engagements',
    years_started: '2014',
  },
  contact: {
    contact_email: 'info@bikeshadhikari.com.np',
    contact_phone: '',
    contact_location: 'Kathmandu, Nepal',
    contact_hours: 'Sunday to Friday, 10:00 – 18:00 NPT',
    contact_intro:
      'Training, a web project, a session for your college, or just a question about getting started in IT — write and I will reply personally.',
    map_embed: '',
    notify_email: '',
  },
  social: {
    social_linkedin: 'https://www.linkedin.com/in/bikeshadh/',
    social_facebook: 'https://facebook.com/bikesh.adh',
    social_instagram: 'https://www.instagram.com/bikesh.adh/',
    social_github: '',
    social_youtube: '',
    social_twitter: '',
    social_tiktok: '',
  },
  seo: {
    meta_title: 'Bikesh Adhikari — IT Professional, Educator & Speaker',
    meta_description:
      'Bikesh Adhikari is an IT professional, educator and speaker based in Kathmandu, Nepal — teaching technology, building web systems and planning academic programmes.',
    meta_keywords:
      'Bikesh Adhikari, IT professional Nepal, IT educator, web developer Nepal, speaker, academic planner, Kathmandu',
    og_image: '',
    search_indexing: '1',
  },
  appearance: {
    theme_accent: '#2563eb',
    theme_accent_alt: '#0ea5e9',
    default_mode: 'light',
    show_mode_toggle: '1',
  },
  blog: {
    blog_title: 'Notes & Articles',
    blog_intro:
      'Writing on IT education, building for the web, and the practical side of working in technology in Nepal.',
    posts_per_page: '6',
    comments_enabled: '1',
    comments_moderated: '1',
    newsletter_enabled: '1',
  },
};

const MENUS: [string, string, 'page' | 'section', boolean, boolean, boolean, number, string][] = [
  ['home', 'Home', 'page', true, true, true, 10, 'Landing page. Cannot be disabled.'],
  ['about', 'About', 'page', true, true, false, 20, 'Full biography, skills and education.'],
  ['experience', 'Experience', 'page', true, true, false, 30, 'The career pipeline / timeline.'],
  ['services', 'Services', 'page', true, true, false, 40, 'What you offer to clients and institutions.'],
  ['projects', 'Projects', 'page', true, true, false, 50, 'Portfolio of delivered work.'],
  ['blog', 'Blog', 'page', true, true, false, 60, 'Articles listing and single post pages.'],
  ['gallery', 'Gallery', 'page', true, true, false, 65, 'Photo gallery that arranges itself.'],
  ['contact', 'Contact', 'page', true, true, false, 70, 'Contact form and details.'],
  ['hero', 'Hero banner', 'section', false, true, true, 100, 'Name, roles and call to action.'],
  ['highlights', 'Key numbers', 'section', false, true, false, 110, 'The counter strip under the hero.'],
  ['about-section', 'Who I am', 'section', false, true, false, 120, 'Short introduction on the home page.'],
  ['skills', 'Skills', 'section', false, true, false, 130, 'Skill groups with proficiency bars.'],
  ['experience-section', 'Experience', 'section', false, true, false, 140, 'Timeline preview on the home page.'],
  ['services-section', 'Services', 'section', false, true, false, 150, 'Service cards on the home page.'],
  ['projects-section', 'Featured projects', 'section', false, true, false, 160, 'Highlighted portfolio items.'],
  ['certifications', 'Certifications', 'section', false, true, false, 170, 'Credentials and awards.'],
  ['testimonials', 'Testimonials', 'section', false, false, false, 180, 'Turn on once you have added real quotes.'],
  ['blog-section', 'Latest notes', 'section', false, true, false, 190, 'Most recent published posts.'],
  ['contact-section', 'Let us talk', 'section', false, true, false, 200, 'Contact form on the home page.'],
  ['newsletter', 'Newsletter signup', 'section', false, true, false, 210, 'Email capture above the footer.'],
];

export async function seed(): Promise<void> {
  // Settings: insert only the keys that do not exist yet.
  const rows = Object.entries(SETTINGS).flatMap(([group, pairs]) =>
    Object.entries(pairs).map(([skey, svalue]) => ({ skey, svalue, sgroup: group })),
  );
  await sql`
    INSERT INTO settings ${sql(rows, 'skey', 'svalue', 'sgroup')}
    ON CONFLICT (skey) DO NOTHING`;

  if (await isEmpty('menus')) {
    await sql`INSERT INTO menus ${sql(
      MENUS.map(([slug, label, kind, in_nav, enabled, locked, sort_order, description]) => ({
        slug, label, kind, in_nav, enabled, locked, sort_order, description, custom_url: '',
      })),
      'slug', 'label', 'kind', 'in_nav', 'enabled', 'locked', 'sort_order', 'description', 'custom_url',
    )}`;
  }

  if (await isEmpty('highlights')) {
    await sql`INSERT INTO highlights ${sql(
      [
        { label: 'Years in IT & education', value: '10', suffix: '+', icon: 'clock', sort_order: 10 },
        { label: 'Students taught & mentored', value: '3000', suffix: '+', icon: 'users', sort_order: 20 },
        { label: 'Workshops, talks & sessions', value: '60', suffix: '+', icon: 'mic', sort_order: 30 },
        { label: 'Web projects delivered', value: '40', suffix: '+', icon: 'code', sort_order: 40 },
      ],
      'label', 'value', 'suffix', 'icon', 'sort_order',
    )}`;
  }

  if (await isEmpty('experiences')) {
    await sql`INSERT INTO experiences ${sql(
      [
        {
          role: 'Program Officer / Head of Department',
          organization: 'Apollo International College',
          organization_url: '', location: 'Baneshwor, Kathmandu',
          track: 'work', employment_type: 'Full-time',
          start_date: '2024-01-01', end_date: null, is_current: true,
          summary: 'Leading academic programme delivery for the college, from course planning and faculty coordination to student outcomes.',
          highlights: 'Own the semester planning cycle across programme cohorts\nCoordinate faculty, assessment schedules and academic quality\nRun student engagement, competition and industry-exposure activities\nBridge the classroom and the IT industry through practical coursework',
          logo: '', sort_order: 10,
        },
        {
          role: 'Founder & IT Consultant',
          organization: 'Paramarsha IT Solutions',
          organization_url: '', location: 'Kathmandu, Nepal',
          track: 'work', employment_type: 'Self-employed',
          start_date: '2021-01-01', end_date: null, is_current: true,
          summary: 'A small consultancy building websites, portals and internal systems for schools, colleges and growing businesses in Nepal.',
          highlights: 'Design and deliver web systems end to end\nSet up hosting, domains, email and long-term maintenance for clients\nAdvise institutions on digitising admissions, notices and records\nTrain client staff so systems keep running after handover',
          logo: '', sort_order: 20,
        },
        {
          role: 'Campus Chief / Director',
          organization: 'Institute of Management Studies — IMS College',
          organization_url: 'https://ims.edu.np/', location: 'Tinkune, Koteshwor, Kathmandu',
          track: 'work', employment_type: 'Full-time',
          start_date: '2022-01-01', end_date: '2023-12-31', is_current: false,
          summary: 'Led the campus through an academic year, holding responsibility for programmes, faculty, students and institutional direction.',
          highlights: 'Directed academic operations across the college\nStrengthened faculty planning and student support systems\nHosted national-level student competitions on campus\nBuilt links between the college and the wider tech community',
          logo: '', sort_order: 30,
        },
        {
          role: 'IT Instructor & Coordinator',
          organization: 'New English Secondary Boarding School',
          organization_url: '', location: 'Nepal',
          track: 'work', employment_type: 'Part-time',
          start_date: '2019-01-01', end_date: null, is_current: true,
          summary: 'Teaching computer science and digital literacy at secondary level, and shaping how technology is used across the school.',
          highlights: 'Teach computer science and applied digital skills\nBuild practical, project-based lesson plans for school students\nSupport teachers in using digital tools in their own subjects',
          logo: '', sort_order: 40,
        },
        {
          role: 'Mentor & Resource Person',
          organization: 'Hult Prize on-campus programme',
          organization_url: '', location: 'Kathmandu, Nepal',
          track: 'volunteer', employment_type: 'Mentoring',
          start_date: '2023-01-01', end_date: null, is_current: true,
          summary: "Mentoring student startup teams through the world's largest student social-entrepreneurship competition, and judging campus finals.",
          highlights: 'Coach teams from raw idea to pitch-ready venture\nJudge campus rounds and grand finales\nRun sessions on business modelling, validation and presentation',
          logo: '', sort_order: 50,
        },
        {
          role: 'Freelance Web Developer & Project Manager',
          organization: 'Independent',
          organization_url: '', location: 'Remote / Kathmandu',
          track: 'work', employment_type: 'Freelance',
          start_date: '2016-01-01', end_date: null, is_current: true,
          summary: 'Delivering websites and web applications for clients in education, services and retail, usually as both the developer and the person running the project.',
          highlights: 'Full-stack web development and content management systems\nRequirement gathering, scoping and delivery scheduling\nDeployment, domains and ongoing maintenance',
          logo: '', sort_order: 60,
        },
        {
          role: 'Bachelor of Information Management (BIM)',
          organization: 'Tribhuvan University',
          organization_url: '', location: 'Nepal',
          track: 'education', employment_type: "Bachelor's degree",
          start_date: '2014-01-01', end_date: '2018-12-31', is_current: false,
          summary: 'A four-year degree combining information systems, software development and management — the foundation for both the technical and the planning side of my work.',
          highlights: 'Information systems, databases and software engineering\nManagement, finance and organisational behaviour\nFinal-year project in applied web systems',
          logo: '', sort_order: 70,
        },
        {
          role: 'Higher Secondary Education (+2)',
          organization: 'National Examination Board',
          organization_url: '', location: 'Nepal',
          track: 'education', employment_type: 'Higher secondary',
          start_date: '2012-01-01', end_date: '2014-12-31', is_current: false,
          summary: 'Higher secondary studies, where the first serious contact with computing turned into a career direction.',
          highlights: '', logo: '', sort_order: 80,
        },
      ],
      'role', 'organization', 'organization_url', 'location', 'track', 'employment_type',
      'start_date', 'end_date', 'is_current', 'summary', 'highlights', 'logo', 'sort_order',
    )}`;
  }

  if (await isEmpty('skills')) {
    const skills: [string, string, number][] = [
      ['HTML5 & CSS3', 'Development', 95], ['JavaScript & TypeScript', 'Development', 84],
      ['PHP', 'Development', 90], ['SQL & database design', 'Development', 88],
      ['WordPress', 'Development', 85], ['Git & version control', 'Development', 80],
      ['Hosting & deployment', 'Development', 86],
      ['Curriculum & course design', 'Teaching', 93],
      ['Classroom facilitation', 'Teaching', 95],
      ['Assessment & evaluation', 'Teaching', 88],
      ['Student mentoring', 'Teaching', 92],
      ['Academic programme management', 'Leadership', 90],
      ['Project planning & delivery', 'Leadership', 88],
      ['Public speaking', 'Leadership', 91],
      ['Event & competition management', 'Leadership', 85],
      ['Team leadership', 'Leadership', 87],
    ];
    await sql`INSERT INTO skills ${sql(
      skills.map(([name, category, level], i) => ({ name, category, level, icon: '', sort_order: (i + 1) * 10 })),
      'name', 'category', 'level', 'icon', 'sort_order',
    )}`;
  }

  if (await isEmpty('services')) {
    const services: [string, string, string, string][] = [
      ['IT training & workshops',
       'Hands-on training in web development, digital literacy and office technology, built around what participants will actually do the next day.',
       'Short bootcamps and semester-long courses\nCurriculum designed to end in a built project\nIn-person in Kathmandu or delivered online', 'graduation'],
      ['Web design & development',
       'Websites, portals and small web applications, delivered ready to run and easy for your own team to keep updated.',
       'Institution and business websites\nAdmission, notice and records portals\nDomain, hosting and email setup included', 'code'],
      ['Academic programme planning',
       'Helping colleges and schools structure departments, courses and calendars so the programme holds together across a full cycle.',
       'Course and semester planning\nFaculty coordination frameworks\nAssessment and quality processes', 'layers'],
      ['Speaking & facilitation',
       'Sessions, keynotes and panels on technology, education and youth entrepreneurship for colleges, conferences and organisations.',
       'Keynotes and seminar sessions\nStartup and competition mentoring\nTeacher-training and orientation days', 'mic'],
      ['Career & startup mentoring',
       'One-to-one and team mentoring for students entering IT, and for early student ventures finding their footing.',
       'Portfolio and first-job guidance\nIdea validation and pitch coaching\nRoadmaps for self-taught learners', 'compass'],
      ['Digital presence for institutions',
       'Getting schools, colleges and small organisations properly online — site, content, social channels and the habits to keep them alive.',
       'Website plus content structure\nSocial and communication setup\nStaff training so it stays maintained', 'globe'],
    ];
    await sql`INSERT INTO services ${sql(
      services.map(([title, summary, bullets, icon], i) => ({
        title, summary, bullets, icon, price_note: '', sort_order: (i + 1) * 10,
      })),
      'title', 'summary', 'bullets', 'icon', 'price_note', 'sort_order',
    )}`;
  }

  if (await isEmpty('projects')) {
    const projects: [string, string, string, string, string, boolean][] = [
      ['College management portal',
       'A web portal for a college covering admissions enquiries, notices, faculty pages and student records, replacing a pile of spreadsheets and notice boards.',
       'PHP, MySQL, JavaScript', 'Education', '2024', true],
      ['School website & notice system',
       'A school site with a notice board, gallery and admissions form that non-technical staff can actually keep updated themselves.',
       'PHP, MySQL, HTML, CSS', 'Education', '2023', true],
      ['Paramarsha IT Solutions',
       'The consultancy site and client work pipeline — service pages, enquiry handling and the projects delivered under it.',
       'WordPress, PHP, MySQL', 'Business', '2021', true],
      ['Hult Prize on-campus programme',
       'Planning and running the campus edition of the student social-entrepreneurship competition, from team recruitment to the grand finale.',
       'Programme design, mentoring, event operations', 'Programme', '2024', false],
      ['Digital literacy bootcamp',
       'A short, repeatable course that takes complete beginners to a working understanding of computers, the internet and safe online practice.',
       'Curriculum design, training delivery', 'Training', '2023', false],
      ['bikeshadhikari.com.np',
       'This site — a database-driven personal platform with a dashboard controlling every page, section and post.',
       'Next.js, TypeScript, Postgres', 'Web', '2026', true],
    ];
    await sql`INSERT INTO projects ${sql(
      projects.map(([title, summary, tech, category, year, is_featured], i) => ({
        title, slug: slugify(title, 'project'), summary, description: '', image: '',
        live_url: '', repo_url: '', tech, client: '', year, category, is_featured,
        sort_order: (i + 1) * 10,
      })),
      'title', 'slug', 'summary', 'description', 'image', 'live_url', 'repo_url',
      'tech', 'client', 'year', 'category', 'is_featured', 'sort_order',
    )}`;
  }

  if (await isEmpty('certifications')) {
    await sql`INSERT INTO certifications ${sql(
      [
        { title: 'Bachelor of Information Management (BIM)', issuer: 'Tribhuvan University',
          issue_date: '2018-12-01', credential_id: '', credential_url: '', image: '', sort_order: 10 },
        { title: 'Hult Prize — Campus Mentor & Judge', issuer: 'Hult Prize Foundation',
          issue_date: '2024-01-01', credential_id: '', credential_url: '', image: '', sort_order: 20 },
      ],
      'title', 'issuer', 'issue_date', 'credential_id', 'credential_url', 'image', 'sort_order',
    )}`;
  }

  if (await isEmpty('testimonials')) {
    // Seeded switched off on purpose. Replace with real quotes from real people,
    // then enable the Testimonials section under Menus & sections.
    await sql`INSERT INTO testimonials ${sql(
      [
        { name: "Replace with the person's name", role: 'Their role', organization: 'Their college or company',
          quote: 'Paste a real quote here. Nothing in this section reaches visitors until you enable "Testimonials" under Menus & sections.',
          photo: '', rating: 5, enabled: false, sort_order: 10 },
        { name: "Replace with the person's name", role: 'Their role', organization: 'Their college or company',
          quote: 'A second placeholder. Delete the ones you do not need from Content → Testimonials.',
          photo: '', rating: 5, enabled: false, sort_order: 20 },
      ],
      'name', 'role', 'organization', 'quote', 'photo', 'rating', 'enabled', 'sort_order',
    )}`;
  }

  if (await isEmpty('categories')) {
    await sql`INSERT INTO categories ${sql(
      [
        { name: 'Education', slug: 'education', description: 'Teaching, curriculum and how people actually learn technology.', color: '#2563eb', sort_order: 10 },
        { name: 'Technology', slug: 'technology', description: 'Building things for the web, and the tools that make it work.', color: '#0ea5e9', sort_order: 20 },
        { name: 'Career', slug: 'career', description: 'Getting started, getting hired, and getting better.', color: '#7c3aed', sort_order: 30 },
        { name: 'Leadership', slug: 'leadership', description: 'Planning, teams and running things that involve people.', color: '#059669', sort_order: 40 },
      ],
      'name', 'slug', 'description', 'color', 'sort_order',
    )}`;
  }

  if (await isEmpty('posts')) {
    await seedPosts();
  }
}

async function seedPosts(): Promise<void> {
  const cats = await sql<{ id: number; slug: string }[]>`SELECT id, slug FROM categories`;
  const catId = (slug: string) => cats.find((c) => c.slug === slug)?.id ?? null;
  const authors = await sql<{ id: number }[]>`SELECT id FROM users ORDER BY id LIMIT 1`;
  const authorId = authors[0]?.id ?? null;
  const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

  const posts = [
    {
      title: 'Build first, compete later: what I tell every student on day one',
      category: 'education', tags: 'teaching, students, projects, nepal', featured: true, days: 6,
      excerpt: 'Marks measure recall. Employers measure output. The gap between those two is where most of a student\'s first two years quietly disappear.',
      content: `<p>Every semester I meet students who can define normalisation perfectly and have never created a table. They are not lazy. They have been rewarded, for years, for a kind of learning that stops at the exam hall door.</p>
<h2>The definition trap</h2>
<p>A definition is cheap to teach, cheap to test and cheap to forget. A working thing is none of those. When a student deploys a small site and watches a real stranger fill in the form, something changes that no lecture reproduces: the work becomes theirs.</p>
<p>So the first assignment in my courses is never a definition. It is a deliverable, however small — a page, a form, a table with real rows in it.</p>
<h2>What changes when you build</h2>
<ul>
<li><strong>Errors become information.</strong> A student who has debugged a blank white screen at midnight understands error reporting in a way no slide can deliver.</li>
<li><strong>Scope becomes real.</strong> Ideas shrink honestly once you have to finish them.</li>
<li><strong>Confidence stops being a personality trait.</strong> It becomes a record of things that worked.</li>
</ul>
<h2>The competition comes after</h2>
<p>Nepal has no shortage of student competitions, and I have judged and mentored plenty of them. The teams that do well are almost never the ones with the cleverest idea. They are the ones who already built something rough before the deadline was announced.</p>
<p>Compete when you have something to compete with. Until then, build.</p>`,
    },
    {
      title: 'From syllabus to skill: designing an IT course students actually use',
      category: 'education', tags: 'curriculum, course design, teaching, it education', featured: true, days: 20,
      excerpt: 'A syllabus is a list of topics. A course is a route from where a student is to something they can do. They are not the same document.',
      content: `<p>Handed a syllabus, the fastest thing to do is teach it in order. It is also usually the worst thing to do. A syllabus is written to be complete; a course has to be written to be survivable.</p>
<h2>Start from the last day</h2>
<p>Before planning week one, I write down what the student will be able to show on the final day. Not know — <strong>show</strong>. Once that artefact is fixed, every week has an obvious job: move the class one step closer to it.</p>
<h2>Sequence by dependency, not by chapter</h2>
<p>Textbook order optimises for reference. Teaching order should optimise for the shortest path to a first working result. I would rather a class deploy an ugly page in week two and spend the rest of the term making it good, than reach week twelve with beautiful theory and nothing running.</p>
<h2>Assess the artefact</h2>
<ul>
<li>Grade what was built, plus the reasoning behind it.</li>
<li>Ask students to explain a decision they later reversed. That is where the learning shows.</li>
<li>Leave room in the rubric for scope that was cut deliberately — that is a professional skill, not a failure.</li>
</ul>
<h2>Leave the exit visible</h2>
<p>A course should end with the student knowing the next three things to learn and where to find them. If they finish and do not know what comes next, the course closed a door it should have opened.</p>`,
    },
    {
      title: 'A practical checklist for putting your first website live',
      category: 'technology', tags: 'deployment, hosting, web, checklist', featured: false, days: 34,
      excerpt: 'The code works on your laptop. Here is the short list of things that decide whether it also works on a live domain at two in the morning.',
      content: `<p>Most first deployments fail on the same handful of things, and none of them are the code. This is the list I go through with students and with clients before a site goes live.</p>
<h2>Before you deploy</h2>
<ul>
<li>Keep credentials in environment variables, never in a file you commit or email around.</li>
<li>Turn detailed error output off in production and log instead. Visitors should never read a stack trace.</li>
<li>Every database query goes through parameters, never string concatenation. Every single one.</li>
<li>Escape on output, not on input.</li>
</ul>
<h2>Going live</h2>
<ul>
<li>Point the domain, then wait for DNS before judging anything.</li>
<li>Confirm HTTPS is on and that the plain HTTP address redirects to it.</li>
<li>Check the site on a phone on mobile data, not just on the office WiFi.</li>
<li>Send one message through the contact form and confirm it arrives.</li>
</ul>
<h2>The week after</h2>
<ul>
<li>Set up a backup before you need one, not after.</li>
<li>Submit the sitemap to Google Search Console.</li>
<li>Watch the analytics for pages returning errors, and fix them while the site is small.</li>
</ul>
<p>None of this is advanced. It is just the difference between a site that is online and a site that is actually running.</p>`,
    },
    {
      title: "The IT graduate's first year: what nobody puts in the course outline",
      category: 'career', tags: 'career, graduates, first job, advice', featured: false, days: 52,
      excerpt: 'The skills that decide your first year are mostly not technical. That is uncomfortable, and it is also good news, because they are learnable.',
      content: `<p>I have watched a lot of graduates walk into their first role. The ones who do well are rarely the ones who topped the class.</p>
<h2>Read more code than you write</h2>
<p>Your first months are mostly comprehension. Getting comfortable reading someone else's messy, half-documented work is the single highest-return habit available to you.</p>
<h2>Ask early, ask precisely</h2>
<p>Nobody minds a question. People mind three days of silence followed by a question. Say what you tried, what happened and what you expected — that turns a request for help into a two-minute conversation.</p>
<h2>Write things down</h2>
<p>Keep a running note of what you fixed and how. In six months it becomes your own documentation, and around review time it becomes evidence.</p>
<h2>Keep building outside work</h2>
<p>A job teaches you one stack, one codebase, one way of doing things. A small project of your own is how you stay a developer rather than becoming only an employee of a particular system.</p>`,
    },
    {
      title: "Running a student competition that is worth the students' time",
      category: 'leadership', tags: 'events, leadership, students, mentoring', featured: false, days: 70,
      excerpt: 'A campus competition can be a genuine turning point or a photo opportunity. The difference is decided weeks before anyone pitches.',
      content: `<p>Having mentored and judged student competitions, I can usually tell in the first round whether the organisers planned for the teams or for the closing ceremony.</p>
<h2>Recruit wider than the usual names</h2>
<p>The same confident students sign up for everything. The ones who would gain most rarely volunteer. Go to them directly.</p>
<h2>Mentoring is the event</h2>
<p>The pitch day is the visible part; the weeks of feedback before it are where the learning happens. Budget mentor time first and decorations last.</p>
<h2>Judge against a rubric the teams have seen</h2>
<p>If teams do not know what is being scored, the result feels arbitrary and the lesson is lost. Publish the criteria at the start.</p>
<h2>Do something the day after</h2>
<p>Most competitions end and evaporate. A follow-up session, an introduction, a small commitment to keep the best team moving — that is what turns three weeks of effort into something durable.</p>`,
    },
  ];

  await sql`INSERT INTO posts ${sql(
    posts.map((p) => ({
      title: p.title,
      slug: slugify(p.title, 'post'),
      excerpt: p.excerpt,
      content: p.content,
      cover_image: '',
      category_id: catId(p.category),
      author_id: authorId,
      tags: p.tags,
      status: 'published',
      is_featured: p.featured,
      allow_comments: true,
      meta_title: '',
      meta_description: p.excerpt,
      published_at: daysAgo(p.days),
      created_at: daysAgo(p.days),
      updated_at: daysAgo(p.days),
    })),
    'title', 'slug', 'excerpt', 'content', 'cover_image', 'category_id', 'author_id', 'tags',
    'status', 'is_featured', 'allow_comments', 'meta_title', 'meta_description',
    'published_at', 'created_at', 'updated_at',
  )}`;
}
