import { currentUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import { withSchema } from '@/lib/schema';

export const dynamic = 'force-dynamic';

/** One CSV cell, quoted whenever quoting is what keeps it one cell. */
function cell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const text = value instanceof Date ? value.toISOString() : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function csv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const header = Object.keys(rows[0]);
  // A leading BOM so Excel opens Devanagari as Devanagari rather than mojibake.
  return `﻿${[
    header.join(','),
    ...rows.map((row) => header.map((key) => cell(row[key])).join(',')),
  ].join('\r\n')}\r\n`;
}

/** Download a slice of the quiz as a spreadsheet. Signed-in staff only. */
export async function GET(request: Request): Promise<Response> {
  if (!(await currentUser())) return new Response('Not signed in', { status: 401 });

  const what = new URL(request.url).searchParams.get('what') ?? 'sessions';

  const rows = await withSchema(async () => {
    if (what === 'questions') {
      return sql<Record<string, unknown>[]>`
        SELECT question_id, question, option_a, option_b, option_c, option_d,
               correct_option, difficulty, category, explanation, source, source_url,
               active, verified_date, content_type
        FROM quiz_questions WHERE deleted_at IS NULL ORDER BY id`;
    }
    if (what === 'answers') {
      return sql<Record<string, unknown>[]>`
        SELECT a.session_id, s.player_name, a.position, q.question_id, q.question,
               a.difficulty, a.category, a.selected_option, a.correct_option,
               a.is_correct, a.points, a.response_ms, a.created_at
        FROM quiz_answers a
        JOIN quiz_sessions s ON s.id = a.session_id
        JOIN quiz_questions q ON q.id = a.question_id
        ORDER BY a.session_id, a.position`;
    }
    return sql<Record<string, unknown>[]>`
      SELECT id AS session_id, player_name, score, max_score, correct_count,
             total_count, accuracy, level, duration_ms, started_at, completed_at
      FROM quiz_sessions ORDER BY started_at DESC`;
  });

  const body = csv(rows as Record<string, unknown>[]);
  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="quiz-${what}-${stamp}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
