import { ImageResponse } from 'next/og';
import { getQuizSettings, qs } from '@/lib/quiz';
import { getSettings, setting } from '@/lib/settings';

export const runtime = 'nodejs';
// Drawn per request so a renamed quiz shares correctly, and so the build needs
// no database.
export const dynamic = 'force-dynamic';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Nepali Congress knowledge quiz';

/**
 * The card a shared link shows when no picture has been uploaded.
 *
 * Worded in Latin on purpose: the drawing engine places glyphs in code-point
 * order and cannot reorder Devanagari matras, so Nepali comes out misspelt
 * here. Upload a share picture to say it in Nepali — it takes precedence.
 */
export default async function Image() {
  const [quiz, site] = await Promise.all([getQuizSettings(), getSettings()]);
  const domain = setting(site, 'site_url').replace(/^https?:\/\//, '').replace(/\/$/, '')
    || 'bikeshadhikari.com.np';
  void quiz;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between', padding: 72,
          background: 'linear-gradient(135deg, #16375f 0%, #1d4676 55%, #102c4d 100%)',
          color: '#fff', fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', position: 'absolute', top: 0, left: 0, right: 0, height: 14 }}>
          <div style={{ flex: 1, background: '#c8102e' }} />
          <div style={{ flex: 1, background: '#16375f' }} />
          <div style={{ flex: 1, background: '#e3a008' }} />
        </div>

        <div style={{ display: 'flex', fontSize: 26, letterSpacing: 6, opacity: .82 }}>
          KNOWLEDGE QUIZ
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 84, fontWeight: 700, lineHeight: 1.1 }}>
            How much do you know?
          </div>
          <div
            style={{
              display: 'flex', marginTop: 28, alignSelf: 'flex-start',
              padding: '16px 32px', borderRadius: 16,
              background: '#c8102e', fontSize: 32, fontWeight: 700,
            }}
          >
            11 questions · Basic → Hard
          </div>
          <div style={{ display: 'flex', marginTop: 18, fontSize: 28, opacity: .85 }}>
            A new set every time you play
          </div>
        </div>

        <div style={{ display: 'flex', fontSize: 24, opacity: .75 }}>{domain}</div>
      </div>
    ),
    size,
  );
}
