import Link from 'next/link';
import type { Post } from '@/lib/types';
import type { UiText } from '@/lib/tech';
import { readingTime } from '@/lib/utils';
import TechIcon from './TechIcon';

/** A blog article as a Simplified Tech card, with the same hover as everything else. */
export default function BlogCard({ post, href, t, eager = false }: { post: Post; href: string; t: UiText; eager?: boolean }) {
  const seed = (post.id * 47) % 3;
  return (
    <article className="st-card st-hl st-hl-card st-card-grid">
      <span className="st-corner st-corner-tl" aria-hidden="true" />
      <span className="st-corner st-corner-tr" aria-hidden="true" />
      <span className="st-corner st-corner-bl" aria-hidden="true" />
      <span className="st-corner st-corner-br" aria-hidden="true" />
      {post.category_name && <span className="st-card-scan st-mono" aria-hidden="true">{post.category_name}</span>}
      <Link href={href} className="st-card-media st-card-media-wide" tabIndex={-1} aria-hidden="true">
        {post.cover_image
          // eslint-disable-next-line @next/next/no-img-element
          ? <img className="st-cover" src={post.cover_image} alt="" loading={eager ? 'eager' : 'lazy'} />
          : (
            <div className={`st-cover st-cover-drawn st-cover-drawn-${seed}`}>
              <span className="st-cover-glyph">{(post.category_name || 'article').toLowerCase().slice(0, 22)}</span>
              <span className="st-cover-grid" />
            </div>
          )}
        {post.excerpt && (
          <span className="st-card-peek">
            <span className="st-mono st-card-peek-head">{post.category_name}</span>
            <span className="st-mono st-card-peek-text">{post.excerpt}</span>
          </span>
        )}
      </Link>
      <div className="st-card-meta st-mono">
        <span>{post.category_name ?? t.blog}</span>
        <span>{t.minRead(readingTime(post.content))}</span>
      </div>
      <h3 className="st-card-title"><Link href={href}>{post.title}</Link></h3>
      <Link href={href} className="st-card-foot" aria-label={`${t.readMore}: ${post.title}`}>
        <span>{t.readMore}</span>
        <TechIcon name="arrow-right" className="st-ico st-card-arrow" />
      </Link>
    </article>
  );
}
