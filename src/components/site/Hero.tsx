import Link from 'next/link';
import { getSettings, setting, socialLinks } from '@/lib/settings';
import { menuEnabled } from '@/lib/menu';
import { getHighlights } from '@/lib/content';
import { lines } from '@/lib/utils';
import RoleRotator from './RoleRotator';
import Icon from '../Icon';

export default async function Hero() {
  const [s, projectsOn, contactOn, highlights] = await Promise.all([
    getSettings(), menuEnabled('projects'), menuEnabled('contact'), getHighlights(),
  ]);

  const roles = lines(setting(s, 'rotating_roles'));
  const photo = setting(s, 'photo');
  const cv = setting(s, 'cv_file');
  const availability = setting(s, 'availability');
  const native = setting(s, 'name_native');
  const socials = socialLinks(s);
  const badge = highlights[0];

  return (
    <section className="hero" id="hero">
      <div className="hero-glow" aria-hidden="true" />
      <div className="container hero-inner">
        <div className="hero-copy">
          {availability && (
            <p className="availability"><span className="pulse" aria-hidden="true" />{availability}</p>
          )}

          <h1 className="hero-name">
            {setting(s, 'full_name', 'Your Name')}
            {native && <span className="hero-native" lang="ne">{native}</span>}
          </h1>

          {roles.length > 0 && (
            <p className="hero-roles">
              <span className="hero-roles-static">I am an</span> <RoleRotator roles={roles} />
            </p>
          )}

          <p className="hero-intro">{setting(s, 'hero_intro')}</p>

          <div className="hero-actions">
            {contactOn && (
              <Link className="btn btn-primary" href="/contact">
                Work with me <Icon name="arrow-right" className="icon icon-sm" />
              </Link>
            )}
            {projectsOn && <Link className="btn btn-ghost" href="/projects">See the work</Link>}
            {cv && (
              <a className="btn btn-link" href={cv} download>
                <Icon name="download" className="icon icon-sm" /> Download CV
              </a>
            )}
          </div>

          {socials.length > 0 && (
            <ul className="hero-social">
              {socials.map((social) => (
                <li key={social.key}>
                  <a href={social.url} target="_blank" rel="noopener noreferrer" aria-label={social.label}>
                    <Icon name={social.icon} />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="hero-media">
          {/* On a narrow screen the picture comes first, so the headline sits
              above it and says what the page is about before anything else. */}
          {setting(s, 'headline') && (
            <p className="hero-tagline">{setting(s, 'headline')}</p>
          )}
          <div className={`hero-photo${photo ? '' : ' is-placeholder'}`}>
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt={setting(s, 'photo_alt', setting(s, 'full_name'))} width={440} height={520} />
            ) : (
              <>
                <span className="photo-initial" aria-hidden="true">{setting(s, 'full_name', 'B').charAt(0)}</span>
                <p className="photo-hint">Upload your photo in the dashboard under <strong>Profile</strong>.</p>
              </>
            )}
          </div>
          {badge && (
            <div className="hero-badge">
              <strong>{badge.value}{badge.suffix}</strong>
              <span>{badge.label}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
