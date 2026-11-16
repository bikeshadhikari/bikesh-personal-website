'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import TechIcon from './TechIcon';

function currentTheme(): 'dark' | 'light' {
  const el = document.querySelector('.st');
  return el?.getAttribute('data-st-theme') === 'light' ? 'light' : 'dark';
}

/** Search, and the light/dark switch. */
export function TechHeaderControls({
  searchAction, lang, searchLabel, placeholder, themeLabel, showTheme,
}: {
  searchAction: string;
  lang: string;
  searchLabel: string;
  placeholder: string;
  themeLabel: string;
  showTheme: boolean;
}) {
  const [open, setOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const [path, query] = searchAction.split('?');
  const langParam = new URLSearchParams(query ?? '').get('lang');

  useEffect(() => {
    if (open) input.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      const target = e.target as HTMLElement;
      if (e.key === '/' && !open && !['INPUT', 'TEXTAREA'].includes(target.tagName)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  function toggleTheme() {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    document.querySelector('.st')?.setAttribute('data-st-theme', next);
    document.documentElement.setAttribute('data-st-page', next);
    try { localStorage.setItem('st-theme', next); } catch { /* private mode */ }
  }

  return (
    <>
      <button type="button" className="st-icon-btn" onClick={() => setOpen(true)} aria-label={searchLabel}
              aria-expanded={open}>
        <TechIcon name="search" />
      </button>
      {showTheme && (
        <button type="button" className="st-icon-btn st-theme-btn" onClick={toggleTheme} aria-label={themeLabel}
                title={themeLabel}>
          <TechIcon name="sun" className="st-ico st-ico-sun" />
          <TechIcon name="moon" className="st-ico st-ico-moon" />
        </button>
      )}
      {open && (
        <div className="st-search-overlay" role="dialog" aria-modal="true" aria-label={searchLabel}
             onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <form className="st-search-box" action={path} method="get">
            <TechIcon name="search" />
            <input ref={input} type="search" name="q" placeholder={placeholder} aria-label={searchLabel}
                   lang={lang === 'ne' ? 'ne' : 'en'} />
            {langParam && <input type="hidden" name="lang" value={langParam} />}
            <button type="button" className="st-icon-btn" onClick={() => setOpen(false)} aria-label="Close">
              <TechIcon name="close" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

/** The menu behind a button on narrow screens. */
export function TechMobileMenu({
  label, closeLabel, items, socials, subscribe, lang,
}: {
  label: string;
  closeLabel: string;
  items: { label: string; href: string }[];
  socials: { label: string; icon: string; url: string }[];
  subscribe: { label: string; href: string } | null;
  lang: { label: string; href: string; show: boolean };
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('st-locked', open);
    return () => document.documentElement.classList.remove('st-locked');
  }, [open]);

  return (
    <>
      <button type="button" className="st-icon-btn st-burger" onClick={() => setOpen(true)} aria-label={label}
              aria-expanded={open}>
        <TechIcon name="menu" />
      </button>
      {open && (
        <div className="st-drawer" role="dialog" aria-modal="true" aria-label={label}>
          <div className="st-drawer-head">
            <span className="st-mono">{label}</span>
            <button type="button" className="st-icon-btn" onClick={() => setOpen(false)} aria-label={closeLabel}>
              <TechIcon name="close" />
            </button>
          </div>
          <ul>
            {items.map((item) => (
              <li key={item.href}>
                <Link href={item.href} onClick={() => setOpen(false)}>
                  <span className="st-slash">/</span>{item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="st-drawer-foot">
            {lang.show && <Link className="st-lang" href={lang.href} onClick={() => setOpen(false)}>{lang.label}</Link>}
            {subscribe && (
              <a className="st-btn st-btn-light" href={subscribe.href} target="_blank" rel="noopener noreferrer">
                {subscribe.label}
              </a>
            )}
            <div className="st-socials">
              {socials.map((x) => (
                <a key={x.url} href={x.url} target="_blank" rel="noopener noreferrer" aria-label={x.label}
                   className="st-social">
                  <TechIcon name={x.icon} />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
