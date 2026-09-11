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
  const floatStat = highlights[1];

  return (
    <section className="hero" id="hero">
      <div className="hero-glow" aria-hidden="true" />
      <div className="container hero-inner">
        <div className="hero-copy">
          <p className="hero-hello">Hello, I&rsquo;m</p>

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

          {availability && (
            <p className="availability"><span className="pulse" aria-hidden="true" />{availability}</p>
          )}

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
          {/* The picture and everything floating around it share one frame,
              so the badge is placed against the photo rather than against the
              column, which on a phone also holds the headline above it. */}
          <div className="hero-frame">
          {/* Glass shapes that sit around the picture, the way a frosted
              interface floats its pieces over the background. */}
          <span className="hero-orb hero-orb-a" aria-hidden="true" />
          <span className="hero-orb hero-orb-b" aria-hidden="true" />
          <span className="hero-spark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9z" />
            </svg>
          </span>

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

          {/* The second key number, shown as a small card with a rising line.
              Both come from Key numbers in the dashboard; nothing new to fill in. */}
          {floatStat && (
            <div className="float-card hero-float">
              <span className="float-label">{floatStat.label}</span>
              <strong className="float-value">
                {floatStat.value}{floatStat.suffix}
              </strong>
              <svg className="float-spark" viewBox="0 0 96 28" aria-hidden="true" preserveAspectRatio="none">
                <path d="M1 25 L18 19 L34 21 L52 11 L70 13 L95 3" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
          </div>
        </div>
      </div>
    </section>
  );
}
