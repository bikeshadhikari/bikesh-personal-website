import 'server-only';
import { createHash, randomUUID } from 'node:crypto';
import { sql } from './db';
import { ensureSchema, isMissingColumn, isMissingTable } from './schema';

export type Difficulty = 'basic' | 'medium' | 'hard';
export const DIFFICULTIES: Difficulty[] = ['basic', 'medium', 'hard'];
export const LETTERS = ['A', 'B', 'C', 'D'] as const;
export type Letter = (typeof LETTERS)[number];

export type QuizQuestion = {
  id: number;
  question_id: string;
  question: string;
  option_a: string; option_b: string; option_c: string; option_d: string;
  correct_option: Letter;
  difficulty: Difficulty;
  category: string;
  explanation: string;
  source: string;
  source_url: string;
  image_url: string;
  audio_url: string;
  fact_key: string;
  content_type: string;
  active: boolean;
  verified_date: string | null;
};

/** A question as the player's browser is allowed to see it: no answer in it. */
export type ServedQuestion = {
  id: number;
  position: number;
  question: string;
  options: { letter: Letter; text: string }[];
  difficulty: Difficulty;
  category: string;
  image_url: string;
  points: number;
};

/** The row kept per question in a session plan. */
type PlanItem = { id: number; difficulty: Difficulty; order: Letter[] };

async function heal<T>(run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (!isMissingTable(error) && !isMissingColumn(error)) return fallback;
    await ensureSchema();
    try { return await run(); } catch { return fallback; }
  }
}

/* -------------------------------------------------------------- settings */

/**
 * Everything the admin can change, with the wording the page ships with.
 *
 * All of it is text in quiz_settings rather than anything written into the
 * page, so the quiz can be renamed, rescored, opened, closed or dated without
 * a deploy.
 */
export const QUIZ_DEFAULTS: Record<string, string> = {
  quiz_enabled: '1',
  quiz_starts_at: '',
  quiz_ends_at: '',
  quiz_closed_message: 'यो खेल हाल उपलब्ध छैन।',

  quiz_badge: '🇳🇵 १५औँ महाधिवेशन विशेष',
  quiz_title: 'कति जान्नुहुन्छ?',
  quiz_subtitle: 'नेपाली कांग्रेस ज्ञान क्विज',
  quiz_hero_text: 'हरेक खेलमा नयाँ प्रश्न । ११ वटा प्रश्न, तीन तह — आधारभूत, मध्यम र कठिन ।',
  quiz_chips: '🧠 इतिहास\n📜 विचार\n🏛️ लोकतन्त्र\n👥 नेतृत्व\n🇳🇵 नेपाल',
  quiz_name_label: 'तपाईंको नाम',
  quiz_name_placeholder: 'नाम लेख्नुहोस्',
  quiz_start_button: '🔥 खेल सुरु गर्नुहोस्',
  quiz_logo: '',
  quiz_hero_image: '',

  quiz_count_basic: '4',
  quiz_count_medium: '3',
  quiz_count_hard: '4',
  quiz_points_basic: '1',
  quiz_points_medium: '2',
  quiz_points_hard: '3',
  quiz_shuffle_options: '1',
  quiz_mixed_order: '0',
  quiz_timer_enabled: '0',
  quiz_timer_seconds: '30',

  quiz_sound: '1',
  quiz_animations: '1',
  quiz_colour_red: '#c8102e',
  quiz_colour_navy: '#16375f',
  quiz_colour_gold: '#e3a008',
  quiz_colour_cream: '#fdf8ee',

  quiz_transition_basic: 'अब सुरु हुन्छ असली चुनौती…',
  quiz_transition_medium: '🔥 अन्तिम चुनौतीतर्फ…',
  quiz_transition_final: '🏁 अन्तिम प्रश्न!',

  quiz_level_0: 'पहिलो पाइला',
  quiz_level_3: 'जिज्ञासु',
  quiz_level_6: 'जानकार',
  quiz_level_8: 'गहिरो जानकार',
  quiz_level_10: 'अध्ययनशील',
  quiz_level_11: 'क्विज मास्टर',

  quiz_result_title: '🎉 खेल सम्पन्न!',
  quiz_perfect_title: '👑 पर्फेक्ट स्कोर',
  quiz_share_title: 'कति जान्नुहुन्छ? — नेपाली कांग्रेस ज्ञान क्विज',
  quiz_share_description:
    '१५औँ महाधिवेशन विशेष — प्रश्न बैंकबाट हरेक खेलमा नयाँ MCQ चुनौती ।',
  quiz_share_image: '',
  quiz_share_hashtag: '#NepaliCongressQuiz',

  // The card a player shares, and the thank-you above their score.
  quiz_card_headline: 'नेपाली कांग्रेस १५ औं महाधिवेशन विशेष',
  quiz_card_invite: 'मैले त Quiz मा भाग लिएँ । भाग लिनका लागि तपाईं पनि यो लिन्कमा जानुहोस् ।',
  quiz_hashtags: '#playNCquiz #NepaliCongress',

  quiz_thanks_title: 'धन्यवाद ।',
  quiz_candidate_name: 'विकेश अधिकारी',
  quiz_candidate_role:
    'संघीय महाधिवेशन प्रतिनिधि उम्मेदवार, युवा तर्फ (३५ वर्षमुनि) को क्लस्टरमा\nसिन्धुली क्षेत्र ०१',
  quiz_thanks_appeal: '१५ औं महाधिवेशनमा विकेश जस्तो अब्बल युवालाई १ भोट । धन्यवाद । जय नेपाल ।',

  quiz_privacy: 'यो क्विज सञ्चालनका लागि तपाईंको नाम र खेलसम्बन्धी परिणाम मात्र प्रयोग गरिन्छ ।',
  quiz_footer: 'विकेश अधिकारी',
  quiz_footer_note:
    'संघीय महाधिवेशन प्रतिनिधि उम्मेदवार, युवा तर्फ (३५ वर्षमुनि) को क्लस्टरमा\nसिन्धुली क्षेत्र ०१',
};

export type QuizSettings = Record<string, string>;

export async function getQuizSettings(): Promise<QuizSettings> {
  const rows = await heal(
    () => sql<{ skey: string; svalue: string }[]>`SELECT skey, svalue FROM quiz_settings`,
    [] as { skey: string; svalue: string }[],
  );
  const out: QuizSettings = { ...QUIZ_DEFAULTS };
  for (const row of rows) if (row.svalue !== '') out[row.skey] = row.svalue;
  return out;
}

export function qs(settings: QuizSettings, key: string): string {
  return settings[key] ?? QUIZ_DEFAULTS[key] ?? '';
}

export function qsNumber(settings: QuizSettings, key: string): number {
  const value = Number(qs(settings, key));
  return Number.isFinite(value) ? value : Number(QUIZ_DEFAULTS[key] ?? 0);
}

export function qsFlag(settings: QuizSettings, key: string): boolean {
  return qs(settings, key) === '1';
}

export async function saveQuizSettings(values: Record<string, string>): Promise<void> {
  const entries = Object.entries(values);
  if (entries.length === 0) return;
  await heal(async () => {
    for (const [skey, svalue] of entries) {
      await sql`
        INSERT INTO quiz_settings (skey, svalue) VALUES (${skey}, ${svalue})
        ON CONFLICT (skey) DO UPDATE SET svalue = ${svalue}`;
    }
  }, undefined);
}

/** Points a difficulty is worth, from settings. */
export function pointsFor(settings: QuizSettings, difficulty: Difficulty): number {
  return Math.max(0, Math.round(qsNumber(settings, `quiz_points_${difficulty}`)));
}

/** How many questions of each difficulty a game draws. */
export function planShape(settings: QuizSettings): Record<Difficulty, number> {
  return {
    basic: Math.max(0, Math.round(qsNumber(settings, 'quiz_count_basic'))),
    medium: Math.max(0, Math.round(qsNumber(settings, 'quiz_count_medium'))),
    hard: Math.max(0, Math.round(qsNumber(settings, 'quiz_count_hard'))),
  };
}

/* -------------------------------------------------------- open or closed */

export type Availability = { open: boolean; reason: string };

/** Whether the game is playable right now: the switch, and the dates. */
export function availability(settings: QuizSettings, now = new Date()): Availability {
  const closed = qs(settings, 'quiz_closed_message');
  if (!qsFlag(settings, 'quiz_enabled')) return { open: false, reason: closed };

  const from = qs(settings, 'quiz_starts_at');
  const to = qs(settings, 'quiz_ends_at');
  if (from && now < new Date(from)) return { open: false, reason: closed };
  if (to && now > new Date(to)) return { open: false, reason: closed };
  return { open: true, reason: '' };
}

/* ------------------------------------------------------------- questions */

/**
 * The rows a game may draw from.
 *
 * A function rather than a constant: a fragment built at module scope would
 * open a database connection the moment this file is imported, which breaks a
 * build that has no database and any script that loads its environment after
 * its imports.
 */
function live() {
  return sql`active = TRUE AND deleted_at IS NULL AND content_type = 'mcq'`;
}

export async function countsByDifficulty(): Promise<Record<Difficulty, number>> {
  const rows = await heal(
    () => sql<{ difficulty: Difficulty; n: string }[]>`
      SELECT difficulty, COUNT(*)::text AS n FROM quiz_questions
      WHERE ${live()} GROUP BY difficulty`,
    [] as { difficulty: Difficulty; n: string }[],
  );
  const out: Record<Difficulty, number> = { basic: 0, medium: 0, hard: 0 };
  for (const row of rows) if (row.difficulty in out) out[row.difficulty] = Number(row.n);
  return out;
}

/** Distinct facts available per difficulty — the real ceiling on a game. */
export async function factsByDifficulty(): Promise<Record<Difficulty, number>> {
  const rows = await heal(
    () => sql<{ difficulty: Difficulty; n: string }[]>`
      SELECT difficulty, COUNT(DISTINCT COALESCE(NULLIF(fact_key, ''), question_id))::text AS n
      FROM quiz_questions WHERE ${live()} GROUP BY difficulty`,
    [] as { difficulty: Difficulty; n: string }[],
  );
  const out: Record<Difficulty, number> = { basic: 0, medium: 0, hard: 0 };
  for (const row of rows) if (row.difficulty in out) out[row.difficulty] = Number(row.n);
  return out;
}

function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Draw one difficulty's worth of questions.
 *
 * Two questions asking the same fact must never land in the same game, so a
 * fact is taken at most once; the supplied bank makes this essential rather
 * than nice to have, since its 150 rows cover 30 facts. Categories are spread
 * as far as the bank allows: the first pass takes one question per category,
 * and only when that runs out does it come back for seconds.
 */
function draw(pool: QuizQuestion[], want: number): QuizQuestion[] {
  const chosen: QuizQuestion[] = [];
  const usedFacts = new Set<string>();
  const usedCategories = new Set<string>();

  const candidates = shuffle(pool);
  for (const pass of [0, 1]) {
    for (const question of candidates) {
      if (chosen.length >= want) break;
      const fact = question.fact_key || question.question_id;
      if (usedFacts.has(fact)) continue;
      if (pass === 0 && usedCategories.has(question.category)) continue;
      chosen.push(question);
      usedFacts.add(fact);
      usedCategories.add(question.category);
    }
  }
  return chosen;
}

async function poolFor(difficulty: Difficulty): Promise<QuizQuestion[]> {
  return heal(
    () => sql<QuizQuestion[]>`
      SELECT id, question_id, question, option_a, option_b, option_c, option_d,
             correct_option, difficulty, category, explanation, source, source_url,
             image_url, audio_url, fact_key, content_type, active, verified_date
      FROM quiz_questions
      WHERE ${live()} AND difficulty = ${difficulty}`,
    [] as QuizQuestion[],
  );
}

export function optionsOf(question: QuizQuestion): Record<Letter, string> {
  return {
    A: question.option_a, B: question.option_b, C: question.option_c, D: question.option_d,
  };
}

/* -------------------------------------------------------------- sessions */

export type StartedGame = {
  sessionId: string;
  questions: ServedQuestion[];
  maxScore: number;
};

export class QuizError extends Error {
  constructor(message: string, readonly code: string) { super(message); }
}

/**
 * Begin a game: draw the questions, write the plan, and hand back only what
 * the player may see.
 */
export async function startGame(
  name: string, settings: QuizSettings, ipHash: string,
): Promise<StartedGame> {
  const shape = planShape(settings);
  const shuffleOptions = qsFlag(settings, 'quiz_shuffle_options');

  const picked: QuizQuestion[] = [];
  for (const difficulty of DIFFICULTIES) {
    const want = shape[difficulty];
    if (want <= 0) continue;
    const got = draw(await poolFor(difficulty), want);
    if (got.length < want) {
      throw new QuizError(
        `Not enough ${difficulty} questions: ${got.length} of ${want}`,
        'pool',
      );
    }
    picked.push(...got);
  }
  if (picked.length === 0) throw new QuizError('No questions configured', 'pool');

  const ordered = qsFlag(settings, 'quiz_mixed_order') ? shuffle(picked) : picked;

  const plan: PlanItem[] = ordered.map((question) => ({
    id: question.id,
    difficulty: question.difficulty,
    order: shuffleOptions ? shuffle([...LETTERS]) : [...LETTERS],
  }));

  const sessionId = randomUUID();
  const maxScore = ordered.reduce((sum, q) => sum + pointsFor(settings, q.difficulty), 0);

  await heal(() => sql`
    INSERT INTO quiz_sessions (id, player_name, plan, max_score, total_count, ip_hash)
    VALUES (${sessionId}, ${name}, ${sql.json(plan)}, ${maxScore},
            ${ordered.length}, ${ipHash})`, undefined);

  return {
    sessionId,
    maxScore,
    questions: ordered.map((question, index) => serve(question, plan[index], index, settings)),
  };
}

function serve(
  question: QuizQuestion, item: PlanItem, index: number, settings: QuizSettings,
): ServedQuestion {
  const texts = optionsOf(question);
  return {
    id: question.id,
    position: index + 1,
    question: question.question,
    // Shown in the session's own order, and labelled by the position they are
    // shown in, so what the player sends back is a seat number rather than the
    // question's own lettering.
    options: item.order.map((letter, seat) => ({
      letter: LETTERS[seat], text: texts[letter],
    })),
    difficulty: question.difficulty,
    category: question.category,
    image_url: question.image_url,
    points: pointsFor(settings, question.difficulty),
  };
}

export type AnswerOutcome = {
  correct: boolean;
  correctLetter: Letter;
  points: number;
  explanation: string;
  source: string;
  sourceUrl: string;
};

/**
 * Record one answer and say whether it was right.
 *
 * The player's browser sends the seat it tapped, never a verdict. The seat is
 * mapped back through the session's own option order to the question's real
 * lettering, and the answer is read from the question row.
 */
export async function recordAnswer(
  sessionId: string, questionId: number, seat: string, responseMs: number,
  settings: QuizSettings,
): Promise<AnswerOutcome> {
  type PlanRow = { plan: PlanItem[] | string; completed_at: string | null };
  const sessions = await heal(
    () => sql<PlanRow[]>`SELECT plan, completed_at FROM quiz_sessions WHERE id = ${sessionId}`,
    [] as PlanRow[],
  );
  const session = sessions[0];
  if (!session) throw new QuizError('Unknown session', 'session');
  if (session.completed_at) throw new QuizError('Game already finished', 'done');

  const plan = readPlan(session.plan);
  const item = plan.find((x) => x.id === questionId);
  if (!item) throw new QuizError('Question not in this game', 'question');

  const rows = await heal(
    () => sql<QuizQuestion[]>`
      SELECT id, question_id, question, option_a, option_b, option_c, option_d,
             correct_option, difficulty, category, explanation, source, source_url,
             image_url, audio_url, fact_key, content_type, active, verified_date
      FROM quiz_questions WHERE id = ${questionId}`,
    [] as QuizQuestion[],
  );
  const question = rows[0];
  if (!question) throw new QuizError('Question missing', 'question');

  const seatIndex = LETTERS.indexOf(seat as Letter);
  const picked = seatIndex >= 0 ? item.order[seatIndex] : null;
  const correct = picked === question.correct_option;
  const points = correct ? pointsFor(settings, question.difficulty) : 0;
  const position = plan.findIndex((x) => x.id === questionId) + 1;

  // The seat the right answer is sitting in this time round.
  const correctSeat = LETTERS[item.order.indexOf(question.correct_option)] ?? 'A';

  await heal(() => sql`
    INSERT INTO quiz_answers (session_id, question_id, position, selected_option,
                              correct_option, is_correct, points, difficulty, category,
                              response_ms)
    VALUES (${sessionId}, ${questionId}, ${position}, ${picked ?? ''},
            ${question.correct_option}, ${correct}, ${points}, ${question.difficulty},
            ${question.category}, ${Math.max(0, Math.min(responseMs, 3_600_000))})
    ON CONFLICT (session_id, question_id) DO NOTHING`, undefined);

  return {
    correct,
    correctLetter: correctSeat,
    points,
    explanation: question.explanation ?? '',
    source: question.source ?? '',
    sourceUrl: question.source_url ?? '',
  };
}

/* ---------------------------------------------------------------- result */

export type Result = {
  name: string;
  score: number;
  maxScore: number;
  correct: number;
  total: number;
  accuracy: number;
  level: string;
  perfect: boolean;
  breakdown: Record<Difficulty, { correct: number; total: number }>;
  durationMs: number;
};

/** The achievement name for a number of correct answers. */
export function levelFor(settings: QuizSettings, correct: number): string {
  const steps: [number, string][] = [
    [11, qs(settings, 'quiz_level_11')],
    [10, qs(settings, 'quiz_level_10')],
    [8, qs(settings, 'quiz_level_8')],
    [6, qs(settings, 'quiz_level_6')],
    [3, qs(settings, 'quiz_level_3')],
    [0, qs(settings, 'quiz_level_0')],
  ];
  return steps.find(([floor]) => correct >= floor)?.[1] ?? '';
}

/**
 * Work out the result from what was recorded, never from what was sent.
 *
 * Called when the player finishes, and safe to call again: it recomputes from
 * the answer rows every time.
 */
export async function finishGame(sessionId: string, settings: QuizSettings): Promise<Result> {
  type SessionRow = {
    player_name: string; max_score: number; total_count: number; started_at: string;
    completed_at: string | null;
  };
  const sessions = await heal(
    () => sql<SessionRow[]>`
      SELECT player_name, max_score, total_count, started_at, completed_at
      FROM quiz_sessions WHERE id = ${sessionId}`,
    [] as SessionRow[],
  );
  const session = sessions[0];
  if (!session) throw new QuizError('Unknown session', 'session');

  const answers = await heal(
    () => sql<{ difficulty: Difficulty; is_correct: boolean; points: number }[]>`
      SELECT difficulty, is_correct, points FROM quiz_answers WHERE session_id = ${sessionId}`,
    [] as { difficulty: Difficulty; is_correct: boolean; points: number }[],
  );

  const breakdown: Record<Difficulty, { correct: number; total: number }> = {
    basic: { correct: 0, total: 0 },
    medium: { correct: 0, total: 0 },
    hard: { correct: 0, total: 0 },
  };
  let score = 0;
  let correct = 0;
  for (const answer of answers) {
    const bucket = breakdown[answer.difficulty] ?? breakdown.basic;
    bucket.total += 1;
    if (answer.is_correct) { bucket.correct += 1; correct += 1; score += answer.points; }
  }

  const total = session.total_count || answers.length;
  const accuracy = total > 0 ? Math.round((correct / total) * 1000) / 10 : 0;
  const level = levelFor(settings, correct);
  const durationMs = Math.max(0, Date.now() - new Date(session.started_at).getTime());

  if (!session.completed_at) {
    await heal(() => sql`
      UPDATE quiz_sessions
      SET score = ${score}, correct_count = ${correct}, accuracy = ${accuracy},
          level = ${level}, duration_ms = ${Math.min(durationMs, 86_400_000)},
          completed_at = NOW()
      WHERE id = ${sessionId} AND completed_at IS NULL`, undefined);
  }

  return {
    name: session.player_name,
    score,
    maxScore: session.max_score,
    correct,
    total,
    accuracy,
    level,
    perfect: total > 0 && correct === total,
    breakdown,
    durationMs,
  };
}

/**
 * The plan, whatever shape it comes back in.
 *
 * A jsonb column normally reads back as a value, but a row written before the
 * insert was corrected holds the JSON as a string. Parsing here means an
 * in-flight game from that moment still finishes rather than erroring.
 */
function readPlan(value: PlanItem[] | string): PlanItem[] {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as PlanItem[]) : [];
  } catch {
    return [];
  }
}

/** A stable, non-reversible stand-in for an address, for rate limiting only. */
export function hashIp(ip: string): string {
  return createHash('sha256').update(`quiz:${ip}`).digest('hex').slice(0, 64);
}

/** How many games this address started in the last minute. */
export async function recentStarts(ipHash: string): Promise<number> {
  const rows = await heal(
    () => sql<{ n: string }[]>`
      SELECT COUNT(*)::text AS n FROM quiz_sessions
      WHERE ip_hash = ${ipHash} AND started_at > NOW() - INTERVAL '1 minute'`,
    [{ n: '0' }],
  );
  return Number(rows[0]?.n ?? 0);
}
