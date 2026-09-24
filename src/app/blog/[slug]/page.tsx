import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import SiteShell from '@/components/site/SiteShell';
import { PostCard, SectionHead } from '@/components/site/blocks';
import CommentForm from '@/components/site/CommentForm';
import ShareBar from '@/components/site/ShareBar';
import { menuEnabled } from '@/lib/menu';
import { getSettings, settingBool } from '@/lib/settings';
import { getComments, getPost, getRelatedPosts, registerView } from '@/lib/content';
import ReadTimer from '@/components/site/ReadTimer';
import { csvList, excerptOf, formatDate, isoDate, sanitizeHtml, siteOrigin } from '@/lib/utils';
import Icon from '@/components/Icon';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: 'Article not found' };

  const description = post.meta_description || post.excerpt || excerptOf(post.content, 30);

  // A cover image wins when there is one. When there is none the `images` key
  // is left out entirely rather than set to undefined, because an explicit
  // undefined suppresses the opengraph-image.tsx sitting beside this file —
  // and that generated picture is what makes every share preview correctly.
  const cover = post.cover_image
    ? { images: [{ url: post.cover_image, width: 1200, height: 630, alt: post.title }] }
    : {};

  return {
    title: post.meta_title || post.title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      url: `/blog/${post.slug}`,
      siteName: post.author_name ?? undefined,
      title: post.title,
      description,
      publishedTime: post.published_at ?? undefined,
      authors: post.author_name ? [post.author_name] : undefined,
      ...cover,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      ...cover,
    },
  };
}

export default async function PostPage({ params }: Props) {
  if (!(await menuEnabled('blog'))) notFound();

  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const [s, comments, related] = await Promise.all([
    getSettings(), getComments(post.id), getRelatedPosts(post),
  ]);

  // Fire and forget: a missed count must never delay the page.
  void registerView(post.id);

  const tags = csvList(post.tags);
  const commentsOn = settingBool(s, 'comments_enabled', true) && post.allow_comments;
  const siteUrl = siteOrigin();
  const shareUrl = `${siteUrl}/blog/${post.slug}`;

  return (
    <SiteShell current="blog">
      {/* Counts the time this reader is actually on the page and reports it
          once, when they leave. */}
      <ReadTimer endpoint={`/api/posts/${post.id}/time`} />
      <article className="post-single">
        <header className="post-hero">
          <div className="hero-glow" aria-hidden="true" />
          <div className="container narrow">
            <p className="breadcrumb">
              <Link href="/blog">Blog</Link>
              {post.category_name && (
                <>
                  <span>/</span>
                  <Link href={`/blog/category/${post.category_slug}`}>{post.category_name}</Link>
                </>
              )}
            </p>
            <h1>{post.title}</h1>
            {post.excerpt && <p className="post-standfirst">{post.excerpt}</p>}
            <ul className="post-meta">
              <li>
                <Icon name="calendar" className="icon icon-xs" />
                <time dateTime={isoDate(post.published_at)}>
                  {formatDate(post.published_at, { day: 'numeric', month: 'long', year: 'numeric' })}
                </time>
              </li>
              <li><Icon name="eye" className="icon icon-xs" />{post.views} views</li>
              {post.author_name && <li><Icon name="users" className="icon icon-xs" />{post.author_name}</li>}
            </ul>
          </div>
        </header>

        {post.cover_image && (
          <figure className="post-cover container narrow">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.cover_image} alt={post.title} />
          </figure>
        )}

        <div className="container narrow">
          <div className="prose article-body" dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }} />

          {tags.length > 0 && (
            <ul className="tag-cloud post-tags">
              {tags.map((tag) => (
                <li key={tag}><Link href={`/blog/tag/${encodeURIComponent(tag)}`}>#{tag}</Link></li>
              ))}
            </ul>
          )}

          <ShareBar url={shareUrl} title={post.title} />
        </div>
      </article>

      {commentsOn && (
        <section className="section section-alt" id="comments">
          <div className="container narrow">
            <h2 className="comments-title">
              {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
            </h2>

            {comments.length > 0 && (
              <ul className="comment-list">
                {comments.map((c) => (
                  <li className="comment" key={c.id}>
                    <span className="avatar-initial" aria-hidden="true">{c.name.charAt(0)}</span>
                    <div>
                      <p className="comment-head">
                        <strong>{c.name}</strong> <time>{formatDate(c.created_at)}</time>
                      </p>
                      <p>{c.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <CommentForm postSlug={post.slug} />
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="section">
          <div className="container">
            <SectionHead eyebrow="Keep reading" heading="Related articles" />
            <div className="cards-grid posts-grid">
              {related.map((p) => <PostCard key={p.id} post={p} />)}
            </div>
          </div>
        </section>
      )}
    </SiteShell>
  );
}
