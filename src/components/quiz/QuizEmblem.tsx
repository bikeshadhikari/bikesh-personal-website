'use client';

import { useEffect, useRef, useState } from 'react';
import { nepaliVoice, speak, synthesis, watchVoices } from '@/lib/speech';

const CHEER_MS = 2200;

/**
 * The emblem over the quiz, which says जय नेपाल when pressed.
 *
 * The picture is whatever has been uploaded in the dashboard, fitted inside a
 * round plate and faded into it at the edges so a square logo shows no corners
 * — the same treatment the political page's symbol gets, for the same reason.
 *
 * A recording is used when one has been uploaded; otherwise the browser speaks
 * the two words. Neither is guaranteed inside an in-app browser, so the waving
 * hand appears either way and the press never fails silently.
 */
export default function QuizEmblem(
  { image, caption, audio = '' }: { image: string; caption: string; audio?: string },
) {
  const [cheering, setCheering] = useState(false);
  const voice = useRef<SpeechSynthesisVoice | null>(null);
  const player = useRef<HTMLAudioElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Voices arrive late, and the first press is usually before they do.
  useEffect(() => watchVoices((voices) => { voice.current = nepaliVoice(voices); }), []);

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

  const cheer = () => {
    const recording = player.current;
    if (recording) {
      recording.currentTime = 0;
      void recording.play().catch(() => speak('जय नेपाल', { voice: voice.current, rate: 0.9 }));
    } else {
      speak('जय नेपाल', { voice: voice.current, rate: 0.9, pitch: 1.05 });
    }

    setCheering(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCheering(false), CHEER_MS);
  };

  if (!image) return null;

  return (
    <div className="q-emblem-wrap">
      <button type="button" className="q-emblem" onClick={cheer} aria-label={caption || 'जय नेपाल'}>
        <span className="q-emblem-plate">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" aria-hidden="true" />
        </span>
        {caption && <span className="q-emblem-caption">{caption}</span>}
      </button>

      {cheering && (
        <div className="q-cheer" role="status" aria-live="polite">
          <span className="q-cheer-hand" aria-hidden="true">🙋‍♂️</span>
          <span className="q-cheer-text">जय नेपाल!</span>
        </div>
      )}
    </div>
  );
}
