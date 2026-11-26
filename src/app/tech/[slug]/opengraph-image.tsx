import { getTechLink, getTechSettings, st, techAccent } from '@/lib/tech';
import { techCard } from '@/lib/tech-card';
import { siteOrigin } from '@/lib/utils';

export const runtime = 'nodejs';
export const alt = 'Simplified Tech by Bikesh';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [link, s] = await Promise.all([getTechLink(slug), getTechSettings()]);
  return techCard({
    title: link?.title ?? st(s, 'st_meta_title'),
    label: link?.kicker || link?.collection_name || '',
    accent: techAccent(s),
    handle: st(s, 'st_handle'),
    site: `${siteOrigin().replace(/^https?:\/\//, '')}/tech`,
  });
}
