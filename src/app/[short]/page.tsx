import { notFound, redirect } from 'next/navigation';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ short: string }>;
  searchParams: Promise<{ lang?: string }>;
};

/**
 * Short links for Simplified Tech posts: bikeshadhikari.com.np/wifi opens the
 * post whose short link is "wifi". Every real page is a folder of its own and
 * is matched before this, so a short link can never hide one; anything that
 * is not a short link gets the ordinary not-found page.
 */
export default async function ShortLink({ params, searchParams }: Props) {
  const [{ short }, { lang }] = await Promise.all([params, searchParams]);
  const key = decodeURIComponent(short).toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{0,59}$/.test(key)) notFound();

  let slug: string | null = null;
  try {
    const rows = await sql<{ slug: string }[]>`
      SELECT slug FROM tech_links
      WHERE short_link = ${key} AND status = 'published' AND (published_at IS NULL OR published_at <= NOW())
      LIMIT 1`;
    slug = rows[0]?.slug ?? null;
  } catch {
    slug = null;
  }
  if (!slug) notFound();
  redirect(`/tech/${slug}${lang === 'ne' || lang === 'en' ? `?lang=${lang}` : ''}`);
}
