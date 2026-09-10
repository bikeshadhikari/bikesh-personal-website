import Link from 'next/link';
import Shell from '@/components/admin/Shell';
import { ConfirmButton } from '@/components/admin/ShellClient';
import { messageAction } from '../actions';
import { sql } from '@/lib/db';
import { excerptOf, formatDate } from '@/lib/utils';
import type { Message } from '@/lib/types';
import Icon from '@/components/Icon';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Messages' };

export default async function MessagesPage({
  searchParams,
}: { searchParams: Promise<{ filter?: string }> }) {
  const { filter = 'all' } = await searchParams;

  const rows = filter === 'unread'
    ? await sql<Message[]>`SELECT * FROM messages WHERE is_read = FALSE ORDER BY id DESC LIMIT 100`
    : filter === 'starred'
      ? await sql<Message[]>`SELECT * FROM messages WHERE is_starred ORDER BY id DESC LIMIT 100`
      : await sql<Message[]>`SELECT * FROM messages ORDER BY id DESC LIMIT 100`;

  return (
    <Shell title="Messages" current="messages">
      <div className="page-head">
        <div>
          <h2>Messages</h2>
          <p className="muted">
            {rows.length} {rows.length === 1 ? 'message' : 'messages'}. Everything sent through the
            contact form arrives here.
          </p>
        </div>
        <div className="page-head-actions">
          <div className="filter-bar">
            <Link className={`filter-chip${filter === 'all' ? ' is-active' : ''}`} href="/admin/messages">All</Link>
            <Link className={`filter-chip${filter === 'unread' ? ' is-active' : ''}`} href="/admin/messages?filter=unread">Unread</Link>
            <Link className={`filter-chip${filter === 'starred' ? ' is-active' : ''}`} href="/admin/messages?filter=starred">Starred</Link>
          </div>
          <form action={messageAction} className="inline-form">
            <input type="hidden" name="op" value="read_all" />
            <button className="btn btn-ghost btn-sm" type="submit">Mark all read</button>
          </form>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="empty-panel">
          <p><strong>Inbox empty.</strong></p>
          <p className="muted">Messages from the contact form will show up here.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th /><th>From</th><th>Subject</th><th className="num">Received</th><th className="actions-col">Actions</th></tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id} className={m.is_read ? undefined : 'is-unread'}>
                  <td>
                    <form action={messageAction} className="inline-form">
                      <input type="hidden" name="id" value={m.id} />
                      <input type="hidden" name="op" value="star" />
                      <button className={`star-btn${m.is_starred ? ' is-on' : ''}`} type="submit" aria-label="Star this message">
                        <Icon name="star" className="icon icon-sm" />
                      </button>
                    </form>
                  </td>
                  <td>
                    <Link className="row-title" href={`/admin/messages/${m.id}`}>{m.name}</Link>
                    <br /><small className="muted">{m.email}</small>
                  </td>
                  <td>
                    <Link href={`/admin/messages/${m.id}`}>{m.subject || '(no subject)'}</Link>
                    <br /><small className="muted">{excerptOf(m.body, 12)}</small>
                  </td>
                  <td className="num">
                    {formatDate(m.created_at)}
                    <br /><small className="muted">{formatDate(m.created_at, { hour: 'numeric', minute: '2-digit' })}</small>
                  </td>
                  <td className="actions-col">
                    <div className="row-actions">
                      <Link className="btn btn-ghost btn-xs" href={`/admin/messages/${m.id}`}>Open</Link>
                      <form action={messageAction} className="inline-form">
                        <input type="hidden" name="id" value={m.id} />
                        <input type="hidden" name="op" value="delete" />
                        <ConfirmButton message="Delete this message permanently?">Delete</ConfirmButton>
                      </form>
                    </div>
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
