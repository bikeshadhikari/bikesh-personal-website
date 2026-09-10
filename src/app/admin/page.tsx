import Link from 'next/link';
import { sql } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import Shell from '@/components/admin/Shell';
import Icon from '@/components/Icon';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type Counts = {
  published: string; drafts: string; unread: string; pending: string;
  projects: string; subscribers: string;
};

export default async function DashboardPage() {
  const user = await currentUser();

  const [counts, recentPosts, recentMessages, popular, disabled] = await Promise.all([
    sql<Counts[]>`SELECT
      (SELECT COUNT(*) FROM posts WHERE status = 'published')::text AS published,
      (SELECT COUNT(*) FROM posts WHERE status = 'draft')::text AS drafts,
      (SELECT COUNT(*) FROM messages WHERE is_read = FALSE)::text AS unread,
      (SELECT COUNT(*) FROM comments WHERE status = 'pending')::text AS pending,
      (SELECT COUNT(*) FROM projects)::text AS projects,
      (SELECT COUNT(*) FROM subscribers WHERE is_active)::text AS subscribers`,
    sql<{ id: number; title: string; status: string; views: number }[]>`
      SELECT id, title, status, views FROM posts ORDER BY id DESC LIMIT 5`,
    sql<{ id: number; name: string; subject: string; created_at: string; is_read: boolean }[]>`
      SELECT id, name, subject, created_at, is_read FROM messages ORDER BY id DESC LIMIT 5`,
    sql<{ id: number; title: string; views: number }[]>`
      SELECT id, title, views FROM posts WHERE status = 'published' AND views > 0
      ORDER BY views DESC LIMIT 5`,
    sql<{ slug: string; label: string; kind: string }[]>`
      SELECT slug, label, kind FROM menus WHERE enabled = FALSE ORDER BY sort_order`,
  ]);

  const c = counts[0];
  const stats = [
    { label: 'Published posts', value: c.published, icon: 'quote', link: 'posts' },
    { label: 'Drafts', value: c.drafts, icon: 'code', link: 'posts' },
    { label: 'Unread messages', value: c.unread, icon: 'mail', link: 'messages' },
    { label: 'Comments waiting', value: c.pending, icon: 'users', link: 'comments' },
    { label: 'Projects', value: c.projects, icon: 'layers', link: 'projects' },
    { label: 'Subscribers', value: c.subscribers, icon: 'star', link: 'subscribers' },
  ];

  return (
    <Shell title="Dashboard" current="">
      <div className="welcome-card">
        <div>
          <h2>Welcome back, {(user?.name ?? '').split(' ')[0]}.</h2>
          <p>
            {user?.role === 'admin' ? (
              <>
                Everything on the public site is controlled from here. Start with{' '}
                <Link href="/admin/menus">Menus &amp; sections</Link> to switch parts of the site on or off.
              </>
            ) : (
              'Write and manage content here. Site-wide settings are handled by an administrator.'
            )}
          </p>
        </div>
        <div className="welcome-actions">
          <Link className="btn btn-primary btn-sm" href="/admin/posts/new">Write a post</Link>
          <a className="btn btn-ghost btn-sm" href="/" target="_blank" rel="noopener noreferrer">View site</a>
        </div>
      </div>

      <div className="stat-grid">
        {stats.map((stat) => (
          <Link className="stat-card" href={`/admin/${stat.link}`} key={stat.label}>
            <span className="stat-icon"><Icon name={stat.icon} /></span>
            <strong>{stat.value}</strong>
            <span className="stat-label">{stat.label}</span>
          </Link>
        ))}
      </div>

      {disabled.length > 0 && (
        <div className="panel panel-notice">
          <h3><Icon name="eye" className="icon icon-sm" /> Currently hidden from visitors</h3>
          <p>These pages and sections are switched off. Turn any of them back on under Menus &amp; sections.</p>
          <ul className="chip-row">
            {disabled.map((d) => (
              <li key={d.slug}><span className="chip chip-soft">{d.label} <small>{d.kind}</small></span></li>
            ))}
          </ul>
        </div>
      )}

      <div className="panel-grid">
        <section className="panel">
          <div className="panel-head"><h3>Recent posts</h3><Link href="/admin/posts">All posts</Link></div>
          {recentPosts.length > 0 ? (
            <table className="data-table compact">
              <tbody>
                {recentPosts.map((p) => (
                  <tr key={p.id}>
                    <td><Link href={`/admin/posts/${p.id}`}>{p.title}</Link></td>
                    <td><span className={`status status-${p.status}`}>{p.status}</span></td>
                    <td className="num">{p.views} views</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">No posts yet. <Link href="/admin/posts/new">Write the first one.</Link></p>
          )}
        </section>

        <section className="panel">
          <div className="panel-head"><h3>Latest messages</h3><Link href="/admin/messages">Inbox</Link></div>
          {recentMessages.length > 0 ? (
            <table className="data-table compact">
              <tbody>
                {recentMessages.map((m) => (
                  <tr key={m.id} className={m.is_read ? undefined : 'is-unread'}>
                    <td>
                      <Link href={`/admin/messages/${m.id}`}>{m.name}</Link>
                      <br /><small className="muted">{m.subject || 'No subject'}</small>
                    </td>
                    <td className="num">{formatDate(m.created_at, { day: 'numeric', month: 'short' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">No messages yet.</p>
          )}
        </section>

        <section className="panel">
          <div className="panel-head"><h3>Most read</h3></div>
          {popular.length > 0 ? (
            <ul className="rank-list">
              {popular.map((p, i) => (
                <li key={p.id}>
                  <span className="rank">{i + 1}</span>
                  <Link href={`/admin/posts/${p.id}`}>{p.title}</Link>
                  <em>{p.views}</em>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">View counts appear once people start reading.</p>
          )}
        </section>

        <section className="panel">
          <div className="panel-head"><h3>Quick actions</h3></div>
          <ul className="quick-links">
            <li><Link href="/admin/posts/new"><Icon name="quote" className="icon icon-sm" /> Write a blog post</Link></li>
            <li><Link href="/admin/experiences/new"><Icon name="briefcase" className="icon icon-sm" /> Add an experience entry</Link></li>
            <li><Link href="/admin/projects/new"><Icon name="code" className="icon icon-sm" /> Add a project</Link></li>
            {user?.role === 'admin' && (
              <>
                <li><Link href="/admin/profile"><Icon name="users" className="icon icon-sm" /> Edit profile and photo</Link></li>
                <li><Link href="/admin/settings"><Icon name="compass" className="icon icon-sm" /> Site settings and favicon</Link></li>
              </>
            )}
          </ul>
        </section>
      </div>
    </Shell>
  );
}
