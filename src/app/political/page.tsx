import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import PoliticalSection from '@/components/site/PoliticalSection';
import PoliticalNav from '@/components/site/PoliticalNav';
import Icon from '@/components/Icon';
import { menuEnabled } from '@/lib/menu';
import { getSettings, setting, socialLinks } from '@/lib/settings';
import { getPoliticalPhotos, getPoliticalSections, polSetting } from '@/lib/political';
import { siteOrigin } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const name = polSetting(s, 'pol_name');
  const title = `${name} — राजनीतिक संलग्नता`;
  const description = polSetting(s, 'pol_meta_description');

  // The share picture is its own setting so this page can travel with a
  // portrait of its own rather than the site's default card.
  const cover = setting(s, 'pol_cover') || setting(s, 'pol_portrait');
  const images = cover ? { images: [{ url: cover, width: 1200, height: 630, alt: title }] } : {};

  return {
    title,
    description,
    alternates: { canonical: '/political' },
    openGraph: { type: 'profile', url: `${siteOrigin()}/political`, title, description, ...images },
    twitter: { card: cover ? 'summary_large_image' : 'summary', title, description, ...images },
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

  const [s, sections, photos] = await Promise.all([
    getSettings(), getPoliticalSections(), getPoliticalPhotos(),
  ]);

  const name = polSetting(s, 'pol_name');
  const roles = polSetting(s, 'pol_roles');
  const quote = polSetting(s, 'pol_quote');
  const intro = polSetting(s, 'pol_intro');
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
      <div className="pol-flag" aria-hidden="true" />

      <header className="pol-hero">
        <div className="pol-hero-art" aria-hidden="true">
          <span className="pol-orb pol-orb-1" />
          <span className="pol-orb pol-orb-2" />
          <span className="pol-tree">
            <svg viewBox="0 0 64 64" width="100%" height="100%" fill="none"
                 stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
              <path d="M32 58V34" />
              <path d="M32 34 20 24M32 40 44 30M32 28 24 16M32 22 40 12" />
              <circle cx="32" cy="18" r="11" />
              <circle cx="20" cy="27" r="8" />
              <circle cx="44" cy="27" r="8" />
            </svg>
          </span>
        </div>

        <div className="pol-wrap pol-hero-inner">
          <div className="pol-hero-copy">
            <p className="pol-eyebrow">सार्वजनिक परिचय</p>
            <h1>{name}</h1>
            {roles && <p className="pol-roles">{roles}</p>}
            {quote && <blockquote className="pol-quote">{quote}</blockquote>}
            {intro && <p className="pol-intro">{intro}</p>}

            <div className="pol-hero-actions">
              <a className="pol-btn pol-btn-solid" href={`#s-${sections[0]?.id ?? ''}`}>
                पढ्न सुरु गर्नुहोस् <Icon name="arrow-right" className="icon icon-sm" />
              </a>
              <Link className="pol-btn pol-btn-ghost" href="/">
                मुख्य वेबसाइट
              </Link>
            </div>
          </div>

          {portrait && (
            <div className="pol-portrait">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={portrait} alt={name} />
            </div>
          )}
        </div>
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

      <footer className="pol-footer">
        <div className="pol-wrap">
          <p className="pol-footer-line">{footerNote}</p>
          <p className="pol-footer-name">{name}{roles && <span> · {roles}</span>}</p>

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
