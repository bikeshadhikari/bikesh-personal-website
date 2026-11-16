import 'server-only';
import type { Metadata } from 'next';
import { getTechSettings, st, stBool, stl, type Lang } from './tech';
import { siteOrigin } from './utils';

/** Title, description, icons and share card for a Simplified Tech page. */
export async function techMetadata({
  lang, path, title, description, image,
}: { lang: Lang; path: string; title?: string; description?: string; image?: string }): Promise<Metadata> {
  const s = await getTechSettings();
  const brand = st(s, 'st_meta_title');
  const fullTitle = title ? `${title} — ${brand}` : `${brand} · ${stl(s, 'st_kicker', lang)}`;
  const desc = description || stl(s, 'st_meta_description', lang);
  const og = image || st(s, 'st_og_image');
  const icon = st(s, 'st_favicon') || '/tech/icon.svg';
  const base = siteOrigin();
  const sep = path.includes('?') ? '&' : '?';

  return {
    title: { absolute: fullTitle },
    description: desc,
    icons: { icon, apple: st(s, 'st_favicon') || '/apple-touch-icon.png', shortcut: icon },
    robots: stBool(s, 'st_index') ? { index: true, follow: true } : { index: false, follow: false },
    alternates: {
      canonical: lang === (st(s, 'st_default_lang') === 'ne' ? 'ne' : 'en') ? path : `${path}${sep}lang=${lang}`,
      languages: { en: `${path}${sep}lang=en`, ne: `${path}${sep}lang=ne` },
    },
    openGraph: {
      type: 'website',
      url: `${base}${path}`,
      siteName: brand,
      title: fullTitle,
      description: desc,
      locale: lang === 'ne' ? 'ne_NP' : 'en_US',
      images: og ? [og] : undefined,
    },
    twitter: { card: og ? 'summary_large_image' : 'summary', title: fullTitle, description: desc, images: og ? [og] : undefined },
  };
}
