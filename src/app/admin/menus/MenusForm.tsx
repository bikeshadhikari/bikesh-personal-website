'use client';

import { useActionState } from 'react';
import { saveMenusAction, type FormState } from '../actions';
import type { MenuItem } from '@/lib/menu';
import Icon from '@/components/Icon';

function Row({ item }: { item: MenuItem }) {
  return (
    <tr className={item.enabled ? undefined : 'is-off'}>
      <td>
        <strong>{item.slug}</strong>
        {item.locked && <span className="chip chip-soft">always on</span>}
        {item.description && <><br /><small className="muted">{item.description}</small></>}
      </td>
      <td>
        <input
          type="text" name={`label_${item.id}`} defaultValue={item.label}
          aria-label={`Label for ${item.slug}`}
        />
      </td>
      <td className="num">
        <input
          type="number" className="input-narrow" name={`order_${item.id}`}
          defaultValue={item.sort_order} aria-label={`Sort order for ${item.slug}`}
        />
      </td>
      {item.kind === 'page' && (
        <td>
          <label className="checkbox small">
            <input type="checkbox" name={`nav_${item.id}`} value="1" defaultChecked={item.in_nav} />
            <span>Show</span>
          </label>
        </td>
      )}
      <td>
        {item.locked ? (
          <span className="status status-published">on</span>
        ) : (
          <label className="switch-label">
            <input
              type="checkbox" className="switch-input" name={`enabled_${item.id}`}
              value="1" defaultChecked={item.enabled} aria-label={`Show ${item.slug} on the website`}
            />
            <span className="switch"><span /></span>
          </label>
        )}
      </td>
      {item.kind === 'page' && (
        <td>
          {item.enabled
            ? <a href={item.slug === 'home' ? '/' : `/${item.slug}`} target="_blank" rel="noopener noreferrer">
                <code>/{item.slug === 'home' ? '' : item.slug}</code>
              </a>
            : <span className="muted">hidden</span>}
        </td>
      )}
    </tr>
  );
}

export default function MenusForm({ pages, sections }: { pages: MenuItem[]; sections: MenuItem[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveMenusAction, null);

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Menus &amp; sections</h2>
          <p className="muted">
            One switch per page and per home-page block. Turning something off removes it from the
            navigation and makes its address return “page not found”.
          </p>
        </div>
      </div>

      {state && (
        <div className={`alert alert-${state.ok ? 'success' : 'error'}`}>{state.message}</div>
      )}

      <form action={action} className="admin-form">
        <section className="form-panel">
          <div className="panel-head">
            <h3><Icon name="layers" className="icon icon-sm" /> Pages</h3>
            <span className="muted">These appear in the top navigation and have their own address.</span>
          </div>
          <div className="table-wrap">
            <table className="data-table menu-table">
              <thead>
                <tr>
                  <th>Page</th><th>Menu label</th><th className="num">Order</th>
                  <th>In navbar</th><th>Live</th><th>Address</th>
                </tr>
              </thead>
              <tbody>{pages.map((item) => <Row key={item.id} item={item} />)}</tbody>
            </table>
          </div>
        </section>

        <section className="form-panel">
          <div className="panel-head">
            <h3><Icon name="code" className="icon icon-sm" /> Home page sections</h3>
            <span className="muted">Blocks stacked down the home page, in the order set here.</span>
          </div>
          <div className="table-wrap">
            <table className="data-table menu-table">
              <thead>
                <tr><th>Section</th><th>Heading</th><th className="num">Order</th><th>Live</th></tr>
              </thead>
              <tbody>{sections.map((item) => <Row key={item.id} item={item} />)}</tbody>
            </table>
          </div>
        </section>

        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={pending}>
            {pending ? 'Saving…' : 'Save changes'}
          </button>
          <a className="btn btn-link" href="/" target="_blank" rel="noopener noreferrer">Preview the site</a>
        </div>
      </form>

      <div className="panel panel-notice">
        <h3><Icon name="sparkle" className="icon icon-sm" /> How the switches behave</h3>
        <ul className="plain-list">
          <li><strong>Blog off</strong> removes it from the navigation, blocks <code>/blog</code> and every article address, hides the latest-writing block, and drops the posts from the sitemap and RSS feed.</li>
          <li><strong>A section off</strong> only hides that block on the home page. The full page, if it has one, stays reachable.</li>
          <li><strong>In navbar off</strong> keeps a page working at its address but hides it from the menu — useful for a page you link to yourself.</li>
          <li>The home page cannot be switched off. To take the whole site down temporarily, use maintenance mode under Settings.</li>
        </ul>
      </div>
    </>
  );
}
