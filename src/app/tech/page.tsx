import Link from 'next/link';
import TechShell from '@/components/tech/TechShell';
import LinkCard, { Cover } from '@/components/tech/LinkCard';
import TechIcon from '@/components/tech/TechIcon';
import Shelf from '@/components/tech/Shelf';
import Pager from '@/components/tech/Pager';
import {
  getTechCollections, getTechHero, getTechLinks, getTechSettings, num, resolveLang, st, stBool, stl,
  tr, ui, withLang, type Lang, type TechLink,
} from '@/lib/tech';
import { techMetadata } from '@/lib/tech-meta';
import JsonLd from '@/components/JsonLd';
import { graph, personSchema, techWebsiteSchema } from '@/lib/seo';
import { siteOrigin } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ lang?: string; page?: string }> };

export async function generateMetadata({ searchParams }: Props) {
  const [{ lang }, s] = await Promise.all([searchParams, getTechSettings()]);
  return techMetadata({ lang: resolveLang(lang, s), path: '/tech' });
}

export default async function TechHome({ searchParams }: Props) {
  const [query, s] = await Promise.all([searchParams, getTechSettings()]);
  const lang = resolveLang(query.lang, s);
  const t = ui(lang);
  const L = (href: string) => withLang(href, lang, s);
  const perPage = Math.min(96, Math.max(6, Number.parseInt(st(s, 'st_per_page'), 10) || 24));
  const page = Math.max(1, Number.parseInt(query.page ?? '1', 10) || 1);

  const [hero, collections, latest] = await Promise.all([
    getTechHero(),
    getTechCollections(),
    getTechLinks({ limit: perPage, offset: (page - 1) * perPage }),
  ]);
  const pages = Math.max(1, Math.ceil(latest.total / perPage));

  const shelves = stBool(s, 'st_show_shelves') && page === 1
    ? (await Promise.all(collections.filter((c) => c.link_count > 0).map(async (c) => ({
        collection: c,
        links: (await getTechLinks({ collectionId: c.id, limit: 12 })).rows,
      })))).filter((x) => x.links.length > 0)
    : [];

  const [main, ...side] = hero;
  const href = (l: TechLink) => L(`/tech/${l.slug}`);
  const colHref = (l: TechLink) => (l.collection_slug ? L(`/tech/c/${l.collection_slug}`) : undefined);

  return (
    <TechShell lang={lang} path={page > 1 ? `/tech?page=${page}` : '/tech'} showNewsletter>
      <JsonLd data={graph(
        techWebsiteSchema(s),
        personSchema(s),
        {
          '@type': 'CollectionPage',
          '@id': `${siteOrigin()}/tech#page`,
          url: `${siteOrigin()}/tech`,
          name: stl(s, 'st_catalogue_title', lang),
          isPartOf: { '@id': `${siteOrigin()}/tech#website` },
          about: { '@id': `${siteOrigin()}/#person` },
          inLanguage: lang,
          mainEntity: {
            '@type': 'ItemList',
            itemListElement: latest.rows.slice(0, 20).map((l, i) => ({
              '@type': 'ListItem', position: i + 1, url: `${siteOrigin()}/tech/${l.slug}`, name: tr(l, 'title', lang),
            })),
          },
        },
      )} />

      {/* The catalogue band */}
      <section className="st-frame st-catalogue">
        <h1 className="st-catalogue-title">{stl(s, 'st_catalogue_title', lang)}</h1>
        <p className="st-mono st-catalogue-note">
          <span>{t.collectionNo} {num(latest.total, lang)}</span>
          <span>{stl(s, 'st_catalogue_note', lang)}</span>
        </p>
      </section>

      {/* Hero: one big card across two thirds, two smaller beside it */}
      {page === 1 && main ? (
        <section className="st-frame st-hero" aria-label={stl(s, 'st_hero_label', lang)}>
          <HeroMain link={main} lang={lang} href={href(main)} label={stl(s, 'st_hero_label', lang)} t={t} />
          {side.length > 0 && (
            <div className="st-hero-side">
              {side.map((l) => <HeroSide key={l.id} link={l} lang={lang} href={href(l)} t={t} />)}
            </div>
          )}
        </section>
      ) : page === 1 ? (
        <section className="st-frame st-empty"><p>{t.nothing}</p></section>
      ) : null}

      {/* Collection chips */}
      {collections.length > 0 && (
        <nav className="st-frame st-chips" aria-label={t.collections}>
          <Link href={L('/tech')} className="st-chip st-hl st-hl-tight is-active">{t.allLinks} <em>{num(latest.total, lang)}</em></Link>
          {collections.map((c) => (
            <Link key={c.id} href={L(`/tech/c/${c.slug}`)} className="st-chip st-hl st-hl-tight">
              {tr(c, 'name', lang)} <em>{num(c.link_count, lang)}</em>
            </Link>
          ))}
        </nav>
      )}

      {/* Shop-style rows, one per collection */}
      {shelves.map(({ collection, links }) => (
        <Shelf
          key={collection.id}
          title={tr(collection, 'name', lang)}
          note={tr(collection, 'description', lang)}
          count={t.items(collection.link_count)}
          seeAll={{ label: t.seeAll, href: L(`/tech/c/${collection.slug}`) }}
        >
          {links.map((l) => (
            <LinkCard key={l.id} link={l} lang={lang} t={t} href={href(l)} variant="shelf" />
          ))}
        </Shelf>
      ))}

      {/* Everything, newest first */}
      {latest.rows.length > 0 && (
        <section className="st-frame st-section" id="all">
          <div className="st-section-head">
            <h2>{page > 1 ? `${t.allLinks} · ${t.page} ${num(page, lang)}` : t.latest}</h2>
            <span className="st-mono">{t.newestFirst}</span>
          </div>
          <div className="st-grid">
            {latest.rows.map((l, i) => (
              <LinkCard key={l.id} link={l} lang={lang} t={t} href={href(l)} collectionHref={colHref(l)} eager={i < 4} />
            ))}
          </div>
          <Pager page={page} pages={pages} lang={lang} t={t} base="/tech" L={L} />
        </section>
      )}

      {/* Collections */}
      {stBool(s, 'st_show_collections') && page === 1 && collections.length > 0 && (
        <section className="st-frame st-section">
          <div className="st-section-head">
            <h2>{t.collections}</h2>
            <span className="st-mono">{t.items(collections.length)}</span>
          </div>
          <div className="st-collections">
            {await Promise.all(collections.map(async (c, i) => {
              const sample = c.cover_image ? [] : (await getTechLinks({ collectionId: c.id, limit: 3 })).rows;
              return (
                <Link key={c.id} href={L(`/tech/c/${c.slug}`)} className="st-collection st-hl st-hl-soft" data-hl={t.open}>
                  <span className="st-collection-no st-mono">{num(String(i + 1).padStart(2, '0'), lang)}</span>
                  <span className="st-collection-art">
                    {c.cover_image
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={c.cover_image} alt="" loading="lazy" />
                      : sample.map((l) => <Cover key={l.id} link={l} lang={lang} />)}
                  </span>
                  <span className="st-collection-body">
                    <strong>{tr(c, 'name', lang)}</strong>
                    {tr(c, 'description', lang) && <span>{tr(c, 'description', lang)}</span>}
                  </span>
                  <span className="st-collection-foot st-mono">
                    {t.items(c.link_count)} <TechIcon name="arrow-up-right" className="st-ico" />
                  </span>
                </Link>
              );
            }))}
          </div>
        </section>
      )}
    </TechShell>
  );
}

function HeroMain({ link, lang, href, label, t }: {
  link: TechLink; lang: Lang; href: string; label: string; t: ReturnType<typeof ui>;
}) {
  const title = tr(link, 'title', lang);
  return (
    <article className="st-hero-main st-card st-hl st-hl-card">
      <span className="st-corner st-corner-tl" aria-hidden="true" />
      <span className="st-corner st-corner-tr" aria-hidden="true" />
      <span className="st-corner st-corner-bl" aria-hidden="true" />
      <span className="st-corner st-corner-br" aria-hidden="true" />
      <div className="st-hero-copy">
        <p className="st-mono st-hero-label">
          <span>/{label}</span>
          {link.block_count > 0 && <span>/{t.links(link.block_count)}</span>}
          {link.badge && <span className="st-badge-inline">{link.badge}</span>}
        </p>
        <h2 className="st-hero-title"><Link href={href}>{title}</Link></h2>
        {tr(link, 'summary', lang) && <p className="st-hero-summary">{tr(link, 'summary', lang)}</p>}
        <Link href={href} className="st-btn st-btn-light st-btn-lg">
          {link.block_count > 0 ? t.openLinks(link.block_count) : t.readMore}
          <TechIcon name="arrow-right" />
        </Link>
      </div>
      <Link href={href} className="st-hero-media" tabIndex={-1} aria-hidden="true">
        <Cover link={link} lang={lang} eager />
        {tr(link, 'kicker', lang) && <span className="st-hero-tag st-mono">{tr(link, 'kicker', lang)}</span>}
      </Link>
    </article>
  );
}

function HeroSide({ link, lang, href, t }: {
  link: TechLink; lang: Lang; href: string; t: ReturnType<typeof ui>;
}) {
  const collection = tr({ name: link.collection_name, name_ne: link.collection_name_ne }, 'name', lang);
  return (
    <article className="st-hero-small st-card st-hl st-hl-card">
      <span className="st-corner st-corner-tl" aria-hidden="true" />
      <span className="st-corner st-corner-tr" aria-hidden="true" />
      <span className="st-corner st-corner-bl" aria-hidden="true" />
      <span className="st-corner st-corner-br" aria-hidden="true" />
      <Link href={href} className="st-card-media" tabIndex={-1} aria-hidden="true">
        <Cover link={link} lang={lang} eager />
        {link.badge && <span className="st-badge st-mono">{link.badge}</span>}
      </Link>
      <div className="st-hero-small-body">
        <p className="st-mono st-card-meta">
          <span>{tr(link, 'kicker', lang) || collection}</span>
          <span>{link.block_count > 0 ? t.links(link.block_count) : ''}</span>
        </p>
        <h3 className="st-card-title"><Link href={href}>{tr(link, 'title', lang)}</Link></h3>
        <Link href={href} className="st-card-foot">
          <span>{t.open}</span><TechIcon name="arrow-right" className="st-ico st-card-arrow" />
        </Link>
      </div>
    </article>
  );
}
