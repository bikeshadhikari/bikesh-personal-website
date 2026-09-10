import { getSettings, setting, settingBool, socialLinks } from '@/lib/settings';
import { telHref } from '@/lib/utils';
import Icon from '../Icon';

export default async function ContactDetails({ showSocial = false }: { showSocial?: boolean }) {
  const s = await getSettings();
  // Each line needs both a value and its switch under Settings → Contact page.
  const email = settingBool(s, 'contact_show_email', true) ? setting(s, 'contact_email') : '';
  const phone = settingBool(s, 'contact_show_phone', true) ? setting(s, 'contact_phone') : '';
  const location = settingBool(s, 'contact_show_location', true) ? setting(s, 'contact_location') : '';
  const hours = settingBool(s, 'contact_show_hours', true) ? setting(s, 'contact_hours') : '';
  const socials = settingBool(s, 'contact_show_social', true) ? socialLinks(s) : [];

  return (
    <aside className="contact-aside">
      <ul className="contact-list">
        {email && (
          <li>
            <span className="contact-icon"><Icon name="mail" /></span>
            <div><strong>Email</strong><a href={`mailto:${email}`}>{email}</a></div>
          </li>
        )}
        {phone && (
          <li>
            <span className="contact-icon"><Icon name="phone" /></span>
            <div><strong>Phone</strong><a href={telHref(phone)}>{phone}</a></div>
          </li>
        )}
        {location && (
          <li>
            <span className="contact-icon"><Icon name="pin" /></span>
            <div><strong>Location</strong><span>{location}</span></div>
          </li>
        )}
        {hours && (
          <li>
            <span className="contact-icon"><Icon name="clock" /></span>
            <div><strong>Usual hours</strong><span>{hours}</span></div>
          </li>
        )}
      </ul>

      {showSocial && socials.length > 0 && (
        <div className="contact-social">
          <h3>Elsewhere</h3>
          <ul className="social-list">
            {socials.map((social) => (
              <li key={social.key}>
                <a href={social.url} target="_blank" rel="noopener noreferrer" aria-label={social.label}>
                  <Icon name={social.icon} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
