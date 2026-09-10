'use client';

import { useEffect, useState } from 'react';
import Icon from '../Icon';

export function ThemeToggle() {
  const toggle = () => {
    const root = document.documentElement;
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch { /* private browsing */ }
  };

  return (
    <button className="icon-btn theme-toggle" type="button" onClick={toggle} aria-label="Switch colour theme">
      <span className="only-light"><Icon name="moon" /></span>
      <span className="only-dark"><Icon name="sun" /></span>
    </button>
  );
}

export function NavToggle() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const nav = document.getElementById('siteNav');
    if (nav) nav.classList.toggle('is-open', open);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const onClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('#siteNav a')) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClick);
    };
  }, [open]);

  return (
    <button
      className="icon-btn nav-toggle"
      type="button"
      aria-expanded={open}
      aria-controls="siteNav"
      aria-label={open ? 'Close menu' : 'Open menu'}
      onClick={() => setOpen((v) => !v)}
    >
      <span className="only-closed"><Icon name="menu" /></span>
      <span className="only-open"><Icon name="close" /></span>
    </button>
  );
}

/** Sticky-header shadow, the reading progress bar and the back-to-top button. */
export function ScrollProgress() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const header = document.getElementById('siteHeader');
    const bar = document.getElementById('scrollProgress');
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      header?.classList.toggle('is-stuck', y > 8);
      if (bar) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = `${max > 0 ? (y / max) * 100 : 0}%`;
      }
      setVisible(y > 600);
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <div className="scroll-progress" id="scrollProgress" aria-hidden="true" />
      <button
        className={`to-top${visible ? ' is-visible' : ''}`}
        type="button"
        aria-label="Back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <Icon name="arrow-up" />
      </button>
    </>
  );
}
