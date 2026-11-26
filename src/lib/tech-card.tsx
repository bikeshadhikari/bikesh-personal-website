import { ImageResponse } from 'next/og';

/** The 1200×630 share card for Simplified Tech pages. */
export function techCard({ title, label, accent, handle, site }: {
  title: string; label: string; accent: string; handle: string; site: string;
}) {
  const size = title.length > 70 ? 58 : title.length > 40 ? 70 : 84;
  return new ImageResponse(
    (
      <div style={{
        width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '64px 76px', background: '#0a0f10', color: '#e9efed', fontFamily: 'sans-serif',
        borderLeft: `14px solid ${accent}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
          <span style={{ fontSize: 46, fontWeight: 800, letterSpacing: -2 }}>simplified tech</span>
          <span style={{ width: 8, height: 54, background: accent, transform: 'skewX(-20deg)', marginLeft: 6 }} />
          <span style={{ fontSize: 22, color: '#7a8986', marginLeft: 18, marginBottom: 6, letterSpacing: 4 }}>BY BIKESH</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {label && (
            <span style={{ fontSize: 26, color: accent, letterSpacing: 3, textTransform: 'uppercase' }}>/{label}</span>
          )}
          <span style={{ fontSize: size, fontWeight: 800, lineHeight: 1.04, letterSpacing: -2 }}>{title}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 26, color: '#b3c0bd' }}>
          <span>{handle}</span>
          <span>{site}</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
