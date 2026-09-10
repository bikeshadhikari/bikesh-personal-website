import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import SiteShell from '@/components/site/SiteShell';
import BlogLayout from '@/components/site/BlogLayout';
import { menuEnabled } from '@/lib/menu';
import { getSettings, settingInt } from '@/lib/settings';
import { getPosts } from '@/lib/content';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ tag: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  const name = decodeURIComponent(tag);
  return { title: `Tagged “${name}”`, description: `Posts tagged ${name}.` };
}

export default async function TagPage({ params, searchParams }: Props) {
  if (!(await menuEnabled('blog'))) notFound();

  const [{ tag }, { page }] = await Promise.all([params, searchParams]);
  const name = decodeURIComponent(tag);
  const s = await getSettings();
  const result = await getPosts({
    tag: name,
    page: Math.max(1, Number(page) || 1),
    perPage: settingInt(s, 'posts_per_page', 6),
  });

  return (
    <SiteShell current="blog">
      <BlogLayout
        heading={`Tagged “${name}”`}
        result={result}
        baseUrl={`/blog/tag/${encodeURIComponent(name)}`}
      />
    </SiteShell>
  );
}
