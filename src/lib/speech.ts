/**
 * Getting a browser to say something out loud, and knowing when it did not.
 *
 * The Web Speech API fails quietly in ways that matter here. A page opened
 * inside Messenger's or Facebook's own browser was showing the जय नेपाल cheer
 * with no sound at all, and every cause below contributed:
 *
 * - Asking for a language the device has no voice for makes some engines say
 *   nothing rather than fall back. Setting lang to 'ne-NP' on a phone without
 *   a Nepali voice is silence, where saying nothing about the language would
 *   have used the default voice and been heard.
 * - getVoices() is empty until the engine has loaded them, which it does
 *   asynchronously and often after the first render, so the first press found
 *   no voice and took the branch above.
 * - cancel() on an idle queue is enough to make WebKit drop the utterance that
 *   follows it.
 * - Some in-app browsers accept an utterance and then simply never speak it:
 *   no start event, no error event, nothing to react to but a timer.
 *
 * Everything here is deliberately synchronous, because iOS only permits speech
 * inside the user gesture that asked for it. Waiting for voices before
 * speaking loses the gesture and the sound with it.
 */

/** A voice that reads Nepali. */
export const NEPALI = /^ne(\b|[-_])/i;

/** Voices that read the Devanagari script, best first. */
export const DEVANAGARI = /^(ne|hi|mr|sa)(\b|[-_])/i;

/** How long to wait for a browser to admit it is not going to speak. */
const SILENCE_MS = 450;

export function synthesis(): SpeechSynthesis | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  return window.speechSynthesis;
}

/**
 * Keep a list of voices up to date, starting it loading now.
 *
 * Returns a teardown. `run` is called straight away with whatever is already
 * known, and again whenever the engine finishes loading more.
 */
export function watchVoices(run: (voices: SpeechSynthesisVoice[]) => void): () => void {
  const synth = synthesis();
  if (!synth) { run([]); return () => {}; }

  const read = () => run(synth.getVoices());
  read();
  synth.addEventListener?.('voiceschanged', read);
  return () => synth.removeEventListener?.('voiceschanged', read);
}

/** The best available voice for Nepali, or null when the device has none. */
export function nepaliVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  return voices.find((v) => NEPALI.test(v.lang ?? ''))
    ?? voices.find((v) => DEVANAGARI.test(v.lang ?? ''))
    ?? null;
}

export type SpeakOptions = {
  voice?: SpeechSynthesisVoice | null;
  rate?: number;
  pitch?: number;
  onEnd?: () => void;
  /** Called once if the words were not spoken, for any reason. */
  onSilence?: () => void;
};

/**
 * Say something, and report back if it did not happen.
 *
 * Must be called inside the user gesture that asked for it.
 */
export function speak(text: string, options: SpeakOptions = {}): void {
  const { voice = null, rate = 0.95, pitch = 1, onEnd, onSilence } = options;
  const synth = synthesis();

  let settled = false;
  const silent = () => {
    if (settled) return;
    settled = true;
    onSilence?.();
  };

  if (!synth) { silent(); return; }

  // Only when something is actually queued: see the note above about cancel().
  if (synth.speaking || synth.pending) synth.cancel();
  // A queue left paused by an earlier cancel swallows everything after it.
  if (synth.paused) synth.resume();

  const utterance = new SpeechSynthesisUtterance(text);
  // A language is named only when there is a voice behind it. Asking for one
  // the device does not have is the difference between a default voice reading
  // the words and hearing nothing.
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  }
  utterance.rate = rate;
  utterance.pitch = pitch;

  utterance.onstart = () => { settled = true; };
  utterance.onend = () => { settled = true; onEnd?.(); };
  utterance.onerror = silent;

  try {
    synth.speak(utterance);
  } catch {
    silent();
    return;
  }

  window.setTimeout(() => {
    if (!synth.speaking && !synth.pending) silent();
  }, SILENCE_MS);
}
