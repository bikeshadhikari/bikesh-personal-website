import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import PoliticalSection from '@/components/site/PoliticalSection';
import PoliticalNav from '@/components/site/PoliticalNav';
import PoliticalBackdrop from '@/components/site/PoliticalBackdrop';
import JayaNepal from '@/components/site/JayaNepal';
import NoticePopup from '@/components/site/NoticePopup';
import { getActiveNotice } from '@/lib/content';
import Icon from '@/components/Icon';
import { menuEnabled } from '@/lib/menu';
import { getSettings, setting, socialLinks } from '@/lib/settings';
import { getPoliticalPhotos, getPoliticalSections, getPoliticalSlides,
         parseFigures, polSetting, registerPoliticalView } from '@/lib/political';
import ReadTimer from '@/components/site/ReadTimer';
import PoliticalSlider from '@/components/site/PoliticalSlider';
import PoliticalEmblem from '@/components/site/PoliticalEmblem';
import PoliticalFloaters from '@/components/site/PoliticalFloaters';
import PoliticalCall from '@/components/site/PoliticalCall';
import { siteOrigin } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const name = polSetting(s, 'pol_name');
  const title = `${name} — राजनीतिक संलग्नता`;
  const description = polSetting(s, 'pol_meta_description');

  // The Share picture wins, then the portrait. Naming neither leaves the card
  // in opengraph-image.tsx to serve, which is why an empty field no longer
  // means a link arrives on Facebook as bare text.
  const cover = setting(s, 'pol_cover') || setting(s, 'pol_portrait');
  const images = cover ? { images: [{ url: cover, width: 1200, height: 630, alt: title }] } : {};

  return {
    title,
    description,
    alternates: { canonical: '/political' },
    openGraph: { type: 'profile', url: `${siteOrigin()}/political`, title, description, ...images },
    // There is always a wide picture now — an uploaded one or the drawn card.
    twitter: { card: 'summary_large_image', title, description, ...images },
  };
}

/**
 * A page that stands on its own.
 *
 * It deliberately skips the site shell: no shared header, no shared footer, no
 * shared palette. Someone arriving from a shared link should meet one subject
 * and one argument, not a portfolio with a political tab.
 */
export default async function PoliticalPage() {
  if (!(await menuEnabled('political'))) notFound();

  // Counted here rather than in generateMetadata, which runs for the same
  // request and would double every arrival. Not awaited: a counter never
  // delays a render.
  void registerPoliticalView();

  const [s, sections, photos, slides, notice] = await Promise.all([
    getSettings(), getPoliticalSections(), getPoliticalPhotos(),
    getPoliticalSlides(), getActiveNotice(),
  ]);

  const name = polSetting(s, 'pol_name');
  const candidacy = polSetting(s, 'pol_candidacy');
  const candidacySub = polSetting(s, 'pol_candidacy_sub');
  const candidacyNote = polSetting(s, 'pol_candidacy_note');
  // Pledges share the figure format: two halves to a line, separated by a bar.
  const pillars = parseFigures(polSetting(s, 'pol_pillars'));
  const portrait = setting(s, 'pol_portrait') || setting(s, 'photo');
  const listenLabel = polSetting(s, 'pol_listen_label');
  const footerNote = polSetting(s, 'pol_footer_note');
  const socials = socialLinks(s);
  const email = setting(s, 'contact_email');

  const byId = new Map<number, typeof photos>();
  for (const photo of photos) {
    const key = photo.section_id ?? 0;
    byId.set(key, [...(byId.get(key) ?? []), photo]);
  }

  return (
    <div className="political">
      <div className="pol-ribbon" aria-hidden="true" />
      <PoliticalBackdrop />

      {/* The same notice the rest of the site shows, so a visitor who arrives
          here first is told the same thing. */}
      {notice && (
        <NoticePopup
          notice={{
            id: notice.id,
            title: notice.title,
            body: notice.body ?? '',
            image: notice.image ?? '',
            linkUrl: notice.link_file || notice.link_url || '',
            linkLabel: notice.link_label ?? '',
            dismissOnce: notice.dismiss_once,
            showOn: notice.show_on ?? 'home',
            showPaths: (notice.show_paths ?? '')
              .split('\n').map((x) => x.trim()).filter(Boolean),
            version: String(notice.updated_at ?? ''),
          }}
        />
      )}

      <ReadTimer endpoint="/api/political/time" />

      <header className="pol-hero">
        <div className="pol-hero-art" aria-hidden="true">
          <span className="pol-orb pol-orb-1" />
          <span className="pol-orb pol-orb-2" />
          <span className="pol-hero-tree" />
        </div>

        <PoliticalFloaters />

        <div className="pol-wrap pol-hero-inner">
          <div className="pol-hero-copy">
            <p className="pol-eyebrow">{polSetting(s, 'pol_eyebrow')}</p>
            <h1>{name}</h1>

            {candidacy && (
              <div className="pol-candidacy">
                <strong>{candidacy}</strong>
                {candidacySub && <span>{candidacySub}</span>}
              </div>
            )}

            {candidacyNote && <p className="pol-intro">{candidacyNote}</p>}

            {pillars.length > 0 && (
              <ul className="pol-pillars">
                {pillars.map((pillar, i) => (
                  <li key={i}>
                    <strong>{pillar.value}</strong>
                    {pillar.label && <span>{pillar.label}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* The ballot symbol, which asks for the जय नेपाल greeting. */}
          <PoliticalEmblem
            image={polSetting(s, 'pol_emblem')}
            caption={polSetting(s, 'pol_emblem_label')}
            label={polSetting(s, 'pol_jaya_label')}
          />
        </div>

        {/* The photographs, reading after the pledges rather than beside them. */}
        {slides.length > 0 ? (
          <div className="pol-wrap pol-hero-gallery">
            <PoliticalSlider
              alt={name}
              slides={slides.map((x) => ({
                id: x.id, image: x.image, caption: x.caption,
                width: x.width, height: x.height,
              }))}
            />
          </div>
        ) : portrait ? (
          <div className="pol-wrap pol-hero-gallery">
            <div className="pol-portrait">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={portrait} alt={name} />
            </div>
          </div>
        ) : null}
      </header>

      {sections.length > 0 && <PoliticalNav sections={sections.map((x) => ({
        id: x.id, number: x.number, title: x.title,
      }))} />}

      <main id="pol-main">
        {sections.length === 0 ? (
          <div className="pol-wrap pol-empty">
            <p>यस पृष्ठको सामग्री तयार हुँदैछ।</p>
          </div>
        ) : (
          sections.map((section, i) => (
            <PoliticalSection
              key={section.id}
              section={section}
              photos={byId.get(section.id) ?? []}
              listenLabel={listenLabel}
              index={i}
            />
          ))
        )}
      </main>

      <PoliticalCall
        phone={polSetting(s, 'pol_phone')}
        label={polSetting(s, 'pol_call_label')}
      />

      <JayaNepal
        label={polSetting(s, 'pol_jaya_label')}
        audio={setting(s, 'pol_jaya_audio')}
      />

      <footer className="pol-footer">
        <div className="pol-wrap">
          <p className="pol-footer-line">{footerNote}</p>
          <p className="pol-footer-name">{name}</p>
          {candidacy && (
            <p className="pol-footer-role">
              {candidacy}{candidacySub && <span> · {candidacySub}</span>}
            </p>
          )}

          {(socials.length > 0 || email) && (
            <ul className="pol-social">
              {email && (
                <li>
                  <a href={`mailto:${email}`} aria-label="Email"><Icon name="mail" /></a>
                </li>
              )}
              {socials.map((social) => (
                <li key={social.key}>
                  <a href={social.url} target="_blank" rel="noopener noreferrer" aria-label={social.label}>
                    <Icon name={social.icon} />
                  </a>
                </li>
              ))}
            </ul>
          )}

          <p className="pol-footer-back">
            <Link href="/">← {setting(s, 'site_name', 'मुख्य वेबसाइट')}</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
