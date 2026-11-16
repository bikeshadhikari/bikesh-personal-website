import type { MetadataRoute } from 'next';
import { navItems, menuHref, menuEnabled } from '@/lib/menu';
import { getCategories, getProjects, getPublishedSlugs } from '@/lib/content';
import { siteOrigin } from '@/lib/utils';
import { getTechCollections, getTechLinks } from '@/lib/tech';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteOrigin();
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, priority: 1, changeFrequency: 'weekly' },
  ];

  for (const item of await navItems()) {
    if (item.slug === 'home') continue;
    entries.push({ url: `${base}${menuHref(item)}`, lastModified: now, priority: 0.8 });
  }

  if (await menuEnabled('projects')) {
    for (const p of await getProjects()) {
      entries.push({ url: `${base}/projects/${p.slug}`, lastModified: now, priority: 0.6 });
    }
  }

  if (await menuEnabled('blog')) {
    for (const post of await getPublishedSlugs()) {
      entries.push({
        url: `${base}/blog/${post.slug}`,
        lastModified: new Date(post.updated_at),
        priority: 0.7,
      });
    }
    for (const c of await getCategories()) {
      entries.push({ url: `${base}/blog/category/${c.slug}`, lastModified: now, priority: 0.4 });
    }
  }

  if (await menuEnabled('tech')) {
    const [{ rows }, collections] = await Promise.all([getTechLinks({ limit: 200 }), getTechCollections()]);
    for (const l of rows) entries.push({ url: `${base}/tech/${l.slug}`, lastModified: now, priority: 0.7 });
    for (const c of collections) entries.push({ url: `${base}/tech/c/${c.slug}`, lastModified: now, priority: 0.5 });
  }

  return entries;
}
