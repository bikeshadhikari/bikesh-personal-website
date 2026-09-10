'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Icon from '../Icon';

/** Dashboard-wide search. Enter runs it; the slash key jumps here from anywhere. */
export default function AdminSearchBox({
  initial = '', autoFocus = false, compact = false,
}: { initial?: string; autoFocus?: boolean; compact?: boolean }) {
  const router = useRouter();
  const [term, setTerm] = useState(initial);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!compact) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && /^(input|textarea|select)$/i.test(target.tagName);
      if (e.key === '/' && !typing && !target?.isContentEditable) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [compact]);

  return (
    <form
      className={compact ? 'topbar-search' : 'inline-search admin-search'}
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        if (term.trim().length >= 2) router.push(`/admin/search?q=${encodeURIComponent(term.trim())}`);
      }}
    >
      <Icon name="search" className="icon icon-sm" />
      <label className="visually-hidden" htmlFor={compact ? 'topbarSearch' : 'adminSearch'}>
        Search the dashboard
      </label>
      <input
        ref={input}
        id={compact ? 'topbarSearch' : 'adminSearch'}
        type="search"
        value={term}
        autoFocus={autoFocus}
        onChange={(e) => setTerm(e.target.value)}
        placeholder={compact ? 'Search  /' : 'Search posts, settings, anything…'}
      />
      {!compact && (
        <button className="btn btn-primary btn-sm" type="submit">Search</button>
      )}
    </form>
  );
}
