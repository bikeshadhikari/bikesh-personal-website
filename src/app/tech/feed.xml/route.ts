import { getTechLinks, getTechSettings, st } from '@/lib/tech';
import { siteOrigin } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

/** RSS for Simplified Tech, for feed readers and the services that crawl feeds. */
export async function GET() {
  const base = siteOrigin();
  const [s, { rows }] = await Promise.all([getTechSettings(), getTechLinks({ limit: 40 })]);
  const items = rows.map((l) => `  <item>
    <title>${esc(l.title)}</title>
    <link>${base}/tech/${l.slug}</link>
    <guid isPermaLink="true">${base}/tech/${l.slug}</guid>
    <pubDate>${new Date(l.published_at ?? Date.now()).toUTCString()}</pubDate>
    ${l.collection_name ? `<category>${esc(l.collection_name)}</category>` : ''}
    <description><![CDATA[${(l.summary || l.meta_description || '').replace(/]]>/g, '')}]]></description>
  </item>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${esc(st(s, 'st_meta_title'))}</title>
  <link>${base}/tech</link>
  <atom:link href="${base}/tech/feed.xml" rel="self" type="application/rss+xml" />
  <description>${esc(st(s, 'st_meta_description'))}</description>
  <language>en</language>
${items}
</channel>
</rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
