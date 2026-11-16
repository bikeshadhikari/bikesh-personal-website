import { getTechSettings, techAccent } from '@/lib/tech';

export const dynamic = 'force-dynamic';

/** The Simplified Tech tab icon: "st" and the slanted stroke, in the accent colour. */
export async function GET() {
  const accent = techAccent(await getTechSettings());
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#0b1112"/>
  <text x="9" y="43" font-family="Helvetica, Arial, sans-serif" font-size="30" font-weight="800" letter-spacing="-1.5" fill="#f1f5f4">st</text>
  <path d="M49 12 L39 52" stroke="${accent}" stroke-width="6" stroke-linecap="round"/>
</svg>`;
  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=300, s-maxage=300' },
  });
}
