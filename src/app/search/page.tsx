import type { Metadata } from 'next';
import SiteShell from '@/components/site/SiteShell';
import BlogLayout from '@/components/site/BlogLayout';
import { menuEnabled } from '@/lib/menu';
import { getSettings, settingInt } from '@/lib/settings';
import { getPosts } from '@/lib/content';
import type { Paginated, Post } from '@/lib/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Search', robots: { index: false, follow: true } };

export default async function SearchPage({
  searchParams,
}: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const { q = '', page } = await searchParams;
  const term = q.slice(0, 120).trim();
  const s = await getSettings();

  const empty: Paginated<Post> = { items: [], total: 0, pages: 0, page: 1 };
  const result = term && (await menuEnabled('blog'))
    ? await getPosts({
        search: term,
        page: Math.max(1, Number(page) || 1),
        perPage: settingInt(s, 'posts_per_page', 6),
      })
    : empty;

  return (
    <SiteShell current="blog">
      <BlogLayout
        heading={term ? `Results for “${term}”` : 'Search'}
        intro={term ? `${result.total} ${result.total === 1 ? 'article' : 'articles'} found.` : 'Type a word or two to search the writing.'}
        result={result}
        baseUrl={`/search?q=${encodeURIComponent(term)}`}
        searchTerm={term}
      />
    </SiteShell>
  );
}
