'use client';

import { useEffect, useRef, useState } from 'react';
import Icon from '../Icon';

type State = 'idle' | 'loading' | 'playing' | 'paused' | 'unsupported' | 'silent';

/**
 * Reads a section aloud.
 *
 * A recording uploaded in the dashboard is used when there is one, because a
 * human reading of Nepali will always beat a synthetic one. Without a
 * recording the browser's own speech engine reads the text, asked for Nepali
 * first and any other Devanagari voice second, since a device with no Nepali
 * voice installed usually has Hindi, which reads the same script intelligibly.
 *
 * Long text is spoken in sentence-sized pieces: several engines cut off around
 * a couple of hundred characters, and short utterances also make pausing and
 * stopping responsive.
 */
export default function ListenButton({
  text, label, audio = '',
}: { text: string; label: string; audio?: string }) {
  const [state, setState] = useState<State>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunks = useRef<string[]>([]);
  const at = useRef(0);

  // Speech that is still running when the reader leaves would follow them to
  // the next page, so it is always stopped on the way out.
  useEffect(() => () => {
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    audioRef.current?.pause();
  }, []);

  useEffect(() => {
    if (audio) return;
    if (typeof window === 'undefined') return;
    if (!('speechSynthesis' in window)) setState('unsupported');
  }, [audio]);

  const pickVoice = (): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis.getVoices();
    return (
      voices.find((v) => v.lang?.toLowerCase().startsWith('ne')) ??
      voices.find((v) => /^(hi|mr|sa)/i.test(v.lang ?? '')) ??
      null
    );
  };

  const speakFrom = (index: number) => {
    const synth = window.speechSynthesis;
    if (index >= chunks.current.length) { setState('idle'); at.current = 0; return; }

    const utterance = new SpeechSynthesisUtterance(chunks.current[index]);
    const voice = pickVoice();
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang ?? 'ne-NP';
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onend = () => { at.current = index + 1; speakFrom(index + 1); };
    utterance.onerror = () => setState('idle');
    synth.speak(utterance);
  };

  const start = () => {
    if (audio) {
      const player = audioRef.current ?? new Audio(audio);
      audioRef.current = player;
      player.onended = () => setState('idle');
      player.onerror = () => setState('unsupported');
      void player.play().then(() => setState('playing')).catch(() => setState('unsupported'));
      return;
    }

    const synth = window.speechSynthesis;
    synth.cancel();
    chunks.current = splitForSpeech(text);
    at.current = 0;
    if (chunks.current.length === 0) return;

    // Voices load asynchronously in several browsers; asking once and waiting
    // for the list avoids reading the first sentence in the wrong language.
    if (synth.getVoices().length === 0) {
      setState('loading');
      const onVoices = () => {
        synth.removeEventListener('voiceschanged', onVoices);
        setState('playing');
        speakFrom(0);
        confirmSpeaking();
      };
      synth.addEventListener('voiceschanged', onVoices);
      window.setTimeout(() => {
        synth.removeEventListener('voiceschanged', onVoices);
        if (synth.speaking) return;
        setState('playing');
        speakFrom(0);
        confirmSpeaking();
      }, 1200);
      return;
    }

    setState('playing');
    speakFrom(0);
    confirmSpeaking();
  };

  /**
   * A device with no speech voices installed accepts speak() and then does
   * nothing, which would leave the button looking broken. Check shortly after
   * starting and say so plainly instead.
   */
  const confirmSpeaking = () => {
    window.setTimeout(() => {
      const synth = window.speechSynthesis;
      if (!synth.speaking && !synth.pending) setState('silent');
    }, 900);
  };

  const pause = () => {
    if (audio) { audioRef.current?.pause(); setState('paused'); return; }
    window.speechSynthesis.pause();
    setState('paused');
  };

  const resume = () => {
    if (audio) { void audioRef.current?.play(); setState('playing'); return; }
    window.speechSynthesis.resume();
    setState('playing');
  };

  const stop = () => {
    if (audio) {
      const player = audioRef.current;
      if (player) { player.pause(); player.currentTime = 0; }
    } else {
      window.speechSynthesis.cancel();
    }
    setState('idle');
  };

  if (state === 'unsupported') return null;

  if (state === 'silent') {
    return (
      <p className="listen-silent">
        यो उपकरणमा नेपाली आवाज उपलब्ध छैन — कृपया पढ्नुहोस्।
      </p>
    );
  }

  const playing = state === 'playing';
  const paused = state === 'paused';

  return (
    <div className="listen">
      <button
        type="button"
        className={`listen-btn${playing ? ' is-playing' : ''}`}
        onClick={playing ? pause : paused ? resume : start}
        aria-label={playing ? 'रोक्नुहोस्' : label}
      >
        <span className="listen-icon" aria-hidden="true">
          <Icon name={playing ? 'pause' : 'play'} />
          {playing && <span className="listen-wave" />}
        </span>
        <span>{state === 'loading' ? 'तयार हुँदैछ…' : playing ? 'रोक्नुहोस्' : paused ? 'फेरि सुन्नुहोस्' : label}</span>
      </button>

      {(playing || paused) && (
        <button type="button" className="listen-stop" onClick={stop} aria-label="बन्द गर्नुहोस्">
          <Icon name="close" className="icon icon-sm" />
        </button>
      )}
    </div>
  );
}

/**
 * Break the text into pieces a speech engine will read without truncating,
 * cutting at sentence ends — the Devanagari danda included — and never
 * mid-word.
 */
function splitForSpeech(text: string, limit = 180): string[] {
  const sentences = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[।.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const out: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    if (sentence.length > limit) {
      if (current) { out.push(current); current = ''; }
      for (const word of sentence.split(' ')) {
        if ((current + ' ' + word).trim().length > limit) { out.push(current.trim()); current = word; }
        else current = `${current} ${word}`.trim();
      }
      continue;
    }
    if ((current + ' ' + sentence).trim().length > limit) { out.push(current.trim()); current = sentence; }
    else current = `${current} ${sentence}`.trim();
  }

  if (current.trim()) out.push(current.trim());
  return out;
}
