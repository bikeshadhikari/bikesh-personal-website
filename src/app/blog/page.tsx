import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import SiteShell from '@/components/site/SiteShell';
import BlogLayout from '@/components/site/BlogLayout';
import { menuEnabled } from '@/lib/menu';
import { getSettings, setting, settingInt } from '@/lib/settings';
import { getPosts } from '@/lib/content';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return { title: setting(s, 'blog_title', 'Blog'), description: setting(s, 'blog_intro') };
}

export default async function BlogPage({
  searchParams,
}: { searchParams: Promise<{ page?: string }> }) {
  if (!(await menuEnabled('blog'))) notFound();

  const { page } = await searchParams;
  const s = await getSettings();
  const result = await getPosts({
    page: Math.max(1, Number(page) || 1),
    perPage: settingInt(s, 'posts_per_page', 6),
  });

  return (
    <SiteShell current="blog">
      <BlogLayout
        heading={setting(s, 'blog_title', 'Notes & Articles')}
        intro={setting(s, 'blog_intro')}
        result={result}
        baseUrl="/blog"
      />
    </SiteShell>
  );
}
