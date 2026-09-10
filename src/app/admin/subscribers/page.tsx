import Shell from '@/components/admin/Shell';
import { ConfirmButton } from '@/components/admin/ShellClient';
import { subscriberAction } from '../actions';
import { sql } from '@/lib/db';
import { formatDate } from '@/lib/utils';
import type { Subscriber } from '@/lib/types';
import Icon from '@/components/Icon';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Subscribers' };

export default async function SubscribersPage() {
  const rows = await sql<Subscriber[]>`SELECT * FROM subscribers ORDER BY id DESC LIMIT 500`;

  return (
    <Shell title="Subscribers" current="subscribers">
      <div className="page-head">
        <div>
          <h2>Newsletter subscribers</h2>
          <p className="muted">
            {rows.length} {rows.length === 1 ? 'address' : 'addresses'} collected from the footer signup.
          </p>
        </div>
        {rows.length > 0 && (
          <a className="btn btn-ghost btn-sm" href="/admin/subscribers/export" download>
            <Icon name="download" className="icon icon-sm" /> Export CSV
          </a>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="empty-panel">
          <p><strong>No subscribers yet.</strong></p>
          <p className="muted">The signup form sits above the footer. It can be switched off under Settings.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Email</th><th className="num">Subscribed</th><th className="actions-col">Actions</th></tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
                  <td><a href={`mailto:${s.email}`}>{s.email}</a></td>
                  <td className="num">{formatDate(s.created_at)}</td>
                  <td className="actions-col">
                    <form action={subscriberAction} className="inline-form">
                      <input type="hidden" name="id" value={s.id} />
                      <ConfirmButton message="Remove this subscriber?">Remove</ConfirmButton>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Shell>
  );
}
