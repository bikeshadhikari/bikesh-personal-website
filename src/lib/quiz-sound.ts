/**
 * The game's sound, synthesised rather than downloaded.
 *
 * Every cue is a few oscillators through a gain envelope, so there are no
 * audio files to fetch, nothing to fail on a slow connection and nothing to
 * block inside an in-app browser that will not autoplay media.
 *
 * Getting sound out of Facebook's, Instagram's and Messenger's own browsers
 * takes more than opening an AudioContext, and this file does all of it:
 *
 * - the context is opened on the first touch anywhere on the page, not on one
 *   particular button, because a gesture is the only moment iOS permits it;
 * - a moment of silence is played through it immediately, which is what
 *   actually unlocks WebKit — creating the context is not enough;
 * - the state is checked before every cue, because iOS suspends the context
 *   when the app is backgrounded and marks it `interrupted` after a call, and
 *   a context in either state accepts notes and plays nothing;
 * - an <audio> element carrying a silent loop is kept running on the quiet
 *   ones, which stops those browsers from tearing the audio session down
 *   between questions.
 *
 * Audio is a nicety and never a dependency: if any of this fails the engine
 * turns itself off and the game carries on in silence.
 */

export type Cue =
  | 'click' | 'start' | 'correct' | 'wrong' | 'next' | 'lock'
  | 'level' | 'final' | 'result' | 'perfect' | 'achievement' | 'tick';

type Tone = {
  at: number; hz: number; to?: number; ms: number; gain?: number; type?: OscillatorType;
};

/**
 * Each cue as a little score: when, what pitch, how long.
 *
 * The quiz-show shape is deliberate — a hard lock when an answer is committed,
 * a rising run when it is right, a falling one when it is not.
 */
const SCORES: Record<Cue, Tone[]> = {
  click:   [{ at: 0, hz: 520, ms: 55, gain: 0.16 }],
  tick:    [{ at: 0, hz: 1180, ms: 28, gain: 0.07, type: 'triangle' }],

  start:   [{ at: 0, hz: 392, ms: 110 }, { at: 90, hz: 523, ms: 110 },
            { at: 180, hz: 659, ms: 130 }, { at: 300, hz: 784, ms: 260 }],

  // The commit: two stabs and a drop, the moment the answer is locked in.
  lock:    [{ at: 0, hz: 320, ms: 90, gain: 0.2, type: 'square' },
            { at: 110, hz: 320, ms: 90, gain: 0.2, type: 'square' },
            { at: 230, hz: 160, to: 96, ms: 420, gain: 0.17, type: 'sawtooth' }],

  // Right: a rising run that lands on a held major chord.
  correct: [{ at: 0, hz: 523, ms: 90 }, { at: 80, hz: 659, ms: 90 },
            { at: 160, hz: 784, ms: 110 },
            { at: 280, hz: 1047, ms: 520, gain: 0.22 },
            { at: 280, hz: 1319, ms: 520, gain: 0.13 },
            { at: 280, hz: 1568, ms: 520, gain: 0.09 }],

  // Wrong: a flat, falling pair. Disappointing on purpose, never harsh.
  wrong:   [{ at: 0, hz: 233, ms: 240, gain: 0.17, type: 'sawtooth' },
            { at: 180, hz: 175, to: 110, ms: 520, gain: 0.15, type: 'sawtooth' }],

  next:    [{ at: 0, hz: 440, ms: 70, gain: 0.13 }],
  level:   [{ at: 0, hz: 523, ms: 120 }, { at: 110, hz: 587, ms: 120 },
            { at: 220, hz: 784, ms: 300 }],

  // The last question, announced.
  final:   [{ at: 0, hz: 196, ms: 200, gain: 0.2, type: 'triangle' },
            { at: 220, hz: 196, ms: 200, gain: 0.2, type: 'triangle' },
            { at: 440, hz: 294, ms: 200, gain: 0.2, type: 'triangle' },
            { at: 660, hz: 392, ms: 560, gain: 0.22 }],

  result:  [{ at: 0, hz: 523, ms: 140 }, { at: 130, hz: 659, ms: 140 },
            { at: 260, hz: 784, ms: 140 }, { at: 390, hz: 1047, ms: 420 }],
  perfect: [{ at: 0, hz: 523, ms: 110 }, { at: 90, hz: 659, ms: 110 },
            { at: 180, hz: 784, ms: 110 }, { at: 270, hz: 1047, ms: 110 },
            { at: 360, hz: 1319, ms: 520, gain: 0.24 },
            { at: 360, hz: 1568, ms: 520, gain: 0.14 }],
  achievement: [{ at: 0, hz: 784, ms: 90 }, { at: 80, hz: 1047, ms: 200 }],
};

const STORE_KEY = 'ncq:sound';

/** A two-note heartbeat under an unanswered question. */
const PULSE_MS = 900;

export class Sound {
  private context: AudioContext | null = null;
  private broken = false;
  private on = true;
  private unlocked = false;
  private pulse: ReturnType<typeof setInterval> | undefined;
  private keepAlive: HTMLAudioElement | null = null;
  private detach: (() => void) | null = null;

  constructor() {
    this.on = readPreference();
    this.listenForFirstGesture();
  }

  get enabled(): boolean { return this.on && !this.broken; }

  /**
   * Open the audio engine on the first touch anywhere.
   *
   * Waiting for the start button was enough on a desktop and not enough in an
   * in-app browser, where the gesture that counts may be the tap that dismissed
   * something else entirely.
   */
  private listenForFirstGesture(): void {
    if (typeof window === 'undefined') return;
    const open = () => { this.wake(); };
    const events: (keyof WindowEventMap)[] = ['pointerdown', 'touchend', 'keydown'];
    for (const event of events) {
      window.addEventListener(event, open, { passive: true });
    }
    this.detach = () => {
      for (const event of events) window.removeEventListener(event, open);
    };
  }

  /** Remember the choice where the browser lets us, and carry on where not. */
  toggle(): boolean {
    this.on = !this.on;
    try { window.localStorage?.setItem(STORE_KEY, this.on ? '1' : '0'); } catch { /* private mode */ }
    if (this.on) this.wake(); else this.stopPulse();
    return this.on;
  }

  /**
   * Start, or restart, the audio engine.
   *
   * Safe to call as often as you like, and worth calling before every cue:
   * iOS suspends the context in the background and marks it interrupted after
   * a phone call, and in both states it accepts notes and plays nothing.
   */
  wake(): void {
    if (this.broken || !this.on) return;
    try {
      const Ctor = window.AudioContext
        ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) { this.broken = true; return; }

      this.context ??= new Ctor();
      const context = this.context;
      if (context.state !== 'running') void context.resume().catch(() => {});

      if (!this.unlocked) {
        this.unlocked = true;
        // A moment of silence, played for real. Creating the context is not
        // what unlocks WebKit; putting something through it is.
        const buffer = context.createBuffer(1, 1, context.sampleRate);
        const source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(context.destination);
        source.start(0);
        this.holdSession();
      }
    } catch {
      this.broken = true;
    }
  }

  /**
   * Keep the audio session open between cues.
   *
   * Facebook's and Instagram's browsers close it as soon as nothing is
   * playing, and the next cue then arrives to a dead context. A silent loop in
   * an ordinary <audio> element keeps the session alive; if the element is
   * refused, nothing here matters enough to fail over.
   */
  private holdSession(): void {
    try {
      if (this.keepAlive) return;
      const element = new Audio(SILENCE);
      element.loop = true;
      element.volume = 0.001;
      // Not a video, so no fullscreen takeover on iOS.
      element.setAttribute('playsinline', 'true');
      void element.play().catch(() => {});
      this.keepAlive = element;
    } catch {
      this.keepAlive = null;
    }
  }

  play(cue: Cue): void {
    if (!this.on || this.broken) return;
    try {
      this.wake();
      const context = this.context;
      if (!context || context.state !== 'running') return;
      this.schedule(context, SCORES[cue]);
    } catch {
      this.broken = true;
    }
  }

  private schedule(context: AudioContext, tones: Tone[]): void {
    for (const tone of tones) {
      const start = context.currentTime + tone.at / 1000;
      const stop = start + tone.ms / 1000;

      const osc = context.createOscillator();
      osc.type = tone.type ?? 'sine';
      osc.frequency.setValueAtTime(tone.hz, start);
      if (tone.to) osc.frequency.exponentialRampToValueAtTime(Math.max(40, tone.to), stop);

      // A short rise and a long fall: a square-edged envelope clicks.
      const gain = context.createGain();
      const peak = tone.gain ?? 0.2;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(peak, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, stop);

      osc.connect(gain).connect(context.destination);
      osc.start(start);
      osc.stop(stop + 0.02);
    }
  }

  /**
   * The bed under an unanswered question: a low two-note heartbeat, quiet
   * enough to think over and insistent enough to be felt.
   */
  startPulse(): void {
    if (!this.on || this.broken) return;
    this.stopPulse();
    const beat = () => {
      this.wake();
      const context = this.context;
      if (!context || context.state !== 'running') return;
      this.schedule(context, [
        { at: 0, hz: 98, ms: 200, gain: 0.11, type: 'sine' },
        { at: PULSE_MS / 2, hz: 73, ms: 220, gain: 0.09, type: 'sine' },
      ]);
    };
    beat();
    this.pulse = setInterval(beat, PULSE_MS);
  }

  stopPulse(): void {
    if (this.pulse) { clearInterval(this.pulse); this.pulse = undefined; }
  }

  close(): void {
    this.stopPulse();
    this.detach?.();
    try { this.keepAlive?.pause(); } catch { /* already gone */ }
    this.keepAlive = null;
    try { void this.context?.close(); } catch { /* already gone */ }
    this.context = null;
  }
}

function readPreference(): boolean {
  try {
    const stored = window.localStorage?.getItem(STORE_KEY);
    return stored === null ? true : stored === '1';
  } catch {
    return true;
  }
}

/** A fraction of a second of silence, inline so it needs no request. */
const SILENCE =
  'data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tA'
  + 'wAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAADAAABgAC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7'
  + 'u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////'
  + '//////////////////////////////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAA'
  + 'JAAAAAAAAAAAAYDpTs1PAAAAAAAAAAAAAAAAAAAA//sQxAADwAABpAAAACAAADSAAAAETEFNRTMuMTAw'
  + 'VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV'
  + 'VVVVVVVVVVVVVVVVVVVV//sQxCuDwAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV'
  + 'VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV'
  + '//sQxFMDwAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV'
  + 'VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
