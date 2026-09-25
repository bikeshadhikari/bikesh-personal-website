import 'server-only';
import { sql } from './db';
import { withSchema } from './schema';
import type { Difficulty } from './quiz';

export type QuizStats = {
  questions: number; active: number; byDifficulty: Record<Difficulty, number>;
  facts: Record<Difficulty, number>;
  games: number; completed: number; players: number;
  avgScore: number; avgAccuracy: number; bestScore: number;
};

export type SessionRow = {
  id: string; player_name: string; score: number; max_score: number;
  correct_count: number; total_count: number; accuracy: string; level: string;
  duration_ms: number; started_at: string; completed_at: string | null;
};

export type QuestionRow = {
  id: number; question_id: string; question: string; difficulty: Difficulty;
  category: string; correct_option: string; active: boolean; source: string;
  updated_at: string; deleted_at: string | null;
};

/** Everything the dashboard tab shows, in one trip. */
export async function quizStats(): Promise<QuizStats> {
  return withSchema(async () => {
    const [bank] = await sql<{
      questions: string; active: string; basic: string; medium: string; hard: string;
      fbasic: string; fmedium: string; fhard: string;
    }[]>`
      SELECT
        COUNT(*) FILTER (WHERE deleted_at IS NULL)::text AS questions,
        COUNT(*) FILTER (WHERE active AND deleted_at IS NULL)::text AS active,
        COUNT(*) FILTER (WHERE difficulty = 'basic'  AND active AND deleted_at IS NULL)::text AS basic,
        COUNT(*) FILTER (WHERE difficulty = 'medium' AND active AND deleted_at IS NULL)::text AS medium,
        COUNT(*) FILTER (WHERE difficulty = 'hard'   AND active AND deleted_at IS NULL)::text AS hard,
        COUNT(DISTINCT fact_key) FILTER (WHERE difficulty = 'basic'  AND active AND deleted_at IS NULL)::text AS fbasic,
        COUNT(DISTINCT fact_key) FILTER (WHERE difficulty = 'medium' AND active AND deleted_at IS NULL)::text AS fmedium,
        COUNT(DISTINCT fact_key) FILTER (WHERE difficulty = 'hard'   AND active AND deleted_at IS NULL)::text AS fhard
      FROM quiz_questions`;

    const [play] = await sql<{
      games: string; completed: string; players: string;
      avg_score: string | null; avg_accuracy: string | null; best: string | null;
    }[]>`
      SELECT COUNT(*)::text AS games,
             COUNT(*) FILTER (WHERE completed_at IS NOT NULL)::text AS completed,
             COUNT(DISTINCT lower(player_name))::text AS players,
             AVG(score) FILTER (WHERE completed_at IS NOT NULL)::text AS avg_score,
             AVG(accuracy) FILTER (WHERE completed_at IS NOT NULL)::text AS avg_accuracy,
             MAX(score) FILTER (WHERE completed_at IS NOT NULL)::text AS best
      FROM quiz_sessions`;

    return {
      questions: Number(bank?.questions ?? 0),
      active: Number(bank?.active ?? 0),
      byDifficulty: {
        basic: Number(bank?.basic ?? 0),
        medium: Number(bank?.medium ?? 0),
        hard: Number(bank?.hard ?? 0),
      },
      facts: {
        basic: Number(bank?.fbasic ?? 0),
        medium: Number(bank?.fmedium ?? 0),
        hard: Number(bank?.fhard ?? 0),
      },
      games: Number(play?.games ?? 0),
      completed: Number(play?.completed ?? 0),
      players: Number(play?.players ?? 0),
      avgScore: Math.round(Number(play?.avg_score ?? 0) * 10) / 10,
      avgAccuracy: Math.round(Number(play?.avg_accuracy ?? 0) * 10) / 10,
      bestScore: Number(play?.best ?? 0),
    };
  });
}

/** Games per day, newest last, for the dashboard chart. */
export async function gamesPerDay(days = 14): Promise<{ day: string; games: number }[]> {
  return withSchema(async () => {
    const rows = await sql<{ day: string; n: string }[]>`
      SELECT to_char(date_trunc('day', started_at), 'YYYY-MM-DD') AS day, COUNT(*)::text AS n
      FROM quiz_sessions
      WHERE started_at > NOW() - (${days} * INTERVAL '1 day')
      GROUP BY 1 ORDER BY 1`;
    return rows.map((row) => ({ day: row.day, games: Number(row.n) }));
  });
}

/** The questions players get wrong most often — the bank's weak spots. */
export async function mostMissed(limit = 8): Promise<
  { question: string; difficulty: string; asked: number; wrong: number }[]
> {
  return withSchema(async () => {
    const rows = await sql<{
      question: string; difficulty: string; asked: string; wrong: string;
    }[]>`
      SELECT q.question, a.difficulty,
             COUNT(*)::text AS asked,
             COUNT(*) FILTER (WHERE NOT a.is_correct)::text AS wrong
      FROM quiz_answers a
      JOIN quiz_questions q ON q.id = a.question_id
      GROUP BY q.question, a.difficulty
      HAVING COUNT(*) >= 3
      ORDER BY (COUNT(*) FILTER (WHERE NOT a.is_correct))::float / COUNT(*) DESC, COUNT(*) DESC
      LIMIT ${limit}`;
    return rows.map((row) => ({
      question: row.question, difficulty: row.difficulty,
      asked: Number(row.asked), wrong: Number(row.wrong),
    }));
  });
}

export async function listQuestions(
  { search = '', difficulty = '', page = 1, perPage = 25 }:
  { search?: string; difficulty?: string; page?: number; perPage?: number },
): Promise<{ rows: QuestionRow[]; total: number }> {
  return withSchema(async () => {
    const like = `%${search}%`;
    const rows = await sql<QuestionRow[]>`
      SELECT id, question_id, question, difficulty, category, correct_option,
             active, source, updated_at, deleted_at
      FROM quiz_questions
      WHERE deleted_at IS NULL
        AND (${search === ''} OR question ILIKE ${like} OR question_id ILIKE ${like}
             OR category ILIKE ${like})
        AND (${difficulty === ''} OR difficulty = ${difficulty})
      ORDER BY id
      LIMIT ${perPage} OFFSET ${(Math.max(1, page) - 1) * perPage}`;

    const [count] = await sql<{ n: string }[]>`
      SELECT COUNT(*)::text AS n FROM quiz_questions
      WHERE deleted_at IS NULL
        AND (${search === ''} OR question ILIKE ${like} OR question_id ILIKE ${like}
             OR category ILIKE ${like})
        AND (${difficulty === ''} OR difficulty = ${difficulty})`;

    return { rows, total: Number(count?.n ?? 0) };
  });
}

export async function listSessions(
  { search = '', since = '', page = 1, perPage = 30 }:
  { search?: string; since?: string; page?: number; perPage?: number },
): Promise<{ rows: SessionRow[]; total: number }> {
  return withSchema(async () => {
    const like = `%${search}%`;
    const rows = await sql<SessionRow[]>`
      SELECT id, player_name, score, max_score, correct_count, total_count,
             accuracy::text, level, duration_ms, started_at, completed_at
      FROM quiz_sessions
      WHERE (${search === ''} OR player_name ILIKE ${like} OR id::text ILIKE ${like})
        AND (${since === ''} OR started_at >= ${since || '1970-01-01'}::timestamptz)
      ORDER BY started_at DESC
      LIMIT ${perPage} OFFSET ${(Math.max(1, page) - 1) * perPage}`;

    const [count] = await sql<{ n: string }[]>`
      SELECT COUNT(*)::text AS n FROM quiz_sessions
      WHERE (${search === ''} OR player_name ILIKE ${like} OR id::text ILIKE ${like})
        AND (${since === ''} OR started_at >= ${since || '1970-01-01'}::timestamptz)`;

    return { rows, total: Number(count?.n ?? 0) };
  });
}

/**
 * Whether the game can be switched on.
 *
 * A game that cannot fill its own question plan must not be opened to players,
 * and the count that matters is distinct facts rather than rows: two questions
 * asking the same thing can only fill one slot between them.
 */
export type Readiness = {
  ok: boolean;
  lines: { difficulty: Difficulty; need: number; have: number; facts: number; ok: boolean }[];
};

export async function readiness(
  want: Record<Difficulty, number>,
): Promise<Readiness> {
  const stats = await quizStats();
  const lines = (['basic', 'medium', 'hard'] as Difficulty[]).map((difficulty) => {
    const need = want[difficulty];
    const facts = stats.facts[difficulty];
    return {
      difficulty, need, have: stats.byDifficulty[difficulty], facts,
      ok: facts >= need,
    };
  });
  return { ok: lines.every((line) => line.ok), lines };
}
