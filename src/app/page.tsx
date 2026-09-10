import Link from 'next/link';
import SiteShell from '@/components/site/SiteShell';
import Hero from '@/components/site/Hero';
import ContactForm from '@/components/site/ContactForm';
import ContactDetails from '@/components/site/ContactDetails';
import {
  Certifications, Highlights, PostCard, Projects,
  SectionHead, Services, Skills, Testimonials, Timeline,
} from '@/components/site/blocks';
import { menuEnabled, menuLabel } from '@/lib/menu';
import { getSettings, setting, settingBool } from '@/lib/settings';
import {
  getCertifications, getExperiences, getHighlights, getPosts,
  getProjects, getServices, getSkillsGrouped, getTestimonials,
} from '@/lib/content';
import Icon from '@/components/Icon';

export const dynamic = 'force-dynamic';

/** Every block below renders only when its switch is on in Menus & sections. */
export default async function HomePage() {
  const s = await getSettings();

  const [heroOn, highlightsOn, aboutOn, skillsOn, expOn, servicesOn, projectsOn,
         certsOn, testimonialsOn, blogSectionOn, contactSectionOn] = await Promise.all([
    menuEnabled('hero'), menuEnabled('highlights'), menuEnabled('about-section'),
    menuEnabled('skills'), menuEnabled('experience-section'), menuEnabled('services-section'),
    menuEnabled('projects-section'), menuEnabled('certifications'), menuEnabled('testimonials'),
    menuEnabled('blog-section'), menuEnabled('contact-section'),
  ]);
  const contactFormOn = settingBool(s, 'contact_show_form', true);
  const [aboutPageOn, expPageOn, projectsPageOn, blogOn, contactOn] = await Promise.all([
    menuEnabled('about'), menuEnabled('experience'), menuEnabled('projects'),
    menuEnabled('blog'), menuEnabled('contact'),
  ]);

  const [highlights, skills, experiences, services, projects, certs, testimonials, posts] =
    await Promise.all([
      highlightsOn ? getHighlights() : [],
      skillsOn ? getSkillsGrouped() : [],
      expOn ? getExperiences('work', 4) : [],
      servicesOn ? getServices(6) : [],
      projectsOn ? getProjects(true, 6) : [],
      certsOn ? getCertifications() : [],
      testimonialsOn ? getTestimonials() : [],
      blogSectionOn && blogOn ? getPosts({ perPage: 3 }).then((r) => r.items) : [],
    ]);

  const aboutParagraphs = setting(s, 'about_body').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const cv = setting(s, 'cv_file');

  return (
    <SiteShell current="home" home>
      {heroOn && <Hero />}
      {highlightsOn && <Highlights items={highlights} />}

      {aboutOn && (
        <section className="section section-about" id="about">
          <div className="container">
            <SectionHead
              eyebrow="About"
              heading={await menuLabel('about-section', 'Who I am')}
              sub={setting(s, 'about_lead')}
            />
            <div className="about-layout">
              <div className="about-text">
                {/* Trimmed to sit level with the panel beside it. The rest of
                    the biography lives on the About page. */}
                <div className="about-clamp">
                  {aboutParagraphs.map((para, i) => <p key={i}>{para}</p>)}
                </div>
                <div className="about-actions">
                  {aboutPageOn && (
                    <Link className="btn btn-primary" href="/about">
                      Read the full profile <Icon name="arrow-right" className="icon icon-sm" />
                    </Link>
                  )}
                  {cv && (
                    <a className="btn btn-ghost" href={cv} download>
                      <Icon name="download" className="icon icon-sm" /> Download CV
                    </a>
                  )}
                </div>
              </div>
              <aside className="about-facts">
                <h3>At a glance</h3>
                <dl>
                  {/* Each pair is wrapped so a whole row can light up together. */}
                  {setting(s, 'contact_location') && (
                    <div><dt><Icon name="pin" className="icon icon-sm" /> Based in</dt><dd>{setting(s, 'contact_location')}</dd></div>
                  )}
                  {setting(s, 'years_started') && (
                    <div><dt><Icon name="clock" className="icon icon-sm" /> Working since</dt><dd>{setting(s, 'years_started')}</dd></div>
                  )}
                  {setting(s, 'contact_email') && (
                    <div><dt><Icon name="mail" className="icon icon-sm" /> Email</dt>
                      <dd><a href={`mailto:${setting(s, 'contact_email')}`}>{setting(s, 'contact_email')}</a></dd></div>
                  )}
                  {setting(s, 'availability') && (
                    <div><dt><Icon name="sparkle" className="icon icon-sm" /> Status</dt><dd>{setting(s, 'availability')}</dd></div>
                  )}
                </dl>
              </aside>
            </div>
          </div>
        </section>
      )}

      {skillsOn && skills.length > 0 && (
        <section className="section section-alt" id="skills">
          <div className="container">
            <SectionHead
              eyebrow="Capabilities"
              heading={await menuLabel('skills', 'Skills')}
              sub="What I build with, what I teach with, and what I plan with."
              center
            />
            <Skills groups={skills} />
          </div>
        </section>
      )}

      {expOn && experiences.length > 0 && (
        <section className="section" id="experience">
          <div className="container">
            <SectionHead
              eyebrow="Pipeline"
              heading={await menuLabel('experience-section', 'Experience')}
              sub="Where the teaching, the building and the planning have happened."
            />
            <Timeline items={experiences} />
            {expPageOn && (
              <p className="section-more">
                <Link className="btn btn-ghost" href="/experience">
                  Full timeline <Icon name="arrow-right" className="icon icon-sm" />
                </Link>
              </p>
            )}
          </div>
        </section>
      )}

      {servicesOn && services.length > 0 && (
        <section className="section section-alt" id="services">
          <div className="container">
            <SectionHead
              eyebrow="What I do"
              heading={await menuLabel('services-section', 'Services')}
              sub="Training, systems and planning for institutions, teams and individuals."
              center
            />
            <Services items={services} />
          </div>
        </section>
      )}

      {projectsOn && projects.length > 0 && (
        <section className="section" id="projects">
          <div className="container">
            <SectionHead
              eyebrow="Selected work"
              heading={await menuLabel('projects-section', 'Featured projects')}
              sub="Systems and programmes that shipped and stayed in use."
            />
            <Projects items={projects} />
            {projectsPageOn && (
              <p className="section-more">
                <Link className="btn btn-ghost" href="/projects">
                  All projects <Icon name="arrow-right" className="icon icon-sm" />
                </Link>
              </p>
            )}
          </div>
        </section>
      )}

      {certsOn && certs.length > 0 && (
        <section className="section section-alt" id="certifications">
          <div className="container narrow">
            <SectionHead
              eyebrow="Credentials"
              heading={await menuLabel('certifications', 'Certifications & recognition')}
              center
            />
            <Certifications items={certs} />
          </div>
        </section>
      )}

      {testimonialsOn && testimonials.length > 0 && (
        <section className="section" id="testimonials">
          <div className="container">
            <SectionHead
              eyebrow="In their words"
              heading={await menuLabel('testimonials', 'What people say')}
              center
            />
            <Testimonials items={testimonials} />
          </div>
        </section>
      )}

      {blogSectionOn && posts.length > 0 && (
        <section className="section section-alt" id="writing">
          <div className="container">
            <SectionHead
              eyebrow="Writing"
              heading={await menuLabel('blog-section', 'Blogs and Articles')}
              sub={setting(s, 'blog_intro')}
            />
            <div className="cards-grid posts-grid">
              {posts.map((post) => <PostCard key={post.id} post={post} />)}
            </div>
            <p className="section-more">
              <Link className="btn btn-ghost" href="/blog">
                All articles <Icon name="arrow-right" className="icon icon-sm" />
              </Link>
            </p>
          </div>
        </section>
      )}

      {contactSectionOn && contactOn && (
        <section className="section section-contact" id="contact">
          <div className="container">
            <SectionHead
              eyebrow="Contact"
              heading={await menuLabel('contact-section', 'Let us talk')}
              sub={setting(s, 'contact_intro')}
            />
            <div className={`contact-layout${contactFormOn ? '' : ' is-details-only'}`}>
              {contactFormOn && <ContactForm />}
              <ContactDetails />
            </div>
          </div>
        </section>
      )}
    </SiteShell>
  );
}
