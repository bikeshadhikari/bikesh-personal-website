'use client';

import { useState } from 'react';
import { writeClipboard } from './CopyButton';
import TechIcon from './TechIcon';

/** The phone's share sheet where there is one, otherwise copy the address. */
export default function ShareLink({ url, title, label, copied }: {
  url: string; title: string; label: string; copied: string;
}) {
  const [done, setDone] = useState(false);
  async function share() {
    if (navigator.share) {
      try { await navigator.share({ title, url }); return; } catch { /* cancelled */ return; }
    }
    if (await writeClipboard(url)) {
      setDone(true);
      window.setTimeout(() => setDone(false), 1800);
    }
  }
  return (
    <button type="button" className="st-btn st-btn-ghost" onClick={share}>
      <TechIcon name={done ? 'check' : 'share'} /> {done ? copied : label}
    </button>
  );
}
