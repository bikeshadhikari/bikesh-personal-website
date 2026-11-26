import { getSettings, setting } from '@/lib/settings';
import { allProfiles } from '@/lib/seo';
import { getTechCollections, getTechLinks, st } from '@/lib/tech';
import { getPosts } from '@/lib/content';
import { siteOrigin } from '@/lib/utils';

export const dynamic = 'force-dynamic';

/**
 * /llms.txt — a plain-text map of the site for AI assistants and AI search
 * (the llmstxt.org convention): who Bikesh is, his channels, and the pages
 * worth reading, so a question like "who is @bikesh.adh" or "Nepali tech
 * creator who shares AI prompts" has a clear, citable answer.
 */
export async function GET() {
  const base = siteOrigin();
  const s = await getSettings();
  const name = setting(s, 'full_name', 'Bikesh Adhikari');
  const [tech, collections, blog] = await Promise.all([
    getTechLinks({ limit: 60 }), getTechCollections(), getPosts({ perPage: 30 }).catch(() => ({ items: [] })),
  ]);
  const about = st(s, 'st_about').replace(/\s*\n\s*\n\s*/g, ' ');

  const lines = [
    `# ${name} — Simplified Tech by Bikesh`,
    '',
    `> ${about}`,
    '',
    `- Handle: ${st(s, 'st_handle')}`,
    `- Brand: Simplified Tech by Bikesh (video series: Tech Explainer)`,
    `- Based in: ${setting(s, 'contact_location', 'Nepal')}`,
    `- Languages: Nepali (videos), English and Nepali (website)`,
    '',
    '## Official profiles',
    ...allProfiles(s).map((u) => `- ${u}`),
    '',
    '## Main pages',
    `- [Simplified Tech by Bikesh](${base}/tech): free AI prompts, tools and step-by-step tech guides`,
    `- [About Bikesh](${base}/tech/about): who he is and where to follow him`,
    `- [Personal website](${base}/): profile, experience, services and contact`,
    `- [Blog](${base}/blog): detailed English articles from the Tech Explainer series (also at ${base}/tech/blog)`,
    ...collections.map((c) => `- [${c.name}](${base}/tech/c/${c.slug})${c.description ? `: ${c.description}` : ''}`),
    '',
    '## Simplified Tech posts',
    ...tech.rows.map((l) => `- [${l.title}](${base}/tech/${l.slug})${l.summary ? `: ${l.summary.replace(/\s+/g, ' ')}` : ''}`),
    '',
    '## Blog articles',
    ...blog.items.map((p) => `- [${p.title}](${base}/blog/${p.slug})${p.excerpt ? `: ${p.excerpt.replace(/\s+/g, ' ').slice(0, 200)}` : ''}`),
    '',
  ];
  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=600, s-maxage=3600' },
  });
}
