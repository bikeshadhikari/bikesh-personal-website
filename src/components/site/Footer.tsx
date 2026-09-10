import Link from 'next/link';
import { getSettings, setting, settingBool, socialLinks } from '@/lib/settings';
import { navItems, menuHref, menuEnabled } from '@/lib/menu';
import { getCategories } from '@/lib/content';
import { telHref } from '@/lib/utils';
import Newsletter from './Newsletter';
import Icon from '../Icon';

export default async function Footer() {
  const [s, items, blogOn, newsletterOn] = await Promise.all([
    getSettings(),
    navItems(),
    menuEnabled('blog'),
    menuEnabled('newsletter'),
  ]);

  const socials = socialLinks(s);
  const categories = blogOn ? (await getCategories()).slice(0, 5) : [];
  const email = setting(s, 'contact_email');
  const phone = setting(s, 'contact_phone');
  const location = setting(s, 'contact_location');
  const showNewsletter = newsletterOn && settingBool(s, 'newsletter_enabled', true);

  return (
    <>
      {showNewsletter && <Newsletter />}

      <footer className="site-footer">
        <div className="container footer-grid">
          <div className="footer-about">
            <span className="brand-mark" aria-hidden="true">{setting(s, 'full_name', 'B').charAt(0)}</span>
            <h3>{setting(s, 'full_name', setting(s, 'site_name'))}</h3>
            <p>{setting(s, 'site_tagline')}</p>
            {(socials.length > 0 || blogOn) && (
              <ul className="social-list">
                {socials.map((social) => (
                  <li key={social.key}>
                    <a href={social.url} target="_blank" rel="noopener noreferrer" aria-label={social.label}>
                      <Icon name={social.icon} />
                    </a>
                  </li>
                ))}
                {blogOn && (
                  <li><a href="/feed.xml" aria-label="RSS feed"><Icon name="rss" /></a></li>
                )}
              </ul>
            )}
          </div>

          <div className="footer-links">
            <h4>Explore</h4>
            <ul>
              {items.map((item) => (
                <li key={item.id}><Link href={menuHref(item)}>{item.label}</Link></li>
              ))}
            </ul>
          </div>

          {categories.length > 0 && (
            <div className="footer-links">
              <h4>Topics</h4>
              <ul>
                {categories.map((c) => (
                  <li key={c.id}><Link href={`/blog/category/${c.slug}`}>{c.name}</Link></li>
                ))}
              </ul>
            </div>
          )}

          <div className="footer-contact">
            <h4>Reach me</h4>
            <ul>
              {email && (
                <li><Icon name="mail" className="icon icon-sm" /><a href={`mailto:${email}`}>{email}</a></li>
              )}
              {phone && (
                <li><Icon name="phone" className="icon icon-sm" /><a href={telHref(phone)}>{phone}</a></li>
              )}
              {location && (
                <li><Icon name="pin" className="icon icon-sm" /><span>{location}</span></li>
              )}
            </ul>
          </div>
        </div>

        <div className="container footer-bottom">
          <p>&copy; {new Date().getFullYear()} {setting(s, 'full_name', setting(s, 'site_name'))}. All rights reserved.</p>
          <p className="footer-note">{setting(s, 'footer_note')}</p>
        </div>
      </footer>
    </>
  );
}
