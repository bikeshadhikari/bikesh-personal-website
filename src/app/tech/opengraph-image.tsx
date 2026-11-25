import { getTechSettings, st, techAccent } from '@/lib/tech';
import { techCard } from '@/lib/tech-card';
import { siteOrigin } from '@/lib/utils';

export const runtime = 'nodejs';
export const alt = 'Simplified Tech by Bikesh';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const s = await getTechSettings();
  return techCard({
    title: st(s, 'st_tagline'),
    label: st(s, 'st_kicker'),
    accent: techAccent(s),
    handle: st(s, 'st_handle'),
    site: `${siteOrigin().replace(/^https?:\/\//, '')}/tech`,
  });
}
