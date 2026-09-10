'use client';

import { useEffect, useRef, useState } from 'react';

/** Types each role out, deletes it, moves to the next. Static if motion is reduced. */
export default function RoleRotator({ roles }: { roles: string[] }) {
  const [text, setText] = useState(roles[0] ?? '');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (roles.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let index = 0;
    let chars = roles[0].length;
    let deleting = false;

    const tick = () => {
      const word = roles[index];
      chars += deleting ? -1 : 1;
      setText(word.slice(0, chars));

      let delay = deleting ? 45 : 85;
      if (!deleting && chars === word.length) { deleting = true; delay = 1800; }
      else if (deleting && chars === 0) { deleting = false; index = (index + 1) % roles.length; delay = 260; }

      timer.current = setTimeout(tick, delay);
    };

    timer.current = setTimeout(tick, 2000);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [roles]);

  return (
    <span className="rotator">
      <span className="rotator-text">{text}</span>
      <span className="rotator-caret" aria-hidden="true" />
    </span>
  );
}
