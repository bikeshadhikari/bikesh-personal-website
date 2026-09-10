import Link from 'next/link';
import Header from './Header';
import Footer from './Footer';
import Reveal from './Reveal';
import Backdrop from './Backdrop';
import PointerGlow from './PointerGlow';
import { currentUser } from '@/lib/auth';
import { getSettings, setting, settingBool } from '@/lib/settings';

/** Header, footer and scroll effects around every public page. */
export default async function SiteShell({
  children, current = 'home', home = false,
}: { children: React.ReactNode; current?: string; home?: boolean }) {
  const s = await getSettings();
  const maintenance = settingBool(s, 'maintenance_mode');

  // While maintenance mode is on, only a genuinely signed-in user gets through.
  // The check verifies the session signature — the presence of a cookie is not
  // enough, or anyone could set one by hand and walk past the holding page.
  const owner = maintenance ? await currentUser() : null;

  if (maintenance && !owner) {
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

  return (
    <div className={home ? 'is-home' : 'is-inner'}>
      <Backdrop />
      {maintenance && owner && (
        <div className="owner-bar" role="status">
          <span className="owner-bar-dot" aria-hidden="true" />
          <p>
            <strong>Maintenance mode is on.</strong> Visitors see a holding page. You can see the
            real site because you are signed in.
          </p>
          <Link href="/admin/settings">Turn it off</Link>
        </div>
      )}
      <Header current={current} />
      <main id="main">{children}</main>
      <Footer />
      <Reveal />
      <PointerGlow />
    </div>
  );
}
