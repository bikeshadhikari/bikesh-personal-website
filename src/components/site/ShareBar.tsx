'use client';

import { useState } from 'react';
import Icon from '../Icon';

export default function ShareBar({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Older browsers without the clipboard API still get the feedback.
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="share-bar">
      <span>Share</span>
      <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
         target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn">
        <Icon name="linkedin" />
      </a>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
         target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook">
        <Icon name="facebook" />
      </a>
      <a href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
         target="_blank" rel="noopener noreferrer" aria-label="Share on X">
        <Icon name="twitter" />
      </a>
      <button className="copy-link" type="button" onClick={copy}>
        {copied ? 'Link copied' : 'Copy link'}
      </button>
    </div>
  );
}
