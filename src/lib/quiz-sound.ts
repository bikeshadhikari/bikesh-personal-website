/**
 * The game's sound, synthesised rather than downloaded.
 *
 * Every cue is a few oscillators through a gain envelope, so there are no
 * audio files to fetch, nothing to fail on a slow connection and nothing to
 * block inside an in-app browser that will not autoplay media.
 *
 * Audio is a nicety here and never a dependency: if the browser has no
 * AudioContext, refuses to start one, or throws at any point, the engine turns
 * itself off and the game carries on in silence. Nothing in here is allowed to
 * reach the player as an error.
 */

export type Cue =
  | 'click' | 'start' | 'correct' | 'wrong' | 'next'
  | 'level' | 'final' | 'result' | 'perfect' | 'achievement';

type Tone = { at: number; hz: number; to?: number; ms: number; gain?: number; type?: OscillatorType };

/** Each cue as a little score: when, what pitch, how long. */
const SCORES: Record<Cue, Tone[]> = {
  click:   [{ at: 0, hz: 520, ms: 55, gain: 0.16 }],
  start:   [{ at: 0, hz: 392, ms: 110 }, { at: 90, hz: 523, ms: 110 },
            { at: 180, hz: 659, ms: 200 }],
  correct: [{ at: 0, hz: 659, ms: 100 }, { at: 90, hz: 880, ms: 190 }],
  wrong:   [{ at: 0, hz: 208, to: 150, ms: 260, type: 'sawtooth', gain: 0.14 }],
  next:    [{ at: 0, hz: 440, ms: 70, gain: 0.13 }],
  level:   [{ at: 0, hz: 523, ms: 120 }, { at: 110, hz: 587, ms: 120 },
            { at: 220, hz: 784, ms: 240 }],
  final:   [{ at: 0, hz: 330, ms: 150, type: 'triangle' }, { at: 150, hz: 330, ms: 150 },
            { at: 300, hz: 494, ms: 320 }],
  result:  [{ at: 0, hz: 523, ms: 140 }, { at: 130, hz: 659, ms: 140 },
            { at: 260, hz: 784, ms: 140 }, { at: 390, hz: 1047, ms: 340 }],
  perfect: [{ at: 0, hz: 523, ms: 120 }, { at: 100, hz: 659, ms: 120 },
            { at: 200, hz: 784, ms: 120 }, { at: 300, hz: 1047, ms: 120 },
            { at: 400, hz: 1319, ms: 420 }],
  achievement: [{ at: 0, hz: 784, ms: 90 }, { at: 80, hz: 1047, ms: 200 }],
};

const STORE_KEY = 'ncq:sound';

export class Sound {
  private context: AudioContext | null = null;
  private broken = false;
  private on = true;

  constructor() {
    this.on = readPreference();
  }

  get enabled(): boolean { return this.on && !this.broken; }

  /** Remember the choice where the browser lets us, and carry on where not. */
  toggle(): boolean {
    this.on = !this.on;
    try { window.localStorage?.setItem(STORE_KEY, this.on ? '1' : '0'); } catch { /* private mode */ }
    if (this.on) this.wake();
    return this.on;
  }

  /**
   * Start the audio engine. Must be called from inside a real tap: a mobile
   * browser will not open an AudioContext any other way, which is why the game
   * does this on the start button rather than on load.
   */
  wake(): void {
    if (this.broken || !this.on) return;
    try {
      const Ctor = window.AudioContext
        ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) { this.broken = true; return; }
      this.context ??= new Ctor();
      if (this.context.state === 'suspended') void this.context.resume().catch(() => {});
    } catch {
      this.broken = true;
    }
  }

  play(cue: Cue): void {
    if (!this.on || this.broken) return;
    try {
      this.wake();
      const context = this.context;
      if (!context || context.state !== 'running') return;

      for (const tone of SCORES[cue]) {
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
    } catch {
      this.broken = true;
    }
  }

  close(): void {
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
