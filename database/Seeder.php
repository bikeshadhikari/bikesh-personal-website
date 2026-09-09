<?php
/**
 * First-run content. Everything here is editable from the dashboard - it is a
 * starting point drawn from Bikesh Adhikari's public profiles, not fixed copy.
 */
class Seeder
{
    public static function run(): void
    {
        self::settings();
        self::menus();
        self::highlights();
        self::experiences();
        self::skills();
        self::services();
        self::projects();
        self::certifications();
        self::testimonials();
        self::blog();
    }

    private static function has(string $table): bool
    {
        return (int) Database::value('SELECT COUNT(*) FROM ' . Database::q($table), [], 0) > 0;
    }

    private static function settings(): void
    {
        $defaults = [
            'site' => [
                'site_name'        => 'Bikesh Adhikari',
                'site_short_name'  => 'Bikesh',
                'site_tagline'     => 'Turning learners into doers, and doers into leaders.',
                'logo_text'        => 'Bikesh<span>.</span>',
                'logo_image'       => '',
                'favicon'          => '',
                'footer_note'      => 'Built and maintained in Kathmandu, Nepal.',
                'asset_version'    => '1',
                'maintenance_mode' => '0',
                'maintenance_text' => 'The site is being updated. Please check back shortly.',
            ],
            'profile' => [
                'full_name'      => 'Bikesh Adhikari',
                'name_native'    => 'विकेश अधिकारी',
                'headline'       => 'IT Professional · Educator · Practitioner · Speaker · Planner',
                'rotating_roles' => "IT Professional\nEducator & Trainer\nWeb Developer\nSpeaker & Facilitator\nAcademic Planner",
                'hero_intro'     => 'I teach technology the way it is actually practised, and I practise it the way it should be taught. For over a decade I have moved between the classroom, the client project and the conference stage, helping students and institutions in Nepal turn curiosity into working skill.',
                'about_lead'     => 'I am an IT professional and educator based in Kathmandu, Nepal, working at the point where teaching, technology and planning meet.',
                'about_body'     => "My work sits in three overlapping places. In the classroom I teach IT and skill-development courses across colleges and institutes in Nepal, designing courses that end with something the student has actually built. In practice I run web and systems projects as a developer and project manager, mostly in PHP, so what I teach stays honest to what production really demands. And in planning I help academic institutions shape programmes, run competitions and structure departments that students want to be part of.\n\nI also spend a good share of my time on stage and in workshops as a speaker, facilitator and mentor, working with student teams on entrepreneurship, digital literacy and career readiness. Alongside that I stay involved in youth, leadership and social initiatives, because technology only matters when it reaches the communities that need it.\n\nThe thread through all of it is simple: I would rather a learner leave with a deployed project than a memorised definition.",
                'photo'          => '',
                'photo_alt'      => '',
                'cv_file'        => '',
                'availability'   => 'Open to training, consulting and speaking engagements',
                'years_started'  => '2014',
            ],
            'contact' => [
                'contact_email'    => 'info@bikeshadhikari.com.np',
                'contact_phone'    => '',
                'contact_location' => 'Kathmandu, Nepal',
                'contact_hours'    => 'Sunday to Friday, 10:00 – 18:00 NPT',
                'contact_intro'    => 'Training, a web project, a session for your college, or just a question about getting started in IT — write and I will reply personally.',
                'map_embed'        => '',
                'notify_email'     => '',
            ],
            'social' => [
                'social_linkedin'  => 'https://www.linkedin.com/in/bikeshadh/',
                'social_facebook'  => 'https://facebook.com/bikesh.adh',
                'social_instagram' => 'https://www.instagram.com/bikesh.adh/',
                'social_github'    => '',
                'social_youtube'   => '',
                'social_twitter'   => '',
                'social_tiktok'    => '',
            ],
            'seo' => [
                'meta_title'       => 'Bikesh Adhikari — IT Professional, Educator & Speaker',
                'meta_description' => 'Bikesh Adhikari is an IT professional, educator and speaker based in Kathmandu, Nepal — teaching technology, building web systems and planning academic programmes.',
                'meta_keywords'    => 'Bikesh Adhikari, IT professional Nepal, IT educator, PHP developer Nepal, speaker, academic planner, Kathmandu',
                'og_image'         => '',
                'google_analytics' => '',
                'search_indexing'  => '1',
            ],
            'appearance' => [
                'theme_accent'     => '#2563eb',
                'theme_accent_alt' => '#0ea5e9',
                'default_mode'     => 'light',
                'show_mode_toggle' => '1',
            ],
            'blog' => [
                'blog_title'       => 'Notes & Articles',
                'blog_intro'       => 'Writing on IT education, building for the web, and the practical side of working in technology in Nepal.',
                'posts_per_page'   => '6',
                'comments_enabled' => '1',
                'comments_moderated' => '1',
                'newsletter_enabled' => '1',
            ],
        ];

        foreach ($defaults as $group => $pairs) {
            foreach ($pairs as $key => $value) {
                $exists = (int) Database::value('SELECT COUNT(*) FROM settings WHERE skey = ?', [$key], 0);
                if ($exists === 0) {
                    Database::insert('settings', ['skey' => $key, 'svalue' => (string) $value, 'sgroup' => $group]);
                }
            }
        }
    }

    private static function menus(): void
    {
        if (self::has('menus')) {
            return;
        }
        $rows = [
            // Navigable pages.
            ['home',       'Home',       'page', 1, 1, 1, 10, 'Landing page. Cannot be disabled.'],
            ['about',      'About',      'page', 1, 1, 0, 20, 'Full biography, skills and education.'],
            ['experience', 'Experience', 'page', 1, 1, 0, 30, 'The career pipeline / timeline.'],
            ['services',   'Services',   'page', 1, 1, 0, 40, 'What you offer to clients and institutions.'],
            ['projects',   'Projects',   'page', 1, 1, 0, 50, 'Portfolio of delivered work.'],
            ['blog',       'Blog',       'page', 1, 1, 0, 60, 'Articles listing and single post pages.'],
            ['contact',    'Contact',    'page', 1, 1, 0, 70, 'Contact form and details.'],
            // Home page blocks.
            ['hero',           'Hero banner',        'section', 0, 1, 1, 100, 'Name, roles and call to action.'],
            ['highlights',     'Key numbers',        'section', 0, 1, 0, 110, 'The counter strip under the hero.'],
            ['about-section',  'About preview',      'section', 0, 1, 0, 120, 'Short introduction on the home page.'],
            ['skills',         'Skills',             'section', 0, 1, 0, 130, 'Skill groups with proficiency bars.'],
            ['experience-section', 'Experience pipeline', 'section', 0, 1, 0, 140, 'Timeline preview on the home page.'],
            ['services-section',   'Services',       'section', 0, 1, 0, 150, 'Service cards on the home page.'],
            ['projects-section',   'Featured projects', 'section', 0, 1, 0, 160, 'Highlighted portfolio items.'],
            ['certifications', 'Certifications',     'section', 0, 1, 0, 170, 'Credentials and awards.'],
            ['testimonials',   'Testimonials',       'section', 0, 0, 0, 180, 'Turn on once you have added real quotes.'],
            ['blog-section',   'Latest writing',     'section', 0, 1, 0, 190, 'Most recent published posts.'],
            ['contact-section','Contact',            'section', 0, 1, 0, 200, 'Contact form on the home page.'],
            ['newsletter',     'Newsletter signup',  'section', 0, 1, 0, 210, 'Email capture in the footer.'],
        ];
        foreach ($rows as [$slug, $label, $kind, $inNav, $enabled, $locked, $order, $desc]) {
            Database::insert('menus', [
                'slug' => $slug, 'label' => $label, 'kind' => $kind, 'description' => $desc,
                'custom_url' => '', 'in_nav' => $inNav, 'enabled' => $enabled,
                'locked' => $locked, 'sort_order' => $order,
            ]);
        }
    }

    private static function highlights(): void
    {
        if (self::has('highlights')) {
            return;
        }
        $rows = [
            ['Years in IT & education', '10', '+', 'clock'],
            ['Students taught & mentored', '3000', '+', 'users'],
            ['Workshops, talks & sessions', '60', '+', 'mic'],
            ['Web projects delivered', '40', '+', 'code'],
        ];
        foreach ($rows as $i => [$label, $value, $suffix, $icon]) {
            Database::insert('highlights', [
                'label' => $label, 'value' => $value, 'suffix' => $suffix,
                'icon' => $icon, 'enabled' => 1, 'sort_order' => ($i + 1) * 10,
            ]);
        }
    }

    private static function experiences(): void
    {
        if (self::has('experiences')) {
            return;
        }
        $rows = [
            [
                'role' => 'Program Officer / Head of Department',
                'organization' => 'Apollo International College',
                'location' => 'Baneshwor, Kathmandu',
                'track' => 'work', 'employment_type' => 'Full-time',
                'start_date' => '2024-01-01', 'end_date' => null, 'is_current' => 1,
                'summary' => 'Leading academic programme delivery for the college, from course planning and faculty coordination to student outcomes.',
                'highlights' => "Own the semester planning cycle across programme cohorts\nCoordinate faculty, assessment schedules and academic quality\nRun student engagement, competition and industry-exposure activities\nBridge the classroom and the IT industry through practical coursework",
            ],
            [
                'role' => 'Founder & IT Consultant',
                'organization' => 'Paramarsha IT Solutions',
                'location' => 'Kathmandu, Nepal',
                'track' => 'work', 'employment_type' => 'Self-employed',
                'start_date' => '2021-01-01', 'end_date' => null, 'is_current' => 1,
                'summary' => 'A small consultancy building websites, portals and internal systems for schools, colleges and growing businesses in Nepal.',
                'highlights' => "Design and deliver PHP and MySQL web systems end to end\nSet up hosting, domains, email and long-term maintenance for clients\nAdvise institutions on digitising admissions, notices and records\nTrain client staff so systems keep running after handover",
            ],
            [
                'role' => 'Campus Chief / Director',
                'organization' => 'Institute of Management Studies — IMS College',
                'organization_url' => 'https://ims.edu.np/',
                'location' => 'Tinkune, Koteshwor, Kathmandu',
                'track' => 'work', 'employment_type' => 'Full-time',
                'start_date' => '2022-01-01', 'end_date' => '2023-12-31', 'is_current' => 0,
                'summary' => 'Led the campus through an academic year, holding responsibility for programmes, faculty, students and institutional direction.',
                'highlights' => "Directed academic operations across the college\nStrengthened faculty planning and student support systems\nHosted national-level student competitions on campus\nBuilt links between the college and the wider tech community",
            ],
            [
                'role' => 'IT Instructor & Coordinator',
                'organization' => 'New English Secondary Boarding School',
                'location' => 'Nepal',
                'track' => 'work', 'employment_type' => 'Part-time',
                'start_date' => '2019-01-01', 'end_date' => null, 'is_current' => 1,
                'summary' => 'Teaching computer science and digital literacy at secondary level, and shaping how technology is used across the school.',
                'highlights' => "Teach computer science and applied digital skills\nBuild practical, project-based lesson plans for school students\nSupport teachers in using digital tools in their own subjects",
            ],
            [
                'role' => 'Mentor & Resource Person',
                'organization' => 'Hult Prize on-campus programme',
                'location' => 'Kathmandu, Nepal',
                'track' => 'volunteer', 'employment_type' => 'Volunteer',
                'start_date' => '2023-01-01', 'end_date' => null, 'is_current' => 1,
                'summary' => 'Mentoring student startup teams through the world\'s largest student social-entrepreneurship competition, and judging campus finals.',
                'highlights' => "Coach teams from raw idea to pitch-ready venture\nJudge campus rounds and grand finales\nRun sessions on business modelling, validation and presentation",
            ],
            [
                'role' => 'Freelance Web Developer & Project Manager',
                'organization' => 'Independent',
                'location' => 'Remote / Kathmandu',
                'track' => 'work', 'employment_type' => 'Freelance',
                'start_date' => '2016-01-01', 'end_date' => null, 'is_current' => 1,
                'summary' => 'Delivering websites and web applications for clients in education, services and retail, usually as both the developer and the person running the project.',
                'highlights' => "PHP, MySQL, WordPress and custom front-end work\nRequirement gathering, scoping and delivery scheduling\nDeployment on shared hosting, cPanel and managed platforms",
            ],
            [
                'role' => 'Bachelor of Information Management (BIM)',
                'organization' => 'Tribhuvan University',
                'location' => 'Nepal',
                'track' => 'education', 'employment_type' => 'Bachelor\'s degree',
                'start_date' => '2014-01-01', 'end_date' => '2018-12-31', 'is_current' => 0,
                'summary' => 'A four-year degree combining information systems, software development and management — the foundation for both the technical and the planning side of my work.',
                'highlights' => "Information systems, databases and software engineering\nManagement, finance and organisational behaviour\nFinal-year project in applied web systems",
            ],
            [
                'role' => 'Higher Secondary Education (+2)',
                'organization' => 'National Examination Board',
                'location' => 'Nepal',
                'track' => 'education', 'employment_type' => 'Higher secondary',
                'start_date' => '2012-01-01', 'end_date' => '2014-12-31', 'is_current' => 0,
                'summary' => 'Higher secondary studies, where the first serious contact with computing turned into a career direction.',
                'highlights' => '',
            ],
        ];
        foreach ($rows as $i => $row) {
            Database::insert('experiences', array_merge([
                'role' => '', 'organization' => '', 'organization_url' => '', 'location' => '',
                'track' => 'work', 'employment_type' => '', 'start_date' => null, 'end_date' => null,
                'is_current' => 0, 'summary' => '', 'highlights' => '', 'logo' => '',
                'enabled' => 1, 'sort_order' => ($i + 1) * 10,
            ], $row));
        }
    }

    private static function skills(): void
    {
        if (self::has('skills')) {
            return;
        }
        $rows = [
            ['PHP', 'Development', 92], ['MySQL & database design', 'Development', 88],
            ['HTML5 & CSS3', 'Development', 95], ['JavaScript', 'Development', 82],
            ['WordPress', 'Development', 85], ['Git & version control', 'Development', 78],
            ['cPanel, hosting & deployment', 'Development', 86],
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
        foreach ($rows as $i => [$name, $cat, $level]) {
            Database::insert('skills', [
                'name' => $name, 'category' => $cat, 'level' => $level,
                'icon' => '', 'enabled' => 1, 'sort_order' => ($i + 1) * 10,
            ]);
        }
    }

    private static function services(): void
    {
        if (self::has('services')) {
            return;
        }
        $rows = [
            ['IT training & workshops', 'Hands-on training in web development, digital literacy and office technology, built around what participants will actually do the next day.',
             "Short bootcamps and semester-long courses\nCurriculum designed to end in a built project\nIn-person in Kathmandu or delivered online", 'graduation'],
            ['Web design & development', 'Websites, portals and small web applications built in PHP and MySQL, delivered ready to run on ordinary shared hosting.',
             "Institution and business websites\nAdmission, notice and records portals\nDomain, hosting and email setup included", 'code'],
            ['Academic programme planning', 'Helping colleges and schools structure departments, courses and calendars so the programme holds together across a full cycle.',
             "Course and semester planning\nFaculty coordination frameworks\nAssessment and quality processes", 'layers'],
            ['Speaking & facilitation', 'Sessions, keynotes and panels on technology, education and youth entrepreneurship for colleges, conferences and organisations.',
             "Keynotes and seminar sessions\nStartup and competition mentoring\nTeacher-training and orientation days", 'mic'],
            ['Career & startup mentoring', 'One-to-one and team mentoring for students entering IT, and for early student ventures finding their footing.',
             "Portfolio and first-job guidance\nIdea validation and pitch coaching\nRoadmaps for self-taught learners", 'compass'],
            ['Digital presence for institutions', 'Getting schools, colleges and small organisations properly online — site, content, social channels and the habits to keep them alive.',
             "Website plus content structure\nSocial and communication setup\nStaff training so it stays maintained", 'globe'],
        ];
        foreach ($rows as $i => [$title, $summary, $bullets, $icon]) {
            Database::insert('services', [
                'title' => $title, 'summary' => $summary, 'bullets' => $bullets, 'icon' => $icon,
                'price_note' => '', 'enabled' => 1, 'sort_order' => ($i + 1) * 10,
            ]);
        }
    }

    private static function projects(): void
    {
        if (self::has('projects')) {
            return;
        }
        $rows = [
            ['College management portal', 'A web portal for a college covering admissions enquiries, notices, faculty pages and student records, replacing a pile of spreadsheets and notice boards.',
             'PHP, MySQL, JavaScript', 'Education', '2024', 1],
            ['School website & notice system', 'A school site with a notice board, gallery and admissions form that non-technical staff can actually keep updated themselves.',
             'PHP, MySQL, HTML, CSS', 'Education', '2023', 1],
            ['Paramarsha IT Solutions', 'The consultancy site and client work pipeline — service pages, enquiry handling and the projects delivered under it.',
             'PHP, MySQL, WordPress', 'Business', '2021', 1],
            ['Hult Prize on-campus programme', 'Planning and running the campus edition of the student social-entrepreneurship competition, from team recruitment to the grand finale.',
             'Programme design, mentoring, event operations', 'Programme', '2024', 0],
            ['Digital literacy bootcamp', 'A short, repeatable course that takes complete beginners to a working understanding of computers, the internet and safe online practice.',
             'Curriculum design, training delivery', 'Training', '2023', 0],
            ['bikeshadhikari.com.np', 'This site — a fully database-driven personal platform with a dashboard controlling every page, section and post.',
             'PHP, MySQL, vanilla JS', 'Web', '2026', 1],
        ];
        foreach ($rows as $i => [$title, $summary, $tech, $cat, $year, $featured]) {
            Database::insert('projects', [
                'title' => $title, 'slug' => uniqueSlug('projects', slugify($title, 'project')),
                'summary' => $summary, 'description' => '', 'image' => '',
                'live_url' => '', 'repo_url' => '', 'tech' => $tech, 'client' => '',
                'year' => $year, 'category' => $cat, 'is_featured' => $featured,
                'enabled' => 1, 'sort_order' => ($i + 1) * 10,
            ]);
        }
    }

    private static function certifications(): void
    {
        if (self::has('certifications')) {
            return;
        }
        $rows = [
            ['Bachelor of Information Management (BIM)', 'Tribhuvan University', '2018-12-01'],
            ['Hult Prize — Campus Mentor & Judge', 'Hult Prize Foundation', '2024-01-01'],
        ];
        foreach ($rows as $i => [$title, $issuer, $date]) {
            Database::insert('certifications', [
                'title' => $title, 'issuer' => $issuer, 'issue_date' => $date,
                'credential_id' => '', 'credential_url' => '', 'image' => '',
                'enabled' => 1, 'sort_order' => ($i + 1) * 10,
            ]);
        }
    }

    private static function testimonials(): void
    {
        if (self::has('testimonials')) {
            return;
        }
        // Seeded switched off on purpose: replace the placeholder text with real
        // quotes from real people, then enable the section under Menus.
        $rows = [
            ['Replace with the person\'s name', 'Their role', 'Their college or company',
             'Paste a real quote here. Nothing on this section is shown to visitors until you enable "Testimonials" under Menus & Sections.'],
            ['Replace with the person\'s name', 'Their role', 'Their college or company',
             'A second placeholder. Delete the ones you do not need from Content → Testimonials.'],
        ];
        foreach ($rows as $i => [$name, $role, $org, $quote]) {
            Database::insert('testimonials', [
                'name' => $name, 'role' => $role, 'organization' => $org, 'quote' => $quote,
                'photo' => '', 'rating' => 5, 'enabled' => 0, 'sort_order' => ($i + 1) * 10,
            ]);
        }
    }

    private static function blog(): void
    {
        if (self::has('categories')) {
            return;
        }
        $cats = [
            ['Education', 'Teaching, curriculum and how people actually learn technology.', '#2563eb'],
            ['Technology', 'Building things for the web, and the tools that make it work.', '#0ea5e9'],
            ['Career', 'Getting started, getting hired, and getting better.', '#7c3aed'],
            ['Leadership', 'Planning, teams and running things that involve people.', '#059669'],
        ];
        $catIds = [];
        foreach ($cats as $i => [$name, $desc, $color]) {
            $catIds[$name] = Database::insert('categories', [
                'name' => $name, 'slug' => slugify($name, 'category'),
                'description' => $desc, 'color' => $color, 'sort_order' => ($i + 1) * 10,
            ]);
        }

        if (self::has('posts')) {
            return;
        }
        $authorId = (int) Database::value('SELECT id FROM users ORDER BY id ASC LIMIT 1', [], 1);
        $posts = [
            [
                'title' => 'Build first, compete later: what I tell every student on day one',
                'category' => 'Education',
                'tags' => 'teaching, students, projects, nepal',
                'excerpt' => 'Marks measure recall. Employers measure output. The gap between those two is where most of a student\'s first two years quietly disappear.',
                'content' => "<p>Every semester I meet students who can define normalisation perfectly and have never created a table. They are not lazy. They have been rewarded, for years, for a kind of learning that stops at the exam hall door.</p>
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
<p>Compete when you have something to compete with. Until then, build.</p>",
                'featured' => 1,
                'days_ago' => 6,
            ],
            [
                'title' => 'From syllabus to skill: designing an IT course students actually use',
                'category' => 'Education',
                'tags' => 'curriculum, course design, teaching, it education',
                'excerpt' => 'A syllabus is a list of topics. A course is a route from where a student is to something they can do. They are not the same document.',
                'content' => "<p>Handed a syllabus, the fastest thing to do is teach it in order. It is also usually the worst thing to do. A syllabus is written to be complete; a course has to be written to be survivable.</p>
<h2>Start from the last day</h2>
<p>Before planning week one, I write down what the student will be able to show on the final day. Not know — <em>show</em>. Once that artefact is fixed, every week has an obvious job: move the class one step closer to it.</p>
<h2>Sequence by dependency, not by chapter</h2>
<p>Textbook order optimises for reference. Teaching order should optimise for the shortest path to a first working result. I would rather a class deploy an ugly page in week two and spend the rest of the term making it good, than reach week twelve with beautiful theory and nothing running.</p>
<h2>Assess the artefact</h2>
<ul>
<li>Grade what was built, plus the reasoning behind it.</li>
<li>Ask students to explain a decision they later reversed. That is where the learning shows.</li>
<li>Leave room in the rubric for scope that was cut deliberately — that is a professional skill, not a failure.</li>
</ul>
<h2>Leave the exit visible</h2>
<p>A course should end with the student knowing the next three things to learn and where to find them. If they finish and do not know what comes next, the course closed a door it should have opened.</p>",
                'featured' => 1,
                'days_ago' => 20,
            ],
            [
                'title' => 'A practical checklist for launching your first PHP site on shared hosting',
                'category' => 'Technology',
                'tags' => 'php, hosting, deployment, mysql, hostinger',
                'excerpt' => 'The code works on your laptop. Here is the short list of things that decide whether it also works on a live domain at two in the morning.',
                'content' => "<p>Most first deployments fail on the same handful of things, and none of them are the code. This is the list I go through with students and with clients before a site goes live.</p>
<h2>Before you upload</h2>
<ul>
<li>Keep credentials in a config file that is excluded from version control. Never in the file you email around.</li>
<li>Turn <code>display_errors</code> off in production and log instead. Visitors should never read a stack trace.</li>
<li>Every database query goes through prepared statements. Every single one.</li>
<li>Escape on output, not on input.</li>
</ul>
<h2>On the host</h2>
<ul>
<li>Create the database and its user in the control panel first, then grant the user full rights to that database.</li>
<li>Upload into <code>public_html</code>, keeping the folder structure intact.</li>
<li>Set folders to 755 and files to 644. Nothing needs 777.</li>
<li>Make only the upload directory writable, and block script execution inside it.</li>
</ul>
<h2>After it is live</h2>
<ul>
<li>Install the free SSL certificate and force HTTPS. There is no reason left not to.</li>
<li>Load the site on a phone on mobile data, not just on the office WiFi.</li>
<li>Send one message through the contact form and confirm it arrives.</li>
<li>Set up a backup before you need one, not after.</li>
</ul>
<p>None of this is advanced. It is just the difference between a site that is online and a site that is actually running.</p>",
                'featured' => 0,
                'days_ago' => 34,
            ],
            [
                'title' => 'The IT graduate\'s first year: what nobody puts in the course outline',
                'category' => 'Career',
                'tags' => 'career, graduates, first job, advice',
                'excerpt' => 'The skills that decide your first year are mostly not technical. That is uncomfortable, and it is also good news, because they are learnable.',
                'content' => "<p>I have watched a lot of graduates walk into their first role. The ones who do well are rarely the ones who topped the class.</p>
<h2>Read more code than you write</h2>
<p>Your first months are mostly comprehension. Getting comfortable reading someone else's messy, half-documented work is the single highest-return habit available to you.</p>
<h2>Ask early, ask precisely</h2>
<p>Nobody minds a question. People mind three days of silence followed by a question. Say what you tried, what happened and what you expected — that turns a request for help into a two-minute conversation.</p>
<h2>Write things down</h2>
<p>Keep a running note of what you fixed and how. In six months it becomes your own documentation, and around review time it becomes evidence.</p>
<h2>Keep building outside work</h2>
<p>A job teaches you one stack, one codebase, one way of doing things. A small project of your own is how you stay a developer rather than becoming only an employee of a particular system.</p>",
                'featured' => 0,
                'days_ago' => 52,
            ],
            [
                'title' => 'Running a student competition that is worth the students\' time',
                'category' => 'Leadership',
                'tags' => 'events, leadership, students, mentoring',
                'excerpt' => 'A campus competition can be a genuine turning point or a photo opportunity. The difference is decided weeks before anyone pitches.',
                'content' => "<p>Having mentored and judged student competitions, I can usually tell in the first round whether the organisers planned for the teams or for the closing ceremony.</p>
<h2>Recruit wider than the usual names</h2>
<p>The same confident students sign up for everything. The ones who would gain most rarely volunteer. Go to them directly.</p>
<h2>Mentoring is the event</h2>
<p>The pitch day is the visible part; the weeks of feedback before it are where the learning happens. Budget mentor time first and decorations last.</p>
<h2>Judge against a rubric the teams have seen</h2>
<p>If teams do not know what is being scored, the result feels arbitrary and the lesson is lost. Publish the criteria at the start.</p>
<h2>Do something the day after</h2>
<p>Most competitions end and evaporate. A follow-up session, an introduction, a small commitment to keep the best team moving — that is what turns three weeks of effort into something durable.</p>",
                'featured' => 0,
                'days_ago' => 70,
            ],
        ];

        foreach ($posts as $p) {
            $published = date('Y-m-d H:i:s', strtotime('-' . $p['days_ago'] . ' days'));
            Database::insert('posts', [
                'title' => $p['title'],
                'slug' => uniqueSlug('posts', slugify($p['title'], 'post')),
                'excerpt' => $p['excerpt'],
                'content' => $p['content'],
                'cover_image' => '',
                'category_id' => $catIds[$p['category']] ?? null,
                'author_id' => $authorId,
                'tags' => $p['tags'],
                'status' => 'published',
                'is_featured' => $p['featured'],
                'allow_comments' => 1,
                'views' => 0,
                'meta_title' => '',
                'meta_description' => $p['excerpt'],
                'published_at' => $published,
                'created_at' => $published,
                'updated_at' => $published,
            ]);
        }
    }
}
