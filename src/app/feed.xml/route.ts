import { menuEnabled } from '@/lib/menu';
import { getSettings, setting } from '@/lib/settings';
import { getPosts } from '@/lib/content';
import { excerptOf } from '@/lib/utils';

export const dynamic = 'force-dynamic';

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export async function GET(): Promise<Response> {
  if (!(await menuEnabled('blog'))) {
    return new Response('Not found', { status: 404 });
  }

  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  const s = await getSettings();
  const { items } = await getPosts({ perPage: 20 });

  const entries = items.map((post) => `  <item>
    <title>${escapeXml(post.title)}</title>
    <link>${base}/blog/${post.slug}</link>
    <guid isPermaLink="true">${base}/blog/${post.slug}</guid>
    <pubDate>${new Date(post.published_at ?? Date.now()).toUTCString()}</pubDate>
    <description><![CDATA[${post.excerpt || excerptOf(post.content)}]]></description>
  </item>`).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title>${escapeXml(`${setting(s, 'site_name')} — ${setting(s, 'blog_title', 'Blog')}`)}</title>
  <link>${base}/blog</link>
  <description>${escapeXml(setting(s, 'blog_intro'))}</description>
  <language>en</language>
${entries}
</channel></rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
