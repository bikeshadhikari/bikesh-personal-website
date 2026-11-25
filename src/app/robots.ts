import type { MetadataRoute } from 'next';
import { getSettings, settingBool } from '@/lib/settings';
import { siteOrigin } from '@/lib/utils';

export const dynamic = 'force-dynamic';

/**
 * Search engines and AI search crawlers are welcome everywhere public. They
 * are named one by one because some AI crawlers only read their own group,
 * and being found by ChatGPT, Perplexity, Claude, Gemini and Copilot is the
 * point. The dashboard and the API stay closed to all of them.
 */
const AI_AND_SEARCH_BOTS = [
  'Googlebot', 'Bingbot', 'DuckDuckBot', 'Applebot', 'Applebot-Extended', 'Google-Extended',
  'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'Perplexity-User',
  'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'meta-externalagent', 'Amazonbot', 'YandexBot',
];

export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = siteOrigin();
  const indexable = settingBool(await getSettings(), 'search_indexing', true);
  const closed = ['/admin/', '/setup', '/api/'];

  return {
    rules: indexable
      ? [
          { userAgent: '*', allow: '/', disallow: closed },
          { userAgent: AI_AND_SEARCH_BOTS, allow: '/', disallow: closed },
        ]
      : { userAgent: '*', disallow: '/' },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
