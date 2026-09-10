import Link from 'next/link';
import { toggleResourceAction, deleteResourceAction } from '@/app/admin/actions';
import { ConfirmButton } from './ShellClient';
import TableSearch from './TableSearch';
import type { ResourceDef } from '@/lib/resources';
import type { ListResult } from '@/lib/crud';
import { dateRange, formatDate } from '@/lib/utils';
import Icon from '../Icon';

export default function ResourceList({
  resource, def, data, search,
}: { resource: string; def: ResourceDef; data: ListResult; search: string }) {
  return (
    <>
      <div className="page-head">
        <div>
          <h2>{def.label}</h2>
          <p className="muted">
            {data.total} {data.total === 1 ? 'entry' : 'entries'}
            {search && ` matching “${search}”`}.
          </p>
        </div>
        <div className="page-head-actions">
          {def.search && <TableSearch resource={resource} initial={search} />}
          <Link className="btn btn-primary btn-sm" href={`/admin/${resource}/new`}>
            New {def.singular.toLowerCase()}
          </Link>
        </div>
      </div>

      {data.rows.length === 0 ? (
        <div className="empty-panel">
          <p><strong>Nothing here yet.</strong></p>
          <p className="muted">
            {search
              ? 'No entry matches that search.'
              : `Create the first ${def.singular.toLowerCase()} and it appears on the website straight away.`}
          </p>
          <Link className="btn btn-primary btn-sm" href={`/admin/${resource}/new`}>
            New {def.singular.toLowerCase()}
          </Link>
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  {def.list.map((col) => (
                    <th key={col.key} className={col.type === 'number' || col.type === 'date' ? 'num' : undefined}>
                      {col.label}
                    </th>
                  ))}
                  <th className="actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => {
                  const id = Number(row.id);
                  return (
                    <tr key={id}>
                      {def.list.map((col) => {
                        const value = col.key === 'period'
                          ? dateRange(row.start_date as string, row.end_date as string, Boolean(row.is_current))
                          : row[col.key];
                        const numeric = col.type === 'number' || col.type === 'date';

                        return (
                          <td key={col.key} className={numeric ? 'num' : undefined}>
                            {col.primary ? (
                              <>
                                <Link className="row-title" href={`/admin/${resource}/${id}`}>
                                  {String(value ?? '')}
                                </Link>
                                {col.viewPath && row.slug ? (
                                  <a
                                    className="row-view"
                                    href={`/${col.viewPath}/${row.slug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="View on the site"
                                  >
                                    <Icon name="external" className="icon icon-xs" />
                                  </a>
                                ) : null}
                              </>
                            ) : col.type === 'status' ? (
                              <span className={`status status-${value}`}>{String(value)}</span>
                            ) : col.type === 'chip' ? (
                              value ? <span className="chip chip-soft">{String(value)}</span> : <span className="muted">—</span>
                            ) : col.type === 'bool' ? (
                              value ? <span className="status status-published">Yes</span> : <span className="muted">No</span>
                            ) : col.type === 'toggle' ? (
                              <form action={toggleResourceAction} className="inline-form">
                                <input type="hidden" name="_resource" value={resource} />
                                <input type="hidden" name="_id" value={id} />
                                <input type="hidden" name="_column" value={col.key} />
                                <button
                                  type="submit"
                                  className={`switch${value ? ' is-on' : ''}`}
                                  role="switch"
                                  aria-checked={Boolean(value)}
                                  title={value ? 'Visible — click to hide' : 'Hidden — click to show'}
                                >
                                  <span />
                                </button>
                              </form>
                            ) : col.type === 'meter' ? (
                              <div className="mini-meter" title={`${value}%`}>
                                <span style={{ width: `${Number(value)}%` }} />
                              </div>
                            ) : col.type === 'date' ? (
                              value ? formatDate(String(value)) : <span className="muted">—</span>
                            ) : col.type === 'thumb' ? (
                              value
                                // eslint-disable-next-line @next/next/no-img-element
                                ? <img className="row-thumb" src={String(value)} alt="" loading="lazy" />
                                : <span className="muted">—</span>
                            ) : col.type === 'mono' ? (
                              <code>{String(value ?? '')}</code>
                            ) : (
                              value === null || value === undefined || value === ''
                                ? <span className="muted">—</span>
                                : String(value)
                            )}
                          </td>
                        );
                      })}
                      <td className="actions-col">
                        <div className="row-actions">
                          <Link className="btn btn-ghost btn-xs" href={`/admin/${resource}/${id}`}>Edit</Link>
                          <form action={deleteResourceAction} className="inline-form">
                            <input type="hidden" name="_resource" value={resource} />
                            <input type="hidden" name="_id" value={id} />
                            <ConfirmButton message={`Delete this ${def.singular.toLowerCase()}? This cannot be undone.`}>
                              Delete
                            </ConfirmButton>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {data.pages > 1 && (
            <nav className="pagination" aria-label="Pagination">
              {Array.from({ length: data.pages }).map((_, i) => (
                <Link
                  key={i}
                  className={`page-link${i + 1 === data.page ? ' is-active' : ''}`}
                  href={`/admin/${resource}?p=${i + 1}${search ? `&search=${encodeURIComponent(search)}` : ''}`}
                >
                  {i + 1}
                </Link>
              ))}
            </nav>
          )}
        </>
      )}
    </>
  );
}
