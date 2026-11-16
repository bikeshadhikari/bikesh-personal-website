import TechShell from '@/components/tech/TechShell';
import LinkCard from '@/components/tech/LinkCard';
import TechIcon from '@/components/tech/TechIcon';
import { getTechLinks, getTechSettings, resolveLang, ui, withLang } from '@/lib/tech';
import { techMetadata } from '@/lib/tech-meta';

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ lang?: string; q?: string }> };

export async function generateMetadata({ searchParams }: Props) {
  const [{ lang }, s] = await Promise.all([searchParams, getTechSettings()]);
  const l = resolveLang(lang, s);
  return { ...(await techMetadata({ lang: l, path: '/tech/search', title: ui(l).search })), robots: { index: false } };
}

export default async function TechSearchPage({ searchParams }: Props) {
  const [query, s] = await Promise.all([searchParams, getTechSettings()]);
  const lang = resolveLang(query.lang, s);
  const t = ui(lang);
  const q = (query.q ?? '').trim().slice(0, 100);
  const { rows, total } = q ? await getTechLinks({ q, limit: 60 }) : { rows: [], total: 0 };
  const path = q ? `/tech/search?q=${encodeURIComponent(q)}` : '/tech/search';

  return (
    <TechShell lang={lang} path={path}>
      <section className="st-frame st-page-head">
        <h1 className="st-detail-title">{t.search}</h1>
        <form className="st-search-inline" action="/tech/search" method="get" role="search">
          <TechIcon name="search" />
          <input type="search" name="q" defaultValue={q} placeholder={t.searchPlaceholder} aria-label={t.search} autoFocus />
          {lang !== 'en' && <input type="hidden" name="lang" value={lang} />}
          <button className="st-btn st-btn-light" type="submit">{t.search}</button>
        </form>
        {q && <p className="st-mono st-detail-count"><span>{rows.length ? t.results(total, q) : t.noResults}</span></p>}
      </section>
      {rows.length > 0 && (
        <section className="st-frame st-section">
          <div className="st-grid">
            {rows.map((l) => (
              <LinkCard key={l.id} link={l} lang={lang} t={t} href={withLang(`/tech/${l.slug}`, lang, s)} />
            ))}
          </div>
        </section>
      )}
    </TechShell>
  );
}
