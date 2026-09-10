import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import SiteShell from '@/components/site/SiteShell';
import { Certifications, Highlights, PageHero, SectionHead, Skills, Timeline } from '@/components/site/blocks';
import { menuEnabled } from '@/lib/menu';
import { getSettings, setting } from '@/lib/settings';
import { getCertifications, getExperiences, getHighlights, getSkillsGrouped } from '@/lib/content';
import { excerptOf } from '@/lib/utils';
import Icon from '@/components/Icon';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return { title: 'About', description: excerptOf(setting(s, 'about_lead'), 30) };
}

export default async function AboutPage() {
  if (!(await menuEnabled('about'))) notFound();

  const [s, skills, education, certs, highlights, contactOn] = await Promise.all([
    getSettings(), getSkillsGrouped(), getExperiences('education'),
    getCertifications(), getHighlights(), menuEnabled('contact'),
  ]);

  const paragraphs = setting(s, 'about_body').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const photo = setting(s, 'photo');
  const cv = setting(s, 'cv_file');

  return (
    <SiteShell current="about">
      <PageHero eyebrow="About" heading={setting(s, 'full_name', 'About me')} sub={setting(s, 'headline')} />

      <section className="section">
        <div className="container about-layout">
          <div className="about-text prose">
            <p className="lead">{setting(s, 'about_lead')}</p>
            {paragraphs.map((para, i) => <p key={i}>{para}</p>)}
            <div className="about-actions">
              {contactOn && (
                <Link className="btn btn-primary" href="/contact">
                  Get in touch <Icon name="arrow-right" className="icon icon-sm" />
                </Link>
              )}
              {cv && (
                <a className="btn btn-ghost" href={cv} download>
                  <Icon name="download" className="icon icon-sm" /> Download CV
                </a>
              )}
            </div>
          </div>

          <aside className="about-side">
            {photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="about-photo" src={photo} alt={setting(s, 'photo_alt', setting(s, 'full_name'))} />
            )}
            <div className="about-facts">
              <h3>At a glance</h3>
              <dl>
                {setting(s, 'contact_location') && (<><dt>Based in</dt><dd>{setting(s, 'contact_location')}</dd></>)}
                {setting(s, 'years_started') && (<><dt>Working since</dt><dd>{setting(s, 'years_started')}</dd></>)}
                {setting(s, 'contact_email') && (
                  <><dt>Email</dt><dd><a href={`mailto:${setting(s, 'contact_email')}`}>{setting(s, 'contact_email')}</a></dd></>
                )}
                {setting(s, 'availability') && (<><dt>Status</dt><dd>{setting(s, 'availability')}</dd></>)}
              </dl>
            </div>
          </aside>
        </div>
      </section>

      {highlights.length > 0 && <Highlights items={highlights} />}

      {skills.length > 0 && (
        <section className="section section-alt">
          <div className="container">
            <SectionHead eyebrow="Capabilities" heading="Skills" center />
            <Skills groups={skills} />
          </div>
        </section>
      )}

      {education.length > 0 && (
        <section className="section">
          <div className="container narrow">
            <SectionHead eyebrow="Academic background" heading="Education" />
            <Timeline items={education} />
          </div>
        </section>
      )}

      {certs.length > 0 && (
        <section className="section section-alt">
          <div className="container narrow">
            <SectionHead eyebrow="Credentials" heading="Certifications & recognition" center />
            <Certifications items={certs} />
          </div>
        </section>
      )}
    </SiteShell>
  );
}
