import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Source_Serif_4 } from 'next/font/google';
import { getSettings, setting, settingBool, socialLinks } from '@/lib/settings';
import { jsonForScript, safeColor, siteOrigin, toneHues } from '@/lib/utils';
import '@/styles/site.css';

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans-loaded',
  display: 'swap',
});
const serif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-serif-loaded',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const siteUrl = siteOrigin();
  const title = setting(s, 'meta_title', setting(s, 'site_name', 'Portfolio'));
  const description = setting(s, 'meta_description');
  const ogImage = setting(s, 'og_image', '/og-default.png');
  // A holding page must never be indexed as the site's real content.
  const indexable = setting(s, 'search_indexing', '1') === '1' && !settingBool(s, 'maintenance_mode');

  return {
    metadataBase: new URL(siteUrl),
    title: { default: title, template: `%s — ${setting(s, 'site_name', 'Portfolio')}` },
    description,
    keywords: setting(s, 'meta_keywords'),
    authors: [{ name: setting(s, 'full_name', setting(s, 'site_name')) }],
    robots: indexable ? { index: true, follow: true } : { index: false, follow: false },
    icons: {
      icon: setting(s, 'favicon') || '/favicon.svg',
      apple: '/apple-touch-icon.png',
    },
    manifest: '/manifest.webmanifest',
    openGraph: {
      type: 'website',
      siteName: setting(s, 'site_name'),
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    twitter: { card: ogImage ? 'summary_large_image' : 'summary', title, description },
    alternates: { types: { 'application/rss+xml': '/feed.xml' } },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1120' },
  ],
};

/** Runs before paint so the chosen theme never flashes. */
const themeScript = `(function(){try{var s=localStorage.getItem('theme');var d=document.documentElement.getAttribute('data-default-mode')||'light';document.documentElement.setAttribute('data-theme',s||(d==='auto'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):d));}catch(e){}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  // Both land inside a <style> block, so only real hex colours get through.
  const accent = safeColor(setting(s, 'theme_accent', '#2563eb'), '#2563eb');
  const accentAlt = safeColor(setting(s, 'theme_accent_alt', '#0ea5e9'), '#0ea5e9');
  const siteUrl = siteOrigin();

  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: setting(s, 'full_name', setting(s, 'site_name')),
    jobTitle: setting(s, 'headline'),
    url: siteUrl,
    image: setting(s, 'photo') || undefined,
    email: setting(s, 'contact_email') ? `mailto:${setting(s, 'contact_email')}` : undefined,
    address: { '@type': 'PostalAddress', addressLocality: setting(s, 'contact_location') },
    sameAs: socialLinks(s).map((l) => l.url),
  };

  return (
    <html lang="en" data-default-mode={setting(s, 'default_mode', 'light')} className={`${sans.variable} ${serif.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <style dangerouslySetInnerHTML={{ __html:
          `:root{--accent:${accent};--accent-alt:${accentAlt};`
          + toneHues(accent).map((h, i) => `--h${i + 1}:${h};`).join('')
          + `}` }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonForScript(personSchema) }}
        />
      </head>
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
