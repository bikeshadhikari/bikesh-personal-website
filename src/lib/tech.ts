import 'server-only';
import { cache } from 'react';
import { sql } from './db';
import { ensureSchema, isMissingColumn, isMissingTable } from './schema';
import { getSettings, saveSettings, setting, settingBool, type SettingsMap } from './settings';
import { safeColor } from './utils';

/*
 * Simplified Tech by Bikesh — a microsite at /tech.
 *
 * It shares the database, the dashboard and the media library with the main
 * site and nothing else: its own header, footer, palette, favicon, theme and
 * language. Every setting it reads starts with st_ and lives under
 * Dashboard → Simplified Tech → Site settings.
 */

export type Lang = 'en' | 'ne';

export type TechCollection = {
  id: number;
  name: string;
  name_ne: string;
  slug: string;
  description: string;
  description_ne: string;
  cover_image: string;
  in_nav: boolean;
  sort_order: number;
  link_count: number;
};

export type TechLink = {
  id: number;
  title: string;
  title_ne: string;
  slug: string;
  short_link: string;
  collection_id: number | null;
  collection_name: string | null;
  collection_name_ne: string | null;
  collection_slug: string | null;
  kicker: string;
  kicker_ne: string;
  summary: string;
  summary_ne: string;
  content: string;
  content_ne: string;
  cover_image: string;
  badge: string;
  external_url: string;
  external_label: string;
  video_url: string;
  is_featured: boolean;
  published_at: string | Date | null;
  views: number;
  block_count: number;
  meta_description: string;
  updated_at?: string | Date | null;
  faq?: string;
};

export type TechBlock = {
  id: number;
  link_id: number;
  title: string;
  title_ne: string;
  description: string;
  description_ne: string;
  label: string;
  body: string;
  body_ne: string;
  url: string;
};

/* -------------------------------------------------------------------------- */
/* Settings                                                                   */
/* -------------------------------------------------------------------------- */

/** Every st_ setting with the value used until the owner changes it. */
export const TECH_DEFAULTS: Record<string, string> = {
  st_name: 'Simplified Tech',
  st_by: 'by Bikesh',
  st_name_ne: 'सिम्प्लिफाइड टेक',
  st_by_ne: 'बिकेशद्वारा',
  st_handle: '@bikesh.adh',
  st_tagline: 'Simplifying tech with Bikesh',
  st_tagline_ne: 'बिकेशसँग प्रविधि सजिलो',
  st_kicker: 'Tech Explainer',
  st_kicker_ne: 'टेक एक्सप्लेनर',
  st_logo_image: '',
  st_favicon: '',
  st_og_image: '',
  st_meta_title: 'Simplified Tech by Bikesh',
  st_meta_description: 'Free prompts, tools and plain-language tech explainers by Bikesh (@bikesh.adh). Copy, paste and get it done.',
  st_meta_description_ne: 'बिकेशका निःशुल्क प्रम्प्ट, टुल र सरल भाषामा प्रविधि व्याख्या। कपी गर्नुहोस्, पेस्ट गर्नुहोस्, काम सक्नुहोस्।',
  st_index: '1',
  st_keywords: '',
  st_about_title: 'About Bikesh — tech creator from Nepal',
  st_about_title_ne: 'बिकेशको बारेमा — नेपालका टेक क्रिएटर',
  st_about: 'Bikesh Adhikari (@bikesh.adh) is a tech creator from Nepal who explains technology in simple Nepali. Through Simplified Tech by Bikesh and the Tech Explainer series on Instagram, Facebook, YouTube and TikTok, he shares free AI prompts, tools and step-by-step guides that anyone can follow — no jargon, no paid apps needed.\n\nHe is also an IT professional and educator, and every prompt and tool on this site is one he has tested himself.',
  st_about_ne: 'बिकेश अधिकारी (@bikesh.adh) नेपालका टेक क्रिएटर हुन्, जसले प्रविधिलाई सरल नेपालीमा बुझाउँछन्। Simplified Tech by Bikesh र इन्स्टाग्राम, फेसबुक, युट्युब तथा टिकटकमा चल्ने Tech Explainer शृङ्खलामार्फत उनी निःशुल्क एआई प्रम्प्ट, टुल र चरणबद्ध गाइड बाँड्छन्।\n\nउनी आईटी पेसाकर्मी र शिक्षक पनि हुन्, र यहाँका हरेक प्रम्प्ट र टुल उनले आफैँ परीक्षण गरेका हुन्।',

  st_default_theme: 'dark',
  st_show_theme_toggle: '1',
  st_use_site_accent: '1',
  st_accent: '#2dd4bf',
  st_default_lang: 'en',
  st_show_lang_toggle: '1',

  st_catalogue_title: 'The Simplified Catalogue',
  st_catalogue_title_ne: 'सिम्प्लिफाइड क्याटलग',
  st_catalogue_note: 'All items free',
  st_catalogue_note_ne: 'सबै निःशुल्क',
  st_hero_label: 'New this week',
  st_hero_label_ne: 'यो हप्ता नयाँ',
  st_show_shelves: '1',
  st_show_collections: '1',
  st_show_newsletter: '1',
  st_show_big_wordmark: '1',
  st_per_page: '24',

  st_blocks_heading: 'Copy and use',
  st_blocks_heading_ne: 'कपी गरेर प्रयोग गर्नुहोस्',

  st_newsletter_title: 'Get new tools in your inbox.',
  st_newsletter_title_ne: 'नयाँ टुलहरू सिधै इमेलमा।',
  st_newsletter_text: 'Free prompts and tools that replace paid apps, plus my take on the week in tech.',
  st_newsletter_text_ne: 'पैसा तिर्नुपर्ने एपको सट्टा निःशुल्क प्रम्प्ट र टुल, अनि हप्ताभरिको प्रविधि सरल भाषामा।',
  st_footer_about: 'I learn tech so you can use it. Prompts, tools and explainers I test myself, written by a person.',
  st_footer_about_ne: 'म प्रविधि सिक्छु, ताकि तपाईं सजिलै प्रयोग गर्न सक्नुहोस्। आफैँ परीक्षण गरेका प्रम्प्ट, टुल र व्याख्या।',
  st_footer_copyright: '© {year} Simplified Tech by Bikesh',
  st_footer_note: 'Tested by me, written by a person.',
  st_footer_note_ne: 'आफैँ परीक्षण गरेको, मान्छेले लेखेको।',
  st_show_main_site_link: '1',

  st_youtube: 'https://www.youtube.com/@bikeshadh',
  st_instagram: 'https://www.instagram.com/bikesh.adh',
  st_facebook: 'https://www.facebook.com/bikesh.adh',
  st_tiktok: 'https://www.tiktok.com/@bikesh.adh',
  st_email: '',
  st_show_subscribe: '1',
  st_show_header_socials: '1',
  st_subscribe_label: 'Subscribe',
  st_subscribe_label_ne: 'सब्स्क्राइब',

  st_nav_links: '',
};

export function st(s: SettingsMap, key: string): string {
  return setting(s, key, TECH_DEFAULTS[key] ?? '');
}

export function stBool(s: SettingsMap, key: string): boolean {
  return settingBool(s, key, (TECH_DEFAULTS[key] ?? '') === '1');
}

/** Pick the Nepali wording of a setting when it exists, else the English. */
export function stl(s: SettingsMap, key: string, lang: Lang): string {
  if (lang === 'ne') {
    const ne = st(s, `${key}_ne`);
    if (ne) return ne;
  }
  return st(s, key);
}

/** The accent: the main site's unless the microsite has its own. */
export function techAccent(s: SettingsMap): string {
  if (stBool(s, 'st_use_site_accent')) {
    return safeColor(setting(s, 'theme_accent', '#2563eb'), '#2563eb');
  }
  return safeColor(st(s, 'st_accent'), '#2dd4bf');
}

export type SocialItem = { key: string; label: string; icon: string; url: string };

export function techSocials(s: SettingsMap): SocialItem[] {
  return [
    { key: 'youtube', label: 'YouTube', icon: 'youtube', url: st(s, 'st_youtube') },
    { key: 'instagram', label: 'Instagram', icon: 'instagram', url: st(s, 'st_instagram') },
    { key: 'facebook', label: 'Facebook', icon: 'facebook', url: st(s, 'st_facebook') },
    { key: 'tiktok', label: 'TikTok', icon: 'tiktok', url: st(s, 'st_tiktok') },
  ].filter((x) => /^https?:\/\//i.test(x.url.trim()));
}

/** YouTube's own "subscribe" prompt opens when this is appended to a channel. */
export function youtubeSubscribeUrl(url: string): string {
  if (!url) return '';
  if (url.includes('sub_confirmation')) return url;
  return `${url}${url.includes('?') ? '&' : '?'}sub_confirmation=1`;
}

export type NavLink = { label: string; href: string };

/** Extra header links typed as  English | नेपाली | /address, one per line. */
export function customNavLinks(s: SettingsMap, lang: Lang): NavLink[] {
  return st(s, 'st_nav_links').split('\n').map((line) => line.trim()).filter(Boolean)
    .map((line) => {
      const parts = line.split('|').map((p) => p.trim());
      const href = parts[parts.length - 1];
      const en = parts[0];
      const ne = parts.length >= 3 ? parts[1] : '';
      return { label: lang === 'ne' && ne ? ne : en, href };
    })
    .filter((l) => l.label && /^(https?:\/\/|\/)/i.test(l.href));
}

/**
 * Settings for the Simplified Tech pages. Also corrects one early default:
 * the Facebook link first shipped as facebook.com/bikeshadh; the right page is
 * facebook.com/bikesh.adh. Only that exact old value is replaced, so a link
 * the owner typed in is never touched.
 */
export const getTechSettings = cache(async (): Promise<SettingsMap> => {
  const s = await getSettings();
  const old = (s.st_facebook ?? '').trim().replace(/\/+$/, '');
  if (/^https?:\/\/(www\.)?facebook\.com\/bikeshadh$/i.test(old)) {
    const fixed = TECH_DEFAULTS.st_facebook;
    try { await saveSettings({ st_facebook: fixed }, 'tech'); } catch { /* shown corrected either way */ }
    return { ...s, st_facebook: fixed };
  }
  return s;
});

/* -------------------------------------------------------------------------- */
/* Language                                                                   */
/* -------------------------------------------------------------------------- */

export function resolveLang(raw: string | string[] | undefined, s: SettingsMap): Lang {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === 'ne' || v === 'en') return v;
  return st(s, 'st_default_lang') === 'ne' ? 'ne' : 'en';
}

/** Add the language to an address on the microsite, unless it is the default. */
export function withLang(href: string, lang: Lang, s: SettingsMap): string {
  const fallback = st(s, 'st_default_lang') === 'ne' ? 'ne' : 'en';
  if (lang === fallback || !href.startsWith('/tech')) return href;
  return `${href}${href.includes('?') ? '&' : '?'}lang=${lang}`;
}

/** A row's field in the reader's language, falling back to English. */
export function tr(row: Record<string, unknown>, field: string, lang: Lang): string {
  if (lang === 'ne') {
    const ne = row[`${field}_ne`];
    if (typeof ne === 'string' && ne.trim()) return ne;
  }
  const en = row[field];
  return typeof en === 'string' ? en : '';
}

const NE_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

export function num(n: number | string, lang: Lang): string {
  const text = String(n);
  return lang === 'ne' ? text.replace(/[0-9]/g, (d) => NE_DIGITS[Number(d)]) : text;
}

const NE_MONTHS = ['जनवरी', 'फेब्रुअरी', 'मार्च', 'अप्रिल', 'मे', 'जुन', 'जुलाई', 'अगस्ट', 'सेप्टेम्बर', 'अक्टोबर', 'नोभेम्बर', 'डिसेम्बर'];

export function techDate(value: string | Date | null | undefined, lang: Lang): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  if (lang === 'ne') return `${NE_MONTHS[d.getUTCMonth()]} ${num(d.getUTCDate(), 'ne')}, ${num(d.getUTCFullYear(), 'ne')}`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

/** Interface wording in both languages. */
const UI = {
  en: {
    home: 'Home', collections: 'Collections', allLinks: 'All links', latest: 'Latest',
    newestFirst: 'Newest first', open: 'Open', seeAll: 'See all', search: 'Search',
    searchPlaceholder: 'Search prompts, tools and guides…', copy: 'Copy', copied: 'Copied',
    items: (n: number) => `${n} ${n === 1 ? 'item' : 'items'}`,
    links: (n: number) => `${n} ${n === 1 ? 'link' : 'links'}`,
    collectionNo: 'Collection no.', openLinks: (n: number) => `Open the ${n} ${n === 1 ? 'link' : 'links'}`,
    readMore: 'Read', backTo: 'All links', related: 'More like this', nothing: 'Nothing here yet.',
    noResults: 'No results. Try a different word.', results: (n: number, q: string) => `${n} result${n === 1 ? '' : 's'} for “${q}”`,
    email: 'you@email.com', subscribeEmail: 'Get the weekly email', newsletterNote: 'Free. Unsubscribe in one click.',
    follow: 'Follow', mainSite: 'Main website', theme: 'Switch theme', menu: 'Menu', close: 'Close',
    language: 'नेपाली', languageLabel: 'Read in Nepali', share: 'Share', copyLink: 'Copy link',
    watch: 'Watch the video', visit: 'Open the link', learn: 'Learn', use: 'Use', about: 'About',
    prev: 'Newer', next: 'Older', explore: 'Explore', page: 'Page',
    faq: 'Frequently asked questions', aboutMe: 'About Bikesh', readFull: 'Read the full article',
  },
  ne: {
    home: 'गृहपृष्ठ', collections: 'सङ्ग्रहहरू', allLinks: 'सबै लिङ्क', latest: 'पछिल्लो',
    newestFirst: 'नयाँ पहिले', open: 'खोल्नुहोस्', seeAll: 'सबै हेर्नुहोस्', search: 'खोज्नुहोस्',
    searchPlaceholder: 'प्रम्प्ट, टुल र गाइड खोज्नुहोस्…', copy: 'कपी', copied: 'कपी भयो',
    items: (n: number) => `${num(n, 'ne')} वटा`,
    links: (n: number) => `${num(n, 'ne')} लिङ्क`,
    collectionNo: 'सङ्ग्रह नं.', openLinks: (n: number) => `${num(n, 'ne')} लिङ्क खोल्नुहोस्`,
    readMore: 'पढ्नुहोस्', backTo: 'सबै लिङ्क', related: 'यस्तै अरू', nothing: 'अहिलेसम्म केही छैन।',
    noResults: 'केही भेटिएन। अर्को शब्दले खोज्नुहोस्।', results: (n: number, q: string) => `“${q}” का लागि ${num(n, 'ne')} नतिजा`,
    email: 'tapai@email.com', subscribeEmail: 'साप्ताहिक इमेल पाउनुहोस्', newsletterNote: 'निःशुल्क। एक क्लिकमै बन्द गर्न सकिन्छ।',
    follow: 'फलो गर्नुहोस्', mainSite: 'मुख्य वेबसाइट', theme: 'थिम बदल्नुहोस्', menu: 'मेनु', close: 'बन्द',
    language: 'English', languageLabel: 'Read in English', share: 'सेयर', copyLink: 'लिङ्क कपी',
    watch: 'भिडियो हेर्नुहोस्', visit: 'लिङ्क खोल्नुहोस्', learn: 'सिक्नुहोस्', use: 'प्रयोग', about: 'बारेमा',
    prev: 'नयाँ', next: 'पुराना', explore: 'अन्वेषण', page: 'पृष्ठ',
    faq: 'प्रायः सोधिने प्रश्न', aboutMe: 'बिकेशको बारेमा', readFull: 'पूरा लेख पढ्नुहोस्',
  },
};

export type UiText = typeof UI.en;
export function ui(lang: Lang): UiText {
  return UI[lang] as UiText;
}

/* -------------------------------------------------------------------------- */
/* Queries                                                                    */
/* -------------------------------------------------------------------------- */

async function heal<T>(run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (!isMissingTable(error) && !isMissingColumn(error)) {
      console.error('[tech]', error);
      return fallback;
    }
    await ensureSchema();
    try {
      return await run();
    } catch (retryError) {
      console.error('[tech]', retryError);
      return fallback;
    }
  }
}

const LIVE = () => sql`l.status = 'published' AND (l.published_at IS NULL OR l.published_at <= NOW())`;

const LINK_COLUMNS = () => sql`
  l.id, l.title, l.title_ne, l.slug, l.short_link, l.collection_id, l.kicker, l.kicker_ne,
  l.summary, l.summary_ne, l.cover_image, l.badge, l.external_url, l.external_label,
  l.video_url, l.is_featured, l.published_at, l.updated_at, l.views, l.meta_description,
  c.name AS collection_name, c.name_ne AS collection_name_ne, c.slug AS collection_slug,
  (SELECT COUNT(*)::int FROM tech_blocks b WHERE b.link_id = l.id AND b.enabled) AS block_count`;

export const getTechCollections = cache(async (): Promise<TechCollection[]> =>
  heal(async () => {
    await seedOnce();
    return [...await sql<TechCollection[]>`
      SELECT c.*, (SELECT COUNT(*)::int FROM tech_links l
                   WHERE l.collection_id = c.id AND ${LIVE()}) AS link_count
      FROM tech_collections c WHERE c.enabled
      ORDER BY c.sort_order ASC, c.id ASC`];
  }, []));

export async function getTechCollection(slug: string): Promise<TechCollection | null> {
  const all = await getTechCollections();
  return all.find((c) => c.slug === slug) ?? null;
}

export const getTechLinks = cache(async (
  opts: { collectionId?: number; q?: string; limit?: number; offset?: number } = {},
): Promise<{ rows: TechLink[]; total: number }> =>
  heal(async () => {
    await seedOnce();
    const limit = Math.min(200, Math.max(1, opts.limit ?? 24));
    const offset = Math.max(0, opts.offset ?? 0);
    const like = opts.q ? `%${opts.q}%` : null;
    const where = sql`${LIVE()}
      ${opts.collectionId ? sql`AND l.collection_id = ${opts.collectionId}` : sql``}
      ${like ? sql`AND (l.title ILIKE ${like} OR l.title_ne ILIKE ${like} OR l.summary ILIKE ${like}
                    OR l.summary_ne ILIKE ${like} OR c.name ILIKE ${like}
                    OR EXISTS (SELECT 1 FROM tech_blocks b WHERE b.link_id = l.id AND b.enabled
                               AND (b.title ILIKE ${like} OR b.body ILIKE ${like} OR b.title_ne ILIKE ${like})))` : sql``}`;
    const [rows, count] = await Promise.all([
      sql<TechLink[]>`SELECT ${LINK_COLUMNS()} FROM tech_links l
        LEFT JOIN tech_collections c ON c.id = l.collection_id
        WHERE ${where}
        ORDER BY l.published_at DESC NULLS LAST, l.id DESC LIMIT ${limit} OFFSET ${offset}`,
      sql<{ n: number }[]>`SELECT COUNT(*)::int AS n FROM tech_links l
        LEFT JOIN tech_collections c ON c.id = l.collection_id WHERE ${where}`,
    ]);
    return { rows: [...rows], total: count[0]?.n ?? 0 };
  }, { rows: [], total: 0 }));

/**
 * The three cards at the top of the home page: the big one is the newest
 * featured link (or simply the newest), the two beside it are the next newest.
 */
export const getTechHero = cache(async (): Promise<TechLink[]> =>
  heal(async () => {
    await seedOnce();
    const rows = await sql<TechLink[]>`SELECT ${LINK_COLUMNS()} FROM tech_links l
      LEFT JOIN tech_collections c ON c.id = l.collection_id
      WHERE ${LIVE()}
      ORDER BY l.is_featured DESC, l.published_at DESC NULLS LAST, l.id DESC LIMIT 1`;
    const main = rows[0];
    if (!main) return [];
    const rest = await sql<TechLink[]>`SELECT ${LINK_COLUMNS()} FROM tech_links l
      LEFT JOIN tech_collections c ON c.id = l.collection_id
      WHERE ${LIVE()} AND l.id <> ${main.id}
      ORDER BY l.published_at DESC NULLS LAST, l.id DESC LIMIT 2`;
    return [main, ...rest];
  }, []));

export const getTechLink = cache(async (slug: string, preview = false): Promise<TechLink | null> =>
  heal(async () => {
    const rows = await sql<TechLink[]>`SELECT ${LINK_COLUMNS()}, l.content, l.content_ne, l.faq FROM tech_links l
      LEFT JOIN tech_collections c ON c.id = l.collection_id
      WHERE l.slug = ${slug} ${preview ? sql`` : sql`AND ${LIVE()}`} LIMIT 1`;
    return rows[0] ?? null;
  }, null));

export async function getTechBlocks(linkId: number): Promise<TechBlock[]> {
  return heal(async () => [...await sql<TechBlock[]>`
    SELECT * FROM tech_blocks WHERE link_id = ${linkId} AND enabled
    ORDER BY sort_order ASC, id ASC`], []);
}

export async function getRelatedTechLinks(link: TechLink, limit = 4): Promise<TechLink[]> {
  return heal(async () => [...await sql<TechLink[]>`SELECT ${LINK_COLUMNS()} FROM tech_links l
    LEFT JOIN tech_collections c ON c.id = l.collection_id
    WHERE ${LIVE()} AND l.id <> ${link.id}
    ORDER BY (l.collection_id IS NOT DISTINCT FROM ${link.collection_id}) DESC,
             l.published_at DESC NULLS LAST LIMIT ${limit}`], []);
}

/** The blog article the agent wrote for a Simplified Tech post, if it is live. */
export async function getBlogArticleFor(linkId: number): Promise<{ slug: string; title: string } | null> {
  return heal(async () => {
    const rows = await sql<{ slug: string; title: string }[]>`
      SELECT slug, title FROM posts WHERE source_tech_id = ${linkId} AND status = 'published'
        AND (published_at IS NULL OR published_at <= NOW()) ORDER BY id DESC LIMIT 1`;
    return rows[0] ?? null;
  }, null);
}

export async function countTechView(id: number): Promise<void> {
  try {
    await sql`UPDATE tech_links SET views = views + 1 WHERE id = ${id}`;
  } catch {
    // A missed view is never worth an error.
  }
}

export async function countTechCopy(id: number): Promise<void> {
  try {
    await sql`UPDATE tech_links SET copies = copies + 1 WHERE id = ${id}`;
  } catch {
    // Same.
  }
}

/** Dropdown choices for the dashboard. */
export async function techCollectionChoices(): Promise<{ value: string; label: string }[]> {
  return heal(async () => (await sql<{ id: number; name: string }[]>`
    SELECT id, name FROM tech_collections ORDER BY sort_order ASC, name ASC`)
    .map((r) => ({ value: String(r.id), label: r.name })), []);
}

export async function techLinkChoices(): Promise<{ value: string; label: string }[]> {
  return heal(async () => (await sql<{ id: number; title: string; status: string }[]>`
    SELECT id, title, status FROM tech_links ORDER BY published_at DESC NULLS LAST, id DESC`)
    .map((r) => ({ value: String(r.id), label: r.status === 'published' ? r.title : `${r.title} (draft)` })), []);
}

/* -------------------------------------------------------------------------- */
/* First run                                                                  */
/* -------------------------------------------------------------------------- */

let seeding: Promise<void> | null = null;

/**
 * One example collection and one example post the first time the microsite
 * is opened, so the layout can be seen before anything is written. Runs once:
 * a flag in settings stops it coming back after the examples are deleted.
 */
function seedOnce(): Promise<void> {
  seeding ??= (async () => {
    const s = await getSettings();
    if (s.st_seeded === '1') return;
    await ensureSchema();
    const [{ n }] = await sql<{ n: number }[]>`SELECT COUNT(*)::int AS n FROM tech_links`;
    if (n === 0) {
      const [col] = await sql<{ id: number }[]>`
        INSERT INTO tech_collections (name, name_ne, slug, description, description_ne, sort_order)
        VALUES ('AI Prompts', 'एआई प्रम्प्ट', 'ai-prompts',
                'Copy-paste prompts that get real work done.',
                'वास्तविक काम गराउने कपी-पेस्ट प्रम्प्टहरू।', 10)
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id`;
      const [link] = await sql<{ id: number }[]>`
        INSERT INTO tech_links (title, title_ne, slug, collection_id, kicker, kicker_ne, summary, summary_ne,
                                content, content_ne, badge, status, is_featured, published_at)
        VALUES ('The WiFi speed prompt', 'वाइफाइ स्पिड प्रम्प्ट', 'wifi-speed-prompt', ${col.id},
                'Speed', 'स्पिड',
                'Paste it into an AI assistant on your computer. It finds what is slowing your WiFi and asks before it fixes anything.',
                'आफ्नो कम्प्युटरको एआई सहायकमा पेस्ट गर्नुहोस्। वाइफाइ किन ढिलो छ पत्ता लगाउँछ, र केही बदल्नुअघि सोध्छ।',
                '<p>This is an example post. Edit it or delete it under <strong>Dashboard → Simplified Tech → Posts &amp; links</strong>.</p>',
                '<p>यो नमुना पोस्ट हो। <strong>ड्यासबोर्ड → Simplified Tech → Posts &amp; links</strong> मा गएर बदल्न वा हटाउन सक्नुहुन्छ।</p>',
                'Free', 'published', TRUE, NOW())
        RETURNING id`;
      await sql`INSERT INTO tech_blocks (link_id, title, title_ne, description, description_ne, label, body, body_ne, sort_order)
        VALUES
        (${link.id}, 'The prompt from the reel', 'रिलमा देखाइएको प्रम्प्ट',
         'Put your plan speed in the brackets, then paste it in.', 'कोष्ठकमा आफ्नो प्लानको स्पिड लेख्नुहोस्, अनि पेस्ट गर्नुहोस्।',
         'Prompt',
         'My internet feels slower than what I pay for. My plan is [your plan speed, for example 100 Mbps]. Find out why on this computer, step by step.',
         'मेरो इन्टरनेट मैले तिरेभन्दा ढिलो छ जस्तो लाग्छ। मेरो प्लान [तपाईंको प्लान स्पिड, जस्तै 100 Mbps] हो। यो कम्प्युटरमा किन ढिलो छ, चरणबद्ध रूपमा पत्ता लगाउनुहोस्।',
         10),
        (${link.id}, 'Tips before you run it', 'चलाउनुअघि सुझाव',
         'Run it once on WiFi and once on a cable if you can.', 'सकेसम्म एक पटक वाइफाइमा र एक पटक केबलमा चलाउनुहोस्।',
         'Prompt',
         '1. Check if I am on Mac or Windows and use the right built-in tools.\n2. Measure my current speed and compare it with my plan.\n3. List what you found and ask me before changing any setting.',
         '', 20)`;
    }
    await saveSettings({ st_seeded: '1' }, 'tech');
  })().catch((error) => {
    seeding = null;
    throw error;
  });
  return seeding;
}
