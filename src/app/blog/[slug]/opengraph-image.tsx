import { ImageResponse } from 'next/og';
import { getPost } from '@/lib/content';
import { getSettings, setting } from '@/lib/settings';
import { siteOrigin } from '@/lib/utils';

export const runtime = 'nodejs';
export const alt = 'Article preview';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * The picture people see when a post is shared.
 *
 * It is drawn per post rather than relying on a cover image, so every article
 * previews properly on Facebook, LinkedIn and WhatsApp even when no cover has
 * been uploaded.
 */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post, s] = await Promise.all([getPost(slug), getSettings()]);

  const title = post?.title ?? setting(s, 'site_name', 'Article');
  const category = post?.category_name ?? '';
  const author = setting(s, 'full_name', 'Bikesh Adhikari');
  // The domain, not the site name, which is usually the person's name again.
  const site = siteOrigin().replace(/^https?:\/\//, '');
  const accent = /^#[0-9a-f]{3,8}$/i.test(setting(s, 'theme_accent', '')) 
    ? setting(s, 'theme_accent') 
    : '#2563eb';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between', padding: '72px 80px',
          background: '#0b1120', color: '#e8edf7',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 64, height: 64, borderRadius: 18, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              background: accent, color: '#fff', fontSize: 34, fontWeight: 800,
            }}
          >
            {author.charAt(0)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 28, fontWeight: 700 }}>{author}</span>
            <span style={{ fontSize: 20, color: '#8b9ab5' }}>{site}</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {category && (
            <span
              style={{
                fontSize: 22, fontWeight: 700, letterSpacing: 2,
                textTransform: 'uppercase', color: accent,
              }}
            >
              {category}
            </span>
          )}
          <span
            style={{
              fontSize: title.length > 70 ? 54 : 66,
              fontWeight: 800, lineHeight: 1.15, letterSpacing: -1.5,
              display: 'flex',
            }}
          >
            {title.length > 120 ? `${title.slice(0, 117)}…` : title}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 90, height: 6, borderRadius: 3, background: accent }} />
          <span style={{ fontSize: 22, color: '#8b9ab5' }}>
            {setting(s, 'headline', 'IT Professional · Educator · Speaker')}
          </span>
        </div>
      </div>
    ),
    size,
  );
}
