import Link from 'next/link';
import { notFound } from 'next/navigation';
import { menuEnabled } from '@/lib/menu';
import { currentUser } from '@/lib/auth';
import { setting, settingBool } from '@/lib/settings';
import {
  customNavLinks, getTechCollections, getTechSettings, st, stBool, stl, techAccent, techSocials,
  tr, ui, withLang, youtubeSubscribeUrl, type Lang,
} from '@/lib/tech';
import { safeColor, toneHues } from '@/lib/utils';
import Wordmark from './Wordmark';
import TechIcon from './TechIcon';
import { TechHeaderControls, TechMobileMenu } from './TechHeaderClient';
import TechNewsletter from './TechNewsletter';

/**
 * Runs before paint so the chosen theme never flashes. A visitor's own choice
 * wins; otherwise the default set in the dashboard.
 */
const themeScript = `(function(){try{var el=document.currentScript.parentNode;var d=el.getAttribute('data-st-default')||'dark';var s=localStorage.getItem('st-theme');var t=s||(d==='auto'?(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):d);el.setAttribute('data-st-theme',t);document.documentElement.setAttribute('data-st-page',t);}catch(e){}})();`;

/** Header, footer, theme and language around every Simplified Tech page. */
export default async function TechShell({
  children, lang, path, current = '', showNewsletter = false,
}: {
  children: React.ReactNode;
  lang: Lang;
  path: string;
  current?: string;
  showNewsletter?: boolean;
}) {
  if (!(await menuEnabled('tech'))) notFound();

  const [s, collections] = await Promise.all([getTechSettings(), getTechCollections()]);
  const t = ui(lang);

  // The microsite honours the main site's maintenance mode.
  if (settingBool(s, 'maintenance_mode') && !(await currentUser())) {
    return (
      <div className="st" data-st-theme="dark">
        <main className="st-holding">
          <Wordmark name={stl(s, 'st_name', lang)} by={stl(s, 'st_by', lang)} size="md" />
          <p>{setting(s, 'maintenance_text', 'We will be back shortly.')}</p>
        </main>
      </div>
    );
  }

  const accent = techAccent(s);
  const accentAlt = safeColor(setting(s, 'theme_accent_alt', '#0ea5e9'), '#0ea5e9');
  const hues = toneHues(accent);
  const defaultTheme = ['dark', 'light', 'auto'].includes(st(s, 'st_default_theme')) ? st(s, 'st_default_theme') : 'dark';
  const name = stl(s, 'st_name', lang);
  const by = stl(s, 'st_by', lang);
  const handle = st(s, 'st_handle');
  const socials = techSocials(s);
  const youtube = socials.find((x) => x.key === 'youtube');
  const L = (href: string) => withLang(href, lang, s);
  const other: Lang = lang === 'en' ? 'ne' : 'en';
  const langHref = withLang(path.replace(/([?&])lang=(en|ne)&?/, '$1').replace(/[?&]$/, ''), other, s);

  const nav = [
    ...collections.filter((c) => c.in_nav).slice(0, 6)
      .map((c) => ({ label: tr(c, 'name', lang), href: L(`/tech/c/${c.slug}`), key: `c-${c.slug}` })),
    ...customNavLinks(s, lang).map((l, i) => ({ ...l, href: L(l.href), key: `x-${i}` })),
    { label: t.blog, href: L('/tech/blog'), key: 'blog' },
    { label: t.about, href: L('/tech/about'), key: 'about' },
  ];

  const year = new Date().getFullYear();
  const copyright = st(s, 'st_footer_copyright').replace('{year}', String(year));

  return (
    <div
      className="st"
      lang={lang === 'ne' ? 'ne' : 'en'}
      data-st-theme={defaultTheme === 'light' ? 'light' : 'dark'}
      data-st-default={defaultTheme}
      data-st-lang={lang}
      style={{
        ['--st-accent' as string]: accent,
        ['--st-accent-2' as string]: accentAlt,
        ['--st-h1' as string]: String(hues[0]),
        ['--st-h2' as string]: String(hues[1]),
        ['--st-h3' as string]: String(hues[2]),
      }}
      suppressHydrationWarning
    >
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      <a className="st-skip" href="#st-main">Skip to content</a>

      <header className="st-header">
        <div className="st-frame st-header-inner">
          <Link className="st-brand" href={L('/tech')} aria-label={`${name} ${by} — ${t.home}`}>
            <Wordmark name={name} by={by} image={st(s, 'st_logo_image') || undefined} />
          </Link>

          <nav className="st-nav" aria-label={name}>
            <ul>
              {nav.map((item) => (
                <li key={item.key}>
                  <Link href={item.href} className={`st-hl st-hl-tight${current === item.key ? ' is-active' : ''}`} data-hl={t.open}
                        aria-current={current === item.key ? 'page' : undefined}>
                    <span className="st-slash" aria-hidden="true">/</span>{item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="st-tools">
            <TechHeaderControls
              searchAction={L('/tech/search')}
              lang={lang}
              searchLabel={t.search}
              placeholder={t.searchPlaceholder}
              themeLabel={t.theme}
              showTheme={stBool(s, 'st_show_theme_toggle')}
            />
            {stBool(s, 'st_show_lang_toggle') && (
              <Link className="st-lang st-hl st-hl-tight" href={langHref} hrefLang={other} title={t.languageLabel}
                    data-hl={t.languageLabel}>
                {t.language}
              </Link>
            )}
            {youtube && (
              <a className="st-yt" href={youtube.url} target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <TechIcon name="youtube-filled" className="st-yt-ico" />
              </a>
            )}
            {youtube && stBool(s, 'st_show_subscribe') && (
              <a className="st-btn st-btn-light st-subscribe" href={youtubeSubscribeUrl(youtube.url)}
                 target="_blank" rel="noopener noreferrer">
                {stl(s, 'st_subscribe_label', lang)}
              </a>
            )}
            {stBool(s, 'st_show_header_socials') && socials.filter((x) => x.key !== 'youtube').map((x) => (
              <a key={x.key} href={x.url} target="_blank" rel="me noopener noreferrer" aria-label={x.label}
                 title={x.label} data-hl={x.label} className={`st-head-social st-hl st-hl-tight st-social-${x.key}`}>
                <TechIcon name={x.icon} />
              </a>
            ))}
            <TechMobileMenu
              label={t.menu}
              closeLabel={t.close}
              items={nav.map(({ label, href }) => ({ label, href }))}
              socials={socials.map(({ label, icon, url }) => ({ label, icon, url }))}
              subscribe={youtube && stBool(s, 'st_show_subscribe')
                ? { label: stl(s, 'st_subscribe_label', lang), href: youtubeSubscribeUrl(youtube.url) } : null}
              lang={{ label: t.language, href: langHref, show: stBool(s, 'st_show_lang_toggle') }}
            />
          </div>
        </div>
      </header>

      {/* On a phone the header has room only for the essentials, so the
          channel links ride in a slim bar just below it. */}
      {(socials.length > 0 || stBool(s, 'st_show_lang_toggle')) && (
        <div className="st-mobile-strip">
          {youtube && stBool(s, 'st_show_subscribe') && (
            <a className="st-strip-sub" href={youtubeSubscribeUrl(youtube.url)} target="_blank" rel="noopener noreferrer">
              <TechIcon name="youtube-filled" className="st-yt-ico" />
              <span>{stl(s, 'st_subscribe_label', lang)}</span>
            </a>
          )}
          <span className="st-strip-icons">
            {socials.filter((x) => x.key !== 'youtube' || !stBool(s, 'st_show_subscribe')).map((x) => (
              <a key={x.key} href={x.url} target="_blank" rel="me noopener noreferrer" aria-label={x.label}
                 className={`st-head-social st-social-${x.key}`}>
                <TechIcon name={x.icon} />
              </a>
            ))}
          </span>
          {stBool(s, 'st_show_lang_toggle') && (
            <Link className="st-lang" href={langHref} hrefLang={other} title={t.languageLabel}>{t.language}</Link>
          )}
        </div>
      )}

      <main id="st-main" className="st-main">{children}</main>

      {showNewsletter && stBool(s, 'st_show_newsletter') && (
        <TechNewsletter
          title={stl(s, 'st_newsletter_title', lang)}
          text={stl(s, 'st_newsletter_text', lang)}
          placeholder={t.email}
          button={t.subscribeEmail}
          note={t.newsletterNote}
        />
      )}

      <footer className="st-footer">
        <div className="st-frame st-footer-grid">
          <div className="st-footer-brand">
            <Wordmark name={name} by={by} size="sm" />
            <p>{stl(s, 'st_footer_about', lang)}</p>
            <p className="st-mono st-footer-handle">
              {handle}{stl(s, 'st_kicker', lang) && <> · {stl(s, 'st_kicker', lang)}</>}
            </p>
          </div>
          <div>
            <p className="st-mono st-footer-head">{t.collections}</p>
            <ul>
              <li><Link className="st-hl st-hl-tight" data-hl={t.open} href={L('/tech')}>{t.allLinks}</Link></li>
              {collections.slice(0, 6).map((c) => (
                <li key={c.id}><Link className="st-hl st-hl-tight" data-hl={t.items(c.link_count)} href={L(`/tech/c/${c.slug}`)}>{tr(c, 'name', lang)}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="st-mono st-footer-head">{t.explore}</p>
            <ul>
              <li><Link className="st-hl st-hl-tight" data-hl={t.open} href={L('/tech/search')}>{t.search}</Link></li>
              <li><Link className="st-hl st-hl-tight" data-hl={t.open} href={L('/tech/blog')}>{t.blog}</Link></li>
              <li><Link className="st-hl st-hl-tight" data-hl={t.open} href={L('/tech/about')}>{t.aboutMe}</Link></li>
              {customNavLinks(s, lang).map((l, i) => <li key={i}><Link className="st-hl st-hl-tight" data-hl={t.open} href={L(l.href)}>{l.label}</Link></li>)}
              {stBool(s, 'st_show_main_site_link') && <li><Link className="st-hl st-hl-tight" data-hl={t.open} href="/">{t.mainSite}</Link></li>}
            </ul>
          </div>
          <div>
            <p className="st-mono st-footer-head">{t.follow}</p>
            <div className="st-socials">
              {socials.map((x) => (
                <a key={x.key} href={x.url} target="_blank" rel="me noopener noreferrer" aria-label={x.label}
                   data-hl={x.label} className={`st-social st-hl st-hl-tight st-social-${x.key}`}>
                  <TechIcon name={x.icon} />
                </a>
              ))}
            </div>
            {st(s, 'st_email') && <p><a href={`mailto:${st(s, 'st_email')}`}>{st(s, 'st_email')}</a></p>}
          </div>
        </div>

        {stBool(s, 'st_show_big_wordmark') && (
          <div className="st-frame st-giant" aria-hidden="true">
            <Wordmark name={name} size="xl" />
          </div>
        )}

        <div className="st-frame st-footer-base st-mono">
          <span>{copyright}</span>
          <span>{stl(s, 'st_footer_note', lang)}</span>
        </div>
      </footer>
    </div>
  );
}
