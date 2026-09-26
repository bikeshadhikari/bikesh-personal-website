'use server';

import { revalidatePath } from 'next/cache';
import { currentUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import { withSchema } from '@/lib/schema';
import { QUIZ_DEFAULTS, getQuizSettings, planShape, saveQuizSettings } from '@/lib/quiz';
import { readiness } from '@/lib/quiz-admin';
import { importQuestions, parseCsv, review } from '@/lib/quiz-import';
import { MEDIA_PREFIX, deleteUpload } from '@/lib/upload';

/**
 * Settings that hold a picture or a recording rather than words.
 *
 * Their value arrives from the uploader under `<key>_url`, not under the key
 * itself, because the file goes up in the browser and only the address it was
 * given comes back with the form.
 */
const MEDIA_KEYS = new Set([
  'quiz_emblem', 'quiz_emblem_audio', 'quiz_share_image', 'quiz_logo', 'quiz_hero_image',
]);

/**
 * An address a media setting may hold.
 *
 * Wider than the site's own check, which takes uploads and absolute https
 * links only: these settings also ship pointing at files that travel with the
 * site, and a default of /political/tree.png must survive being saved.
 */
function acceptQuizMedia(value: string): string {
  const trimmed = value.trim();
  if (trimmed === '') return '';

  if (trimmed.startsWith(MEDIA_PREFIX)) {
    return /^\/api\/media\/[0-9a-f]{1,64}$/i.test(trimmed) ? trimmed : '';
  }
  // A path within this site, and nothing that climbs out of it.
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.includes('..')) {
    return trimmed.slice(0, 500);
  }
  try {
    const url = new URL(trimmed);
    return url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
}

/** Every action here changes the game, so every action checks the seat first. */
async function requireEditor(): Promise<void> {
  const user = await currentUser();
  if (!user) throw new Error('Not signed in');
}

const PAGE = '/admin/play-nepali-congress-quiz';

export type ActionState = { ok: boolean; message: string; detail?: string[] };

/** Save any subset of the quiz settings. */
export async function saveSettingsAction(
  _previous: ActionState, formData: FormData,
): Promise<ActionState> {
  await requireEditor();

  const current = await getQuizSettings();
  const values: Record<string, string> = {};

  for (const key of Object.keys(QUIZ_DEFAULTS)) {
    if (MEDIA_KEYS.has(key)) {
      if (!formData.has(`${key}_url`)) continue;
      const next = acceptQuizMedia(String(formData.get(`${key}_url`) ?? ''));
      const previous = current[key] ?? '';
      // A replaced upload is no longer referenced by anything, so it goes.
      if (previous && previous !== next && previous.startsWith(MEDIA_PREFIX)) {
        await deleteUpload(previous);
      }
      values[key] = next;
      continue;
    }

    if (!formData.has(key) && !formData.has(`${key}__present`)) continue;
    const raw = formData.get(key);
    // A checkbox that is off sends nothing, so its presence marker decides.
    values[key] = raw === null ? '0' : String(raw).trim();
  }

  // Switching the game on is refused while the bank cannot fill a round.
  if (values.quiz_enabled === '1') {
    const settings = { ...current, ...values };
    const check = await readiness(planShape(settings));
    if (!check.ok) {
      return {
        ok: false,
        message: 'Quiz cannot be enabled — not enough distinct questions.',
        detail: check.lines
          .filter((line) => !line.ok)
          .map((line) => `${line.difficulty}: ${line.facts} distinct of ${line.need} required (${line.have} rows)`),
      };
    }
  }

  await saveQuizSettings(values);
  revalidatePath(PAGE);
  revalidatePath('/play-nepali-congress-quiz');
  return { ok: true, message: 'Saved.' };
}

/** Look a CSV over and report what would happen, writing nothing. */
export async function reviewImportAction(
  _previous: ActionState, formData: FormData,
): Promise<ActionState> {
  await requireEditor();
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: 'Choose a CSV file first.' };
  }

  const checked = await review(parseCsv(await file.text()));
  const detail = [
    `${checked.total} rows detected`,
    `${checked.valid.length} valid`,
    `${checked.invalid.length} invalid`,
    `${checked.duplicatesInFile} duplicate ids within the file`,
    `${checked.alreadyPresent} already in the bank (these would be updated)`,
    `${checked.facts} distinct facts among the valid rows`,
    ...checked.invalid.slice(0, 40).map((bad) => `line ${bad.line} ${bad.question_id}: ${bad.reason}`),
  ];
  return { ok: checked.valid.length > 0, message: 'Checked — nothing written yet.', detail };
}

/** Validate, then write the rows that passed. */
export async function importAction(
  _previous: ActionState, formData: FormData,
): Promise<ActionState> {
  await requireEditor();
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: 'Choose a CSV file first.' };
  }

  const checked = await review(parseCsv(await file.text()));
  if (checked.valid.length === 0) {
    return {
      ok: false,
      message: 'Nothing valid to import.',
      detail: checked.invalid.slice(0, 40).map((bad) => `line ${bad.line} ${bad.question_id}: ${bad.reason}`),
    };
  }

  const result = await importQuestions(checked.valid);
  revalidatePath(PAGE);
  return {
    ok: true,
    message: `Imported ${result.inserted} new, updated ${result.updated}.`,
    detail: checked.invalid.length > 0
      ? [
          `${checked.invalid.length} rows were refused and not imported:`,
          ...checked.invalid.slice(0, 40).map((bad) => `line ${bad.line} ${bad.question_id}: ${bad.reason}`),
        ]
      : undefined,
  };
}

/** Turn one question on or off without touching any past game. */
export async function toggleQuestionAction(formData: FormData): Promise<void> {
  await requireEditor();
  const id = Number(formData.get('id'));
  if (!Number.isSafeInteger(id) || id <= 0) return;
  await withSchema(() => sql`
    UPDATE quiz_questions SET active = NOT active, updated_at = NOW() WHERE id = ${id}`);
  revalidatePath(PAGE);
}

/**
 * Retire a question.
 *
 * Soft, always: a past game's answers point at this row, and a real delete
 * would take that history with it.
 */
export async function deleteQuestionAction(formData: FormData): Promise<void> {
  await requireEditor();
  const id = Number(formData.get('id'));
  if (!Number.isSafeInteger(id) || id <= 0) return;
  await withSchema(() => sql`
    UPDATE quiz_questions
    SET deleted_at = NOW(), active = FALSE, updated_at = NOW()
    WHERE id = ${id}`);
  revalidatePath(PAGE);
}

/** Create or update one question from the editor. */
export async function saveQuestionAction(
  _previous: ActionState, formData: FormData,
): Promise<ActionState> {
  await requireEditor();

  const text = (key: string) => String(formData.get(key) ?? '').trim();
  const id = Number(formData.get('id')) || 0;
  const options = { A: text('option_a'), B: text('option_b'), C: text('option_c'), D: text('option_d') };
  const correct = text('correct_option').toUpperCase();

  if (!text('question')) return { ok: false, message: 'The question cannot be empty.' };
  const blank = Object.entries(options).filter(([, v]) => !v).map(([k]) => k);
  if (blank.length > 0) return { ok: false, message: `Option ${blank.join(', ')} is empty.` };
  const values = Object.values(options);
  if (new Set(values).size !== values.length) {
    return { ok: false, message: 'Two options are identical — a player could defend either answer.' };
  }
  if (!['A', 'B', 'C', 'D'].includes(correct)) {
    return { ok: false, message: 'Choose which option is correct.' };
  }

  const { factKeyOf } = await import('@/lib/quiz-import');
  const factKey = factKeyOf(options as Record<'A' | 'B' | 'C' | 'D', string>, correct as 'A');

  const row = {
    question: text('question'),
    option_a: options.A, option_b: options.B, option_c: options.C, option_d: options.D,
    correct_option: correct,
    difficulty: text('difficulty') || 'basic',
    category: text('category'),
    explanation: text('explanation'),
    source: text('source'),
    source_url: text('source_url'),
    image_url: text('image_url'),
    audio_url: text('audio_url'),
    fact_key: factKey,
    active: formData.get('active') !== null,
  };

  await withSchema(async () => {
    if (id > 0) {
      await sql`UPDATE quiz_questions SET ${sql(row)}, updated_at = NOW() WHERE id = ${id}`;
    } else {
      const questionId = text('question_id') || `NCQ-${Date.now().toString(36).toUpperCase()}`;
      await sql`INSERT INTO quiz_questions ${sql({ ...row, question_id: questionId })}`;
    }
  });

  revalidatePath(PAGE);
  return { ok: true, message: id > 0 ? 'Question saved.' : 'Question added.' };
}
