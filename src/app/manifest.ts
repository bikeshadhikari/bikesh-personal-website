import type { MetadataRoute } from 'next';
import { getSettings, setting } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const s = await getSettings();
  return {
    name: setting(s, 'site_name', 'Portfolio'),
    short_name: setting(s, 'site_short_name', 'Portfolio'),
    description: setting(s, 'meta_description'),
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: setting(s, 'theme_accent', '#2563eb'),
    icons: [
      { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
