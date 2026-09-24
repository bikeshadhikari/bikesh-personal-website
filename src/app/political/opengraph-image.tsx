import { ImageResponse } from 'next/og';
import { getSettings, setting } from '@/lib/settings';

export const runtime = 'nodejs';
// The card reads the current name, so it is drawn per request rather than
// frozen into the build — which also keeps the build itself free of any
// database.
export const dynamic = 'force-dynamic';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Political involvement';

/**
 * The last-resort card a shared link shows.
 *
 * Reached only when neither a share picture nor a portrait has been uploaded;
 * without it such a link arrived on Facebook as bare text. The wording is
 * deliberately Latin: the drawing engine places glyphs in code-point order and
 * cannot reorder Devanagari matras, so Nepali text would come out misspelt.
 * Upload a share picture to say it in Nepali.
 */
export default async function Image() {
  const s = await getSettings();
  const name = setting(s, 'site_title') || 'Bikesh Adhikari';
  const domain = setting(s, 'site_url').replace(/^https?:\/\//, '').replace(/\/$/, '')
    || 'bikeshadhikari.com.np';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between', padding: '72px',
          background: 'linear-gradient(135deg, #064d29 0%, #0b6b3a 55%, #0a5e33 100%)',
          color: '#ffffff', fontFamily: 'sans-serif',
        }}
      >
        {/* A band of the national colours along the top. */}
        <div style={{ display: 'flex', position: 'absolute', top: 0, left: 0, right: 0, height: 14 }}>
          <div style={{ flex: 1, background: '#c8102e' }} />
          <div style={{ flex: 1, background: '#16375f' }} />
          <div style={{ flex: 1, background: '#e3a008' }} />
        </div>

        <div style={{ display: 'flex', fontSize: 26, letterSpacing: 6, opacity: 0.82 }}>
          POLITICAL INVOLVEMENT
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 96, fontWeight: 700, lineHeight: 1.1 }}>
            {name}
          </div>
          <div
            style={{
              display: 'flex', marginTop: 30, alignSelf: 'flex-start',
              padding: '16px 32px', borderRadius: 16,
              background: '#c8102e', fontSize: 32, fontWeight: 700, letterSpacing: 1,
            }}
          >
            Candidate — Nepali Congress
          </div>
        </div>

        <div style={{ display: 'flex', fontSize: 26, opacity: 0.78 }}>{domain}</div>
      </div>
    ),
    size,
  );
}
