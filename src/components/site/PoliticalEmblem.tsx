'use client';

import { JAYA_EVENT } from './JayaNepal';

/**
 * The party's symbol standing beside the candidacy in the hero.
 *
 * It is a button rather than a picture because pressing it asks for the same
 * जय नेपाल greeting the floating button gives — the cheer itself lives in one
 * place, and this only sends word.
 *
 * The picture sits in a round plate of its own and melts into it. Two copies
 * do that between them: one enlarged and blurred to fill the whole disc, so the
 * picture's own colours reach the round edge, and the picture itself over the
 * top, shown whole and with its corners faded away into that wash. The seam
 * never shows because both layers are the same picture, so whatever is
 * uploaded — a square party logo, a tall portrait, a wide banner — arrives with
 * no square edge anywhere and nothing cropped off.
 *
 * The caption stands below the plate, clear of the circle, where a long one
 * can wrap.
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
        <span
          className="pol-emblem-wash"
          style={{ backgroundImage: `url("${image.replace(/"/g, '%22')}")` }}
          aria-hidden="true"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="" aria-hidden="true" />
      </span>
      {caption && <span className="pol-emblem-name">{caption}</span>}
    </button>
  );
}
