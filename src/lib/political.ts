import 'server-only';
import { cache } from 'react';
import { sql } from './db';
import { ensureSchema, isMissingColumn, isMissingTable } from './schema';
import { SECTION_SEED } from './political-content';
import type { PoliticalPhoto, PoliticalSection } from './types';

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
  pol_quote: 'सिक्नेहरूलाई कर्मशील बनाउने र कर्मशीलहरूलाई नेतृत्वतर्फ अघि बढाउने।',
  pol_intro:
    'प्रविधि, शिक्षा, सामाजिक सेवा, युवा नेतृत्व र राजनीतिक अध्ययनलाई जोड्दै अघि बढेको '
    + 'एक युवाको सार्वजनिक यात्रा। अध्ययन, संवाद, सहभागिता र जिम्मेवारी — यही यात्राको आधार।',
  pol_listen_label: 'नपढी सुन्नका लागि यहाँ क्लिक गर्नुहोस्',
  pol_footer_note: 'समुन्नत नेपाल, सम्मानित नेपाली',
  pol_meta_description:
    'प्रविधि, शिक्षा, सामाजिक सेवा र युवा नेतृत्वबाट सार्वजनिक जीवनसम्म — '
    + 'विकेश अधिकारीको राजनीतिक यात्रा, विचार र संलग्नता।',
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
  if (Number(count) > 0) return;

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

export const getPoliticalSections = cache(async (): Promise<PoliticalSection[]> =>
  heal<PoliticalSection[]>(async () => {
    await seedSections();
    return [...await sql<PoliticalSection[]>`
      SELECT * FROM political_sections WHERE enabled ORDER BY sort_order ASC, id ASC`];
  }, []));

export const getPoliticalPhotos = cache(async (): Promise<PoliticalPhoto[]> =>
  heal<PoliticalPhoto[]>(async () => [...await sql<PoliticalPhoto[]>`
    SELECT * FROM political_photos WHERE enabled ORDER BY sort_order ASC, id ASC`], []));

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
