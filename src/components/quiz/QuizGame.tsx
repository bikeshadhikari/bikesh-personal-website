'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Sound } from '@/lib/quiz-sound';
import ResultCard from './ResultCard';

type Letter = 'A' | 'B' | 'C' | 'D';
type Difficulty = 'basic' | 'medium' | 'hard';

type ServedQuestion = {
  id: number;
  position: number;
  question: string;
  options: { letter: Letter; text: string }[];
  difficulty: Difficulty;
  category: string;
  image_url: string;
  points: number;
};

type Outcome = {
  correct: boolean; correctLetter: Letter; points: number;
  explanation: string; source: string; sourceUrl: string;
};

type Result = {
  name: string; score: number; maxScore: number; correct: number; total: number;
  accuracy: number; level: string; perfect: boolean; durationMs: number;
  breakdown: Record<Difficulty, { correct: number; total: number }>;
};

export type QuizText = Record<string, string>;

type Phase = 'intro' | 'welcome' | 'loading' | 'playing' | 'transition' | 'result';

/** How long the greeting is held while the questions are being fetched. */
const WELCOME_MS = 2600;

const SAVE_KEY = 'ncq:game';
const DIFF_LABEL: Record<Difficulty, string> = {
  basic: 'आधारभूत', medium: 'मध्यम', hard: 'कठिन',
};
const DIFF_DOT: Record<Difficulty, string> = { basic: '🟢', medium: '🟡', hard: '🔴' };

/** Saved between questions so a refresh does not throw the game away. */
type Saved = {
  sessionId: string; name: string; questions: ServedQuestion[];
  at: number; answers: Record<number, Letter>; maxScore: number; savedAt: number;
};

/** localStorage is absent in some in-app browsers; memory stands in for it. */
const memory = new Map<string, string>();
function store(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
    return;
  } catch { /* fall through */ }
  if (value === null) memory.delete(key); else memory.set(key, value);
}
function read(key: string): string | null {
  try {
    const found = window.localStorage.getItem(key);
    if (found !== null) return found;
  } catch { /* fall through */ }
  return memory.get(key) ?? null;
}

export default function QuizGame({ text, privacyNote }: { text: QuizText; privacyNote: string }) {
  const t = useCallback((key: string) => text[key] ?? '', [text]);

  const [phase, setPhase] = useState<Phase>('intro');
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [error, setError] = useState('');

  const [sessionId, setSessionId] = useState('');
  const [questions, setQuestions] = useState<ServedQuestion[]>([]);
  const [maxScore, setMaxScore] = useState(0);
  const [at, setAt] = useState(0);
  const [picked, setPicked] = useState<Letter | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [answers, setAnswers] = useState<Record<number, Letter>>({});
  const [running, setRunning] = useState(0);
  const [streak, setStreak] = useState(0);
  const [badge, setBadge] = useState('');
  const [transition, setTransition] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [resume, setResume] = useState<Saved | null>(null);
  const [soundOn, setSoundOn] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const sound = useRef<Sound | null>(null);
  const shownAt = useRef(Date.now());
  const liveRegion = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    sound.current = new Sound();
    setSoundOn(sound.current.enabled);
    return () => sound.current?.close();
  }, []);

  const cue = useCallback((name_: Parameters<Sound['play']>[0]) => {
    sound.current?.play(name_);
  }, []);

  // An unfinished game from a previous visit.
  useEffect(() => {
    const raw = read(SAVE_KEY);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw) as Saved;
      // Older than a day is stale rather than interrupted.
      if (!saved.sessionId || Date.now() - saved.savedAt > 86_400_000) { store(SAVE_KEY, null); return; }
      if (saved.at >= saved.questions.length) { store(SAVE_KEY, null); return; }
      setResume(saved);
    } catch {
      store(SAVE_KEY, null);
    }
  }, []);

  const save = useCallback((next: Partial<Saved>) => {
    const current: Saved = {
      sessionId, name, questions, at, answers, maxScore, savedAt: Date.now(), ...next,
    };
    if (!current.sessionId) return;
    store(SAVE_KEY, JSON.stringify(current));
  }, [sessionId, name, questions, at, answers, maxScore]);

  const question = questions[at];
  const answered = picked !== null;

  useEffect(() => {
    if (phase !== 'playing' || answered) { sound.current?.stopPulse(); return; }
    sound.current?.startPulse();
    return () => sound.current?.stopPulse();
  }, [phase, answered, at]);

  /* ------------------------------------------------------------- start */

  const begin = async (playerName: string) => {
    setNameError('');
    setError('');
    const trimmed = playerName.replace(/\s+/g, ' ').trim();
    if (trimmed.length < 2) {
      setNameError('कृपया आफ्नो नाम लेख्नुहोस् (कम्तीमा २ अक्षर) ।');
      return;
    }

    // Started from a real tap, which is the only moment a mobile browser will
    // let an AudioContext open.
    sound.current?.wake();
    cue('start');
    // The greeting shows straight away and the questions are fetched behind
    // it, so the wait costs the player nothing.
    setPhase('welcome');
    const shown = Date.now();

    try {
      const response = await fetch('/api/quiz/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.error ?? 'खेल सुरु गर्न समस्या भयो ।');
        setPhase('intro');
        return;
      }

      // Hold the greeting for what is left of its time, never longer.
      const left = WELCOME_MS - (Date.now() - shown);
      if (left > 0) await new Promise((resolve) => window.setTimeout(resolve, left));

      setSessionId(data.sessionId);
      setQuestions(data.questions);
      setMaxScore(data.maxScore);
      setName(data.name);
      setAt(0); setPicked(null); setOutcome(null); setAnswers({});
      setRunning(0); setStreak(0); setBadge('');
      shownAt.current = Date.now();
      setPhase('playing');
      store(SAVE_KEY, JSON.stringify({
        sessionId: data.sessionId, name: data.name, questions: data.questions,
        at: 0, answers: {}, maxScore: data.maxScore, savedAt: Date.now(),
      } satisfies Saved));
    } catch {
      setError('खेल सुरु गर्न समस्या भयो ।');
      setPhase('intro');
    }
  };

  const continueSaved = (saved: Saved) => {
    sound.current?.wake();
    setSessionId(saved.sessionId);
    setName(saved.name);
    setQuestions(saved.questions);
    setMaxScore(saved.maxScore);
    setAnswers(saved.answers ?? {});
    setAt(saved.at);
    setPicked(null);
    setOutcome(null);
    setResume(null);
    shownAt.current = Date.now();
    setPhase('playing');
  };

  /* ------------------------------------------------------------ answer */

  const choose = async (letter: Letter) => {
    if (answered || !question || submitting) return;
    setPicked(letter);
    setSubmitting(true);
    sound.current?.stopPulse();
    cue('lock');

    try {
      const response = await fetch('/api/quiz/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId, questionId: question.id, option: letter,
          responseMs: Date.now() - shownAt.current,
        }),
      });
      if (!response.ok) throw new Error('rejected');
      const data = (await response.json()) as Outcome;
      setOutcome(data);
      cue(data.correct ? 'correct' : 'wrong');

      if (data.correct) {
        setRunning((r) => r + data.points);
        const next = streak + 1;
        setStreak(next);
        if (next === 3) { setBadge('🔥 ३ कम्बो'); cue('achievement'); }
        if (next === 5) { setBadge('⚡ ५ हट स्ट्रिक'); cue('achievement'); }
      } else {
        setStreak(0);
      }

      const nextAnswers = { ...answers, [question.id]: letter };
      setAnswers(nextAnswers);
      save({ answers: nextAnswers });
      if (liveRegion.current) {
        liveRegion.current.textContent = data.correct ? 'सही उत्तर' : 'गलत उत्तर';
      }
    } catch {
      // The tap is not lost: the player can try the same option again.
      setPicked(null);
      setError('उत्तर पठाउन समस्या भयो । फेरि थिच्नुहोस् ।');
    } finally {
      setSubmitting(false);
    }
  };

  /* -------------------------------------------------------------- next */

  const advance = async () => {
    cue('next');
    setError('');
    const next = at + 1;

    if (next >= questions.length) { await finish(); return; }

    const from = questions[at].difficulty;
    const to = questions[next].difficulty;
    const last = next === questions.length - 1;

    setPicked(null);
    setOutcome(null);
    setBadge('');

    if (from !== to || last) {
      const message = last
        ? t('quiz_transition_final')
        : to === 'medium' ? t('quiz_transition_basic') : t('quiz_transition_medium');
      setTransition(message);
      setPhase('transition');
      cue(last ? 'final' : 'level');
      window.setTimeout(() => {
        setAt(next);
        save({ at: next });
        shownAt.current = Date.now();
        setPhase('playing');
      }, 1400);
      return;
    }

    setAt(next);
    save({ at: next });
    shownAt.current = Date.now();
  };

  const finish = async () => {
    setPhase('loading');
    try {
      const response = await fetch('/api/quiz/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      if (!response.ok) throw new Error('rejected');
      const data = (await response.json()) as Result;
      setResult(data);
      store(SAVE_KEY, null);
      setPhase('result');
      cue(data.perfect ? 'perfect' : 'result');
    } catch {
      setError('परिणाम सुरक्षित गर्न समस्या भयो ।');
      setPhase('playing');
    }
  };

  /* --------------------------------------------------------- keyboard */

  useEffect(() => {
    if (phase !== 'playing' || !question) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const key = event.key.toUpperCase();
      if (!answered && ['A', 'B', 'C', 'D'].includes(key)) {
        event.preventDefault();
        void choose(key as Letter);
      }
      if (answered && (key === 'ENTER' || key === ' ')) { event.preventDefault(); void advance(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // A half-played game is worth a warning before the tab closes.
  useEffect(() => {
    if (phase !== 'playing' && phase !== 'transition') return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [phase]);

  const progress = questions.length > 0 ? ((at + (answered ? 1 : 0)) / questions.length) * 100 : 0;

  /* ----------------------------------------------------------- render */

  if (phase === 'result' && result) {
    return (
      <ResultView
        result={result} text={text} maxScore={maxScore}
        onReplay={() => { cue('click'); setResult(null); setPhase('intro'); }}
        soundOn={soundOn}
        onSound={() => { const on = sound.current?.toggle() ?? false; setSoundOn(on); }}
      />
    );
  }

  if (phase === 'intro') {
    return (
      <div className="q-card q-intro">
        <SoundToggle on={soundOn} onToggle={() => {
          const on = sound.current?.toggle() ?? false; setSoundOn(on);
        }} />

        <p className="q-badge">{t('quiz_badge')}</p>
        <h1 className="q-title">{t('quiz_title')}</h1>
        <p className="q-subtitle">{t('quiz_subtitle')}</p>

        <ul className="q-chips">
          {t('quiz_chips').split('\n').filter(Boolean).map((chip) => (
            <li key={chip}>{chip}</li>
          ))}
        </ul>

        <p className="q-hero-text">{t('quiz_hero_text')}</p>

        {resume && (
          <div className="q-resume" role="status">
            <p>तपाईंको खेल जारी छ ।</p>
            <div className="q-resume-actions">
              <button type="button" className="q-btn q-btn-solid" onClick={() => continueSaved(resume)}>
                जारी राख्नुहोस्
              </button>
              <button
                type="button" className="q-btn q-btn-ghost"
                onClick={() => { store(SAVE_KEY, null); setResume(null); }}
              >
                नयाँ खेल
              </button>
            </div>
          </div>
        )}

        <form
          className="q-start"
          onSubmit={(event) => { event.preventDefault(); void begin(name); }}
        >
          <label htmlFor="q-name">{t('quiz_name_label')}</label>
          <input
            id="q-name" name="name" type="text" autoComplete="name"
            placeholder={t('quiz_name_placeholder')} value={name}
            maxLength={80} required minLength={2}
            aria-describedby={nameError ? 'q-name-error' : undefined}
            aria-invalid={nameError ? true : undefined}
            onChange={(event) => { setName(event.target.value); setNameError(''); }}
          />
          {nameError && <p className="q-error" id="q-name-error" role="alert">{nameError}</p>}
          {error && <p className="q-error" role="alert">{error}</p>}
          <button type="submit" className="q-btn q-btn-start">{t('quiz_start_button')}</button>
        </form>

        <p className="q-shape">
          {t('quiz_count_basic')} BASIC • {t('quiz_count_medium')} MEDIUM • {t('quiz_count_hard')} HARD
        </p>
        <p className="q-privacy">{privacyNote}</p>
      </div>
    );
  }

  if (phase === 'welcome') {
    return (
      <div className="q-card q-welcome" role="status" aria-live="polite">
        <span className="q-welcome-flag" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/political/flag.png" alt="" />
        </span>
        <p className="q-welcome-role">{t('quiz_welcome_role')}</p>
        <p className="q-welcome-name">{t('quiz_welcome_name')}</p>
        <p className="q-welcome-line">{t('quiz_welcome_line')}</p>
        <span className="q-bar"><span /></span>
      </div>
    );
  }

  if (phase === 'loading') {
    return (
      <div className="q-card q-loading" role="status" aria-live="polite">
        <span className="q-brain" aria-hidden="true">🧠</span>
        <p>प्रश्न तयार हुँदैछ…</p>
        <span className="q-bar"><span /></span>
      </div>
    );
  }

  if (phase === 'transition') {
    return (
      <div className="q-card q-transition" role="status" aria-live="polite">
        <p>{transition}</p>
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className="q-card q-play">
      <div className="q-top">
        <span className="q-step">प्रश्न {question.position} / {questions.length}</span>
        <span className="q-running">{running} अंक</span>
        <SoundToggle on={soundOn} inline onToggle={() => {
          const on = sound.current?.toggle() ?? false; setSoundOn(on);
        }} />
      </div>

      <div className="q-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100}
           aria-valuenow={Math.round(progress)} aria-label="प्रगति">
        <span style={{ width: `${progress}%` }} />
      </div>

      <p className={`q-level q-level-${question.difficulty}`}>
        {DIFF_DOT[question.difficulty]} {DIFF_LABEL[question.difficulty]}
        <small>{question.points} अंक</small>
      </p>

      {badge && <p className="q-combo" role="status">{badge}</p>}

      <h2 className="q-question">{question.question}</h2>

      {question.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="q-image" src={question.image_url} alt="" />
      )}

      <ul className="q-options">
        {question.options.map((option) => {
          const isPicked = picked === option.letter;
          const isRight = outcome?.correctLetter === option.letter;
          const state = !answered ? ''
            : isRight ? ' is-right'
            : isPicked ? ' is-wrong'
            : ' is-dim';
          return (
            <li key={option.letter}>
              <button
                type="button"
                className={`q-option${state}${isPicked ? ' is-picked' : ''}`}
                onClick={() => void choose(option.letter)}
                disabled={answered || submitting}
                aria-pressed={isPicked}
              >
                <span className="q-letter" aria-hidden="true">{option.letter}</span>
                <span className="q-text">{option.text}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <p className="visually-hidden" aria-live="polite" ref={liveRegion} />

      {/* A tap that never reached the server leaves no feedback block to put
          the message in, and silence reads as a broken game rather than a lost
          connection. */}
      {error && !outcome && (
        <p className="q-error q-error-loud" role="alert">{error}</p>
      )}

      {outcome && (
        <div className={`q-feedback${outcome.correct ? ' is-right' : ' is-wrong'}`}>
          <p className="q-verdict">{outcome.correct ? '✅ सही!' : '❌ गलत'}</p>
          {outcome.explanation && (
            <>
              <h3>व्याख्या</h3>
              <p>{outcome.explanation}</p>
            </>
          )}
          {outcome.source && (
            <p className="q-source">
              स्रोत:{' '}
              {outcome.sourceUrl
                ? <a href={outcome.sourceUrl} target="_blank" rel="noopener noreferrer nofollow">{outcome.source}</a>
                : outcome.source}
            </p>
          )}
          {error && <p className="q-error" role="alert">{error}</p>}
          <button type="button" className="q-btn q-btn-solid q-next" onClick={() => void advance()}>
            {at + 1 >= questions.length ? 'परिणाम हेर्नुहोस् →' : 'अर्को प्रश्न →'}
          </button>
        </div>
      )}
    </div>
  );
}

function SoundToggle(
  { on, onToggle, inline }: { on: boolean; onToggle: () => void; inline?: boolean },
) {
  return (
    <button
      type="button"
      className={`q-sound${inline ? ' is-inline' : ''}`}
      onClick={onToggle}
      aria-pressed={on}
      title={on ? 'आवाज बन्द गर्नुहोस्' : 'आवाज खोल्नुहोस्'}
    >
      {on ? '🔊' : '🔇'}
      <span className="visually-hidden">{on ? 'आवाज खुला छ' : 'आवाज बन्द छ'}</span>
    </button>
  );
}

/* ------------------------------------------------------------- result */

function ResultView({
  result, text, maxScore, onReplay, soundOn, onSound,
}: {
  result: Result; text: QuizText; maxScore: number; onReplay: () => void;
  soundOn: boolean; onSound: () => void;
}) {
  const t = (key: string) => text[key] ?? '';
  const score = useCounter(result.score);
  const [copied, setCopied] = useState(false);

  const shareText = useMemo(() => [
    '🇳🇵 नेपाली कांग्रेस QUIZ',
    t('quiz_badge'),
    '',
    `नाम: ${result.name}`,
    `स्कोर: ${result.score} / ${result.maxScore || maxScore}`,
    `सही: ${result.correct} / ${result.total}`,
    `स्तर: ${result.level}`,
    '',
    t('quiz_hashtags') || t('quiz_share_hashtag'),
    shareUrl(t('quiz_share_url')),
  ].join('\n'), [result, maxScore, text]);

  const share = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) {
        await navigator.share({ title: t('quiz_share_title'), text: shareText, url });
        return;
      }
    } catch { /* dismissed, or not permitted here */ }
    await copy();
  };

  const copy = async () => {
    const payload = `${shareText}\n${typeof window !== 'undefined' ? window.location.href : ''}`;
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard is blocked in several in-app browsers; a selectable box is
      // the fallback that always works.
      const box = document.getElementById('q-share-text') as HTMLTextAreaElement | null;
      box?.focus();
      box?.select();
    }
  };

  const rows: [Difficulty, string][] = [
    ['basic', '🟢 BASIC'], ['medium', '🟡 MEDIUM'], ['hard', '🔴 HARD'],
  ];

  const lost = rows
    .map(([key]) => ({ key, ...result.breakdown[key] }))
    .filter((row) => row.total > 0 && row.correct < row.total);

  return (
    <div className="q-card q-result">
      <SoundToggle on={soundOn} onToggle={onSound} />
      {result.perfect && <Confetti />}

      <p className="q-badge">{result.perfect ? t('quiz_perfect_title') : t('quiz_result_title')}</p>

      <section className="q-thanks">
        <p className="q-thanks-title">{t('quiz_thanks_title')}</p>
        <p className="q-thanks-name">{t('quiz_candidate_name')}</p>
        {t('quiz_candidate_role').split('\n').filter(Boolean).map((line) => (
          <p className="q-thanks-role" key={line}>{line}</p>
        ))}
        <p className="q-thanks-appeal">{t('quiz_thanks_appeal')}</p>
      </section>

      <h1 className="q-player">{result.name}</h1>

      <p className="q-score"><strong>{score}</strong> / {result.maxScore || maxScore}</p>
      <p className="q-correct">{result.correct} / {result.total} सही</p>
      <p className="q-levelname">{result.level}</p>
      <p className="q-accuracy">शुद्धता: {result.accuracy}%</p>

      <h2 className="q-break-title">तपाईंले कहाँ अंक गुमाउनुभयो?</h2>
      <ul className="q-breakdown">
        {rows.map(([key, label]) => {
          const row = result.breakdown[key];
          const pct = row.total > 0 ? (row.correct / row.total) * 100 : 0;
          return (
            <li key={key}>
              <span className="q-break-label">{label}</span>
              <span className="q-break-bar"><span style={{ width: `${pct}%` }} /></span>
              <span className="q-break-count">{row.correct} / {row.total}</span>
            </li>
          );
        })}
      </ul>

      <p className="q-note">
        {lost.length === 0
          ? 'सबै तहमा पूरा अंक — बधाई छ ।'
          : lost.map((row) => {
              const label = { basic: 'आधारभूत', medium: 'मध्यम', hard: 'कठिन' }[row.key];
              const missed = row.total - row.correct;
              return `${label} तहमा ${missed} प्रश्न छुट्यो ।`;
            }).join(' ')}
      </p>

      <ResultCard
        facts={{
          name: result.name,
          score: result.score,
          maxScore: result.maxScore || maxScore,
          correct: result.correct,
          total: result.total,
          level: result.level,
          stars: starsFor(result.correct, result.total),
          perfect: result.perfect,
        }}
        text={{
          badge: t('quiz_badge'),
          headline: t('quiz_card_headline'),
          invite: t('quiz_card_invite'),
          hashtags: t('quiz_hashtags'),
          url: shareUrl(t('quiz_share_url')),
        }}
      />

      <div className="q-actions">
        <button type="button" className="q-btn q-btn-solid" onClick={() => void share()}>
          लेख शेयर गर्नुहोस्
        </button>
        <button type="button" className="q-btn q-btn-ghost" onClick={() => void copy()}>
          {copied ? '✓ कपी भयो' : 'परिणाम कपी गर्नुहोस्'}
        </button>
        <button type="button" className="q-btn q-btn-gold" onClick={onReplay}>
          🔄 फेरि खेल्नुहोस्
        </button>
      </div>

      <label className="visually-hidden" htmlFor="q-share-text">परिणाम</label>
      <textarea id="q-share-text" className="q-share-text" readOnly value={shareText} rows={8} />
    </div>
  );
}

/**
 * The address to put on a shared card.
 *
 * The configured one wins so a card made on a preview build still sends people
 * to the real page; the browser's own address is only the fallback.
 */
function shareUrl(configured: string): string {
  if (configured) return configured;
  return typeof window === 'undefined' ? '' : window.location.href.split('?')[0];
}

/** Five stars, filled in proportion to how many answers were right. */
function starsFor(correct: number, total: number): number {
  if (total <= 0) return 0;
  return Math.max(1, Math.ceil((correct / total) * 5));
}

/** Counts up to a number, or lands on it at once when motion is unwelcome. */
function useCounter(target: number): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let reduced = false;
    try {
      reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch { /* older browser */ }
    if (reduced || target <= 0) { setValue(target); return; }

    const started = Date.now();
    const span = 900;
    const tick = window.setInterval(() => {
      const through = Math.min(1, (Date.now() - started) / span);
      setValue(Math.round(target * (1 - (1 - through) ** 3)));
      if (through >= 1) window.clearInterval(tick);
    }, 40);
    return () => window.clearInterval(tick);
  }, [target]);
  return value;
}

function Confetti() {
  const pieces = Array.from({ length: 28 }, (_, i) => i);
  return (
    <div className="q-confetti" aria-hidden="true">
      {pieces.map((i) => (
        <span key={i} style={{
          '--x': `${(i * 37) % 100}%`,
          '--delay': `${(i % 7) * 120}ms`,
          '--spin': `${(i % 2 ? 1 : -1) * (180 + (i * 23) % 360)}deg`,
        } as React.CSSProperties} />
      ))}
    </div>
  );
}
