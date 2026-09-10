import Link from 'next/link';
import { sql } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { getSettings, setting } from '@/lib/settings';
import { logoutAction } from '@/app/admin/actions';
import { SidebarControls, AdminThemeToggle } from './ShellClient';
import Icon from '../Icon';

type NavEntry = [slug: string, label: string, icon: string, badge?: number];

/** Sidebar, top bar and page frame for every dashboard screen. */
export default async function Shell({
  title, children, current,
}: { title: string; children: React.ReactNode; current: string }) {
  const [user, s, counts] = await Promise.all([
    currentUser(),
    getSettings(),
    sql<{ unread: string; pending: string }[]>`
      SELECT
        (SELECT COUNT(*) FROM messages WHERE is_read = FALSE)::text AS unread,
        (SELECT COUNT(*) FROM comments WHERE status = 'pending')::text AS pending`,
  ]);

  const unread = Number(counts[0]?.unread ?? 0);
  const pending = Number(counts[0]?.pending ?? 0);

  const isAdmin = user?.role === 'admin';

  const groups: [string, NavEntry[]][] = [
    ['Overview', [
      ['', 'Dashboard', 'layers'],
      ...(isAdmin ? ([['menus', 'Menus & sections', 'check']] as NavEntry[]) : []),
    ]],
    ['Blog', [
      ['posts', 'Blog posts', 'quote'],
      ['categories', 'Categories', 'tag'],
      ['comments', 'Comments', 'users', pending],
    ]],
    ['Profile', [
      ...(isAdmin ? ([['profile', 'Profile & bio', 'users']] as NavEntry[]) : []),
      ['experiences', 'Experience pipeline', 'briefcase'],
      ['skills', 'Skills', 'sparkle'],
      ['certifications', 'Certifications', 'award'],
    ]],
    ['Content', [
      ['services', 'Services', 'layers'],
      ['projects', 'Projects', 'code'],
      ['testimonials', 'Testimonials', 'quote'],
      ['highlights', 'Key numbers', 'star'],
    ]],
    ['Inbox', [
      ['messages', 'Messages', 'mail', unread],
      ['subscribers', 'Subscribers', 'users'],
    ]],
    ['System', [
      ...(isAdmin ? ([['settings', 'Settings', 'compass']] as NavEntry[]) : []),
      ['media', 'Media library', 'eye'],
      ...(isAdmin ? ([['users', 'Users', 'users']] as NavEntry[]) : []),
      ['account', 'My account', 'check'],
    ]],
  ];

  return (
    <div className="admin">
      <a className="skip-link" href="#adminMain">Skip to content</a>

      <aside className="admin-sidebar" id="adminSidebar">
        <div className="sidebar-head">
          <Link className="brand" href="/admin">
            <span className="brand-mark">{setting(s, 'full_name', 'B').charAt(0)}</span>
            <span>
              <strong>{setting(s, 'site_short_name', 'Dashboard')}</strong>
              <small>Control panel</small>
            </span>
          </Link>
        </div>

        <nav className="sidebar-nav" aria-label="Dashboard sections">
          {groups.map(([group, items]) => (
            <div key={group}>
              <p className="nav-group">{group}</p>
              <ul>
                {items.map(([slug, label, icon, badge]) => {
                  const active = current === slug;
                  return (
                    <li key={slug || 'dashboard'}>
                      <Link
                        href={`/admin${slug ? `/${slug}` : ''}`}
                        className={active ? 'is-active' : undefined}
                        aria-current={active ? 'page' : undefined}
                      >
                        <Icon name={icon} className="icon icon-sm" />
                        <span>{label}</span>
                        {badge ? <em className="nav-badge">{badge}</em> : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="sidebar-foot">
          <a className="btn btn-ghost btn-sm" href="/" target="_blank" rel="noopener noreferrer">
            <Icon name="external" className="icon icon-sm" /> View site
          </a>
        </div>
      </aside>

      <div className="admin-shell">
        <header className="admin-topbar">
          <SidebarControls />
          <h1 className="topbar-title">{title}</h1>
          <div className="topbar-actions">
            <AdminThemeToggle />
            <div className="user-chip">
              <span className="avatar-initial">{(user?.name ?? 'A').charAt(0)}</span>
              <span className="user-meta">
                <strong>{user?.name}</strong>
                <small>{user?.role}</small>
              </span>
            </div>
            <form action={logoutAction}>
              <button className="btn btn-ghost btn-sm" type="submit">Sign out</button>
            </form>
          </div>
        </header>

        <main className="admin-main" id="adminMain">{children}</main>

        <footer className="admin-foot">
          <p>&copy; {new Date().getFullYear()} {setting(s, 'full_name')} · Dashboard</p>
        </footer>
      </div>
    </div>
  );
}
