import ListenButton from './ListenButton';
import { parseFigures } from '@/lib/political';
import { sanitizeHtml } from '@/lib/utils';
import type { PoliticalPhoto, PoliticalSection as Section } from '@/lib/types';

/** Strips tags so the speech engine reads words rather than markup. */
function plainText(html: string): string {
  return html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<li\b[^>]*>/gi, ' • ')
    .replace(/<\/(p|h2|h3|h4|li|ul|ol)>/gi, '. ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .replace(/\s*\.\s*\./g, '.')
    .trim();
}

export default function PoliticalSection({
  section, photos, listenLabel, index,
}: {
  section: Section;
  photos: PoliticalPhoto[];
  listenLabel: string;
  index: number;
}) {
  const figures = parseFigures(section.figures);
  const spoken = [section.title, section.subtitle, plainText(section.body)]
    .filter(Boolean).join('. ');

  // A picture can sit above the text or beside it on either hand, which is
  // what keeps six sections down a long page from reading as one column.
  const side = section.image && (section.image_side === 'left' || section.image_side === 'right')
    ? section.image_side
    : 'full';

  return (
    <section className="pol-section" id={`s-${section.id}`} data-tone={index % 3}>
      <div className="pol-wrap">
        <header className="pol-head">
          {section.number && <span className="pol-number" aria-hidden="true">{section.number}</span>}
          <div className="pol-head-text">
            <h2>{section.title}</h2>
            {section.subtitle && <p className="pol-sub">{section.subtitle}</p>}
            <ListenButton
              text={spoken}
              label={listenLabel}
              audio={section.audio || undefined}
              scopeId={`s-${section.id}`}
            />
          </div>
        </header>

        {side === 'full' && section.image && (
          <figure className="pol-lead">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={section.image} alt={section.title} loading="lazy" />
          </figure>
        )}

        {figures.length > 0 && (
          <ul className="pol-figures">
            {figures.map((f, i) => (
              <li key={i}>
                <strong>{f.value}</strong>
                {f.label && <span>{f.label}</span>}
              </li>
            ))}
          </ul>
        )}

        <div className={`pol-columns is-${side}`}>
          {side !== 'full' && section.image && (
            <figure className="pol-aside">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={section.image} alt={section.title} loading="lazy" />
            </figure>
          )}
          <div
            className="pol-body"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(section.body) }}
          />
        </div>

        {photos.length > 0 && (
          <div className="pol-photos">
            {photos.map((photo) => (
              <figure
                key={photo.id}
                style={photo.width > 0 && photo.height > 0
                  ? { aspectRatio: `${photo.width} / ${photo.height}` }
                  : undefined}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.image} alt={photo.caption || section.title} loading="lazy" />
                {photo.caption && <figcaption>{photo.caption}</figcaption>}
              </figure>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
