import Link from 'next/link';
import type { Lang, TechLink, UiText } from '@/lib/tech';
import { num, tr } from '@/lib/tech';
import TechIcon from './TechIcon';

/** A post's picture, or a drawn stand-in in the accent colours when it has none. */
export function Cover({ link, lang, eager = false, className = '' }: {
  link: TechLink; lang: Lang; eager?: boolean; className?: string;
}) {
  const title = tr(link, 'title', lang);
  if (link.cover_image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img className={`st-cover ${className}`} src={link.cover_image} alt=""
           loading={eager ? 'eager' : 'lazy'} decoding="async" />
    );
  }
  const seed = (link.id * 47) % 3;
  return (
    <div className={`st-cover st-cover-drawn st-cover-drawn-${seed} ${className}`} aria-hidden="true">
      <span className="st-cover-glyph">{(tr(link, 'kicker', lang) || title).slice(0, 18)}</span>
      <span className="st-cover-grid" />
    </div>
  );
}

/** The count shown on a card: copy blocks if it has any. */
export function countLabel(link: TechLink, t: UiText): string {
  return link.block_count > 0 ? t.links(link.block_count) : '';
}

/**
 * A card in a grid or a shelf. On hover: corner brackets close in around it,
 * the summary types itself over the picture, the picture leans in, and a line
 * draws under "Open" while the arrow turns to point out.
 */
export default function LinkCard({
  link, lang, t, href, collectionHref, eager = false, variant = 'grid',
}: {
  link: TechLink;
  lang: Lang;
  t: UiText;
  href: string;
  collectionHref?: string;
  eager?: boolean;
  variant?: 'grid' | 'shelf';
}) {
  const title = tr(link, 'title', lang);
  const summary = tr(link, 'summary', lang);
  const collection = tr({ name: link.collection_name, name_ne: link.collection_name_ne }, 'name', lang);
  const kicker = tr(link, 'kicker', lang) || collection;

  return (
    <article className={`st-card st-card-${variant}`}>
      <span className="st-corner st-corner-tl" aria-hidden="true" />
      <span className="st-corner st-corner-tr" aria-hidden="true" />
      <span className="st-corner st-corner-bl" aria-hidden="true" />
      <span className="st-corner st-corner-br" aria-hidden="true" />
      {kicker && <span className="st-card-scan st-mono" aria-hidden="true">{kicker}</span>}

      <Link href={href} className="st-card-media" tabIndex={-1} aria-hidden="true">
        <Cover link={link} lang={lang} eager={eager} />
        {link.badge && <span className="st-badge st-mono">{link.badge}</span>}
        {summary && (
          <span className="st-card-peek">
            <span className="st-mono st-card-peek-head">{kicker}{link.block_count > 0 && <> · {t.links(link.block_count)}</>}</span>
            <span className="st-mono st-card-peek-text">{summary}</span>
          </span>
        )}
      </Link>

      <div className="st-card-meta st-mono">
        {collection && collectionHref
          ? <Link href={collectionHref}>{collection}</Link>
          : <span>{collection || kicker}</span>}
        <span>{countLabel(link, t)}</span>
      </div>

      <h3 className="st-card-title">
        <Link href={href}>{title}</Link>
      </h3>

      <Link href={href} className="st-card-foot" aria-label={`${t.open}: ${title}`}>
        <span>{t.open}</span>
        <TechIcon name="arrow-right" className="st-ico st-card-arrow" />
      </Link>
    </article>
  );
}

export { num };
