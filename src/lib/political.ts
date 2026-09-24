import 'server-only';
import { cache } from 'react';
import { sql } from './db';
import { ensureSchema, isMissingColumn, isMissingTable } from './schema';
import { SECTION_SEED } from './political-content';
import type { PoliticalPhoto, PoliticalSection, PoliticalSlide } from './types';

/**
 * What the page says before anyone has filled the form in.
 *
 * A setting's `default` only pre-fills the dashboard field; it is not what a
 * read returns on a site that was installed before these settings existed. So
 * the page reads through here, and a fresh deploy shows a finished page rather
 * than a hero with gaps in it.
 */
export const POLITICAL_DEFAULTS: Record<string, string> = {
  pol_name: 'विकेश अधिकारी',
  pol_roles: 'IT • शिक्षाकर्मी • प्राविधिक • वक्ता • योजनाकार',
  pol_quote: 'सिक्नेहरूलाई कर्मशील बनाउने र कर्मशीलहरूलाई नेतृत्वतर्फ अघि बढाउने ।',
  pol_intro:
    'प्रविधि, शिक्षा, समाजसेवा, युवा नेतृत्व र राजनीतिक अध्ययनलाई एकसाथ जोड्दै अघि बढेको '
    + 'एक युवाको सार्वजनिक यात्रा । अध्ययन, संवाद, सहभागिता र जिम्मेवारी — यही यात्राको आधार हो ।',
  pol_listen_label: 'नपढी सुन्नका लागि यहाँ क्लिक गर्नुहोस्',
  pol_footer_note: 'समुन्नत नेपाल, सम्मानित नेपाली',
  pol_jaya_label: 'जय नेपाल भन्नुहोस्',
  pol_candidacy: 'संघीय महाधिवेशन प्रतिनिधि उम्मेदवार',
  pol_candidacy_sub: 'युवा तर्फ — ३५ वर्षमुनि',
  pol_candidacy_note:
    'नेपाली कांग्रेसको संघीय महाधिवेशनमा युवा तर्फबाट प्रतिनिधि उम्मेदवार । '
    + 'शिक्षा, प्रविधि र समाजसेवाको अनुभवलाई संगठनभित्रको नीति–निर्माण र '
    + 'युवा प्रतिनिधित्वमा रूपान्तरण गर्ने प्रतिबद्धतासहित ।',
  pol_pillars:
    'शिक्षित युवा | सबल संगठन\n'
    + 'नयाँ विचार | नयाँ नेतृत्व\n'
    + 'युवा सहभागिता | समावेशी प्रतिनिधित्व\n'
    + 'व्यावहारिक राजनीति | सकारात्मक परिवर्तन',
  pol_meta_description:
    'प्रविधि, शिक्षा, समाजसेवा र युवा नेतृत्वदेखि सार्वजनिक जीवनसम्म — '
    + 'विकेश अधिकारीको राजनीतिक यात्रा, विचार र संलग्नताको विस्तृत परिचय ।',
};

/** A political page setting, falling back to what the page ships with. */
export function polSetting(map: Record<string, string>, key: string): string {
  const value = (map[key] ?? '').trim();
  return value || POLITICAL_DEFAULTS[key] || '';
}

/** One figure card: a number and what it counts. */
export type Figure = { value: string; label: string };

/**
 * Figures are written one per line as `value | label`, which keeps a small
 * table of numbers inside an ordinary text field rather than needing a screen
 * of its own. A line with no separator becomes a value with no label.
 */
export function parseFigures(raw: string): Figure[] {
  return (raw ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const at = line.indexOf('|');
      if (at < 0) return { value: line, label: '' };
      return { value: line.slice(0, at).trim(), label: line.slice(at + 1).trim() };
    })
    .filter((f) => f.value !== '');
}

async function heal<T>(run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (!isMissingTable(error) && !isMissingColumn(error)) return fallback;
    await ensureSchema();
    try {
      return await run();
    } catch {
      return fallback;
    }
  }
}

/**
 * Put the six shipped sections in place the first time the page is asked for.
 *
 * Only when the table is completely empty, so an owner who deletes a section
 * does not find it back the next morning, and nothing already written is
 * touched.
 */
async function seedSections(): Promise<void> {
  const [{ count }] = await sql<{ count: string }[]>`
    SELECT COUNT(*)::text AS count FROM political_sections`;
  if (Number(count) > 0) { await refreshUntouched(); return; }

  await sql`INSERT INTO political_sections ${sql(
    SECTION_SEED.map((s, i) => ({
      number: s.number,
      title: s.title,
      subtitle: s.subtitle,
      body: s.body,
      figures: s.figures,
      image: '',
      audio: '',
      sort_order: (i + 1) * 10,
      enabled: true,
    })),
    'number', 'title', 'subtitle', 'body', 'figures', 'image', 'audio', 'sort_order', 'enabled',
  )}`;
}

/**
 * Bring the shipped wording up to date where nobody has changed it.
 *
 * A section whose updated_at still equals its created_at has never been saved
 * from the dashboard, so replacing its text loses nothing. The moment the
 * owner edits a section it is theirs, and this leaves it alone for good.
 */
async function refreshUntouched(): Promise<void> {
  const rows = await sql<{ id: number; number: string }[]>`
    SELECT id, number FROM political_sections WHERE updated_at = created_at`;
  if (rows.length === 0) return;

  for (const row of rows) {
    const shipped = SECTION_SEED.find((x) => x.number === row.number);
    if (!shipped) continue;
    await sql`
      UPDATE political_sections
      SET title = ${shipped.title}, subtitle = ${shipped.subtitle},
          body = ${shipped.body}, figures = ${shipped.figures},
          updated_at = created_at
      WHERE id = ${row.id} AND updated_at = created_at`;
  }
}

export const getPoliticalSections = cache(async (): Promise<PoliticalSection[]> =>
  heal<PoliticalSection[]>(async () => {
    await seedSections();
    // Named rather than SELECT *, so a database that predates a column fails
    // loudly here and is brought up to date, instead of quietly returning rows
    // with the new field missing.
    return [...await sql<PoliticalSection[]>`
      SELECT id, number, title, subtitle, body, figures, image, image_side, audio,
             sort_order, enabled, created_at, updated_at
      FROM political_sections WHERE enabled ORDER BY sort_order ASC, id ASC`];
  }, []));

export const getPoliticalPhotos = cache(async (): Promise<PoliticalPhoto[]> =>
  heal<PoliticalPhoto[]>(async () => [...await sql<PoliticalPhoto[]>`
    SELECT * FROM political_photos WHERE enabled ORDER BY sort_order ASC, id ASC`], []));

export const getPoliticalSlides = cache(async (): Promise<PoliticalSlide[]> =>
  heal<PoliticalSlide[]>(async () => [...await sql<PoliticalSlide[]>`
    SELECT * FROM political_slides WHERE enabled ORDER BY sort_order ASC, id ASC`], []));

/** The sections a photo can be filed under, for the dashboard dropdown. */
export async function sectionChoices(): Promise<{ value: string; label: string }[]> {
  return heal(async () => {
    const rows = await sql<{ id: number; number: string; title: string }[]>`
      SELECT id, number, title FROM political_sections ORDER BY sort_order ASC, id ASC`;
    return rows.map((r) => ({
      value: String(r.id),
      label: r.number ? `${r.number} — ${r.title}` : r.title,
    }));
  }, []);
}
