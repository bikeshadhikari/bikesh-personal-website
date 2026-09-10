import 'server-only';
import { cache } from 'react';
import { sql } from './db';

export type SettingsMap = Record<string, string>;

/**
 * All site settings in one query, memoised for the lifetime of a request by
 * React's cache(). Every page reads settings, so this keeps it to one round trip.
 */
export const getSettings = cache(async (): Promise<SettingsMap> => {
  try {
    const rows = await sql<{ skey: string; svalue: string }[]>`SELECT skey, svalue FROM settings`;
    const map: SettingsMap = {};
    for (const row of rows) map[row.skey] = row.svalue;
    return map;
  } catch {
    return {};
  }
});

export function setting(map: SettingsMap, key: string, fallback = ''): string {
  const value = map[key];
  return value === undefined || value === '' ? fallback : value;
}

export function settingBool(map: SettingsMap, key: string, fallback = false): boolean {
  const value = map[key];
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

export function settingInt(map: SettingsMap, key: string, fallback: number): number {
  const parsed = Number.parseInt(map[key] ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function saveSettings(pairs: Record<string, string>, group = 'general'): Promise<void> {
  const entries = Object.entries(pairs);
  if (entries.length === 0) return;
  const rows = entries.map(([skey, svalue]) => ({ skey, svalue: svalue ?? '', sgroup: group }));
  await sql`
    INSERT INTO settings ${sql(rows, 'skey', 'svalue', 'sgroup')}
    ON CONFLICT (skey) DO UPDATE SET svalue = EXCLUDED.svalue, sgroup = EXCLUDED.sgroup
  `;
}

export type SocialLink = { key: string; label: string; icon: string; url: string };

const SOCIAL_MAP: Record<string, { label: string; icon: string }> = {
  linkedin: { label: 'LinkedIn', icon: 'linkedin' },
  facebook: { label: 'Facebook', icon: 'facebook' },
  instagram: { label: 'Instagram', icon: 'instagram' },
  github: { label: 'GitHub', icon: 'github' },
  youtube: { label: 'YouTube', icon: 'youtube' },
  twitter: { label: 'X', icon: 'twitter' },
  tiktok: { label: 'TikTok', icon: 'tiktok' },
};

/** Only the social links that actually have a value. */
export function socialLinks(map: SettingsMap): SocialLink[] {
  return Object.entries(SOCIAL_MAP)
    .map(([key, meta]) => ({ key, ...meta, url: (map[`social_${key}`] ?? '').trim() }))
    .filter((s) => s.url !== '');
}
