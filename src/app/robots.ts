import type { MetadataRoute } from 'next';
import { getSettings, settingBool } from '@/lib/settings';
import { siteOrigin } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = siteOrigin();
  const indexable = settingBool(await getSettings(), 'search_indexing', true);

  return {
    rules: indexable
      ? { userAgent: '*', allow: '/', disallow: ['/admin/', '/setup', '/api/'] }
      : { userAgent: '*', disallow: '/' },
    sitemap: `${base}/sitemap.xml`,
  };
}
