import Link from 'next/link';
import { notFound } from 'next/navigation';
import Shell from '@/components/admin/Shell';
import { ConfirmButton } from '@/components/admin/ShellClient';
import { messageAction } from '../../actions';
import { sql } from '@/lib/db';
import { formatDate, telHref } from '@/lib/utils';
import type { Message } from '@/lib/types';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Message' };

export default async function MessagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await sql<Message[]>`SELECT * FROM messages WHERE id = ${Number(id)}`;
  const message = rows[0];
  if (!message) notFound();

  // Opening a message marks it read.
  if (!message.is_read) {
    await sql`UPDATE messages SET is_read = TRUE WHERE id = ${message.id}`;
  }

  const replyHref = `mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject || 'Your message'}`)}`;

  return (
    <Shell title={message.subject || 'Message'} current="messages">
      <div className="page-head">
        <div>
          <h2>{message.subject || 'Message'}</h2>
          <p className="muted"><Link href="/admin/messages">← Back to the inbox</Link></p>
        </div>
        <div className="page-head-actions">
          <a className="btn btn-primary btn-sm" href={replyHref}>Reply by email</a>
          <form action={messageAction} className="inline-form">
            <input type="hidden" name="id" value={message.id} />
            <input type="hidden" name="op" value="unread" />
            <button className="btn btn-ghost btn-sm" type="submit">Mark unread</button>
          </form>
        </div>
      </div>

      <article className="form-panel message-view">
        <dl className="message-meta">
          <div><dt>From</dt><dd>{message.name}</dd></div>
          <div><dt>Email</dt><dd><a href={`mailto:${message.email}`}>{message.email}</a></dd></div>
          {message.phone && (
            <div><dt>Phone</dt><dd><a href={telHref(message.phone)}>{message.phone}</a></dd></div>
          )}
          <div>
            <dt>Received</dt>
            <dd>{formatDate(message.created_at, {
              day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit',
            })}</dd>
          </div>
          {message.ip && <div><dt>IP address</dt><dd><code>{message.ip}</code></dd></div>}
        </dl>

        <div className="message-body">
          {message.body.split('\n').map((line, i) => <p key={i}>{line}</p>)}
        </div>

        <div className="form-actions">
          <a className="btn btn-primary" href={replyHref}>Reply</a>
          <form action={messageAction} className="inline-form">
            <input type="hidden" name="id" value={message.id} />
            <input type="hidden" name="op" value="delete" />
            <ConfirmButton className="btn btn-danger" message="Delete this message permanently?">
              Delete
            </ConfirmButton>
          </form>
        </div>
      </article>
    </Shell>
  );
}
