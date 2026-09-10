import 'server-only';
import { cache } from 'react';
import { sql } from './db';

export type MenuItem = {
  id: number;
  slug: string;
  label: string;
  kind: 'page' | 'section';
  description: string;
  custom_url: string;
  in_nav: boolean;
  enabled: boolean;
  locked: boolean;
  sort_order: number;
};

/**
 * Pages and home-page sections.
 *
 * A row with kind 'page' is a real URL that also appears in the navigation.
 * A row with kind 'section' is a block on the home page.
 * Disabling a row hides it from the navigation AND makes its route return the
 * not-found page, so this table is the single source of truth for the site.
 */
export const getMenus = cache(async (): Promise<MenuItem[]> => {
  try {
    return await sql<MenuItem[]>`SELECT * FROM menus ORDER BY sort_order ASC, id ASC`;
  } catch {
    return [];
  }
});

export async function menuEnabled(slug: string): Promise<boolean> {
  const items = await getMenus();
  const item = items.find((m) => m.slug === slug);
  return item ? item.enabled : true; // Unknown slugs stay visible.
}

export async function menuLabel(slug: string, fallback: string): Promise<string> {
  const items = await getMenus();
  const item = items.find((m) => m.slug === slug);
  return item && item.label.trim() ? item.label : fallback;
}

export async function navItems(): Promise<MenuItem[]> {
  const items = await getMenus();
  return items.filter((m) => m.kind === 'page' && m.enabled && m.in_nav);
}

export function menuHref(item: MenuItem): string {
  if (item.custom_url && item.custom_url.trim()) return item.custom_url;
  return item.slug === 'home' ? '/' : `/${item.slug}`;
}
