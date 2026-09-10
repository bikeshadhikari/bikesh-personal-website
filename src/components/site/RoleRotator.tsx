'use client';

import { useEffect, useRef, useState } from 'react';

const TYPE_MS = 70;
const DELETE_MS = 35;
const HOLD_MS = 1700;
const GAP_MS = 320;

/**
 * Types each role out, holds it, deletes it, moves to the next.
 *
 * The first role is rendered on the server so the line is never empty, then
 * the cycle begins by erasing it. Reduced motion leaves the first role in
 * place and skips the animation entirely.
 */
export default function RoleRotator({ roles }: { roles: string[] }) {
  const [text, setText] = useState(roles[0] ?? '');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const key = roles.join('|');

  useEffect(() => {
    const list = key.split('|').filter(Boolean);
    if (list.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let index = 0;
    let chars = list[0].length;
    // The opening word is already on screen, so the first thing to do is erase it.
    let phase: 'typing' | 'deleting' = 'deleting';
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      const word = list[index];

      if (phase === 'typing') {
        chars = Math.min(chars + 1, word.length);
        setText(word.slice(0, chars));
        if (chars === word.length) {
          phase = 'deleting';
          timer.current = setTimeout(tick, HOLD_MS);
          return;
        }
        timer.current = setTimeout(tick, TYPE_MS);
        return;
      }

      chars = Math.max(chars - 1, 0);
      setText(word.slice(0, chars));
      if (chars === 0) {
        index = (index + 1) % list.length;
        phase = 'typing';
        timer.current = setTimeout(tick, GAP_MS);
        return;
      }
      timer.current = setTimeout(tick, DELETE_MS);
    };

    timer.current = setTimeout(tick, HOLD_MS);

    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [key]);

  return (
    <span className="rotator">
      <span className="rotator-text">{text}</span>
      <span className="rotator-caret" aria-hidden="true" />
    </span>
  );
}
