import Link from 'next/link';
import TechShell from '@/components/tech/TechShell';
import TechIcon from '@/components/tech/TechIcon';
import JsonLd from '@/components/JsonLd';
import { getTechSettings, getTechLinks, resolveLang, st, stl, techSocials, tr, ui, withLang } from '@/lib/tech';
import { techMetadata } from '@/lib/tech-meta';
import { breadcrumbs, graph, personId, personSchema } from '@/lib/seo';
import { setting } from '@/lib/settings';
import { siteOrigin } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ lang?: string }> };

export async function generateMetadata({ searchParams }: Props) {
  const [{ lang }, s] = await Promise.all([searchParams, getTechSettings()]);
  const l = resolveLang(lang, s);
  return techMetadata({
    lang: l, path: '/tech/about', title: stl(s, 'st_about_title', l),
    description: stl(s, 'st_about', l).split('\n')[0].slice(0, 300),
    image: setting(s, 'photo') || undefined,
    keywords: ['about Bikesh Adhikari', 'who is bikesh.adh', 'Nepali tech creator'],
  });
}

/**
 * Who Bikesh is, in plain words, with every channel listed. The page search
 * engines and AI assistants read to answer "who is @bikesh.adh" and to link
 * the website with the Instagram, Facebook, YouTube and TikTok accounts.
 */
export default async function TechAboutPage({ searchParams }: Props) {
  const [query, s] = await Promise.all([searchParams, getTechSettings()]);
  const lang = resolveLang(query.lang, s);
  const t = ui(lang);
  const socials = techSocials(s);
  const { rows } = await getTechLinks({ limit: 6 });
  const photo = setting(s, 'photo');
  const name = setting(s, 'full_name', 'Bikesh Adhikari');
  const base = siteOrigin();

  return (
    <TechShell lang={lang} path="/tech/about" current="about" showNewsletter>
      <JsonLd data={graph(
        { '@type': 'ProfilePage', url: `${base}/tech/about`, name: stl(s, 'st_about_title', lang),
          mainEntity: { '@id': personId() }, inLanguage: lang },
        personSchema(s),
        breadcrumbs([
          { name: stl(s, 'st_name', lang), url: `${base}/tech` },
          { name: t.aboutMe, url: `${base}/tech/about` },
        ]),
      )} />
      <div className="st-frame st-detail">
        <aside className="st-detail-side">
          <div className="st-detail-sticky">
            {photo && (
              <div className="st-detail-cover">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="st-cover" src={photo} alt={name} />
              </div>
            )}
            <div className="st-socials">
              {socials.map((x) => (
                <a key={x.key} href={x.url} target="_blank" rel="me noopener noreferrer" aria-label={x.label}
                   data-hl={x.label} className={`st-social st-hl st-hl-tight st-social-${x.key}`}>
                  <TechIcon name={x.icon} />
                </a>
              ))}
            </div>
          </div>
        </aside>
        <article className="st-detail-main">
          <p className="st-mono st-crumbs">
            <Link className="st-hl st-hl-tight" href={withLang('/tech', lang, s)}>{stl(s, 'st_name', lang)}</Link>
            <span>/</span><span className="is-here">{t.aboutMe}</span>
          </p>
          <h1 className="st-detail-title">{stl(s, 'st_about_title', lang)}</h1>
          <p className="st-mono st-detail-count"><span>{st(s, 'st_handle')} · {stl(s, 'st_kicker', lang)}</span></p>
          <div className="st-prose st-prose-first">
            {stl(s, 'st_about', lang).split(/\n\s*\n/).map((para, i) => <p key={i}>{para}</p>)}
          </div>

          <section className="st-blocks">
            <h2 className="st-mono st-blocks-head">{t.follow}</h2>
            <ul className="st-about-channels">
              {socials.map((x) => (
                <li key={x.key}>
                  <a href={x.url} target="_blank" rel="me noopener noreferrer" className="st-block-head st-hl" data-hl={t.open}>
                    <span className="st-block-no st-mono"><TechIcon name={x.icon} /></span>
                    <span className="st-block-text">
                      <span className="st-block-title">{x.label}</span>
                      <span className="st-block-desc">{x.url.replace(/^https?:\/\/(www\.)?/, '')}</span>
                    </span>
                    <span className="st-block-arrow"><TechIcon name="arrow-up-right" /></span>
                  </a>
                </li>
              ))}
              <li>
                <Link href="/" className="st-block-head st-hl" data-hl={t.open}>
                  <span className="st-block-no st-mono"><TechIcon name="globe" /></span>
                  <span className="st-block-text">
                    <span className="st-block-title">{t.mainSite}</span>
                    <span className="st-block-desc">{base.replace(/^https?:\/\//, '')}</span>
                  </span>
                  <span className="st-block-arrow"><TechIcon name="arrow-up-right" /></span>
                </Link>
              </li>
            </ul>
          </section>

          {rows.length > 0 && (
            <section className="st-blocks">
              <h2 className="st-mono st-blocks-head">{t.latest}</h2>
              <ul className="st-about-channels">
                {rows.map((l) => (
                  <li key={l.id}>
                    <Link href={withLang(`/tech/${l.slug}`, lang, s)} className="st-block-head st-hl" data-hl={t.open}>
                      <span className="st-block-no st-mono">→</span>
                      <span className="st-block-text">
                        <span className="st-block-title">{tr(l, 'title', lang)}</span>
                        {tr(l, 'summary', lang) && <span className="st-block-desc">{tr(l, 'summary', lang)}</span>}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>
      </div>
    </TechShell>
  );
}
