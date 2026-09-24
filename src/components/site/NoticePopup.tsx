'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Icon from '../Icon';

export type NoticeData = {
  id: number;
  title: string;
  body: string;
  image: string;
  linkUrl: string;
  linkLabel: string;
  dismissOnce: boolean;
  /** Where it is allowed to appear. */
  showOn: 'home' | 'all' | 'pages';
  /** The pages it is pinned to, when showOn is 'pages'. */
  showPaths: string[];
  /** Changes whenever the notice is edited, so an edited notice shows again. */
  version: string;
};

/**
 * Whether this notice belongs on the page being looked at.
 *
 * A pinned page matches the page itself and anything under it, so pinning to
 * /blog covers every article without listing them. Trailing slashes are
 * ignored, so /blog and /blog/ are the same page.
 */
function allowedHere(notice: NoticeData, pathname: string | null): boolean {
  const here = (pathname ?? '/').replace(/\/+$/, '') || '/';

  if (notice.showOn === 'all') return true;
  if (notice.showOn === 'home') return here === '/';

  return notice.showPaths.some((raw) => {
    const path = raw.replace(/\/+$/, '') || '/';
    return path === '/' ? here === '/' : here === path || here.startsWith(`${path}/`);
  });
}

/**
 * The notice a visitor meets on arrival.
 *
 * It has to be closed before the site can be used: the backdrop does not
 * dismiss it and neither does Escape, which is what "mandatory" means here.
 * That makes the close button the only way out, so it is always visible, it
 * takes focus as the notice opens, and focus is kept inside the dialog while
 * it is open — a person on a keyboard or a screen reader reaches the same one
 * control a person with a mouse does.
 *
 * Whether it comes back is the owner's choice. Shown once, the fact that this
 * visitor closed it is remembered in their own browser and nowhere else.
 */
export default function NoticePopup({ notice }: { notice: NoticeData }) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const key = `notice-seen-${notice.id}-${notice.version}`;
  const pathname = usePathname();
  const allowed = allowedHere(notice, pathname);

  useEffect(() => {
    if (!allowed) { setOpen(false); return; }
    if (!notice.dismissOnce) { setOpen(true); return; }
    try {
      if (window.localStorage.getItem(key) !== '1') setOpen(true);
    } catch {
      // Private browsing can refuse storage. Showing the notice is the safe
      // side of that: better seen twice than never.
      setOpen(true);
    }
  }, [key, notice.dismissOnce, allowed]);

  useEffect(() => {
    if (!open) return;

    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    const returnTo = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    // Escape is deliberately swallowed: the notice must be closed on purpose.
    // Tab is wrapped so focus cannot wander to the page behind it.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); return; }
      if (event.key !== 'Tab') return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      );
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !dialogRef.current?.contains(active))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault(); first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      root.style.overflow = previous;
      returnTo?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const close = () => {
    if (notice.dismissOnce) {
      try { window.localStorage.setItem(key, '1'); } catch { /* nothing to do */ }
    }
    setOpen(false);
  };

  const paragraphs = notice.body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const heading = notice.title.trim();
  const external = /^https?:\/\//i.test(notice.linkUrl);

  return (
    <div className="notice-backdrop" role="presentation">
      <div
        className="notice-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={heading || 'Notice'}
        ref={dialogRef}
      >
        <button
          type="button"
          className="notice-close"
          onClick={close}
          ref={closeRef}
          aria-label="Close this notice and continue to the site"
        >
          <Icon name="close" />
        </button>

        <div className="notice-scroll">
          {notice.image && (
            // The whole picture is shown whatever its shape, so a poster is
            // never cropped to fit a box it was not made for.
            // eslint-disable-next-line @next/next/no-img-element
            <img className="notice-image" src={notice.image} alt={heading} />
          )}

          {(heading || paragraphs.length > 0 || notice.linkUrl) && (
            <div className="notice-body">
              {heading && <h2>{heading}</h2>}
              {paragraphs.map((p, i) => <p key={i}>{p}</p>)}

              {notice.linkUrl && (
                <a
                  className="btn btn-primary notice-link"
                  href={notice.linkUrl}
                  {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  {notice.linkLabel || 'Read more'}
                  <Icon name={external ? 'external' : 'arrow-right'} className="icon icon-sm" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
