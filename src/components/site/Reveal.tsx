'use client';

import { useEffect } from 'react';

/**
 * Scroll-in animation, skill bar fills and counting numbers.
 * Everything degrades to visible-and-static when motion is reduced.
 */
export default function Reveal() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const targets = document.querySelectorAll<HTMLElement>(
      '.section-head, .card, .timeline-item, .highlight-card, .cert-item, .skill-group, .process-list li',
    );
    targets.forEach((el) => el.classList.add('reveal'));

    const countUp = (el: HTMLElement) => {
      const raw = String(el.dataset.target ?? el.textContent ?? '').replace(/[^0-9.]/g, '');
      const target = Number.parseFloat(raw);
      if (!Number.isFinite(target)) return;
      if (reduce) { el.textContent = raw; return; }

      const duration = 1400;
      let start: number | null = null;
      const step = (ts: number) => {
        if (start === null) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(target * eased).toLocaleString();
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    if (!('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('is-visible'));
      document.querySelectorAll('.skill-bar').forEach((b) => b.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          el.classList.add('is-visible');
          el.querySelectorAll('.skill-bar').forEach((b) => b.classList.add('is-visible'));
          const counter = el.querySelector<HTMLElement>('.counter');
          if (counter && !counter.dataset.done) { counter.dataset.done = '1'; countUp(counter); }
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return null;
}
