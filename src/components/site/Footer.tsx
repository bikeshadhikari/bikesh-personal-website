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

  const socials = settingBool(s, 'footer_show_social', true) ? socialLinks(s) : [];
  // The feed link is off unless it is asked for.
  const showRss = blogOn && settingBool(s, 'footer_show_rss', false);
  const showTopics = blogOn && settingBool(s, 'footer_show_topics', true);
  const categories = showTopics ? (await getCategories()).slice(0, 5) : [];

  // Each detail is shown only when it has a value and is switched on here.
  const email = settingBool(s, 'footer_show_email', true) ? setting(s, 'contact_email') : '';
  const phone = settingBool(s, 'footer_show_phone', true) ? setting(s, 'contact_phone') : '';
  const location = settingBool(s, 'footer_show_location', true) ? setting(s, 'contact_location') : '';
  const hours = settingBool(s, 'footer_show_hours', false) ? setting(s, 'contact_hours') : '';

  const showNewsletter = newsletterOn && settingBool(s, 'newsletter_enabled', true);
  const showLinks = settingBool(s, 'footer_show_links', true);
  const showContact = settingBool(s, 'footer_show_contact', true)
    && Boolean(email || phone || location || hours);
  const name = setting(s, 'full_name', setting(s, 'site_name'));

  // The copyright line is a template so it can be rewritten from the dashboard
  // without losing the year, which has to stay current.
  const year = String(new Date().getFullYear());
  const copyright = setting(s, 'footer_copyright')
    ? setting(s, 'footer_copyright').replace(/\{year\}/g, year).replace(/\{name\}/g, name)
    : `\u00a9 ${year} ${name}. All rights reserved.`;

  return (
    <>
      {showNewsletter && <Newsletter />}

      <footer className="site-footer">
        <div className="container footer-grid">
          <div className="footer-about">
            <span className="brand-mark" aria-hidden="true">{setting(s, 'full_name', 'B').charAt(0)}</span>
            <h3>{name}</h3>
            <p>{setting(s, 'footer_about') || setting(s, 'site_tagline')}</p>
            {(socials.length > 0 || showRss) && (
              <ul className="social-list">
                {socials.map((social) => (
                  <li key={social.key}>
                    <a href={social.url} target="_blank" rel="noopener noreferrer" aria-label={social.label}>
                      <Icon name={social.icon} />
                    </a>
                  </li>
                ))}
                {showRss && (
                  <li><a href="/feed.xml" aria-label="RSS feed"><Icon name="rss" /></a></li>
                )}
              </ul>
            )}
          </div>

          {showLinks && items.length > 0 && (
            <div className="footer-links">
              <h4>{setting(s, 'footer_links_title', 'Explore')}</h4>
              <ul>
                {items.map((item) => (
                  <li key={item.id}><Link href={menuHref(item)}>{item.label}</Link></li>
                ))}
              </ul>
            </div>
          )}

          {categories.length > 0 && (
            <div className="footer-links">
              <h4>{setting(s, 'footer_topics_title', 'Topics')}</h4>
              <ul>
                {categories.map((c) => (
                  <li key={c.id}><Link href={`/blog/category/${c.slug}`}>{c.name}</Link></li>
                ))}
              </ul>
            </div>
          )}

          {showContact && (
          <div className="footer-contact">
            <h4>{setting(s, 'footer_contact_title', 'Reach me')}</h4>
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
              {hours && (
                <li><Icon name="clock" className="icon icon-sm" /><span>{hours}</span></li>
              )}
            </ul>
          </div>
          )}
        </div>

        <div className="container footer-bottom">
          <p>{copyright}</p>
          {setting(s, 'footer_note') && (
            <p className="footer-note">{setting(s, 'footer_note')}</p>
          )}
        </div>
      </footer>
    </>
  );
}
