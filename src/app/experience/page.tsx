import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import SiteShell from '@/components/site/SiteShell';
import { PageHero, Timeline } from '@/components/site/blocks';
import { menuEnabled } from '@/lib/menu';
import { getSettings, setting } from '@/lib/settings';
import { getExperiences, getExperienceTracks } from '@/lib/content';
import Icon from '@/components/Icon';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Experience',
  description: 'Roles, institutions, education and volunteer work, in one timeline.',
};

const LABELS: Record<string, string> = {
  work: 'Work', education: 'Education', volunteer: 'Volunteer', award: 'Awards',
};

export default async function ExperiencePage({
  searchParams,
}: { searchParams: Promise<{ track?: string }> }) {
  if (!(await menuEnabled('experience'))) notFound();

  const { track: requested } = await searchParams;
  const tracks = await getExperienceTracks();
  const track = requested && tracks.includes(requested) ? requested : 'all';

  const [experiences, contactOn, s] = await Promise.all([
    getExperiences(track), menuEnabled('contact'), getSettings(),
  ]);

  return (
    <SiteShell current="experience">
      <PageHero
        eyebrow="Career pipeline"
        heading="Experience"
        sub="Roles, institutions and study, in one line from the beginning to now."
      />

      <section className="section">
        <div className="container">
          {tracks.length > 1 && (
            <div className="filter-bar">
              <Link className={`filter-chip${track === 'all' ? ' is-active' : ''}`} href="/experience">Everything</Link>
              {tracks.map((t) => (
                <Link
                  key={t}
                  className={`filter-chip${track === t ? ' is-active' : ''}`}
                  href={`/experience?track=${t}`}
                >
                  {LABELS[t] ?? t}
                </Link>
              ))}
            </div>
          )}

          {experiences.length > 0
            ? <Timeline items={experiences} />
            : <p className="empty-state">Nothing has been added to this track yet.</p>}
        </div>
      </section>

      {contactOn && (
        <section className="cta-band">
          <div className="container">
            <h2>Looking for a trainer, developer or speaker?</h2>
            <p>{setting(s, 'contact_intro', 'Tell me what you are planning and I will tell you honestly whether I am the right fit.')}</p>
            <Link className="btn btn-primary" href="/contact">
              Start a conversation <Icon name="arrow-right" className="icon icon-sm" />
            </Link>
          </div>
        </section>
      )}
    </SiteShell>
  );
}
