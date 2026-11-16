import Link from 'next/link';
import Shell from '@/components/admin/Shell';
import Icon from '@/components/Icon';
import { sql } from '@/lib/db';
import { withSchema } from '@/lib/schema';
import { currentUser } from '@/lib/auth';
import { menuEnabled } from '@/lib/menu';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Simplified Tech' };

type Counts = { published: number; drafts: number; categories: number; blocks: number; views: number; copies: number };
type Cat = { id: number; name: string; name_ne: string; slug: string; enabled: boolean; posts: number };
type Post = {
  id: number; title: string; slug: string; status: string; views: number; copies: number;
  category: string | null; blocks: number; published_at: string | null;
};

/**
 * The home screen for the /tech microsite: what is there, and one click to
 * add more. Everything for Simplified Tech is reachable from here.
 */
export default async function TechOverviewPage() {
  const user = await currentUser();
  const isAdmin = user?.role === 'admin';

  const [counts, cats, posts, live] = await Promise.all([
    withSchema(() => sql<Counts[]>`
      SELECT
        (SELECT COUNT(*)::int FROM tech_links WHERE status = 'published') AS published,
        (SELECT COUNT(*)::int FROM tech_links WHERE status <> 'published') AS drafts,
        (SELECT COUNT(*)::int FROM tech_collections) AS categories,
        (SELECT COUNT(*)::int FROM tech_blocks) AS blocks,
        (SELECT COALESCE(SUM(views), 0)::int FROM tech_links) AS views,
        (SELECT COALESCE(SUM(copies), 0)::int FROM tech_links) AS copies`).catch(() => []),
    withSchema(() => sql<Cat[]>`
      SELECT c.id, c.name, c.name_ne, c.slug, c.enabled,
             (SELECT COUNT(*)::int FROM tech_links l WHERE l.collection_id = c.id) AS posts
      FROM tech_collections c ORDER BY c.sort_order ASC, c.id ASC`).catch(() => []),
    withSchema(() => sql<Post[]>`
      SELECT l.id, l.title, l.slug, l.status, l.views, l.copies, l.published_at, c.name AS category,
             (SELECT COUNT(*)::int FROM tech_blocks b WHERE b.link_id = l.id) AS blocks
      FROM tech_links l LEFT JOIN tech_collections c ON c.id = l.collection_id
      ORDER BY l.updated_at DESC, l.id DESC LIMIT 10`).catch(() => []),
    menuEnabled('tech'),
  ]);

  const c = counts[0] ?? { published: 0, drafts: 0, categories: 0, blocks: 0, views: 0, copies: 0 };
  const stats = [
    { label: 'Published posts', value: c.published, icon: 'quote', href: '/admin/tech_links' },
    { label: 'Drafts', value: c.drafts, icon: 'clock', href: '/admin/tech_links' },
    { label: 'Categories', value: c.categories, icon: 'tag', href: '/admin/tech_collections' },
    { label: 'Copy blocks', value: c.blocks, icon: 'code', href: '/admin/tech_blocks' },
    { label: 'Views', value: c.views, icon: 'eye', href: '/admin/tech_links' },
    { label: 'Copies', value: c.copies, icon: 'check', href: '/admin/tech_links' },
  ];

  return (
    <Shell title="Simplified Tech by Bikesh" current="tech">
      <div className="welcome-card">
        <div>
          <h2>Simplified Tech by Bikesh</h2>
          <p>
            Your separate site at <a href="/tech" target="_blank" rel="noopener noreferrer">/tech</a>.
            Make categories (AI Prompts, Software Installation Guides, New Tools…), write posts inside them,
            and add copy blocks for anything readers should copy.
            {!live && <> <strong>It is switched off</strong> — turn it on under <Link href="/admin/menus">Menus &amp; sections</Link>.</>}
          </p>
        </div>
        <div className="welcome-actions">
          <Link className="btn btn-primary btn-sm" href="/admin/tech_links/new">+ New post</Link>
          <Link className="btn btn-ghost btn-sm" href="/admin/tech_collections/new">+ New category</Link>
          {isAdmin && <Link className="btn btn-ghost btn-sm" href="/admin/tech-settings">Site settings</Link>}
          <a className="btn btn-ghost btn-sm" href="/tech" target="_blank" rel="noopener noreferrer">View site</a>
        </div>
      </div>

      <div className="stat-grid">
        {stats.map((s) => (
          <Link className="stat-card" href={s.href} key={s.label}>
            <span className="stat-icon"><Icon name={s.icon} /></span>
            <strong>{s.value.toLocaleString()}</strong>
            <span className="stat-label">{s.label}</span>
          </Link>
        ))}
      </div>

      <div className="panel-grid">
        <section className="panel">
          <div className="panel-head">
            <h3>Categories</h3>
            <Link href="/admin/tech_collections/new">+ New category</Link>
          </div>
          {cats.length > 0 ? (
            <table className="data-table compact">
              <tbody>
                {cats.map((cat) => (
                  <tr key={cat.id}>
                    <td>
                      <Link href={`/admin/tech_collections/${cat.id}`}><strong>{cat.name}</strong></Link>
                      {cat.name_ne && <><br /><small className="muted">{cat.name_ne}</small></>}
                      {!cat.enabled && <><br /><small className="muted">hidden</small></>}
                    </td>
                    <td className="num nowrap">{cat.posts} {cat.posts === 1 ? 'post' : 'posts'}</td>
                    <td className="num">
                      <Link className="btn btn-ghost btn-sm" href={`/admin/tech_links/new?collection_id=${cat.id}`}>+ Post</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">
              No categories yet. <Link href="/admin/tech_collections/new">Make the first one</Link> — for example
              AI Prompts, Software Installation Guides or New Tools.
            </p>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h3>Recent posts</h3>
            <Link href="/admin/tech_links">All posts</Link>
          </div>
          {posts.length > 0 ? (
            <table className="data-table compact">
              <tbody>
                {posts.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link href={`/admin/tech_links/${p.id}`}>{p.title}</Link>
                      <br />
                      <small className="muted">
                        {p.category ?? 'No category'} · {p.blocks} copy {p.blocks === 1 ? 'block' : 'blocks'}
                        {p.published_at && <> · {formatDate(p.published_at, { day: 'numeric', month: 'short' })}</>}
                      </small>
                    </td>
                    <td><span className={`status status-${p.status}`}>{p.status}</span></td>
                    <td className="num nowrap">{p.views} views<br /><small className="muted">{p.copies} copies</small></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">No posts yet. <Link href="/admin/tech_links/new">Write the first one.</Link></p>
          )}
        </section>

        <section className="panel">
          <div className="panel-head"><h3>How to add a post</h3></div>
          <ol className="tech-steps">
            <li><strong>Category.</strong> Make one under <Link href="/admin/tech_collections">Categories</Link>, or use an existing one.</li>
            <li><strong>Post.</strong> Press <em>+ Post</em> beside a category. Give it a title, a short description and a cover picture — in English, and in नेपाली if you like.</li>
            <li><strong>Copy blocks.</strong> Save, then press <em>+ Add a copy block</em> at the bottom of the post for each prompt, command or text to copy.</li>
            <li><strong>Publish.</strong> Leave the status on Published. The newest post becomes the big card at the top of the site.</li>
          </ol>
        </section>
      </div>
    </Shell>
  );
}
