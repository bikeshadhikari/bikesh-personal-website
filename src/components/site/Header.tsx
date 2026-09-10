import Link from 'next/link';
import { navItems, menuHref, menuEnabled } from '@/lib/menu';
import { getSettings, setting, settingBool } from '@/lib/settings';
import { ThemeToggle, NavToggle, ScrollProgress } from './HeaderClient';
import Icon from '../Icon';

export default async function Header({ current = 'home' }: { current?: string }) {
  const [items, s, blogOn, contactOn] = await Promise.all([
    navItems(),
    getSettings(),
    menuEnabled('blog'),
    menuEnabled('contact'),
  ]);

  const logoImage = setting(s, 'logo_image');
  const logoText = setting(s, 'logo_text', setting(s, 'site_name', 'Home'));
  const initial = setting(s, 'full_name', 'B').charAt(0);

  return (
    <header className="site-header" id="siteHeader">
      <div className="container header-inner">
        <Link className="brand" href="/" aria-label={`${setting(s, 'site_name', 'Home')} — home`}>
          {logoImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoImage} alt={setting(s, 'site_name')} className="brand-img" />
          ) : (
            <>
              <span className="brand-mark" aria-hidden="true">{initial}</span>
              <span className="brand-text">{logoText}</span>
            </>
          )}
        </Link>

        <nav className="site-nav" id="siteNav" aria-label="Main">
          <ul>
            {items.map((item) => {
              const active = current === item.slug;
              return (
                <li key={item.id}>
                  <Link
                    href={menuHref(item)}
                    className={active ? 'active' : undefined}
                    aria-current={active ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          {contactOn && (
            <div className="nav-cta">
              <Link className="btn btn-primary btn-sm" href="/contact">Get in touch</Link>
            </div>
          )}
        </nav>

        <div className="header-actions">
          {blogOn && (
            <form className="header-search" action="/search" method="get" role="search">
              <label className="visually-hidden" htmlFor="siteSearch">Search articles</label>
              <Icon name="search" className="icon icon-sm" />
              <input type="search" id="siteSearch" name="q" placeholder="Search" />
            </form>
          )}
          {settingBool(s, 'show_mode_toggle', true) && <ThemeToggle />}
          <NavToggle />
        </div>
      </div>
      <ScrollProgress />
    </header>
  );
}
