'use client';

import { useEffect, useRef, useState } from 'react';
import Icon from '../Icon';
import { synthesis } from '@/lib/speech';

type State = 'idle' | 'loading' | 'playing' | 'paused' | 'silent';

const NEPALI = /^ne\b|^ne[-_]/i;
const DEVANAGARI = /^(hi|mr|sa|ne|bh)\b|^(hi|mr|sa|ne|bh)[-_]/i;

/**
 * Reads a section aloud.
 *
 * Order of preference: a recording uploaded in the dashboard, then a Nepali
 * voice installed on the device, then any other voice that reads Devanagari.
 * A Hindi voice pronounces the script but not the language, so when one is all
 * that is available the button says so and offers the list, rather than
 * quietly reading Nepali in Hindi and leaving the listener wondering.
 *
 * Selecting text before pressing play starts the reading at that point, which
 * is how a reader picks up where their eye left off.
 *
 * The button is always shown, whatever the browser can do. It used to remove
 * itself when the device had no speech engine, which meant it was missing
 * altogether from a link opened inside Messenger or Facebook — a web view
 * that frequently has none. A button that says it cannot speak here is worth
 * more than one that quietly is not there, and where a recording has been
 * uploaded the browser's own speech does not come into it at all.
 */
export default function ListenButton({
  text, label, audio = '', scopeId,
}: { text: string; label: string; audio?: string; scopeId?: string }) {
  const [state, setState] = useState<State>('idle');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [chosen, setChosen] = useState<string>('');
  const [menuOpen, setMenuOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunks = useRef<string[]>([]);

  useEffect(() => () => {
    synthesis()?.cancel();
    audioRef.current?.pause();
  }, []);

  // The voice list arrives asynchronously in most browsers.
  useEffect(() => {
    if (audio) return;
    if (!synthesis()) return;
    const synth = window.speechSynthesis;
    const read = () => {
      const all = synth.getVoices().filter((v) => DEVANAGARI.test(v.lang ?? ''));
      setVoices(all);
      setChosen((current) => current || (all.find((v) => NEPALI.test(v.lang))?.voiceURI ?? all[0]?.voiceURI ?? ''));
    };
    read();
    synth.addEventListener('voiceschanged', read);
    return () => synth.removeEventListener('voiceschanged', read);
  }, [audio]);

  const voice = voices.find((v) => v.voiceURI === chosen) ?? null;
  const hasNepali = voices.some((v) => NEPALI.test(v.lang));
  const readingNepali = voice ? NEPALI.test(voice.lang) : false;

  const speakFrom = (index: number) => {
    const synth = window.speechSynthesis;
    if (index >= chunks.current.length) { setState('idle'); return; }

    const utterance = new SpeechSynthesisUtterance(chunks.current[index]);
    // A language is named only when there is a voice behind it. Asking a
    // device for 'ne-NP' when it has no Nepali voice makes some engines say
    // nothing at all, where leaving it unset reads the words in the default
    // voice — which is how a page opened inside Messenger's own browser ended
    // up silent.
    if (voice) { utterance.voice = voice; utterance.lang = voice.lang; }
    utterance.rate = 0.92;
    utterance.onend = () => speakFrom(index + 1);
    utterance.onerror = () => setState('idle');
    synth.speak(utterance);
  };

  /** Where in the section the reader has highlighted, if anywhere. */
  const selectedText = (): string => {
    if (!scopeId || typeof window === 'undefined') return '';
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) return '';
    const scope = document.getElementById(scopeId);
    if (!scope || !scope.contains(selection.anchorNode)) return '';
    return selection.toString().trim();
  };

  const start = () => {
    if (audio) {
      const player = audioRef.current ?? new Audio(audio);
      audioRef.current = player;
      player.onended = () => setState('idle');
      // A recording that will not play is a reason to try the browser's own
      // voice, not a reason for the button to give up.
      player.onerror = speakInstead;
      void player.play().then(() => setState('playing')).catch(speakInstead);
      return;
    }

    speakInstead();
  };

  /** Read the text aloud, or say plainly that this device cannot. */
  const speakInstead = () => {
    if (!synthesis()) { setState('silent'); return; }
    const synth = window.speechSynthesis;
    // Only when something is queued: cancel() on an idle queue is enough to
    // make WebKit drop the utterance that follows it.
    if (synth.speaking || synth.pending) synth.cancel();
    if (synth.paused) synth.resume();

    // Start at the highlighted sentence when there is one, and carry on to
    // the end of the section from there.
    const picked = selectedText();
    let source = text;
    if (picked) {
      const at = text.indexOf(picked.slice(0, 40));
      if (at > 0) source = text.slice(at);
      else source = `${picked}. ${text}`;
    }

    chunks.current = splitForSpeech(source);
    if (chunks.current.length === 0) return;

    setState('playing');
    speakFrom(0);
    window.setTimeout(() => {
      const s = window.speechSynthesis;
      if (!s.speaking && !s.pending) setState('silent');
    }, 1000);
  };

  // Whichever of the two is actually making the sound is the one to work on:
  // a recording that failed over to speech is no longer the audio path.
  const usingRecording = () => Boolean(audio) && !audioRef.current?.paused;

  const pause = () => {
    if (usingRecording()) { audioRef.current?.pause(); setState('paused'); return; }
    synthesis()?.pause();
    setState('paused');
  };

  const resume = () => {
    if (audio && audioRef.current?.paused && audioRef.current.currentTime > 0) {
      void audioRef.current.play();
      setState('playing');
      return;
    }
    synthesis()?.resume();
    setState('playing');
  };

  const stop = () => {
    const player = audioRef.current;
    if (player) { player.pause(); player.currentTime = 0; }
    synthesis()?.cancel();
    setState('idle');
  };

  const switchVoice = (uri: string) => {
    setChosen(uri);
    setMenuOpen(false);
    if (state === 'playing' || state === 'paused') { synthesis()?.cancel(); setState('idle'); }
  };

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
        <span>{playing ? 'रोक्नुहोस्' : paused ? 'फेरि सुन्नुहोस्' : label}</span>
      </button>

      {(playing || paused) && (
        <button type="button" className="listen-stop" onClick={stop} aria-label="बन्द गर्नुहोस्">
          <Icon name="close" className="icon icon-sm" />
        </button>
      )}

      {/* The voice list, when the device offers more than one. */}
      {!audio && voices.length > 1 && (
        <div className="listen-voice">
          <button
            type="button"
            className="listen-voice-btn"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
          >
            <Icon name="speaker" className="icon icon-sm" />
            <span>{readingNepali ? 'नेपाली आवाज' : 'आवाज छान्नुहोस्'}</span>
          </button>
          {menuOpen && (
            <ul className="listen-voice-menu">
              {voices.map((v) => (
                <li key={v.voiceURI}>
                  <button
                    type="button"
                    className={v.voiceURI === chosen ? 'is-chosen' : undefined}
                    onClick={() => switchVoice(v.voiceURI)}
                  >
                    {v.name} <small>{v.lang}</small>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {state === 'silent' && (
        <p className="listen-note">
          यो ब्राउजरमा आवाज उपलब्ध छैन । कृपया यो पृष्ठ आफ्नो ब्राउजरमा खोलेर सुन्नुहोस् ।
        </p>
      )}

      {!audio && voices.length > 0 && !hasNepali && state !== 'silent' && (
        <p className="listen-note">
          यो उपकरणमा नेपाली आवाज छैन। देवनागरी पढ्न सक्ने अर्को आवाज प्रयोग हुँदैछ।
        </p>
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
