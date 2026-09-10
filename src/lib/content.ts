import 'server-only';
import { cache } from 'react';
import { sql } from './db';
import type {
  Category, Certification, Comment, Experience, GalleryItem, Highlight,
  Paginated, Post, Project, Service, Skill, Testimonial,
} from './types';
import { ensureSchema, isMissingTable } from './schema';

/* -------------------------------------------------------------------------- */
/* Profile blocks                                                             */
/* -------------------------------------------------------------------------- */

export const getHighlights = cache(async (): Promise<Highlight[]> =>
  sql<Highlight[]>`SELECT * FROM highlights WHERE enabled ORDER BY sort_order, id`);

export const getSkillsGrouped = cache(async (): Promise<[string, Skill[]][]> => {
  const rows = await sql<Skill[]>`SELECT * FROM skills WHERE enabled ORDER BY sort_order, id`;
  const groups = new Map<string, Skill[]>();
  for (const row of rows) {
    const key = row.category || 'General';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }
  return [...groups.entries()];
});

/** The experience pipeline. Pass a track to filter: work, education, volunteer, award. */
export const getExperiences = cache(async (track?: string, limit?: number): Promise<Experience[]> => {
  const rows = track && track !== 'all'
    ? await sql<Experience[]>`
        SELECT * FROM experiences WHERE enabled AND track = ${track}
        ORDER BY is_current DESC, start_date DESC NULLS LAST, sort_order ASC, id DESC`
    : await sql<Experience[]>`
        SELECT * FROM experiences WHERE enabled
        ORDER BY is_current DESC, start_date DESC NULLS LAST, sort_order ASC, id DESC`;
  return limit ? rows.slice(0, limit) : rows;
});

export const getExperienceTracks = cache(async (): Promise<string[]> => {
  const rows = await sql<{ track: string }[]>`
    SELECT DISTINCT track FROM experiences WHERE enabled ORDER BY track`;
  return rows.map((r) => r.track);
});

export const getServices = cache(async (limit?: number): Promise<Service[]> => {
  const rows = await sql<Service[]>`SELECT * FROM services WHERE enabled ORDER BY sort_order, id`;
  return limit ? rows.slice(0, limit) : rows;
});

export const getProjects = cache(async (featuredOnly = false, limit?: number): Promise<Project[]> => {
  const rows = featuredOnly
    ? await sql<Project[]>`SELECT * FROM projects WHERE enabled AND is_featured
                           ORDER BY sort_order, id DESC`
    : await sql<Project[]>`SELECT * FROM projects WHERE enabled
                           ORDER BY is_featured DESC, sort_order, id DESC`;
  return limit ? rows.slice(0, limit) : rows;
});

export async function getProject(slug: string): Promise<Project | null> {
  const rows = await sql<Project[]>`SELECT * FROM projects WHERE slug = ${slug} AND enabled LIMIT 1`;
  return rows[0] ?? null;
}

export const getProjectCategories = cache(async (): Promise<string[]> => {
  const rows = await sql<{ category: string }[]>`
    SELECT DISTINCT category FROM projects WHERE enabled AND category <> '' ORDER BY category`;
  return rows.map((r) => r.category);
});

export const getCertifications = cache(async (): Promise<Certification[]> =>
  sql<Certification[]>`SELECT * FROM certifications WHERE enabled
                       ORDER BY sort_order, issue_date DESC NULLS LAST, id`);

export const getTestimonials = cache(async (): Promise<Testimonial[]> =>
  sql<Testimonial[]>`SELECT * FROM testimonials WHERE enabled ORDER BY sort_order, id`);

/** Gallery photos, newest first unless a sort order says otherwise. */
export const getGallery = cache(async (): Promise<GalleryItem[]> => {
  try {
    return await sql<GalleryItem[]>`
      SELECT * FROM gallery WHERE enabled ORDER BY sort_order, id DESC`;
  } catch (error) {
    // A site set up before the gallery existed creates the table on first view.
    if (!isMissingTable(error)) return [];
    await ensureSchema();
    return sql<GalleryItem[]>`
      SELECT * FROM gallery WHERE enabled ORDER BY sort_order, id DESC`;
  }
});

/* -------------------------------------------------------------------------- */
/* Blog                                                                       */
/* -------------------------------------------------------------------------- */

export const getCategories = cache(async (): Promise<Category[]> =>
  sql<Category[]>`
    SELECT c.*, (SELECT COUNT(*)::int FROM posts p
                 WHERE p.category_id = c.id AND p.status = 'published') AS post_count
    FROM categories c ORDER BY c.sort_order, c.name`);

export async function getCategory(slug: string): Promise<Category | null> {
  const rows = await sql<Category[]>`SELECT * FROM categories WHERE slug = ${slug} LIMIT 1`;
  return rows[0] ?? null;
}

export type PostQuery = {
  page?: number;
  perPage?: number;
  categoryId?: number;
  tag?: string;
  search?: string;
  featured?: boolean;
  excludeId?: number;
};

const POST_COLUMNS = sql`
  p.*, c.name AS category_name, c.slug AS category_slug, c.color AS category_color,
  u.name AS author_name`;

/** Published posts, filtered and paginated. Scheduled posts stay hidden. */
export async function getPosts(opts: PostQuery = {}): Promise<Paginated<Post>> {
  const page = Math.max(1, opts.page ?? 1);
  const perPage = Math.max(1, opts.perPage ?? 6);
  const offset = (page - 1) * perPage;

  const where = sql`
    p.status = 'published'
    AND (p.published_at IS NULL OR p.published_at <= NOW())
    ${opts.categoryId ? sql`AND p.category_id = ${opts.categoryId}` : sql``}
    ${opts.tag ? sql`AND p.tags ILIKE ${'%' + opts.tag + '%'}` : sql``}
    ${opts.featured ? sql`AND p.is_featured` : sql``}
    ${opts.excludeId ? sql`AND p.id <> ${opts.excludeId}` : sql``}
    ${opts.search
      ? sql`AND (p.title ILIKE ${'%' + opts.search + '%'}
                 OR p.excerpt ILIKE ${'%' + opts.search + '%'}
                 OR p.content ILIKE ${'%' + opts.search + '%'}
                 OR p.tags ILIKE ${'%' + opts.search + '%'})`
      : sql``}
  `;

  const countRows = await sql<{ count: string }[]>`
    SELECT COUNT(*)::text AS count FROM posts p WHERE ${where}`;
  const total = Number(countRows[0]?.count ?? 0);

  const items = await sql<Post[]>`
    SELECT ${POST_COLUMNS}
    FROM posts p
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN users u ON u.id = p.author_id
    WHERE ${where}
    ORDER BY p.published_at DESC NULLS LAST, p.id DESC
    LIMIT ${perPage} OFFSET ${offset}`;

  return { items, total, pages: Math.ceil(total / perPage), page };
}

export async function getPost(slug: string): Promise<Post | null> {
  const rows = await sql<Post[]>`
    SELECT ${POST_COLUMNS}
    FROM posts p
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN users u ON u.id = p.author_id
    WHERE p.slug = ${slug} AND p.status = 'published'
      AND (p.published_at IS NULL OR p.published_at <= NOW())
    LIMIT 1`;
  return rows[0] ?? null;
}

export async function registerView(postId: number): Promise<void> {
  try {
    await sql`UPDATE posts SET views = views + 1 WHERE id = ${postId}`;
  } catch {
    // A missed view count is never worth failing a page render.
  }
}

export async function getRelatedPosts(post: Post, limit = 3): Promise<Post[]> {
  const sameCategory = post.category_id
    ? (await getPosts({ categoryId: post.category_id, excludeId: post.id, perPage: limit })).items
    : [];
  if (sameCategory.length >= limit) return sameCategory;

  const filler = (await getPosts({ excludeId: post.id, perPage: limit + sameCategory.length })).items;
  const seen = new Set(sameCategory.map((p) => p.id));
  for (const p of filler) {
    if (sameCategory.length >= limit) break;
    if (!seen.has(p.id)) { sameCategory.push(p); seen.add(p.id); }
  }
  return sameCategory;
}

/** Tag cloud built from the comma separated tags column. */
export const getTags = cache(async (limit = 20): Promise<[string, number][]> => {
  const rows = await sql<{ tags: string }[]>`
    SELECT tags FROM posts WHERE status = 'published' AND tags <> ''`;
  const counts = new Map<string, number>();
  for (const row of rows) {
    for (const tag of row.tags.split(',').map((t) => t.trim()).filter(Boolean)) {
      const key = tag.toLowerCase();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
});

export async function getComments(postId: number): Promise<Comment[]> {
  return sql<Comment[]>`
    SELECT * FROM comments WHERE post_id = ${postId} AND status = 'approved'
    ORDER BY created_at ASC`;
}

export async function getPublishedSlugs(): Promise<{ slug: string; updated_at: string }[]> {
  return sql<{ slug: string; updated_at: string }[]>`
    SELECT slug, updated_at FROM posts
    WHERE status = 'published' AND (published_at IS NULL OR published_at <= NOW())
    ORDER BY published_at DESC`;
}
