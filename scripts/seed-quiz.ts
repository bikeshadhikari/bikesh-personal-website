/**
 * Load the question bank into the database.
 *
 * Every row is checked before anything is written — a question with two
 * identical options, a missing option, a difficulty the game does not have or
 * an explanation naming an answer other than the one marked is refused and
 * reported rather than imported. Run it again after editing the file: a
 * question id already present is updated, never doubled.
 *
 *   npx tsx --conditions=react-server scripts/seed-quiz.ts [path/to/file.csv]
 */
import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Load .env.local by hand, before anything that might reach for the database.
for (const file of ['.env.local', '.env']) {
  try {
    const text = readFileSync(resolve(process.cwd(), file), 'utf8');
    for (const line of text.split('\n')) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
      }
    }
  } catch {
    // Optional — real environment variables win anyway.
  }
}

import { importQuestions, parseCsv, review } from '../src/lib/quiz-import';
import { ensureSchema } from '../src/lib/schema';

const DEFAULT_FILE = 'data/nepali-congress-quiz-150.csv';

async function main(): Promise<void> {
  const file = process.argv[2] ?? DEFAULT_FILE;
  const text = await readFile(file, 'utf8');

  await ensureSchema();

  const rows = parseCsv(text);
  const checked = await review(rows);

  console.log(`file            ${file}`);
  console.log(`rows            ${checked.total}`);
  console.log(`valid           ${checked.valid.length}`);
  console.log(`invalid         ${checked.invalid.length}`);
  console.log(`already present ${checked.alreadyPresent}`);
  console.log(`distinct facts  ${checked.facts}`);

  if (checked.invalid.length > 0) {
    console.log('\nrefused:');
    for (const bad of checked.invalid) {
      console.log(`  line ${bad.line} ${bad.question_id}: ${bad.reason}`);
    }
  }

  if (checked.valid.length === 0) {
    console.log('\nNothing to import.');
    process.exit(checked.invalid.length > 0 ? 1 : 0);
  }

  const result = await importQuestions(checked.valid);
  console.log(`\ninserted ${result.inserted}, updated ${result.updated}`);
  process.exit(0);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
