'use client';

import { useEffect } from 'react';

/**
 * A soft highlight that follows the pointer across a card.
 *
 * One listener on the document rather than one per card, coalesced into a
 * single animation frame, writing two custom properties the stylesheet reads.
 * It does nothing on a touch screen, where there is no pointer to follow, and
 * nothing for a visitor who has asked for reduced motion.
 */
const SELECTOR = '.card, .highlight-card, .cert-item, .skill-group, .side-box, .about-facts, .hero-photo';

export default function PointerGlow() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const root = document.documentElement;
    let frame = 0;
    let pending: { el: HTMLElement; x: number; y: number } | null = null;
    let drift = { x: 0, y: 0 };
    let last: HTMLElement | null = null;

    const apply = () => {
      frame = 0;
      // How far the pointer sits from the middle of the window, as -1 to 1.
      // The backdrop leans this way, which gives the page a sense of depth.
      root.style.setProperty('--mx', drift.x.toFixed(3));
      root.style.setProperty('--my', drift.y.toFixed(3));
      if (!pending) return;
      const { el, x, y } = pending;
      el.style.setProperty('--px', `${x}%`);
      el.style.setProperty('--py', `${y}%`);
    };

    const onMove = (event: PointerEvent) => {
      drift = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: (event.clientY / window.innerHeight) * 2 - 1,
      };

      const el = (event.target as Element | null)?.closest<HTMLElement>(SELECTOR) ?? null;

      if (el !== last) {
        last?.classList.remove('is-lit');
        last = el;
        el?.classList.add('is-lit');
      }

      if (el) {
        const box = el.getBoundingClientRect();
        pending = {
          el,
          x: ((event.clientX - box.left) / box.width) * 100,
          y: ((event.clientY - box.top) / box.height) * 100,
        };
      } else {
        pending = null;
      }
      frame ||= requestAnimationFrame(apply);
    };

    const onLeave = () => { last?.classList.remove('is-lit'); last = null; };

    document.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);

    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      if (frame) cancelAnimationFrame(frame);
      last?.classList.remove('is-lit');
      root.style.removeProperty('--mx');
      root.style.removeProperty('--my');
    };
  }, []);

  return null;
}
