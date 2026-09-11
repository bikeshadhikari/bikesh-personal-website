'use client';

import { useEffect } from 'react';

/**
 * Measures how long the reader actually spends on a post.
 *
 * Only time the page is visible counts, so a tab opened and left in the
 * background adds nothing. The figure is sent when the reader leaves, switches
 * tab or hides the window, using sendBeacon so it still arrives while the page
 * is being torn down. Each page load reports at most once; switching away and
 * back does not send a second time, it simply keeps counting.
 */
const MIN_SECONDS = 4;

export default function ReadTimer({ postId }: { postId: number }) {
  useEffect(() => {
    let visibleSince = document.visibilityState === 'visible' ? Date.now() : 0;
    let banked = 0;
    let sent = false;

    const elapsed = () => {
      const live = visibleSince ? (Date.now() - visibleSince) / 1000 : 0;
      return Math.round(banked + live);
    };

    const send = () => {
      if (sent) return;
      const seconds = elapsed();
      if (seconds < MIN_SECONDS) return;
      sent = true;

      const body = JSON.stringify({ seconds });
      const url = `/api/posts/${postId}/time`;
      // A Blob keeps the beacon a simple request, so it needs no preflight.
      if (navigator.sendBeacon?.(url, new Blob([body], { type: 'text/plain' }))) return;
      // Older browsers: a keepalive fetch does the same job.
      fetch(url, { method: 'POST', body, keepalive: true }).catch(() => {});
    };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        if (visibleSince) { banked += (Date.now() - visibleSince) / 1000; visibleSince = 0; }
        send();
      } else if (!visibleSince) {
        visibleSince = Date.now();
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', send);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', send);
      send();
    };
  }, [postId]);

  return null;
}
