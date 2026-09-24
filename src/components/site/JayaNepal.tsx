'use client';

import { useEffect, useRef, useState } from 'react';

const CHEER_MS = 2600;
const PIECES = 26;

/** Anything on the page can ask for the greeting by firing this event. */
export const JAYA_EVENT = 'jaya-nepal';

/**
 * A greeting the reader can set off: the button on the edge of the screen
 * says जय नेपाल भन्नुहोस्, and pressing it brings a waving hand to the middle
 * of the page while the words are spoken aloud. The tree in the hero asks for
 * the same greeting through JAYA_EVENT, so both give the identical cheer.
 *
 * A recording uploaded in the dashboard is used when there is one. Otherwise
 * the browser speaks the two words, preferring a Nepali voice and falling back
 * to another that reads Devanagari — two words are short enough that even an
 * imperfect voice carries them.
 */
export default function JayaNepal({ label, audio = '' }: { label: string; audio?: string }) {
  const [cheering, setCheering] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    audioRef.current?.pause();
  }, []);

  // The emblem elsewhere on the page sets off the very same cheer.
  useEffect(() => {
    const onAsk = () => cheerRef.current();
    window.addEventListener(JAYA_EVENT, onAsk);
    return () => window.removeEventListener(JAYA_EVENT, onAsk);
  }, []);

  const say = () => {
    if (audio) {
      const player = audioRef.current ?? new Audio(audio);
      audioRef.current = player;
      player.currentTime = 0;
      void player.play().catch(() => {});
      return;
    }
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const synth = window.speechSynthesis;
    synth.cancel();
    const voices = synth.getVoices();
    const voice =
      voices.find((v) => /^ne\b|^ne[-_]/i.test(v.lang ?? '')) ??
      voices.find((v) => /^(hi|mr|sa)\b|^(hi|mr|sa)[-_]/i.test(v.lang ?? '')) ??
      null;

    const utterance = new SpeechSynthesisUtterance('जय नेपाल');
    if (voice) { utterance.voice = voice; utterance.lang = voice.lang; }
    else utterance.lang = 'ne-NP';
    utterance.rate = 0.9;
    utterance.pitch = 1.05;
    synth.speak(utterance);
  };

  const cheer = () => {
    say();
    setCheering(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCheering(false), CHEER_MS);
  };
  const cheerRef = useRef(cheer);
  cheerRef.current = cheer;

  return (
    <>
      <button type="button" className="jaya-btn" onClick={cheer}>
        <span className="jaya-hand" aria-hidden="true">🙋‍♂️</span>
        <span className="jaya-text">{label}</span>
      </button>

      {cheering && (
        <div className="jaya-cheer" role="status" aria-live="polite">
          <div className="jaya-burst">
            {/* Flecks in the flag's own colours, thrown outward. */}
            {Array.from({ length: PIECES }, (_, i) => (
              <span
                key={i}
                className="jaya-fleck"
                style={{
                  '--angle': `${(360 / PIECES) * i}deg`,
                  '--delay': `${(i % 6) * 55}ms`,
                  '--distance': `${120 + ((i * 37) % 110)}px`,
                } as React.CSSProperties}
              />
            ))}
            <span className="jaya-big" aria-hidden="true">🙋‍♂️</span>
          </div>
          <p className="jaya-shout">जय नेपाल!</p>
        </div>
      )}
    </>
  );
}
