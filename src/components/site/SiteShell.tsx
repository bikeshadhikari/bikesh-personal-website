import { cookies } from 'next/headers';
import Header from './Header';
import Footer from './Footer';
import Reveal from './Reveal';
import { getSettings, setting, settingBool } from '@/lib/settings';

/** Header, footer and scroll effects around every public page. */
export default async function SiteShell({
  children, current = 'home', home = false,
}: { children: React.ReactNode; current?: string; home?: boolean }) {
  const s = await getSettings();

  // Maintenance mode hides the site from visitors. Anyone holding a dashboard
  // session cookie keeps browsing normally, so you can check your own work.
  if (settingBool(s, 'maintenance_mode')) {
    const signedIn = (await cookies()).get('bikesh_session');
    if (!signedIn) {
      return (
        <main className="maintenance-body">
          <div className="maintenance">
            <span className="brand-mark" aria-hidden="true">
              {setting(s, 'full_name', 'B').charAt(0)}
            </span>
            <h1>{setting(s, 'site_name', 'This site')}</h1>
            <p>{setting(s, 'maintenance_text', 'We will be back shortly.')}</p>
            {setting(s, 'contact_email') && (
              <a className="btn btn-primary" href={`mailto:${setting(s, 'contact_email')}`}>
                Email me instead
              </a>
            )}
          </div>
        </main>
      );
    }
  }

  return (
    <div className={home ? 'is-home' : 'is-inner'}>
      <Header current={current} />
      <main id="main">{children}</main>
      <Footer />
      <Reveal />
    </div>
  );
}
