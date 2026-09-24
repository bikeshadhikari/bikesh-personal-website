'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Icon from '../Icon';

export type Slide = { id: number; image: string; caption: string; width: number; height: number };

const HOLD_MS = 4500;

/**
 * The photographs at the top of the political page.
 *
 * It advances on its own, pauses while the pointer is on it or while the tab
 * is hidden, and stops for good the moment anyone works the arrows or dots —
 * a carousel that keeps moving under a reader's hand is a nuisance. Only the
 * current slide is in the accessibility tree, and the frame holds one shape so
 * the page does not jump as photographs of different sizes come round.
 */
export default function PoliticalSlider({ slides, alt }: { slides: Slide[]; alt: string }) {
  const [at, setAt] = useState(0);
  const [held, setHeld] = useState(false);
  const stopped = useRef(false);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const go = useCallback((next: number) => {
    setAt((next + slides.length) % slides.length);
  }, [slides.length]);

  const take = (next: number) => { stopped.current = true; go(next); };

  useEffect(() => {
    if (slides.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const tick = () => {
      if (stopped.current || held || document.hidden) return;
      setAt((current) => (current + 1) % slides.length);
    };
    timer.current = setInterval(tick, HOLD_MS);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [slides.length, held]);

  if (slides.length === 0) return null;

  const current = slides[at];

  return (
    <div
      className="pol-slider"
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocusCapture={() => setHeld(true)}
      onBlurCapture={() => setHeld(false)}
    >
      <div className="pol-slider-frame">
        {slides.map((slide, i) => (
          <figure
            key={slide.id}
            className={`pol-slide${i === at ? ' is-on' : ''}`}
            aria-hidden={i === at ? undefined : true}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.image}
              alt={slide.caption || alt}
              loading={i === 0 ? 'eager' : 'lazy'}
            />
            {slide.caption && <figcaption>{slide.caption}</figcaption>}
          </figure>
        ))}

        {slides.length > 1 && (
          <>
            <button type="button" className="pol-slide-arrow is-prev"
                    onClick={() => take(at - 1)} aria-label="अघिल्लो तस्बिर">
              <Icon name="arrow-right" />
            </button>
            <button type="button" className="pol-slide-arrow is-next"
                    onClick={() => take(at + 1)} aria-label="अर्को तस्बिर">
              <Icon name="arrow-right" />
            </button>
          </>
        )}
      </div>

      {slides.length > 1 && (
        <div className="pol-slide-dots" role="tablist" aria-label="तस्बिरहरू">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={i === at}
              aria-label={`तस्बिर ${i + 1}`}
              className={i === at ? 'is-on' : undefined}
              onClick={() => take(i)}
            />
          ))}
        </div>
      )}

      <p className="visually-hidden" aria-live="polite">
        {current.caption || `तस्बिर ${at + 1} / ${slides.length}`}
      </p>
    </div>
  );
}
