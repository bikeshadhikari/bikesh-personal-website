import { getSettings, setting } from '@/lib/settings';
import { safeColor, toneHues } from '@/lib/utils';

export const dynamic = 'force-dynamic';

/**
 * The browser-tab icon, drawn in the accent colour chosen in Settings.
 *
 * It used to be a static file with the colours baked in, so changing the
 * accent left the tab showing the old blue. Drawing it here keeps the tab, the
 * phone home screen and the site itself in one colour. An uploaded favicon
 * still wins: this is only the fallback.
 */
export async function GET(): Promise<Response> {
  const s = await getSettings();
  const accent = safeColor(setting(s, 'theme_accent', '#2563eb'), '#2563eb');
  const [, second] = toneHues(accent);
  const letter = (setting(s, 'site_short_name') || setting(s, 'full_name') || 'B')
    .trim().charAt(0).toUpperCase() || 'B';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="${escapeXml(letter)}">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0%" stop-color="${accent}"/>
<stop offset="100%" stop-color="hsl(${second} 74% 56%)"/>
</linearGradient></defs>
<rect width="64" height="64" rx="15" fill="url(#g)"/>
<text x="32" y="33" fill="#ffffff" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
 font-size="38" font-weight="700" text-anchor="middle" dominant-baseline="central">${escapeXml(letter)}</text>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      // Short-lived: the accent can change in the dashboard at any moment.
      'Cache-Control': 'public, max-age=0, s-maxage=60, must-revalidate',
    },
  });
}

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c] as string));
}
