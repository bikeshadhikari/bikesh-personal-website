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
/**
 * Pages and sections added after a site was set up need their row creating, or
 * they would never appear in the dashboard. Inserting on read keeps an existing
 * install in step with the code without a migration step.
 */
const LATER_ADDITIONS: Pick<MenuItem, 'slug' | 'label' | 'kind' | 'description' | 'sort_order'>[] = [
  { slug: 'gallery', label: 'Gallery', kind: 'page',
    description: 'Photo gallery that arranges itself.', sort_order: 65 },
  { slug: 'political', label: 'राजनीतिक संलग्नता', kind: 'page',
    description: 'The standalone political involvement page.', sort_order: 68 },
];

/**
 * Labels that were renamed after the first release. The old wording is only
 * replaced when it is still exactly what shipped, so a label the owner has
 * edited themselves is never overwritten.
 */
const RENAMES: { slug: string; from: string; to: string }[] = [
  { slug: 'blog-section', from: 'Latest notes', to: 'Blogs and Articles' },
];

export const getMenus = cache(async (): Promise<MenuItem[]> => {
  try {
    let rows = await sql<MenuItem[]>`SELECT * FROM menus ORDER BY sort_order ASC, id ASC`;

    const stale = RENAMES.filter((r) => rows.some((m) => m.slug === r.slug && m.label === r.from));
    if (stale.length > 0) {
      for (const r of stale) {
        await sql`UPDATE menus SET label = ${r.to} WHERE slug = ${r.slug} AND label = ${r.from}`;
      }
      rows = await sql<MenuItem[]>`SELECT * FROM menus ORDER BY sort_order ASC, id ASC`;
    }

    const known = new Set(rows.map((m) => m.slug));
    const missing = LATER_ADDITIONS.filter((m) => !known.has(m.slug));
    if (missing.length === 0) return rows;

    await sql`INSERT INTO menus ${sql(
      missing.map((m) => ({ ...m, custom_url: '', in_nav: true, enabled: true, locked: false })),
      'slug', 'label', 'kind', 'description', 'sort_order', 'custom_url', 'in_nav', 'enabled', 'locked',
    )} ON CONFLICT (slug) DO NOTHING`;

    return sql<MenuItem[]>`SELECT * FROM menus ORDER BY sort_order ASC, id ASC`;
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

/**
 * The pages a visitor can actually reach, as somewhere a notice can be pinned.
 * Built from Menus & sections, so a page switched off there cannot be chosen,
 * and the home page is always first.
 */
export async function pageChoices(): Promise<{ value: string; label: string }[]> {
  const items = await getMenus();
  const pages = items
    .filter((m) => m.enabled && m.kind === 'page')
    .map((m) => ({ value: menuHref(m), label: m.label }))
    .filter((p) => p.value.startsWith('/'));

  return [{ value: '/', label: 'Home' }, ...pages.filter((p) => p.value !== '/')];
}
