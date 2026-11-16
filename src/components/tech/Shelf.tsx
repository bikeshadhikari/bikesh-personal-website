'use client';

import Link from 'next/link';
import { useRef } from 'react';
import TechIcon from './TechIcon';

/** A row of cards that scrolls sideways, with arrows on wide screens. */
export default function Shelf({
  title, note, count, seeAll, children,
}: {
  title: string;
  note?: string;
  count: string;
  seeAll: { label: string; href: string };
  children: React.ReactNode;
}) {
  const track = useRef<HTMLDivElement>(null);
  const move = (dir: number) => {
    const el = track.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
  };

  return (
    <section className="st-frame st-shelf">
      <div className="st-section-head">
        <div>
          <h2>{title}</h2>
          {note && <p className="st-shelf-note">{note}</p>}
        </div>
        <div className="st-shelf-tools">
          <span className="st-mono">{count}</span>
          <button type="button" className="st-icon-btn" onClick={() => move(-1)} aria-label="Previous">
            <TechIcon name="chevron-left" />
          </button>
          <button type="button" className="st-icon-btn" onClick={() => move(1)} aria-label="Next">
            <TechIcon name="chevron-right" />
          </button>
          <Link href={seeAll.href} className="st-see-all st-hl st-hl-tight" data-hl={count}>{seeAll.label} <TechIcon name="arrow-right" /></Link>
        </div>
      </div>
      <div className="st-shelf-track" ref={track}>{children}</div>
    </section>
  );
}
