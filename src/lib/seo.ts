import 'server-only';
import { setting, socialLinks, type SettingsMap } from './settings';
import { siteOrigin } from './utils';

/*
 * Structured data (schema.org JSON-LD) shared by both sites.
 *
 * Everything points at ONE Person, with the same @id everywhere, carrying
 * every social profile in sameAs. That is how Google's Knowledge Graph and AI
 * search engines join "Bikesh Adhikari", "@bikesh.adh", "Simplified Tech by
 * Bikesh", the website and the Instagram/Facebook/YouTube/TikTok accounts into
 * a single entity, so a search for any one of them can surface all of them.
 */

export const personId = () => `${siteOrigin()}/#person`;
export const techSiteId = () => `${siteOrigin()}/tech#website`;

const TECH_SOCIAL_KEYS = ['st_youtube', 'st_instagram', 'st_facebook', 'st_tiktok'];
const TECH_SOCIAL_DEFAULTS: Record<string, string> = {
  st_youtube: 'https://www.youtube.com/@bikeshadh',
  st_instagram: 'https://www.instagram.com/bikesh.adh',
  st_facebook: 'https://www.facebook.com/bikeshadh',
  st_tiktok: 'https://www.tiktok.com/@bikesh.adh',
};

/** Every public profile, main-site and Simplified Tech, without duplicates. */
export function allProfiles(s: SettingsMap): string[] {
  const urls = [
    ...socialLinks(s).map((l) => l.url),
    ...TECH_SOCIAL_KEYS.map((k) => setting(s, k, TECH_SOCIAL_DEFAULTS[k])),
  ].map((u) => u.trim()).filter((u) => /^https?:\/\//i.test(u));
  const seen = new Set<string>();
  return urls.filter((u) => {
    const key = u.toLowerCase().replace(/\/+$/, '').replace('://www.', '://');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const DEFAULT_KNOWS_ABOUT = [
  'Artificial intelligence', 'AI prompts', 'ChatGPT', 'Claude', 'Technology education',
  'Smartphones', 'Internet and Wi-Fi', 'Cyber security awareness', 'Web development', 'IT in Nepal',
];

export function personSchema(s: SettingsMap) {
  const base = siteOrigin();
  const name = setting(s, 'full_name', 'Bikesh Adhikari');
  const knows = setting(s, 'seo_knows_about').split(',').map((x) => x.trim()).filter(Boolean);
  return {
    '@type': 'Person',
    '@id': personId(),
    name,
    alternateName: [setting(s, 'st_handle', '@bikesh.adh'), 'Bikesh', 'Simplified Tech by Bikesh'],
    url: base,
    image: setting(s, 'photo') || undefined,
    jobTitle: setting(s, 'seo_job_title', 'Tech creator and IT educator'),
    description: setting(s, 'seo_person_description',
      `${name} (@bikesh.adh) is a tech creator from Nepal who explains technology in simple Nepali through Simplified Tech by Bikesh and the Tech Explainer series on Instagram, Facebook, YouTube and TikTok.`),
    email: setting(s, 'contact_email') ? `mailto:${setting(s, 'contact_email')}` : undefined,
    nationality: { '@type': 'Country', name: 'Nepal' },
    homeLocation: { '@type': 'Place', name: setting(s, 'contact_location', 'Nepal') },
    knowsAbout: knows.length > 0 ? knows : DEFAULT_KNOWS_ABOUT,
    sameAs: allProfiles(s),
  };
}

export function techWebsiteSchema(s: SettingsMap) {
  const base = siteOrigin();
  return {
    '@type': 'WebSite',
    '@id': techSiteId(),
    name: setting(s, 'st_meta_title', 'Simplified Tech by Bikesh'),
    alternateName: ['Simplified Tech', 'Tech Explainer by Bikesh'],
    url: `${base}/tech`,
    inLanguage: ['en', 'ne'],
    description: setting(s, 'st_meta_description',
      'Free AI prompts, tools and plain-language tech explainers by Bikesh (@bikesh.adh), a tech creator from Nepal.'),
    publisher: { '@id': personId() },
    author: { '@id': personId() },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${base}/tech/search?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbs(items: { name: string; url: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url })),
  };
}

export type Faq = { question: string; answer: string };

export function parseFaq(raw: string | null | undefined): Faq[] {
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list)
      ? list.filter((f) => f && typeof f.question === 'string' && typeof f.answer === 'string'
          && f.question.trim() && f.answer.trim()).slice(0, 10)
      : [];
  } catch {
    return [];
  }
}

export function faqSchema(faq: Faq[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

/** A @graph document ready for a <script type="application/ld+json">. */
export function graph(...nodes: (Record<string, unknown> | null | undefined | false)[]) {
  return { '@context': 'https://schema.org', '@graph': nodes.filter(Boolean) };
}

export const DEFAULT_TECH_KEYWORDS = [
  'Simplified Tech by Bikesh', 'Bikesh Adhikari', '@bikesh.adh', 'bikesh.adh', 'Tech Explainer',
  'tech creator in Nepal', 'Nepali tech creator', 'Nepali tech explainer', 'tech tips in Nepali',
  'AI prompts', 'free AI tools', 'ChatGPT prompts Nepal', 'technology in Nepali',
];
