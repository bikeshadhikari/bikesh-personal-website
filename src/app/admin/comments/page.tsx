import Link from 'next/link';
import Shell from '@/components/admin/Shell';
import { ConfirmButton } from '@/components/admin/ShellClient';
import { commentModerationAction } from '../actions';
import { sql } from '@/lib/db';
import { formatDate } from '@/lib/utils';
import type { Comment } from '@/lib/types';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Comments' };

export default async function CommentsPage({
  searchParams,
}: { searchParams: Promise<{ filter?: string }> }) {
  const { filter = 'pending' } = await searchParams;
  const valid = ['pending', 'approved', 'spam'].includes(filter);

  const [rows, counts] = await Promise.all([
    valid
      ? sql<Comment[]>`
          SELECT c.*, p.title AS post_title, p.slug AS post_slug
          FROM comments c LEFT JOIN posts p ON p.id = c.post_id
          WHERE c.status = ${filter} ORDER BY c.id DESC LIMIT 100`
      : sql<Comment[]>`
          SELECT c.*, p.title AS post_title, p.slug AS post_slug
          FROM comments c LEFT JOIN posts p ON p.id = c.post_id
          ORDER BY c.id DESC LIMIT 100`,
    sql<{ pending: string; approved: string; spam: string }[]>`SELECT
      (SELECT COUNT(*) FROM comments WHERE status = 'pending')::text AS pending,
      (SELECT COUNT(*) FROM comments WHERE status = 'approved')::text AS approved,
      (SELECT COUNT(*) FROM comments WHERE status = 'spam')::text AS spam`,
  ]);

  const c = counts[0];
  const tabs: [string, string, string][] = [
    ['pending', 'Waiting', c.pending],
    ['approved', 'Published', c.approved],
    ['spam', 'Spam', c.spam],
    ['all', 'All', ''],
  ];

  return (
    <Shell title="Comments" current="comments">
      <div className="page-head">
        <div>
          <h2>Comments</h2>
          <p className="muted">New comments wait here until you approve them, if moderation is on under Settings.</p>
        </div>
        <div className="filter-bar">
          {tabs.map(([key, label, count]) => (
            <Link
              key={key}
              className={`filter-chip${filter === key ? ' is-active' : ''}`}
              href={`/admin/comments?filter=${key}`}
            >
              {label}{count && <em>{count}</em>}
            </Link>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="empty-panel">
          <p><strong>Nothing here.</strong></p>
          <p className="muted">No comments with this status.</p>
        </div>
      ) : (
        <ul className="comment-admin-list">
          {rows.map((comment) => (
            <li className="comment-admin" key={comment.id}>
              <div className="comment-admin-head">
                <span className="avatar-initial">{comment.name.charAt(0)}</span>
                <div>
                  <strong>{comment.name}</strong>
                  {comment.email && <a href={`mailto:${comment.email}`}>{comment.email}</a>}
                  <small className="muted">
                    on{' '}
                    {comment.post_slug
                      ? <a href={`/blog/${comment.post_slug}`} target="_blank" rel="noopener noreferrer">{comment.post_title}</a>
                      : 'a deleted post'}
                    {' · '}
                    {formatDate(comment.created_at, {
                      day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
                    })}
                  </small>
                </div>
                <span className={`status status-${comment.status}`}>{comment.status}</span>
              </div>

              <p className="comment-admin-body">{comment.body}</p>

              <div className="row-actions">
                {comment.status !== 'approved' && (
                  <form action={commentModerationAction} className="inline-form">
                    <input type="hidden" name="id" value={comment.id} />
                    <input type="hidden" name="op" value="approve" />
                    <button className="btn btn-primary btn-xs" type="submit">Publish</button>
                  </form>
                )}
                {comment.status !== 'spam' && (
                  <form action={commentModerationAction} className="inline-form">
                    <input type="hidden" name="id" value={comment.id} />
                    <input type="hidden" name="op" value="spam" />
                    <button className="btn btn-ghost btn-xs" type="submit">Spam</button>
                  </form>
                )}
                <form action={commentModerationAction} className="inline-form">
                  <input type="hidden" name="id" value={comment.id} />
                  <input type="hidden" name="op" value="delete" />
                  <ConfirmButton message="Delete this comment permanently?">Delete</ConfirmButton>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Shell>
  );
}
