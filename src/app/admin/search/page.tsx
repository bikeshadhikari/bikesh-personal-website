import Link from 'next/link';
import Shell from '@/components/admin/Shell';
import AdminSearchBox from '@/components/admin/AdminSearchBox';
import Icon from '@/components/Icon';
import { searchAdmin, type SearchHit } from '@/lib/admin-search';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Search' };

export default async function AdminSearchPage({
  searchParams,
}: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams;
  const term = q.slice(0, 100).trim();
  const hits = await searchAdmin(term);

  const grouped = hits.reduce<Record<string, SearchHit[]>>((acc, hit) => {
    (acc[hit.group] ??= []).push(hit);
    return acc;
  }, {});

  return (
    <Shell title="Search" current="search">
      <div className="page-head">
        <div>
          <h2>Search the dashboard</h2>
          <p className="muted">
            Posts, projects, experience, skills, services, gallery, settings and menus, all at once.
          </p>
        </div>
      </div>

      <div className="form-panel">
        <AdminSearchBox initial={term} autoFocus />
      </div>

      {term.length < 2 ? (
        <div className="empty-panel">
          <p><strong>Type at least two characters.</strong></p>
          <p className="muted">
            Try a post title, an organisation, a skill, or a setting like “favicon” or “accent”.
          </p>
        </div>
      ) : hits.length === 0 ? (
        <div className="empty-panel">
          <p><strong>Nothing matched “{term}”.</strong></p>
          <p className="muted">Check the spelling, or try a shorter word.</p>
        </div>
      ) : (
        <>
          <p className="muted search-count">
            {hits.length} {hits.length === 1 ? 'result' : 'results'} for “{term}”.
          </p>
          {Object.entries(grouped).map(([group, items]) => (
            <section className="form-panel" key={group}>
              <div className="panel-head"><h3>{group}</h3><span className="muted">{items.length}</span></div>
              <ul className="search-results">
                {items.map((hit, i) => (
                  <li key={`${hit.href}-${i}`}>
                    <Link href={hit.href}>
                      <span className="search-icon"><Icon name={hit.icon} className="icon icon-sm" /></span>
                      <span className="search-body">
                        <strong>{hit.title}</strong>
                        {hit.detail && <small>{hit.detail}</small>}
                      </span>
                      <Icon name="arrow-right" className="icon icon-sm search-go" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </Shell>
  );
}
