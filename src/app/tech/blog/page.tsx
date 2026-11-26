import Link from 'next/link';
import TechShell from '@/components/tech/TechShell';
import BlogCard from '@/components/tech/BlogCard';
import Pager from '@/components/tech/Pager';
import TechIcon from '@/components/tech/TechIcon';
import JsonLd from '@/components/JsonLd';
import { getCategories, getPosts } from '@/lib/content';
import { getTechSettings, num, resolveLang, st, stl, ui, withLang } from '@/lib/tech';
import { techMetadata } from '@/lib/tech-meta';
import { breadcrumbs, graph, personId, techSiteId } from '@/lib/seo';
import { siteOrigin } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ lang?: string; page?: string; c?: string; q?: string }> };

export async function generateMetadata({ searchParams }: Props) {
  const [{ lang }, s] = await Promise.all([searchParams, getTechSettings()]);
  const l = resolveLang(lang, s);
  return techMetadata({
    lang: l, path: '/tech/blog', title: ui(l).blog, description: ui(l).blogIntro,
    keywords: ['tech blog Nepal', 'tech explainer articles', 'AI how-to guides'],
  });
}

/**
 * Every blog article, inside Simplified Tech. Each one opens in the
 * Simplified Tech design; its main address stays /blog/<slug>.
 */
export default async function TechBlogPage({ searchParams }: Props) {
  const [query, s] = await Promise.all([searchParams, getTechSettings()]);
  const lang = resolveLang(query.lang, s);
  const t = ui(lang);
  const L = (href: string) => withLang(href, lang, s);
  const page = Math.max(1, Number.parseInt(query.page ?? '1', 10) || 1);
  const perPage = Math.min(48, Math.max(6, Number.parseInt(st(s, 'st_per_page'), 10) || 24));
  const categories = (await getCategories().catch(() => [])).filter((c) => (c.post_count ?? 0) > 0);
  const active = categories.find((c) => c.slug === query.c) ?? null;
  const q = (query.q ?? '').trim().slice(0, 80);
  const { items, total, pages } = await getPosts({ page, perPage, categoryId: active?.id, search: q || undefined })
    .catch(() => ({ items: [], total: 0, pages: 1, page: 1 }));

  const base = `/tech/blog${active ? `?c=${active.slug}` : ''}${q ? `${active ? '&' : '?'}q=${encodeURIComponent(q)}` : ''}`;
  const origin = siteOrigin();

  return (
    <TechShell lang={lang} path={base} current="blog" showNewsletter>
      <JsonLd data={graph(
        {
          '@type': 'Blog', url: `${origin}/tech/blog`, name: `${stl(s, 'st_name', lang)} — ${t.blog}`,
          isPartOf: { '@id': techSiteId() }, author: { '@id': personId() }, inLanguage: 'en',
          blogPost: items.map((p) => ({ '@type': 'BlogPosting', headline: p.title, url: `${origin}/blog/${p.slug}`,
            datePublished: p.published_at ? new Date(p.published_at).toISOString() : undefined })),
        },
        breadcrumbs([{ name: stl(s, 'st_name', lang), url: `${origin}/tech` }, { name: t.blog, url: `${origin}/tech/blog` }]),
      )} />

      <section className="st-frame st-page-head">
        <p className="st-mono st-crumbs">
          <Link className="st-hl st-hl-tight" href={L('/tech')}>{stl(s, 'st_name', lang)}</Link>
          <span>/</span><span className="is-here">{t.blog}</span>
        </p>
        <p className="st-mono st-detail-count"><span>{t.blog}, {t.articles(total)}</span></p>
        <h1 className="st-detail-title">{t.blog}</h1>
        <p className="st-detail-summary">{t.blogIntro}</p>
        <form className="st-search-inline" action="/tech/blog" method="get" role="search">
          <TechIcon name="search" />
          <input type="search" name="q" defaultValue={q} placeholder={t.searchPlaceholder} aria-label={t.search} />
          {active && <input type="hidden" name="c" value={active.slug} />}
          {lang !== 'en' && <input type="hidden" name="lang" value={lang} />}
          <button className="st-btn st-btn-light" type="submit">{t.search}</button>
        </form>
      </section>

      {categories.length > 0 && (
        <nav className="st-frame st-chips" aria-label={t.collections}>
          <Link href={L('/tech/blog')} className={`st-chip st-hl st-hl-tight${active ? '' : ' is-active'}`}>
            {t.allArticles}
          </Link>
          {categories.map((c) => (
            <Link key={c.id} href={L(`/tech/blog?c=${c.slug}`)}
                  className={`st-chip st-hl st-hl-tight${active?.id === c.id ? ' is-active' : ''}`}>
              {c.name} <em>{num(c.post_count ?? 0, lang)}</em>
            </Link>
          ))}
        </nav>
      )}

      <section className="st-frame st-section">
        {items.length === 0 ? <p className="st-empty">{q ? t.noResults : t.nothing}</p> : (
          <div className="st-grid">
            {items.map((p, i) => <BlogCard key={p.id} post={p} href={L(`/tech/blog/${p.slug}`)} t={t} eager={i < 4} />)}
          </div>
        )}
        <Pager page={page} pages={Math.max(1, pages)} lang={lang} t={t} base={base} L={L} />
      </section>
    </TechShell>
  );
}
