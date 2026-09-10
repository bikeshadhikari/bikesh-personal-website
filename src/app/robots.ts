import type { MetadataRoute } from 'next';
import { getSettings, settingBool } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  const indexable = settingBool(await getSettings(), 'search_indexing', true);

  return {
    rules: indexable
      ? { userAgent: '*', allow: '/', disallow: ['/admin/', '/setup', '/api/'] }
      : { userAgent: '*', disallow: '/' },
    sitemap: `${base}/sitemap.xml`,
  };
}
