import 'server-only';
import { sql } from './db';
import { RESOURCES } from './resources';

export type SearchHit = {
  group: string;
  title: string;
  detail: string;
  href: string;
  icon: string;
};

/** Which text columns are worth searching in each content table. */
const CONTENT_TARGETS: [resource: string, columns: string[], titleColumn: string][] = [
  ['posts', ['title', 'excerpt', 'tags'], 'title'],
  ['projects', ['title', 'summary', 'tech', 'client'], 'title'],
  ['experiences', ['role', 'organization', 'summary', 'highlights'], 'role'],
  ['services', ['title', 'summary', 'bullets'], 'title'],
  ['skills', ['name', 'category'], 'name'],
  ['certifications', ['title', 'issuer'], 'title'],
  ['testimonials', ['name', 'organization', 'quote'], 'name'],
  ['highlights', ['label', 'value'], 'label'],
  ['categories', ['name', 'description'], 'name'],
  ['gallery', ['title', 'caption'], 'title'],
  ['notices', ['title', 'body'], 'title'],
  ['political_sections', ['title', 'subtitle', 'body'], 'title'],
  ['political_photos', ['caption'], 'caption'],
  ['political_slides', ['caption'], 'caption'],
];

/** Plain-language labels for settings keys, so a search for "favicon" lands somewhere. */
const SETTING_LABELS: Record<string, [label: string, page: string]> = {
  site_name: ['Site name', 'settings'],
  site_tagline: ['Tagline', 'settings'],
  logo_text: ['Logo text', 'settings'],
  logo_image: ['Logo image', 'settings'],
  favicon: ['Favicon', 'settings'],
  footer_note: ['Footer note', 'settings'],
  contact_email: ['Public email', 'settings'],
  contact_phone: ['Phone', 'settings'],
  contact_location: ['Location', 'settings'],
  contact_hours: ['Usual hours', 'settings'],
  contact_intro: ['Contact introduction', 'settings'],
  notify_email: ['Forward enquiries to', 'settings'],
  map_embed: ['Map embed', 'settings'],
  social_linkedin: ['LinkedIn link', 'settings'],
  social_facebook: ['Facebook link', 'settings'],
  social_instagram: ['Instagram link', 'settings'],
  social_youtube: ['YouTube link', 'settings'],
  social_github: ['GitHub link', 'settings'],
  social_twitter: ['X link', 'settings'],
  social_tiktok: ['TikTok link', 'settings'],
  meta_title: ['Default page title', 'settings'],
  meta_description: ['Default description', 'settings'],
  meta_keywords: ['Keywords', 'settings'],
  og_image: ['Share image', 'settings'],
  search_indexing: ['Search engine indexing', 'settings'],
  theme_accent: ['Accent colour', 'settings'],
  theme_accent_alt: ['Secondary colour', 'settings'],
  default_mode: ['Default theme', 'settings'],
  show_mode_toggle: ['Light and dark toggle', 'settings'],
  blog_title: ['Blog heading', 'settings'],
  blog_intro: ['Blog introduction', 'settings'],
  posts_per_page: ['Posts per page', 'settings'],
  comments_enabled: ['Comments allowed', 'settings'],
  comments_moderated: ['Comment moderation', 'settings'],
  newsletter_enabled: ['Newsletter signup', 'settings'],
  maintenance_mode: ['Maintenance mode', 'settings'],
  footer_about: ['Footer introduction', 'settings'],
  footer_links_title: ['Footer heading over the page links', 'settings'],
  footer_topics_title: ['Footer heading over the blog topics', 'settings'],
  footer_contact_title: ['Footer heading over the contact details', 'settings'],
  footer_show_links: ['Footer page links', 'settings'],
  footer_show_topics: ['Footer blog topics', 'settings'],
  footer_show_contact: ['Footer contact details', 'settings'],
  footer_show_social: ['Footer social icons', 'settings'],
  footer_copyright: ['Footer copyright line', 'settings'],
  footer_show_rss: ['Footer RSS feed icon', 'settings'],
  footer_show_email: ['Footer email', 'settings'],
  footer_show_phone: ['Footer phone number', 'settings'],
  footer_show_location: ['Footer location', 'settings'],
  footer_show_hours: ['Footer usual hours', 'settings'],
  contact_show_email: ['Contact page email', 'settings'],
  contact_show_phone: ['Contact page phone number', 'settings'],
  contact_show_location: ['Contact page location', 'settings'],
  contact_show_hours: ['Contact page usual hours', 'settings'],
  contact_show_social: ['Contact page social icons', 'settings'],
  contact_show_form: ['Contact page message form', 'settings'],
  contact_show_map: ['Contact page map', 'settings'],
  maintenance_text: ['Maintenance message', 'settings'],
  full_name: ['Full name', 'profile'],
  name_native: ['Name in Nepali', 'profile'],
  headline: ['Headline', 'profile'],
  rotating_roles: ['Rotating roles', 'profile'],
  availability: ['Availability note', 'profile'],
  hero_intro: ['Hero introduction', 'profile'],
  about_lead: ['About opening line', 'profile'],
  about_body: ['Biography', 'profile'],
  photo: ['Profile photo', 'profile'],
  cv_file: ['CV file', 'profile'],
  years_started: ['Working since', 'profile'],
};

function snippet(value: string, term: string, length = 90): string {
  const text = value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const at = text.toLowerCase().indexOf(term.toLowerCase());
  if (at < 0) return text.slice(0, length);
  const from = Math.max(0, at - 30);
  return `${from > 0 ? '…' : ''}${text.slice(from, from + length)}${text.length > from + length ? '…' : ''}`;
}

/** Search content, settings and dashboard sections in one pass. */
export async function searchAdmin(term: string): Promise<SearchHit[]> {
  const query = term.trim();
  if (query.length < 2) return [];

  const like = `%${query}%`;
  const hits: SearchHit[] = [];

  for (const [resource, columns, titleColumn] of CONTENT_TARGETS) {
    const def = RESOURCES[resource];
    if (!def) continue;

    const where = columns.map((c) => `${c}::text ILIKE $1`).join(' OR ');
    try {
      const rows = await sql.unsafe<Record<string, unknown>[]>(
        `SELECT id, ${[...new Set([titleColumn, ...columns])].join(', ')}
         FROM ${def.table} WHERE ${where} LIMIT 5`,
        [like] as never[],
      );
      for (const row of rows) {
        const matched = columns.find(
          (c) => String(row[c] ?? '').toLowerCase().includes(query.toLowerCase()),
        );
        hits.push({
          group: def.label,
          title: String(row[titleColumn] ?? '(untitled)') || '(untitled)',
          detail: matched ? snippet(String(row[matched] ?? ''), query) : '',
          href: `/admin/${resource}/${row.id}`,
          icon: def.icon,
        });
      }
    } catch {
      // A table that does not exist yet simply has nothing to match.
    }
  }

  try {
    const rows = await sql<{ skey: string; svalue: string }[]>`
      SELECT skey, svalue FROM settings ORDER BY skey`;
    const lower = query.toLowerCase();
    for (const row of rows) {
      const meta = SETTING_LABELS[row.skey];
      if (!meta) continue;
      const [label, page] = meta;
      const inLabel = label.toLowerCase().includes(lower);
      const inKey = row.skey.toLowerCase().includes(lower);
      const inValue = row.svalue.toLowerCase().includes(lower);
      if (!inLabel && !inKey && !inValue) continue;

      hits.push({
        group: page === 'profile' ? 'Profile & bio' : 'Settings',
        title: label,
        detail: inValue ? snippet(row.svalue, query) : row.svalue.slice(0, 70),
        href: `/admin/${page}#f-${row.skey}`,
        icon: page === 'profile' ? 'users' : 'compass',
      });
    }
  } catch {
    // Settings unavailable: the content results still stand.
  }

  try {
    const rows = await sql<{ slug: string; label: string; kind: string }[]>`
      SELECT slug, label, kind FROM menus
      WHERE slug ILIKE ${like} OR label ILIKE ${like} ORDER BY sort_order LIMIT 5`;
    for (const row of rows) {
      hits.push({
        group: 'Menus & sections',
        title: row.label,
        detail: `${row.kind === 'page' ? 'Page' : 'Home page section'} · ${row.slug}`,
        href: '/admin/menus',
        icon: 'check',
      });
    }
  } catch {
    // Same again.
  }

  return hits;
}
