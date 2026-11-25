import 'server-only';
import type { Metadata } from 'next';
import { getTechSettings, st, stBool, stl, type Lang } from './tech';
import { siteOrigin } from './utils';
import { DEFAULT_TECH_KEYWORDS } from './seo';

/** Title, description, icons and share card for a Simplified Tech page. */
export async function techMetadata({
  lang, path, title, description, image, article, keywords,
}: {
  lang: Lang; path: string; title?: string; description?: string; image?: string;
  article?: { published?: string | null; modified?: string | null; section?: string | null; tags?: string[] };
  keywords?: string[];
}): Promise<Metadata> {
  const s = await getTechSettings();
  const brand = st(s, 'st_meta_title');
  const fullTitle = title ? `${title} — ${brand}` : `${brand} · ${stl(s, 'st_kicker', lang)}`;
  const desc = description || stl(s, 'st_meta_description', lang);
  // A post draws its own card (opengraph-image beside it); every other page
  // falls back to the Simplified Tech card.
  const og = image || st(s, 'st_og_image') || (article ? '' : `${siteOrigin()}/tech/opengraph-image`);
  const icon = st(s, 'st_favicon') || '/tech/icon.svg';
  const base = siteOrigin();
  const sep = path.includes('?') ? '&' : '?';

  const baseKeywords = st(s, 'st_keywords').split(',').map((k) => k.trim()).filter(Boolean);
  const author = s.full_name || 'Bikesh Adhikari';

  return {
    title: { absolute: fullTitle },
    description: desc,
    keywords: [...(keywords ?? []), ...(baseKeywords.length ? baseKeywords : DEFAULT_TECH_KEYWORDS)],
    authors: [{ name: author, url: base }],
    creator: author,
    publisher: brand,
    category: 'technology',
    icons: { icon, apple: st(s, 'st_favicon') || '/apple-touch-icon.png', shortcut: icon },
    robots: stBool(s, 'st_index') ? { index: true, follow: true } : { index: false, follow: false },
    alternates: {
      canonical: lang === (st(s, 'st_default_lang') === 'ne' ? 'ne' : 'en') ? path : `${path}${sep}lang=${lang}`,
      languages: { en: `${path}${sep}lang=en`, ne: `${path}${sep}lang=ne`, 'x-default': path },
      types: { 'application/rss+xml': [{ url: '/tech/feed.xml', title: brand }] },
    },
    openGraph: {
      ...(article
        ? { type: 'article' as const, publishedTime: article.published ?? undefined, modifiedTime: article.modified ?? undefined,
            section: article.section ?? undefined, tags: article.tags, authors: [author] }
        : { type: 'website' as const }),
      url: `${base}${path}`,
      siteName: brand,
      title: fullTitle,
      description: desc,
      locale: lang === 'ne' ? 'ne_NP' : 'en_US',
      ...(og ? { images: [og] } : {}),
    },
    twitter: { card: 'summary_large_image', title: fullTitle, description: desc, creator: st(s, 'st_handle'), ...(og ? { images: [og] } : {}) },
  };
}
