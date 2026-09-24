'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Icon from '../Icon';

export type Slide = { id: number; image: string; caption: string; width: number; height: number };

/**
 * The photographs, as a rail of small cards rather than one large picture.
 *
 * Several read at once and the next one peeks in from the edge, so the row
 * announces that there is more to see without needing dots to say so. It is a
 * real scroll container: a finger drags it, a trackpad swipes it, the keyboard
 * reaches every card, and the arrows are a convenience on top rather than the
 * only way through.
 */
export default function PoliticalSlider({ slides, alt }: { slides: Slide[]; alt: string }) {
  const rail = useRef<HTMLUListElement | null>(null);
  const [at, setAt] = useState({ start: true, end: false });

  /** Which arrows are worth showing depends on how far along the rail is. */
  const measure = useCallback(() => {
    const node = rail.current;
    if (!node) return;
    const slack = node.scrollWidth - node.clientWidth;
    setAt({
      start: node.scrollLeft <= 4,
      // Never both at once: a rail with nothing to scroll shows no arrows.
      end: slack <= 4 || node.scrollLeft >= slack - 4,
    });
  }, []);

  useEffect(() => {
    measure();
    const node = rail.current;
    if (!node) return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [measure]);

  /** One card's worth of travel, so a press moves a predictable distance. */
  const step = (direction: 1 | -1) => {
    const node = rail.current;
    if (!node) return;
    const card = node.firstElementChild as HTMLElement | null;
    const width = card ? card.getBoundingClientRect().width + 16 : node.clientWidth * 0.8;
    node.scrollBy({ left: width * direction, behavior: 'smooth' });
  };

  if (slides.length === 0) return null;

  return (
    <div className="pol-rail">
      <button
        type="button"
        className="pol-rail-arrow is-prev"
        onClick={() => step(-1)}
        aria-label="अघिल्ला तस्बिरहरू"
        hidden={at.start}
      >
        <Icon name="arrow-right" />
      </button>

      <ul className="pol-rail-track" ref={rail} onScroll={measure}>
        {slides.map((slide, i) => (
          <li key={slide.id} className="pol-rail-card">
            <figure>
              <div className="pol-rail-shot">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slide.image}
                  alt={slide.caption || alt}
                  loading={i < 3 ? 'eager' : 'lazy'}
                />
              </div>
              {slide.caption && <figcaption>{slide.caption}</figcaption>}
            </figure>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="pol-rail-arrow is-next"
        onClick={() => step(1)}
        aria-label="अरू तस्बिरहरू"
        hidden={at.end}
      >
        <Icon name="arrow-right" />
      </button>
    </div>
  );
}
