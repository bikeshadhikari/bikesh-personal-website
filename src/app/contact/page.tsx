import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import SiteShell from '@/components/site/SiteShell';
import { PageHero } from '@/components/site/blocks';
import ContactForm from '@/components/site/ContactForm';
import ContactDetails from '@/components/site/ContactDetails';
import { menuEnabled } from '@/lib/menu';
import { getSettings, setting, settingBool } from '@/lib/settings';
import { sanitizeEmbed } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return { title: 'Contact', description: setting(s, 'contact_intro') };
}

export default async function ContactPage() {
  if (!(await menuEnabled('contact'))) notFound();

  const s = await getSettings();
  const map = settingBool(s, 'contact_show_map', true) ? sanitizeEmbed(setting(s, 'map_embed')) : '';
  const form = settingBool(s, 'contact_show_form', true);

  return (
    <SiteShell current="contact">
      <PageHero eyebrow="Contact" heading="Let us talk" sub={setting(s, 'contact_intro')} />

      <section className="section" id="contact">
        <div className={`container contact-layout${form ? '' : ' is-details-only'}`}>
          {form && <ContactForm />}
          <ContactDetails showSocial />
        </div>
      </section>

      {map && (
        <section className="map-band">
          <div className="container">
            <div className="map-frame" dangerouslySetInnerHTML={{ __html: map }} />
          </div>
        </section>
      )}
    </SiteShell>
  );
}
