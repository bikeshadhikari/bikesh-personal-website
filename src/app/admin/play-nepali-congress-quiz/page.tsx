import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import Shell from '@/components/admin/Shell';
import { ActionForm, ImportForms } from '@/components/admin/QuizForms';
import FileUpload from '@/components/admin/FileUpload';
import { AUDIO_ACCEPT } from '@/lib/upload-types';
import { getQuizSettings, planShape, qs, qsFlag } from '@/lib/quiz';
import {
  gamesPerDay, listQuestions, listSessions, mostMissed, quizStats, readiness,
} from '@/lib/quiz-admin';
import { formatDate, humanDuration } from '@/lib/utils';
import {
  deleteQuestionAction, importAction, reviewImportAction, saveSettingsAction,
  toggleQuestionAction,
} from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Play Nepali Congress Quiz' };

const TABS = [
  ['dashboard', 'Dashboard'],
  ['questions', 'Questions'],
  ['settings', 'Game settings'],
  ['appearance', 'Appearance & text'],
  ['results', 'Results'],
  ['import', 'Import'],
  ['export', 'Export'],
] as const;

type Search = Promise<Record<string, string | string[] | undefined>>;

const one = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] ?? '' : value ?? '';

export default async function QuizAdminPage({ searchParams }: { searchParams: Search }) {
  if (!(await currentUser())) redirect('/admin/login?next=/admin/play-nepali-congress-quiz');

  const params = await searchParams;
  const tab = TABS.some(([key]) => key === one(params.tab)) ? one(params.tab) : 'dashboard';
  const settings = await getQuizSettings();

  return (
    <Shell title="Play Nepali Congress Quiz" current="play-nepali-congress-quiz">
      <p className="page-intro">
        Everything about the game at{' '}
        <Link href="/play-nepali-congress-quiz" target="_blank" rel="noopener noreferrer">
          /play-nepali-congress-quiz
        </Link>{' '}
        lives here.
      </p>

      <nav className="quiz-tabs" aria-label="Quiz sections">
        {TABS.map(([key, label]) => (
          <Link
            key={key}
            href={`/admin/play-nepali-congress-quiz?tab=${key}`}
            className={key === tab ? 'is-on' : undefined}
            aria-current={key === tab ? 'page' : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>

      {tab === 'dashboard' && <Dashboard settings={settings} />}
      {tab === 'questions' && <Questions params={params} />}
      {tab === 'settings' && <GameSettings settings={settings} />}
      {tab === 'appearance' && <Appearance settings={settings} />}
      {tab === 'results' && <Results params={params} />}
      {tab === 'import' && (
        <section className="panel">
          <div className="panel-head"><h3>Bulk import</h3></div>
          <ImportForms reviewAction={reviewImportAction} importAction={importAction} />
        </section>
      )}
      {tab === 'export' && <Export />}
    </Shell>
  );
}

/* ---------------------------------------------------------------- tabs */

async function Dashboard({ settings }: { settings: Record<string, string> }) {
  const [stats, check, perDay, missed] = await Promise.all([
    quizStats(), readiness(planShape(settings)), gamesPerDay(14), mostMissed(6),
  ]);
  const enabled = qsFlag(settings, 'quiz_enabled');
  const peak = Math.max(1, ...perDay.map((day) => day.games));

  const cards: [string, string | number][] = [
    ['Total questions', stats.questions],
    ['Active', stats.active],
    ['Basic', stats.byDifficulty.basic],
    ['Medium', stats.byDifficulty.medium],
    ['Hard', stats.byDifficulty.hard],
    ['Games started', stats.games],
    ['Completed', stats.completed],
    ['Unique players', stats.players],
    ['Average score', stats.avgScore],
    ['Average accuracy', `${stats.avgAccuracy}%`],
    ['Highest score', stats.bestScore],
  ];

  return (
    <>
      <section className={`quiz-status${enabled ? ' is-on' : ' is-off'}`}>
        <h3>{enabled ? '🟢 Quiz is live' : '🔴 Quiz is switched off'}</h3>
        <p>
          {enabled
            ? 'Anyone with the link can play right now.'
            : `Visitors see: “${qs(settings, 'quiz_closed_message')}”`}
        </p>
        <Link className="btn btn-ghost" href="/admin/play-nepali-congress-quiz?tab=settings">
          Change
        </Link>
      </section>

      {!check.ok && (
        <section className="quiz-report is-bad">
          <p><strong>The game cannot be switched on yet.</strong></p>
          <ul>
            {check.lines.filter((line) => !line.ok).map((line) => (
              <li key={line.difficulty}>
                {line.difficulty}: {line.facts} distinct of {line.need} required
                {' '}({line.have} rows, but questions asking the same fact only fill one slot)
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="stat-grid">
        {cards.map(([label, value]) => (
          <div className="stat-card" key={label}>
            <span className="stat-value">{value}</span>
            <span className="stat-label">{label}</span>
          </div>
        ))}
      </div>

      <section className="panel">
        <div className="panel-head"><h3>Distinct facts in the bank</h3></div>
        <p className="muted">
          Two questions asking the same fact with the same options never appear in one
          game, so this — not the row count — is what a round can draw from.
        </p>
        <ul className="quiz-facts">
          {check.lines.map((line) => (
            <li key={line.difficulty}>
              <span>{line.difficulty}</span>
              <strong>{line.facts}</strong>
              <small>distinct, from {line.have} questions · {line.need} needed per game</small>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <div className="panel-head"><h3>Games per day</h3></div>
        {perDay.length === 0 ? <p className="muted">No games yet.</p> : (
          <ul className="quiz-chart">
            {perDay.map((day) => (
              <li key={day.day}>
                <span className="quiz-bar" style={{ height: `${(day.games / peak) * 100}%` }} />
                <small>{day.day.slice(5)}</small>
                <em>{day.games}</em>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel">
        <div className="panel-head"><h3>Most missed questions</h3></div>
        {missed.length === 0 ? <p className="muted">Not enough answers yet.</p> : (
          <table className="data-table compact">
            <tbody>
              {missed.map((row) => (
                <tr key={row.question}>
                  <td>{row.question}</td>
                  <td><span className={`status status-${row.difficulty}`}>{row.difficulty}</span></td>
                  <td className="num">{row.wrong} / {row.asked} wrong</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}

async function Questions({ params }: { params: Record<string, string | string[] | undefined> }) {
  const search = one(params.q);
  const difficulty = one(params.difficulty);
  const page = Math.max(1, Number(one(params.page)) || 1);
  const { rows, total } = await listQuestions({ search, difficulty, page });
  const pages = Math.max(1, Math.ceil(total / 25));

  return (
    <section className="panel">
      <div className="panel-head">
        <h3>Questions <small className="muted">({total})</small></h3>
      </div>

      <form className="quiz-filters" method="get">
        <input type="hidden" name="tab" value="questions" />
        <input type="search" name="q" defaultValue={search} placeholder="Search question, id or category" />
        <select name="difficulty" defaultValue={difficulty} aria-label="Difficulty">
          <option value="">All difficulties</option>
          <option value="basic">Basic</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <button type="submit" className="btn btn-ghost">Filter</button>
      </form>

      {rows.length === 0 ? <p className="muted">Nothing matches.</p> : (
        <table className="data-table compact">
          <thead>
            <tr>
              <th>ID</th><th>Question</th><th>Difficulty</th><th>Category</th>
              <th>Answer</th><th>Status</th><th>Updated</th><th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td><code>{row.question_id}</code></td>
                <td>{row.question.length > 88 ? `${row.question.slice(0, 88)}…` : row.question}</td>
                <td><span className={`status status-${row.difficulty}`}>{row.difficulty}</span></td>
                <td>{row.category}</td>
                <td className="num">{row.correct_option}</td>
                <td>
                  <span className={`status status-${row.active ? 'published' : 'draft'}`}>
                    {row.active ? 'active' : 'off'}
                  </span>
                </td>
                <td className="num">{formatDate(row.updated_at, { day: 'numeric', month: 'short' })}</td>
                <td className="row-actions">
                  <form action={toggleQuestionAction}>
                    <input type="hidden" name="id" value={row.id} />
                    <button type="submit" className="btn btn-ghost btn-xs">
                      {row.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </form>
                  <form action={deleteQuestionAction}>
                    <input type="hidden" name="id" value={row.id} />
                    <button type="submit" className="btn btn-ghost btn-xs">Retire</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {pages > 1 && (
        <nav className="pager">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={`/admin/play-nepali-congress-quiz?tab=questions&page=${n}${search ? `&q=${encodeURIComponent(search)}` : ''}${difficulty ? `&difficulty=${difficulty}` : ''}`}
              className={n === page ? 'is-on' : undefined}
            >
              {n}
            </Link>
          ))}
        </nav>
      )}

      <p className="muted">
        Retiring a question hides it from new games and keeps every past answer intact.
      </p>
    </section>
  );
}

/** One settings field, rendered from the value already stored. */
function Field(
  { name, label, value, hint, type = 'text', rows, options }:
  {
    name: string; label: string; value: string; hint?: string;
    type?: 'text' | 'textarea' | 'number' | 'checkbox' | 'color' | 'datetime-local'
      | 'image' | 'audio';
    rows?: number; options?: [string, string][];
  },
) {
  const id = `f-${name}`;

  // A picture or a recording goes up through the media library, so the form
  // only ever carries the address it comes back with.
  if (type === 'image' || type === 'audio') {
    return (
      <div className="field field-full">
        <label htmlFor={`f-${name}`}>{label}</label>
        <FileUpload
          name={name}
          value={value}
          folder="quiz"
          isImage={type === 'image'}
          accept={type === 'audio' ? AUDIO_ACCEPT : undefined}
        />
        {hint && <p className="hint">{hint}</p>}
      </div>
    );
  }
  if (type === 'checkbox') {
    return (
      <div className="field">
        <label className="checkbox" htmlFor={id}>
          <input type="hidden" name={`${name}__present`} value="1" />
          <input id={id} type="checkbox" name={name} value="1" defaultChecked={value === '1'} />
          <span>{label}</span>
        </label>
        {hint && <p className="hint">{hint}</p>}
      </div>
    );
  }
  return (
    <div className={`field${type === 'textarea' ? ' field-full' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {options ? (
        <select id={id} name={name} defaultValue={value}>
          {options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}
        </select>
      ) : type === 'textarea' ? (
        <textarea id={id} name={name} defaultValue={value} rows={rows ?? 3} />
      ) : (
        <input id={id} type={type} name={name} defaultValue={value} />
      )}
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}

function GameSettings({ settings }: { settings: Record<string, string> }) {
  const v = (key: string) => qs(settings, key);
  return (
    <section className="panel">
      <div className="panel-head"><h3>Game settings</h3></div>
      <ActionForm action={saveSettingsAction} submitLabel="Save settings">
        <div className="field-grid">
          <Field name="quiz_enabled" type="checkbox" label="Quiz is live" value={v('quiz_enabled')}
                 hint="Switching this on is refused while the bank cannot fill a round." />
          <Field name="quiz_closed_message" label="Message when closed" value={v('quiz_closed_message')} />
          <Field name="quiz_starts_at" type="datetime-local" label="Opens at" value={v('quiz_starts_at')}
                 hint="Leave empty for no start date." />
          <Field name="quiz_ends_at" type="datetime-local" label="Closes at" value={v('quiz_ends_at')}
                 hint="Leave empty for no end date." />

          <Field name="quiz_count_basic" type="number" label="Basic questions per game" value={v('quiz_count_basic')} />
          <Field name="quiz_count_medium" type="number" label="Medium questions per game" value={v('quiz_count_medium')} />
          <Field name="quiz_count_hard" type="number" label="Hard questions per game" value={v('quiz_count_hard')} />

          <Field name="quiz_points_basic" type="number" label="Points per basic answer" value={v('quiz_points_basic')} />
          <Field name="quiz_points_medium" type="number" label="Points per medium answer" value={v('quiz_points_medium')} />
          <Field name="quiz_points_hard" type="number" label="Points per hard answer" value={v('quiz_points_hard')} />

          <Field name="quiz_shuffle_options" type="checkbox" label="Shuffle the options each game" value={v('quiz_shuffle_options')} />
          <Field name="quiz_mixed_order" type="checkbox" label="Mix the difficulties instead of going in order" value={v('quiz_mixed_order')} />
          <Field name="quiz_sound" type="checkbox" label="Offer sound" value={v('quiz_sound')} />
          <Field name="quiz_animations" type="checkbox" label="Animations" value={v('quiz_animations')} />
        </div>
      </ActionForm>
    </section>
  );
}

function Appearance({ settings }: { settings: Record<string, string> }) {
  const v = (key: string) => qs(settings, key);
  return (
    <section className="panel">
      <div className="panel-head"><h3>Wording, levels and colours</h3></div>
      <ActionForm action={saveSettingsAction} submitLabel="Save">
        <div className="field-grid">
          <Field name="quiz_emblem" type="image" label="Emblem picture" value={v('quiz_emblem')}
                 hint="Shown in a round plate above everything on the opening screen. Any shape — it is fitted and its edges faded into the circle." />
          <Field name="quiz_emblem_caption" label="Emblem caption" value={v('quiz_emblem_caption')} />
          <Field name="quiz_emblem_audio" type="audio" label="जय नेपाल recording" value={v('quiz_emblem_audio')}
                 hint="MP3, M4A, MP4, WAV, OGG or a voice memo straight off your phone. Strongly recommended: without one the browser has to speak the words, and the browser inside Messenger or Instagram often cannot. Up to 4 MB." />

          <Field name="quiz_candidate_badge" label="Candidacy badge" value={v('quiz_candidate_badge')} />
          <Field name="quiz_candidate_sub" label="Candidacy second line" value={v('quiz_candidate_sub')} />

          <Field name="quiz_badge" label="Badge over the title" value={v('quiz_badge')} />
          <Field name="quiz_title" label="Title" value={v('quiz_title')} />
          <Field name="quiz_subtitle" label="Subtitle" value={v('quiz_subtitle')} />
          <Field name="quiz_start_button" label="Start button" value={v('quiz_start_button')} />
          <Field name="quiz_name_label" label="Name field label" value={v('quiz_name_label')} />
          <Field name="quiz_name_placeholder" label="Name field placeholder" value={v('quiz_name_placeholder')} />
          <Field name="quiz_hero_text" type="textarea" label="Opening paragraph" value={v('quiz_hero_text')} rows={2} />
          <Field name="quiz_chips" type="textarea" label="Topic chips (one per line)" value={v('quiz_chips')} rows={5} />

          <Field name="quiz_transition_basic" label="After the basic round" value={v('quiz_transition_basic')} />
          <Field name="quiz_transition_medium" label="After the medium round" value={v('quiz_transition_medium')} />
          <Field name="quiz_transition_final" label="Before the last question" value={v('quiz_transition_final')} />

          <Field name="quiz_level_0" label="Level · 0–2 correct" value={v('quiz_level_0')} />
          <Field name="quiz_level_3" label="Level · 3–5" value={v('quiz_level_3')} />
          <Field name="quiz_level_6" label="Level · 6–7" value={v('quiz_level_6')} />
          <Field name="quiz_level_8" label="Level · 8–9" value={v('quiz_level_8')} />
          <Field name="quiz_level_10" label="Level · 10" value={v('quiz_level_10')} />
          <Field name="quiz_level_11" label="Level · all correct" value={v('quiz_level_11')} />

          <Field name="quiz_thanks_title" label="Thank-you line" value={v('quiz_thanks_title')} />
          <Field name="quiz_candidate_name" label="Candidate name" value={v('quiz_candidate_name')} />
          <Field name="quiz_candidate_role" type="textarea" rows={2}
                 label="Candidate details (one line each)" value={v('quiz_candidate_role')} />
          <Field name="quiz_thanks_appeal" type="textarea" rows={2}
                 label="Closing line above the score" value={v('quiz_thanks_appeal')} />

          <Field name="quiz_welcome_role" type="textarea" rows={2}
                 label="Greeting · role line" value={v('quiz_welcome_role')} />
          <Field name="quiz_welcome_name" label="Greeting · name" value={v('quiz_welcome_name')} />
          <Field name="quiz_welcome_line" label="Greeting · welcome line" value={v('quiz_welcome_line')} />

          <Field name="quiz_card_headline" label="Share card headline" value={v('quiz_card_headline')} />
          <Field name="quiz_share_url" label="Link printed on the card" value={v('quiz_share_url')}
                 hint="Leave empty to use whatever address the player is on." />
          <Field name="quiz_card_invite" type="textarea" rows={2}
                 label="Share card invitation" value={v('quiz_card_invite')} />
          <Field name="quiz_hashtags" label="Hashtags" value={v('quiz_hashtags')} />

          <Field name="quiz_result_title" label="Result heading" value={v('quiz_result_title')} />
          <Field name="quiz_perfect_title" label="Perfect score heading" value={v('quiz_perfect_title')} />
          <Field name="quiz_share_title" label="Share title" value={v('quiz_share_title')} />
          <Field name="quiz_share_description" type="textarea" label="Share description" value={v('quiz_share_description')} rows={2} />
          <Field name="quiz_share_image" type="image" label="Share picture" value={v('quiz_share_image')}
                 hint="Used when the link itself is pasted somewhere. Leave empty and a card is drawn instead. The card a player shares after playing is drawn separately and is not affected." />
          <Field name="quiz_share_hashtag" label="Hashtag" value={v('quiz_share_hashtag')} />

          <Field name="quiz_colour_red" type="color" label="Red" value={v('quiz_colour_red')} />
          <Field name="quiz_colour_navy" type="color" label="Navy" value={v('quiz_colour_navy')} />
          <Field name="quiz_colour_gold" type="color" label="Gold" value={v('quiz_colour_gold')} />
          <Field name="quiz_colour_cream" type="color" label="Cream" value={v('quiz_colour_cream')} />

          <Field name="quiz_privacy" type="textarea" label="Privacy notice" value={v('quiz_privacy')} rows={2} />
          <Field name="quiz_footer" label="Footer name" value={v('quiz_footer')} />
          <Field name="quiz_footer_note" type="textarea" rows={2}
                 label="Footer details (one line each)" value={v('quiz_footer_note')} />
        </div>
      </ActionForm>
    </section>
  );
}

async function Results({ params }: { params: Record<string, string | string[] | undefined> }) {
  const search = one(params.q);
  const since = one(params.since);
  const page = Math.max(1, Number(one(params.page)) || 1);
  const { rows, total } = await listSessions({ search, since, page });

  return (
    <section className="panel">
      <div className="panel-head">
        <h3>Results <small className="muted">({total})</small></h3>
        <a href="/admin/play-nepali-congress-quiz/export?what=sessions">Download CSV</a>
      </div>

      <form className="quiz-filters" method="get">
        <input type="hidden" name="tab" value="results" />
        <input type="search" name="q" defaultValue={search} placeholder="Search a player or session id" />
        <input type="date" name="since" defaultValue={since} aria-label="From date" />
        <button type="submit" className="btn btn-ghost">Filter</button>
      </form>

      {rows.length === 0 ? <p className="muted">No games yet.</p> : (
        <table className="data-table compact">
          <thead>
            <tr>
              <th>Player</th><th>Score</th><th>Correct</th><th>Accuracy</th>
              <th>Level</th><th>Took</th><th>Started</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.player_name}</td>
                <td className="num">{row.score} / {row.max_score}</td>
                <td className="num">{row.correct_count} / {row.total_count}</td>
                <td className="num">{Number(row.accuracy)}%</td>
                <td>{row.level || <span className="muted">unfinished</span>}</td>
                <td className="num">
                  {row.completed_at ? humanDuration(Math.round(row.duration_ms / 1000)) : '—'}
                </td>
                <td className="num">{formatDate(row.started_at, { day: 'numeric', month: 'short' })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function Export() {
  const sets: [string, string, string][] = [
    ['questions', 'Questions', 'The whole bank, in the same shape the importer reads.'],
    ['sessions', 'Results', 'One row per game: player, score, accuracy, level, timings.'],
    ['answers', 'Answers', 'One row per answer, for analysis of individual questions.'],
  ];
  return (
    <section className="panel">
      <div className="panel-head"><h3>Export</h3></div>
      <ul className="quiz-exports">
        {sets.map(([key, label, note]) => (
          <li key={key}>
            <div>
              <strong>{label}</strong>
              <small>{note}</small>
            </div>
            <a className="btn btn-ghost" href={`/admin/play-nepali-congress-quiz/export?what=${key}`}>
              Download CSV
            </a>
          </li>
        ))}
      </ul>
      <p className="muted">
        Exports carry the player names people typed and nothing else about them — no address,
        no contact details, because none are collected.
      </p>
    </section>
  );
}
