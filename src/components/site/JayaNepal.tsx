'use client';

import { useEffect, useRef, useState } from 'react';
import { nepaliVoice, speak, synthesis, watchVoices } from '@/lib/speech';

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
 * A recording uploaded in the dashboard is used when there is one, and is the
 * only thing that is certain to be heard: a link opened inside Messenger's or
 * Facebook's own browser lands in a web view whose speech support ranges from
 * patchy to absent. Without a recording the browser is asked to speak the two
 * words, and if it turns out not to, the cheer still happens — silently, which
 * is the best that can be done there.
 */
export default function JayaNepal({ label, audio = '' }: { label: string; audio?: string }) {
  const [cheering, setCheering] = useState(false);
  const player = useRef<HTMLAudioElement | null>(null);
  const voice = useRef<SpeechSynthesisVoice | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Voices load late, and the first press is usually before they arrive. The
  // list is kept current here so pressing can stay synchronous — iOS only
  // allows speech inside the gesture that asked for it.
  useEffect(() => watchVoices((voices) => { voice.current = nepaliVoice(voices); }), []);

  // Built up front so a press only has to start it. A web view is far more
  // willing to play audio it has already fetched.
  useEffect(() => {
    if (!audio) { player.current = null; return; }
    const element = new Audio(audio);
    element.preload = 'auto';
    player.current = element;
    return () => { element.pause(); player.current = null; };
  }, [audio]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
    synthesis()?.cancel();
  }, []);

  const speakIt = () => {
    speak('जय नेपाल', { voice: voice.current, rate: 0.9, pitch: 1.05 });
  };

  const say = () => {
    const element = player.current;
    if (!element) { speakIt(); return; }

    element.currentTime = 0;
    // If the recording will not play — no gesture credit, a file that failed
    // to load — the browser's own voice is still worth a try.
    void element.play().catch(speakIt);
  };

  const cheer = () => {
    say();
    setCheering(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCheering(false), CHEER_MS);
  };
  const cheerRef = useRef(cheer);
  cheerRef.current = cheer;

  // The emblem elsewhere on the page sets off the very same cheer.
  useEffect(() => {
    const onAsk = () => cheerRef.current();
    window.addEventListener(JAYA_EVENT, onAsk);
    return () => window.removeEventListener(JAYA_EVENT, onAsk);
  }, []);

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
