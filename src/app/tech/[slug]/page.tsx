import Link from 'next/link';
import { notFound } from 'next/navigation';
import TechShell from '@/components/tech/TechShell';
import LinkCard, { Cover } from '@/components/tech/LinkCard';
import CopyButton from '@/components/tech/CopyButton';
import ArticleBody from '@/components/tech/ArticleBody';
import TechIcon from '@/components/tech/TechIcon';
import ShareLink from '@/components/tech/ShareLink';
import BlockHead from '@/components/tech/BlockHead';
import { currentUser } from '@/lib/auth';
import {
  countTechView, getRelatedTechLinks, getTechBlocks, getTechLink, getTechSettings, num, resolveLang,
  st, stl, techDate, tr, ui, withLang,
} from '@/lib/tech';
import { techMetadata } from '@/lib/tech-meta';
import { excerptOf, siteOrigin } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
};

export async function generateMetadata({ params, searchParams }: Props) {
  const [{ slug }, { lang: raw }, s] = await Promise.all([params, searchParams, getTechSettings()]);
  const lang = resolveLang(raw, s);
  const link = await getTechLink(slug);
  if (!link) return { title: 'Not found' };
  return techMetadata({
    lang,
    path: `/tech/${link.slug}`,
    title: tr(link, 'title', lang),
    description: link.meta_description || tr(link, 'summary', lang) || excerptOf(tr(link, 'content', lang), 30),
    image: link.cover_image || undefined,
  });
}

export default async function TechLinkPage({ params, searchParams }: Props) {
  const [{ slug }, query, s] = await Promise.all([params, searchParams, getTechSettings()]);
  const lang = resolveLang(query.lang, s);
  const t = ui(lang);
  const L = (href: string) => withLang(href, lang, s);

  // A signed-in owner can open drafts from the dashboard's View button.
  const owner = await currentUser();
  const link = await getTechLink(slug, Boolean(owner));
  if (!link) notFound();
  if (!owner) void countTechView(link.id);

  const [blocks, related] = await Promise.all([getTechBlocks(link.id), getRelatedTechLinks(link)]);

  const title = tr(link, 'title', lang);
  const summary = tr(link, 'summary', lang);
  const kicker = tr(link, 'kicker', lang);
  const collection = tr({ name: link.collection_name, name_ne: link.collection_name_ne }, 'name', lang);
  const content = tr(link, 'content', lang);
  const url = `${siteOrigin()}/tech/${link.slug}`;

  return (
    <TechShell lang={lang} path={`/tech/${link.slug}`}
               current={link.collection_slug ? `c-${link.collection_slug}` : ''} showNewsletter>
      <div className="st-frame st-detail">
        <aside className="st-detail-side">
          <div className="st-detail-sticky">
            <div className="st-detail-cover"><Cover link={link} lang={lang} eager /></div>
            <Link href={L('/tech')} className="st-back st-hl st-hl-tight" data-hl={t.allLinks}><TechIcon name="arrow-left" /> {t.backTo}</Link>
            <div className="st-detail-actions">
              {link.external_url && (
                <a className="st-btn st-btn-light" href={link.external_url} target="_blank" rel="noopener noreferrer">
                  {link.external_label || t.visit} <TechIcon name="arrow-up-right" />
                </a>
              )}
              {link.video_url && (
                <a className="st-btn st-btn-ghost" href={link.video_url} target="_blank" rel="noopener noreferrer">
                  <TechIcon name="play" /> {t.watch}
                </a>
              )}
              <ShareLink url={url} title={title} label={t.share} copied={t.copied} />
            </div>
          </div>
        </aside>

        <article className="st-detail-main">
          <p className="st-mono st-crumbs">
            <Link className="st-hl st-hl-tight" href={L('/tech')}>{stl(s, 'st_name', lang)}</Link>
            <span>/</span>
            {link.collection_slug
              ? <Link className="st-hl st-hl-tight" href={L(`/tech/c/${link.collection_slug}`)}>{collection}</Link>
              : <span>{t.allLinks}</span>}
            {kicker && <><span>/</span><span className="is-here">{kicker}</span></>}
          </p>

          <p className="st-mono st-detail-count">
            <span>{kicker || collection}{blocks.length > 0 && <>, {t.links(blocks.length)}</>}</span>
            {link.published_at && <span className="st-detail-date">{techDate(link.published_at, lang)}</span>}
            {link.badge && <span className="st-badge-inline">{link.badge}</span>}
          </p>

          <h1 className="st-detail-title">{title}</h1>
          {summary && <p className="st-detail-summary">{summary}</p>}

          {content && <ArticleBody html={content} copy={t.copy} copied={t.copied} />}

          {blocks.length > 0 && (
            <section className="st-blocks" aria-label={stl(s, 'st_blocks_heading', lang)}>
              <h2 className="st-mono st-blocks-head">{stl(s, 'st_blocks_heading', lang)}</h2>
              <ol>
                {blocks.map((b, i) => {
                  const body = tr(b, 'body', lang);
                  return (
                    <li key={b.id} className="st-block">
                      <BlockHead
                        no={num(String(i + 1).padStart(2, '0'), lang)}
                        title={tr(b, 'title', lang)}
                        description={tr(b, 'description', lang)}
                        url={b.url}
                        text={body}
                        linkId={link.id}
                        openLabel={t.visit}
                        copyLabel={`${t.copy} ${b.label || 'Prompt'}`.toLowerCase()}
                        copiedLabel={t.copied}
                      />
                      <div className="st-block-body">
                        <div className="st-codebox">
                          <div className="st-codebox-head">
                            <span className="st-mono">{b.label || 'Prompt'}</span>
                            <span className="st-codebox-tools">
                              {b.url && (
                                <a className="st-copy" href={b.url} target="_blank" rel="noopener noreferrer">
                                  <TechIcon name="arrow-up-right" /><span>{t.open}</span>
                                </a>
                              )}
                              <CopyButton text={body} label={t.copy} doneLabel={t.copied} linkId={link.id} />
                            </span>
                          </div>
                          <pre className="st-codebox-body">{body}</pre>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}

          {st(s, 'st_handle') && (
            <p className="st-mono st-signoff">— {st(s, 'st_handle')} · {stl(s, 'st_tagline', lang)}</p>
          )}
        </article>
      </div>

      {related.length > 0 && (
        <section className="st-frame st-section">
          <div className="st-section-head">
            <h2>{t.related}</h2>
            <Link href={L('/tech')} className="st-see-all st-hl st-hl-tight" data-hl={t.open}>{t.allLinks} <TechIcon name="arrow-right" /></Link>
          </div>
          <div className="st-grid">
            {related.map((l) => (
              <LinkCard key={l.id} link={l} lang={lang} t={t} href={L(`/tech/${l.slug}`)}
                        collectionHref={l.collection_slug ? L(`/tech/c/${l.collection_slug}`) : undefined} />
            ))}
          </div>
        </section>
      )}
    </TechShell>
  );
}
