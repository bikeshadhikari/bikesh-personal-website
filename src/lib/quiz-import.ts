import 'server-only';
import { createHash } from 'node:crypto';
import { sql } from './db';
import { withSchema } from './schema';
import { DIFFICULTIES, LETTERS, type Difficulty, type Letter } from './quiz';

export type ImportRow = Record<string, string>;

export type Candidate = {
  line: number;
  question_id: string;
  question: string;
  options: Record<Letter, string>;
  correct_option: Letter;
  difficulty: Difficulty;
  category: string;
  explanation: string;
  source: string;
  source_url: string;
  verified_date: string | null;
  content_type: string;
  active: boolean;
  fact_key: string;
};

export type Rejected = { line: number; question_id: string; reason: string };

export type Review = {
  total: number;
  valid: Candidate[];
  invalid: Rejected[];
  duplicatesInFile: number;
  alreadyPresent: number;
  facts: number;
};

/** A minimal RFC 4180 reader: quoted fields, doubled quotes, CRLF. */
export function parseCsv(text: string): ImportRow[] {
  const clean = text.replace(/^﻿/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < clean.length; i += 1) {
    const char = clean[i];
    if (quoted) {
      if (char === '"') {
        if (clean[i + 1] === '"') { field += '"'; i += 1; } else quoted = false;
      } else field += char;
      continue;
    }
    if (char === '"') { quoted = true; continue; }
    if (char === ',') { row.push(field); field = ''; continue; }
    if (char === '\r') continue;
    if (char === '\n') { row.push(field); rows.push(row); row = []; field = ''; continue; }
    field += char;
  }
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }
  if (rows.length === 0) return [];

  const header = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1)
    .filter((cells) => cells.some((cell) => cell.trim() !== ''))
    .map((cells) => Object.fromEntries(header.map((key, i) => [key, (cells[i] ?? '').trim()])));
}

/** Unicode-normalised, so two spellings of the same Devanagari string match. */
function norm(value: string): string {
  return (value ?? '').normalize('NFC').replace(/\s+/g, ' ').trim();
}

/**
 * What makes two questions the same fact: the same four options with the same
 * one of them right. Rewording the stem does not make a new question, and the
 * game uses this to keep both out of one player's round.
 */
export function factKeyOf(options: Record<Letter, string>, correct: Letter): string {
  const sorted = LETTERS.map((l) => norm(options[l])).sort();
  return createHash('sha1')
    .update(`${sorted.join('\u0001')}\u0002${norm(options[correct])}`)
    .digest('hex')
    .slice(0, 32);
}

/**
 * Check one row hard enough that a bad question can never reach a player.
 *
 * The rule that matters most is that exactly one option is right. A row whose
 * options repeat has two defensible answers even when the file names only one,
 * and a chronology question is where that slips through: four dates, two of
 * them the same, and whichever the player picks the game calls one of them
 * wrong. Rows like that are refused rather than imported.
 */
export function validate(row: ImportRow, line: number): Candidate | Rejected {
  const id = norm(row.question_id) || `ROW-${line}`;
  const fail = (reason: string): Rejected => ({ line, question_id: id, reason });

  const question = norm(row.question);
  if (!question) return fail('Question text is empty');
  if (question.length > 1000) return fail('Question text is over 1000 characters');

  const options = {
    A: norm(row.option_a), B: norm(row.option_b), C: norm(row.option_c), D: norm(row.option_d),
  } as Record<Letter, string>;

  const blank = LETTERS.filter((l) => !options[l]);
  if (blank.length > 0) return fail(`Option ${blank.join(', ')} is empty — an MCQ needs four`);

  // Two identical options mean two answers a player could defend.
  const seen = new Map<string, Letter>();
  for (const letter of LETTERS) {
    const previous = seen.get(options[letter]);
    if (previous) {
      return fail(`Options ${previous} and ${letter} are identical ("${options[letter]}") — two answers would be defensible`);
    }
    seen.set(options[letter], letter);
  }

  const correct = norm(row.correct_option).toUpperCase();
  if (!LETTERS.includes(correct as Letter)) {
    return fail(`Correct option is "${row.correct_option || 'empty'}", not one of A, B, C, D`);
  }

  const difficulty = norm(row.difficulty).toLowerCase();
  if (!DIFFICULTIES.includes(difficulty as Difficulty)) {
    return fail(`Difficulty is "${row.difficulty}", not basic, medium or hard`);
  }

  const contentType = norm(row.content_type).toLowerCase() || 'mcq';
  if (!['mcq', 'poll'].includes(contentType)) return fail(`Unknown content type "${contentType}"`);

  // The explanation usually states the answer in words. Where it does, and it
  // names a different option, one of the two is wrong and neither can be
  // trusted — exactly the ambiguity this check exists to catch.
  const explanation = norm(row.explanation);
  const stated = /सही उत्तर[:：]\s*([^।]+)/.exec(explanation)?.[1]?.trim();
  if (stated) {
    const named = LETTERS.find((l) => options[l] === stated);
    if (named && named !== correct) {
      return fail(`Explanation says the answer is "${stated}" (option ${named}) but the file marks ${correct}`);
    }
  }

  const verified = norm(row.verified_date);
  const activeRaw = norm(row.active).toLowerCase();

  return {
    line,
    question_id: id,
    question,
    options,
    correct_option: correct as Letter,
    difficulty: difficulty as Difficulty,
    category: norm(row.category),
    explanation,
    source: norm(row.source),
    source_url: norm(row.source_url),
    verified_date: /^\d{4}-\d{2}-\d{2}$/.test(verified) ? verified : null,
    content_type: contentType,
    active: activeRaw === '' || ['1', 'true', 'yes', 'y', 'active'].includes(activeRaw),
    fact_key: factKeyOf(options, correct as Letter),
  };
}

/** Look the whole file over without writing anything. */
export async function review(rows: ImportRow[]): Promise<Review> {
  const valid: Candidate[] = [];
  const invalid: Rejected[] = [];
  const seenIds = new Set<string>();
  let duplicatesInFile = 0;

  rows.forEach((row, index) => {
    const checked = validate(row, index + 2);
    if ('reason' in checked) { invalid.push(checked); return; }
    if (seenIds.has(checked.question_id)) {
      duplicatesInFile += 1;
      invalid.push({
        line: checked.line, question_id: checked.question_id,
        reason: 'This question id appears earlier in the file',
      });
      return;
    }
    seenIds.add(checked.question_id);
    valid.push(checked);
  });

  let alreadyPresent = 0;
  if (valid.length > 0) {
    const ids = valid.map((c) => c.question_id);
    const rowsFound = await withSchema(() => sql<{ n: string }[]>`
      SELECT COUNT(*)::text AS n FROM quiz_questions WHERE question_id = ANY(${ids})`);
    alreadyPresent = Number(rowsFound[0]?.n ?? 0);
  }

  return {
    total: rows.length,
    valid,
    invalid,
    duplicatesInFile,
    alreadyPresent,
    facts: new Set(valid.map((c) => c.fact_key)).size,
  };
}

export type ImportResult = { inserted: number; updated: number; skipped: number };

/** Write the rows that passed. An id already present is updated, not doubled. */
export async function importQuestions(candidates: Candidate[]): Promise<ImportResult> {
  let inserted = 0;
  let updated = 0;

  await withSchema(async () => {
    for (const c of candidates) {
      const rows = await sql<{ inserted: boolean }[]>`
        INSERT INTO quiz_questions (
          question_id, question, option_a, option_b, option_c, option_d,
          correct_option, difficulty, category, explanation, source, source_url,
          fact_key, content_type, active, verified_date
        ) VALUES (
          ${c.question_id}, ${c.question}, ${c.options.A}, ${c.options.B},
          ${c.options.C}, ${c.options.D}, ${c.correct_option}, ${c.difficulty},
          ${c.category}, ${c.explanation}, ${c.source}, ${c.source_url},
          ${c.fact_key}, ${c.content_type}, ${c.active}, ${c.verified_date}
        )
        ON CONFLICT (question_id) DO UPDATE SET
          question = EXCLUDED.question, option_a = EXCLUDED.option_a,
          option_b = EXCLUDED.option_b, option_c = EXCLUDED.option_c,
          option_d = EXCLUDED.option_d, correct_option = EXCLUDED.correct_option,
          difficulty = EXCLUDED.difficulty, category = EXCLUDED.category,
          explanation = EXCLUDED.explanation, source = EXCLUDED.source,
          source_url = EXCLUDED.source_url, fact_key = EXCLUDED.fact_key,
          content_type = EXCLUDED.content_type, active = EXCLUDED.active,
          verified_date = EXCLUDED.verified_date, deleted_at = NULL,
          updated_at = NOW()
        RETURNING (xmax = 0) AS inserted`;
      if (rows[0]?.inserted) inserted += 1; else updated += 1;
    }

    // Categories come from whatever the questions use, so the admin list is
    // never out of step with the bank.
    const names = [...new Set(candidates.map((c) => c.category).filter(Boolean))];
    for (const name of names) {
      const slug = createHash('sha1').update(name).digest('hex').slice(0, 12);
      await sql`
        INSERT INTO quiz_categories (slug, name) VALUES (${slug}, ${name})
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name`;
    }
  });

  return { inserted, updated, skipped: 0 };
}
