'use client';

import { useEffect, useRef } from 'react';
import { writeClipboard } from './CopyButton';

/**
 * A post's article. Every code block written in the dashboard gets its own
 * Copy button, so a long post can carry copyable text anywhere in it.
 */
export default function ArticleBody({ html, copy, copied }: { html: string; copy: string; copied: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const buttons: HTMLButtonElement[] = [];
    root.querySelectorAll('pre').forEach((pre) => {
      if (pre.parentElement?.classList.contains('st-pre-wrap')) return;
      const wrap = document.createElement('div');
      wrap.className = 'st-pre-wrap';
      pre.replaceWith(wrap);
      wrap.appendChild(pre);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'st-copy st-copy-float';
      btn.textContent = copy;
      btn.addEventListener('click', async () => {
        if (await writeClipboard(pre.innerText)) {
          btn.textContent = copied;
          btn.classList.add('is-done');
          window.setTimeout(() => { btn.textContent = copy; btn.classList.remove('is-done'); }, 1800);
        }
      });
      wrap.appendChild(btn);
      buttons.push(btn);
    });
  }, [html, copy, copied]);

  return <div ref={ref} className="st-prose" dangerouslySetInnerHTML={{ __html: html }} />;
}
