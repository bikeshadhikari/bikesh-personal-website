import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import SiteShell from '@/components/site/SiteShell';
import { Highlights, PageHero, SectionHead, Services } from '@/components/site/blocks';
import { menuEnabled } from '@/lib/menu';
import { getSettings, setting } from '@/lib/settings';
import { getHighlights, getServices } from '@/lib/content';
import Icon from '@/components/Icon';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Services',
  description: 'Training, web development, academic planning, speaking and mentoring.',
};

const STEPS = [
  { title: 'Conversation', body: 'We talk about what you actually need, who it is for, and what success looks like. No charge, no obligation.' },
  { title: 'Plan', body: 'You get a written outline: scope, schedule, what I deliver and what I need from you. Nothing starts before this is agreed.' },
  { title: 'Delivery', body: 'Work happens in visible stages, with something to review at each one, so there are no surprises at the end.' },
  { title: 'Handover', body: 'You are trained on whatever was built, so the work keeps running without me. That is the point.' },
];

export default async function ServicesPage() {
  if (!(await menuEnabled('services'))) notFound();

  const [services, highlights, contactOn, s] = await Promise.all([
    getServices(), getHighlights(), menuEnabled('contact'), getSettings(),
  ]);

  return (
    <SiteShell current="services">
      <PageHero
        eyebrow="Services"
        heading="How I can help"
        sub="Training, web development, academic planning, speaking and mentoring."
      />

      <section className="section">
        <div className="container">
          {services.length > 0
            ? <Services items={services} />
            : <p className="empty-state">Services will be listed here shortly.</p>}
        </div>
      </section>

      {highlights.length > 0 && <Highlights items={highlights} />}

      <section className="section section-alt">
        <div className="container narrow">
          <SectionHead eyebrow="How it works" heading="A simple way of working" center />
          <ol className="process-list">
            {STEPS.map((step, i) => (
              <li key={step.title}>
                <span className="step-num">{i + 1}</span>
                <div><h3>{step.title}</h3><p>{step.body}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {contactOn && (
        <section className="cta-band">
          <div className="container">
            <h2>Ready when you are</h2>
            <p>{setting(s, 'contact_intro')}</p>
            <Link className="btn btn-primary" href="/contact">
              Send a message <Icon name="arrow-right" className="icon icon-sm" />
            </Link>
          </div>
        </section>
      )}
    </SiteShell>
  );
}
