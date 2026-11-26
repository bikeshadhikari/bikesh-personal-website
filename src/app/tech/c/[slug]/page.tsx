import { notFound } from 'next/navigation';
import TechShell from '@/components/tech/TechShell';
import LinkCard from '@/components/tech/LinkCard';
import Pager from '@/components/tech/Pager';
import Link from 'next/link';
import {
  getTechCollection, getTechCollections, getTechLinks, getTechSettings, num, resolveLang, st, stl,
  tr, ui, withLang,
} from '@/lib/tech';
import { techMetadata } from '@/lib/tech-meta';
import JsonLd from '@/components/JsonLd';
import { breadcrumbs, graph, personId, techSiteId } from '@/lib/seo';
import { siteOrigin } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string; page?: string }>;
};

export async function generateMetadata({ params, searchParams }: Props) {
  const [{ slug }, { lang: raw }, s] = await Promise.all([params, searchParams, getTechSettings()]);
  const lang = resolveLang(raw, s);
  const c = await getTechCollection(slug);
  if (!c) return { title: 'Not found' };
  return techMetadata({
    lang, path: `/tech/c/${c.slug}`, title: tr(c, 'name', lang),
    description: tr(c, 'description', lang) || undefined, image: c.cover_image || undefined,
  });
}

export default async function TechCollectionPage({ params, searchParams }: Props) {
  const [{ slug }, query, s] = await Promise.all([params, searchParams, getTechSettings()]);
  const lang = resolveLang(query.lang, s);
  const t = ui(lang);
  const L = (href: string) => withLang(href, lang, s);
  const collection = await getTechCollection(slug);
  if (!collection) notFound();

  const perPage = Math.min(96, Math.max(6, Number.parseInt(st(s, 'st_per_page'), 10) || 24));
  const page = Math.max(1, Number.parseInt(query.page ?? '1', 10) || 1);
  const [{ rows, total }, all] = await Promise.all([
    getTechLinks({ collectionId: collection.id, limit: perPage, offset: (page - 1) * perPage }),
    getTechCollections(),
  ]);
  const base = `/tech/c/${collection.slug}`;

  return (
    <TechShell lang={lang} path={page > 1 ? `${base}?page=${page}` : base} current={`c-${collection.slug}`} showNewsletter>
      <JsonLd data={graph(
        {
          '@type': 'CollectionPage',
          url: `${siteOrigin()}${base}`,
          name: tr(collection, 'name', lang),
          description: tr(collection, 'description', lang) || undefined,
          isPartOf: { '@id': techSiteId() },
          author: { '@id': personId() },
          inLanguage: lang,
          mainEntity: { '@type': 'ItemList', itemListElement: rows.map((l, i) => ({
            '@type': 'ListItem', position: i + 1, url: `${siteOrigin()}/tech/${l.slug}`, name: tr(l, 'title', lang),
          })) },
        },
        breadcrumbs([
          { name: stl(s, 'st_name', lang), url: `${siteOrigin()}/tech` },
          { name: tr(collection, 'name', lang), url: `${siteOrigin()}${base}` },
        ]),
      )} />
      <section className="st-frame st-page-head">
        <p className="st-mono st-crumbs">
          <Link href={L('/tech')}>{stl(s, 'st_name', lang)}</Link><span>/</span>
          <span>{t.collections}</span><span>/</span><span className="is-here">{tr(collection, 'name', lang)}</span>
        </p>
        <p className="st-mono st-detail-count"><span>{tr(collection, 'name', lang)}, {t.items(total)}</span></p>
        <h1 className="st-detail-title">{tr(collection, 'name', lang)}</h1>
        {tr(collection, 'description', lang) && <p className="st-detail-summary">{tr(collection, 'description', lang)}</p>}
      </section>

      <nav className="st-frame st-chips" aria-label={t.collections}>
        <Link href={L('/tech')} className="st-chip st-hl st-hl-tight">{t.allLinks}</Link>
        {all.map((c) => (
          <Link key={c.id} href={L(`/tech/c/${c.slug}`)} className={`st-chip st-hl st-hl-tight${c.id === collection.id ? ' is-active' : ''}`}
                aria-current={c.id === collection.id ? 'page' : undefined}>
            {tr(c, 'name', lang)} <em>{num(c.link_count, lang)}</em>
          </Link>
        ))}
      </nav>

      <section className="st-frame st-section">
        {rows.length === 0 ? <p className="st-empty">{t.nothing}</p> : (
          <div className="st-grid">
            {rows.map((l, i) => (
              <LinkCard key={l.id} link={l} lang={lang} t={t} href={L(`/tech/${l.slug}`)} eager={i < 4} />
            ))}
          </div>
        )}
        <Pager page={page} pages={Math.max(1, Math.ceil(total / perPage))} lang={lang} t={t} base={base} L={L} />
      </section>
    </TechShell>
  );
}
