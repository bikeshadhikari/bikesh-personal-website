import Link from 'next/link';
import Icon from '../Icon';
import { csvList, dateRange, durationBetween, excerptOf, formatDate, isoDate, lines } from '@/lib/utils';
import type { Certification, Experience, Highlight, Post, Project, Service, Skill, Testimonial } from '@/lib/types';

/* -- headings ------------------------------------------------------------- */

export function SectionHead({
  eyebrow, heading, sub, center = false,
}: { eyebrow?: string; heading: string; sub?: string; center?: boolean }) {
  return (
    <div className={`section-head${center ? ' is-center' : ''}`}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2>{heading}</h2>
      {sub && <p className="section-sub">{sub}</p>}
    </div>
  );
}

export function PageHero({ eyebrow, heading, sub }: { eyebrow?: string; heading: string; sub?: string }) {
  return (
    <section className="page-hero">
      <div className="hero-glow" aria-hidden="true" />
      <div className="container">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{heading}</h1>
        {sub && <p className="page-hero-sub">{sub}</p>}
      </div>
    </section>
  );
}

/* -- key numbers ---------------------------------------------------------- */

export function Highlights({ items }: { items: Highlight[] }) {
  if (items.length === 0) return null;
  return (
    <section className="highlights" aria-label="Key numbers">
      <div className="container highlights-grid">
        {items.map((h) => (
          <div className="highlight-card" key={h.id}>
            <span className="highlight-icon"><Icon name={h.icon || 'sparkle'} /></span>
            <span className="highlight-value">
              <strong className="counter" data-target={h.value}>{h.value}</strong>
              {h.suffix && <span className="highlight-suffix">{h.suffix}</span>}
            </span>
            <span className="highlight-label">{h.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -- skills --------------------------------------------------------------- */

export function Skills({ groups }: { groups: [string, Skill[]][] }) {
  if (groups.length === 0) return null;
  return (
    <div className="skills-grid">
      {groups.map(([category, items]) => (
        <div className="skill-group" key={category}>
          <h3>{category}</h3>
          <ul>
            {items.map((s) => (
              <li className="skill" key={s.id}>
                <div className="skill-top">
                  <span className="skill-name">{s.name}</span>
                  <span className="skill-level">{s.level}%</span>
                </div>
                <div className="skill-bar" role="img" aria-label={`${s.name}: ${s.level} percent`}>
                  <span style={{ ['--level' as string]: `${s.level}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* -- the experience pipeline ---------------------------------------------- */

const TRACK_LABEL: Record<string, string> = {
  work: 'Work', education: 'Education', volunteer: 'Volunteer', award: 'Award',
};
const TRACK_ICON: Record<string, string> = {
  work: 'briefcase', education: 'graduation', volunteer: 'heart', award: 'award',
};

export function Timeline({ items }: { items: Experience[] }) {
  if (items.length === 0) return null;
  return (
    <ol className="timeline">
      {items.map((x) => {
        const track = x.track || 'work';
        const range = dateRange(x.start_date, x.end_date, x.is_current);
        const duration = durationBetween(x.start_date, x.end_date, x.is_current);
        const points = lines(x.highlights);

        return (
          <li className={`timeline-item${x.is_current ? ' is-current' : ''}`} data-track={track} key={x.id}>
            <span className="timeline-dot" aria-hidden="true">
              <Icon name={TRACK_ICON[track] ?? 'briefcase'} className="icon icon-sm" />
            </span>
            <div className="timeline-card">
              <div className="timeline-meta">
                <span className={`chip chip-${track}`}>{TRACK_LABEL[track] ?? track}</span>
                {x.is_current && <span className="chip chip-live">Current</span>}
                {x.employment_type && <span className="chip chip-soft">{x.employment_type}</span>}
              </div>

              <h3 className="timeline-role">{x.role}</h3>

              <p className="timeline-org">
                {x.organization && (x.organization_url ? (
                  <a href={x.organization_url} target="_blank" rel="noopener noreferrer">
                    {x.organization} <Icon name="external" className="icon icon-xs" />
                  </a>
                ) : x.organization)}
                {x.location && <><span className="dot-sep">·</span>{x.location}</>}
              </p>

              <p className="timeline-dates">
                <Icon name="calendar" className="icon icon-xs" /> {range}
                {duration && <><span className="dot-sep">·</span>{duration}</>}
              </p>

              {x.summary && <p className="timeline-summary">{x.summary}</p>}

              {points.length > 0 && (
                <ul className="timeline-points">
                  {points.map((point, i) => (
                    <li key={i}><Icon name="check" className="icon icon-xs" /><span>{point}</span></li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* -- services ------------------------------------------------------------- */

export function Services({ items }: { items: Service[] }) {
  if (items.length === 0) return null;
  return (
    <div className="cards-grid services-grid">
      {items.map((s) => {
        const bullets = lines(s.bullets);
        return (
          <article className="card service-card" key={s.id}>
            <span className="card-icon"><Icon name={s.icon || 'sparkle'} /></span>
            <h3>{s.title}</h3>
            <p>{s.summary}</p>
            {bullets.length > 0 && (
              <ul className="card-list">
                {bullets.map((b, i) => (
                  <li key={i}><Icon name="check" className="icon icon-xs" /><span>{b}</span></li>
                ))}
              </ul>
            )}
            {s.price_note && <p className="card-note">{s.price_note}</p>}
            <span className="card-corner" aria-hidden="true">
              <Icon name="arrow-up-right" className="icon icon-xs" />
            </span>
          </article>
        );
      })}
    </div>
  );
}

/* -- projects ------------------------------------------------------------- */

export function Projects({ items }: { items: Project[] }) {
  if (items.length === 0) return null;
  return (
    <div className="cards-grid projects-grid">
      {items.map((p) => {
        const tech = csvList(p.tech);
        return (
          <article className="card project-card" data-category={p.category} key={p.id}>
            <Link className={`project-thumb${p.image ? '' : ' is-placeholder'}`} href={`/projects/${p.slug}`}>
              {p.image
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={p.image} alt={p.title} loading="lazy" />
                : <span aria-hidden="true"><Icon name="layers" /></span>}
            </Link>
            <div className="project-body">
              <div className="card-meta">
                {p.category && <span className="chip chip-soft">{p.category}</span>}
                {p.year && <span className="card-year">{p.year}</span>}
              </div>
              <h3><Link href={`/projects/${p.slug}`}>{p.title}</Link></h3>
              <p>{excerptOf(p.summary, 24)}</p>
              {tech.length > 0 && (
                <ul className="tech-list">{tech.map((t) => <li key={t}>{t}</li>)}</ul>
              )}
              <div className="card-actions">
                <Link className="btn btn-link" href={`/projects/${p.slug}`}>
                  Details <Icon name="arrow-right" className="icon icon-xs" />
                </Link>
                {p.live_url && (
                  <a className="btn btn-link" href={p.live_url} target="_blank" rel="noopener noreferrer">
                    Visit <Icon name="external" className="icon icon-xs" />
                  </a>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

/* -- certifications and testimonials -------------------------------------- */

export function Certifications({ items }: { items: Certification[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="cert-list">
      {items.map((c) => (
        <li className="cert-item" key={c.id}>
          <span className="cert-icon"><Icon name="award" /></span>
          <div>
            <h3>{c.title}</h3>
            <p>
              {c.issuer}
              {c.issue_date && <><span className="dot-sep">·</span>{formatDate(c.issue_date, { month: 'long', year: 'numeric' })}</>}
            </p>
            {c.credential_url && (
              <a className="btn btn-link" href={c.credential_url} target="_blank" rel="noopener noreferrer">
                View credential <Icon name="external" className="icon icon-xs" />
              </a>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Testimonials({ items }: { items: Testimonial[] }) {
  if (items.length === 0) return null;
  return (
    <div className="cards-grid testimonial-grid">
      {items.map((t) => (
        <figure className="card testimonial-card" key={t.id}>
          <span className="quote-mark" aria-hidden="true"><Icon name="quote" /></span>
          {t.rating > 0 && (
            <div className="stars" aria-label={`${t.rating} out of 5`}>
              {Array.from({ length: t.rating }).map((_, i) => (
                <Icon key={i} name="star" className="icon icon-xs star" />
              ))}
            </div>
          )}
          <blockquote>{t.quote}</blockquote>
          <figcaption>
            {t.photo
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={t.photo} alt="" loading="lazy" />
              : <span className="avatar-initial" aria-hidden="true">{t.name.charAt(0)}</span>}
            <span>
              <strong>{t.name}</strong>
              <small>{[t.role, t.organization].filter(Boolean).join(', ')}</small>
            </span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

/* -- blog cards and pagination -------------------------------------------- */

export function PostCard({ post }: { post: Post }) {
  return (
    <article className="card post-card">
      <Link className={`post-thumb${post.cover_image ? '' : ' is-placeholder'}`} href={`/blog/${post.slug}`}>
        {post.cover_image
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={post.cover_image} alt={post.title} loading="lazy" />
          : <span aria-hidden="true">{post.title.charAt(0)}</span>}
      </Link>
      <div className="post-body">
        <div className="card-meta">
          {post.category_name && (
            <Link className="chip chip-soft" href={`/blog/category/${post.category_slug}`}>{post.category_name}</Link>
          )}
          <time dateTime={isoDate(post.published_at)}>{formatDate(post.published_at)}</time>
        </div>
        <h3><Link href={`/blog/${post.slug}`}>{post.title}</Link></h3>
        <p>{post.excerpt || excerptOf(post.content, 24)}</p>
        <div className="card-actions">
          <Link className="btn btn-link" href={`/blog/${post.slug}`}>
            Read <Icon name="arrow-right" className="icon icon-xs" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function Pagination({ page, pages, baseUrl }: { page: number; pages: number; baseUrl: string }) {
  if (pages <= 1) return null;
  const sep = baseUrl.includes('?') ? '&' : '?';
  return (
    <nav className="pagination" aria-label="Pagination">
      {page > 1 && <Link className="page-link" href={`${baseUrl}${sep}page=${page - 1}`} rel="prev">Previous</Link>}
      {Array.from({ length: pages }).map((_, i) => (
        <Link
          key={i}
          className={`page-link${i + 1 === page ? ' is-active' : ''}`}
          href={`${baseUrl}${sep}page=${i + 1}`}
          aria-current={i + 1 === page ? 'page' : undefined}
        >
          {i + 1}
        </Link>
      ))}
      {page < pages && <Link className="page-link" href={`${baseUrl}${sep}page=${page + 1}`} rel="next">Next</Link>}
    </nav>
  );
}
