'use client';

import { JAYA_EVENT } from './JayaNepal';

/**
 * The party's symbol standing beside the candidacy in the hero.
 *
 * It is a button rather than a picture because pressing it asks for the same
 * जय नेपाल greeting the floating button gives — the cheer itself lives in one
 * place, and this only sends word.
 *
 * The picture sits in a round plate of its own, and is fitted inside it rather
 * than filling it. Whatever is uploaded — a square party logo, a tall portrait,
 * a wide banner — is shown whole and centred, because a square image in a round
 * frame otherwise pushes its corners out through the edge. The caption stands
 * below the plate, clear of the circle, where a long one can wrap.
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
      {/* Outside the plate, which clips what it holds, so the ring can grow. */}
      <span className="pol-emblem-glow" aria-hidden="true" />
      <span className="pol-emblem-plate">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="" aria-hidden="true" />
      </span>
      {caption && <span className="pol-emblem-name">{caption}</span>}
    </button>
  );
}
