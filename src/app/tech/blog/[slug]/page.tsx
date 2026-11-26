import Link from 'next/link';
import { notFound } from 'next/navigation';
import TechShell from '@/components/tech/TechShell';
import BlogCard from '@/components/tech/BlogCard';
import ArticleBody from '@/components/tech/ArticleBody';
import ShareLink from '@/components/tech/ShareLink';
import TechIcon from '@/components/tech/TechIcon';
import JsonLd from '@/components/JsonLd';
import { getPost, getRelatedPosts, registerView } from '@/lib/content';
import { sql } from '@/lib/db';
import { getTechSettings, resolveLang, stl, techDate, ui, withLang } from '@/lib/tech';
import { techMetadata } from '@/lib/tech-meta';
import { breadcrumbs, graph, parseFaq } from '@/lib/seo';
import { csvList, excerptOf, readingTime, sanitizeHtml, siteOrigin } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string }> };

export async function generateMetadata({ params, searchParams }: Props) {
  const [{ slug }, { lang }, s] = await Promise.all([params, searchParams, getTechSettings()]);
  const post = await getPost(slug);
  if (!post) return { title: 'Not found' };
  const meta = await techMetadata({
    lang: resolveLang(lang, s), path: `/tech/blog/${post.slug}`, title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt || excerptOf(post.content, 30),
    image: post.cover_image || `${siteOrigin()}/blog/${post.slug}/opengraph-image`,
    article: { published: post.published_at, modified: post.updated_at, section: post.category_name, tags: csvList(post.tags) },
  });
  // The article's main address is on the blog; this copy points search engines there.
  return { ...meta, alternates: { ...meta.alternates, canonical: `/blog/${post.slug}`, languages: undefined } };
}

/** A blog article in the Simplified Tech design. */
export default async function TechBlogArticle({ params, searchParams }: Props) {
  const [{ slug }, query, s] = await Promise.all([params, searchParams, getTechSettings()]);
  const lang = resolveLang(query.lang, s);
  const t = ui(lang);
  const L = (href: string) => withLang(href, lang, s);
  const post = await getPost(slug);
  if (!post) notFound();
  void registerView(post.id);

  const [related, source] = await Promise.all([
    getRelatedPosts(post).catch(() => []),
    post.source_tech_id
      ? sql<{ slug: string; title: string }[]>`SELECT slug, title FROM tech_links
          WHERE id = ${post.source_tech_id} AND status = 'published' LIMIT 1`.catch(() => [])
      : Promise.resolve([]),
  ]);
  const faq = parseFaq(post.faq);
  const tags = csvList(post.tags);
  const origin = siteOrigin();
  // Links inside the article that point at the main blog stay inside Simplified Tech.
  const html = sanitizeHtml(post.content).replace(/href="\/blog\/([a-z0-9-]+)"/g, (_m, s1) => `href="${L(`/tech/blog/${s1}`)}"`);

  return (
    <TechShell lang={lang} path={`/tech/blog/${post.slug}`} current="blog" showNewsletter>
      <JsonLd data={graph(breadcrumbs([
        { name: stl(s, 'st_name', lang), url: `${origin}/tech` },
        { name: t.blog, url: `${origin}/tech/blog` },
        { name: post.title, url: `${origin}/blog/${post.slug}` },
      ]))} />
      <div className="st-frame st-detail">
        <aside className="st-detail-side">
          <div className="st-detail-sticky">
            {post.cover_image && (
              <div className="st-detail-cover">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="st-cover" src={post.cover_image} alt={post.title} />
              </div>
            )}
            <Link href={L('/tech/blog')} className="st-back st-hl st-hl-tight" data-hl={t.allArticles}>
              <TechIcon name="arrow-left" /> {t.allArticles}
            </Link>
            <div className="st-detail-actions">
              {source[0] && (
                <Link className="st-btn st-btn-light" href={L(`/tech/${source[0].slug}`)}>
                  {t.copyVersion} <TechIcon name="arrow-right" />
                </Link>
              )}
              <ShareLink url={`${origin}/blog/${post.slug}`} title={post.title} label={t.share} copied={t.copied} />
            </div>
          </div>
        </aside>

        <article className="st-detail-main">
          <p className="st-mono st-crumbs">
            <Link className="st-hl st-hl-tight" href={L('/tech')}>{stl(s, 'st_name', lang)}</Link><span>/</span>
            <Link className="st-hl st-hl-tight" href={L('/tech/blog')}>{t.blog}</Link>
            {post.category_name && <><span>/</span>
              <Link className="st-hl st-hl-tight" href={L(`/tech/blog?c=${post.category_slug}`)}>{post.category_name}</Link></>}
          </p>
          <p className="st-mono st-detail-count">
            <span>{post.category_name ?? t.blog}</span>
            {post.published_at && <span className="st-detail-date">{techDate(post.published_at, lang)}</span>}
            <span className="st-detail-date">{t.minRead(readingTime(post.content))}</span>
          </p>
          <h1 className="st-detail-title">{post.title}</h1>
          {post.excerpt && <p className="st-detail-summary">{post.excerpt}</p>}

          <ArticleBody html={html} copy={t.copy} copied={t.copied} />

          {faq.length > 0 && (
            <section className="st-faq" aria-labelledby="st-faq-head">
              <h2 id="st-faq-head" className="st-mono st-blocks-head">{t.faq}</h2>
              {faq.map((f, i) => (
                <details key={i} className="st-faq-item st-hl st-hl-soft" open={i === 0}>
                  <summary>{f.question}</summary>
                  <p>{f.answer}</p>
                </details>
              ))}
            </section>
          )}

          {tags.length > 0 && (
            <p className="st-tags">
              {tags.map((tag) => <span key={tag} className="st-chip">#{tag}</span>)}
            </p>
          )}
        </article>
      </div>

      {related.length > 0 && (
        <section className="st-frame st-section">
          <div className="st-section-head">
            <h2>{t.related}</h2>
            <Link href={L('/tech/blog')} className="st-see-all st-hl st-hl-tight" data-hl={t.open}>
              {t.allArticles} <TechIcon name="arrow-right" />
            </Link>
          </div>
          <div className="st-grid">
            {related.slice(0, 4).map((p) => <BlogCard key={p.id} post={p} href={L(`/tech/blog/${p.slug}`)} t={t} />)}
          </div>
        </section>
      )}
    </TechShell>
  );
}
