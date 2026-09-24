'use client';

import { JAYA_EVENT } from './JayaNepal';

/**
 * The party's tree standing beside the candidacy in the hero.
 *
 * It is a button rather than a picture because pressing it asks for the same
 * जय नेपाल greeting the floating button gives — the cheer itself lives in one
 * place, and this only sends word.
 */
export default function PoliticalEmblem(
  { image, caption, label }: { image: string; caption: string; label: string },
) {
  return (
    <button
      type="button"
      className="pol-emblem"
      aria-label={label}
      onClick={() => window.dispatchEvent(new Event(JAYA_EVENT))}
    >
      <span className="pol-emblem-glow" aria-hidden="true" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt="" aria-hidden="true" />
      {caption && <span className="pol-emblem-name">{caption}</span>}
    </button>
  );
}
