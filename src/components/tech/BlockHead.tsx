'use client';

import { useState } from 'react';
import { writeClipboard } from './CopyButton';
import TechIcon from './TechIcon';

/**
 * The heading row of a copy block. It lights up on hover like every other
 * item; with a link it opens the link, without one a click copies the block.
 */
export default function BlockHead({
  no, title, description, url, text, linkId, openLabel, copyLabel, copiedLabel,
}: {
  no: string;
  title: string;
  description: string;
  url: string;
  text: string;
  linkId: number;
  openLabel: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [done, setDone] = useState(false);

  const inner = (
    <>
      <span className="st-block-no st-mono">{no}</span>
      <span className="st-block-text">
        {title && <span className="st-block-title">{title}</span>}
        {description && <span className="st-block-desc">{description}</span>}
      </span>
      <span className="st-block-arrow"><TechIcon name={url ? 'arrow-up-right' : done ? 'check' : 'copy'} /></span>
    </>
  );

  if (url) {
    return (
      <a className="st-block-head st-hl" data-hl={openLabel} href={url} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    );
  }

  async function copy() {
    if (!(await writeClipboard(text))) return;
    setDone(true);
    window.setTimeout(() => setDone(false), 1800);
    try {
      navigator.sendBeacon?.('/api/tech/copy', new Blob([JSON.stringify({ id: linkId })], { type: 'application/json' }));
    } catch { /* never worth an error */ }
  }

  return (
    <button type="button" className="st-block-head st-hl" data-hl={done ? copiedLabel : copyLabel} onClick={copy}>
      {inner}
    </button>
  );
}
