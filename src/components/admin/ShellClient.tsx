'use client';

import { useEffect, useState } from 'react';
import Icon from '../Icon';

export function SidebarControls() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.getElementById('adminSidebar')?.classList.toggle('is-open', open);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        className="icon-btn sidebar-open"
        type="button"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name={open ? 'close' : 'menu'} />
      </button>
      {open && <div className="sidebar-backdrop" onClick={() => setOpen(false)} />}
    </>
  );
}

export function AdminThemeToggle() {
  useEffect(() => {
    try {
      const stored = localStorage.getItem('admin-theme');
      if (stored) document.documentElement.setAttribute('data-theme', stored);
    } catch { /* private browsing */ }
  }, []);

  const toggle = () => {
    const root = document.documentElement;
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('admin-theme', next); } catch { /* private browsing */ }
  };

  return (
    <button className="icon-btn" type="button" onClick={toggle} aria-label="Switch theme">
      <span className="only-light"><Icon name="moon" /></span>
      <span className="only-dark"><Icon name="sun" /></span>
    </button>
  );
}

/** Confirms before a destructive form submits. */
export function ConfirmButton({
  children, message, className = 'btn btn-danger btn-xs',
}: { children: React.ReactNode; message: string; className?: string }) {
  return (
    <button
      className={className}
      type="submit"
      onClick={(e) => { if (!window.confirm(message)) e.preventDefault(); }}
    >
      {children}
    </button>
  );
}
