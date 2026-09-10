import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import SiteShell from '@/components/site/SiteShell';
import BlogLayout from '@/components/site/BlogLayout';
import { menuEnabled } from '@/lib/menu';
import { getSettings, settingInt } from '@/lib/settings';
import { getCategory, getPosts } from '@/lib/content';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: 'Category not found' };
  return {
    title: category.name,
    description: category.description || `Posts filed under ${category.name}.`,
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  if (!(await menuEnabled('blog'))) notFound();

  const [{ slug }, { page }] = await Promise.all([params, searchParams]);
  const category = await getCategory(slug);
  if (!category) notFound();

  const s = await getSettings();
  const result = await getPosts({
    categoryId: category.id,
    page: Math.max(1, Number(page) || 1),
    perPage: settingInt(s, 'posts_per_page', 6),
  });

  return (
    <SiteShell current="blog">
      <BlogLayout
        heading={category.name}
        intro={category.description}
        result={result}
        baseUrl={`/blog/category/${category.slug}`}
        activeCategory={category.slug}
      />
    </SiteShell>
  );
}
