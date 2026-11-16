'use client';

import { useState } from 'react';
import TechIcon from './TechIcon';

async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* fall through to the old way */ }
  // In-app browsers (Instagram, Facebook) often refuse the modern API.
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch { ok = false; }
  area.remove();
  return ok;
}

/** Copies a block's text, says so, and counts the copy for the dashboard. */
export default function CopyButton({
  text, label, doneLabel, linkId, className = '',
}: { text: string; label: string; doneLabel: string; linkId?: number; className?: string }) {
  const [done, setDone] = useState(false);

  async function copy() {
    const ok = await writeClipboard(text);
    if (!ok) return;
    setDone(true);
    window.setTimeout(() => setDone(false), 1800);
    if (linkId) {
      try {
        navigator.sendBeacon?.('/api/tech/copy', new Blob([JSON.stringify({ id: linkId })], { type: 'application/json' }));
      } catch { /* counting is never worth an error */ }
    }
  }

  return (
    <button type="button" className={`st-copy${done ? ' is-done' : ''} ${className}`} onClick={copy}
            aria-live="polite">
      <TechIcon name={done ? 'check' : 'copy'} />
      <span>{done ? doneLabel : label}</span>
    </button>
  );
}

export { writeClipboard };
