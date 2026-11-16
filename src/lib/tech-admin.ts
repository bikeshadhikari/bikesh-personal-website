import 'server-only';
import { sql } from './db';
import { normalizeUrl, slugify } from './utils';

/** First path segments that already belong to the site, so a short link can never hide a page. */
const RESERVED = new Set([
  'about', 'admin', 'api', 'blog', 'contact', 'experience', 'feed.xml', 'gallery', 'icon.svg',
  'manifest.webmanifest', 'play-nepali-congress-quiz', 'political', 'projects', 'robots.txt',
  'search', 'services', 'setup', 'sitemap.xml', 'tech', 'favicon.ico', 'apple-touch-icon.png',
  'og-default.png', 'quiz', '_next', 'home', 'login', 'index',
]);

/** Clean a typed short link and say what is wrong with it, if anything. */
export async function checkShortLink(raw: string, id: number): Promise<{ value: string; error?: string }> {
  const text = raw.trim();
  if (!text) return { value: '' };
  const value = slugify(text, 'go').slice(0, 60);
  if (!/^[a-z0-9]/.test(text.toLowerCase().normalize('NFKD'))) {
    return { value, error: 'Use English letters, numbers and hyphens, e.g. wifi or free-pdf.' };
  }
  if (RESERVED.has(value)) {
    return { value, error: `/${value} is already a page on the site. Choose another word.` };
  }
  const menus = await sql<{ n: number }[]>`SELECT COUNT(*)::int AS n FROM menus WHERE slug = ${value}`.catch(() => [{ n: 0 }]);
  if (menus[0].n > 0) return { value, error: `/${value} is already a page on the site. Choose another word.` };
  const taken = await sql<{ title: string }[]>`
    SELECT title FROM tech_links WHERE short_link = ${value} AND id <> ${id} LIMIT 1`.catch(() => []);
  if (taken[0]) return { value, error: `/${value} is already used by “${taken[0].title}”.` };
  return { value };
}

type BlockInput = {
  id?: number; label?: string; title?: string; title_ne?: string; description?: string;
  description_ne?: string; body?: string; body_ne?: string; url?: string; enabled?: boolean;
};

const cut = (v: unknown, n: number) => String(v ?? '').slice(0, n);

/**
 * Write the copy blocks edited inside a post. Their order on the form is their
 * order on the page; blocks removed from the form are deleted.
 */
export async function syncTechBlocks(linkId: number, json: string): Promise<void> {
  let list: BlockInput[];
  try {
    const parsed = JSON.parse(json);
    list = Array.isArray(parsed) ? parsed : [];
  } catch {
    return; // A malformed field never wipes what is there.
  }

  const rows = list
    .map((b, i) => ({
      id: Number(b.id) > 0 ? Number(b.id) : 0,
      label: cut(b.label, 60).trim() || 'Prompt',
      title: cut(b.title, 220).trim(),
      title_ne: cut(b.title_ne, 220).trim(),
      description: cut(b.description, 4000).trim(),
      description_ne: cut(b.description_ne, 4000).trim(),
      body: cut(b.body, 50000).replace(/\s+$/, ''),
      body_ne: cut(b.body_ne, 50000).replace(/\s+$/, ''),
      url: (() => { const u = normalizeUrl(cut(b.url, 500).trim()); return /^(https?:\/\/|\/)/i.test(u) ? u : ''; })(),
      enabled: b.enabled !== false,
      sort_order: (i + 1) * 10,
    }))
    .filter((b) => b.body.trim() || b.title);

  await sql.begin(async (transaction) => {
    // postgres.js types a transaction more narrowly than the client it is.
    const tx = transaction as unknown as typeof sql;
    const existing = await tx<{ id: number }[]>`SELECT id FROM tech_blocks WHERE link_id = ${linkId}`;
    const mine = new Set(existing.map((r) => r.id));
    const kept: number[] = [];

    for (const b of rows) {
      const { id, ...data } = b;
      if (id && mine.has(id)) {
        await tx`UPDATE tech_blocks SET ${tx(data, 'label', 'title', 'title_ne', 'description', 'description_ne',
          'body', 'body_ne', 'url', 'enabled', 'sort_order')} WHERE id = ${id} AND link_id = ${linkId}`;
        kept.push(id);
      } else {
        const [row] = await tx<{ id: number }[]>`INSERT INTO tech_blocks ${tx({ ...data, link_id: linkId } as never,
          'link_id', 'label', 'title', 'title_ne', 'description', 'description_ne', 'body', 'body_ne', 'url',
          'enabled', 'sort_order')} RETURNING id`;
        kept.push(row.id);
      }
    }

    const gone = [...mine].filter((id) => !kept.includes(id));
    if (gone.length > 0) await tx`DELETE FROM tech_blocks WHERE link_id = ${linkId} AND id IN ${tx(gone)}`;
  });
}

export async function blocksForEditor(linkId: number) {
  if (!linkId) return [];
  return sql<BlockInput[]>`
    SELECT id, label, title, title_ne, description, description_ne, body, body_ne, url, enabled
    FROM tech_blocks WHERE link_id = ${linkId} ORDER BY sort_order ASC, id ASC`.catch(() => []);
}
