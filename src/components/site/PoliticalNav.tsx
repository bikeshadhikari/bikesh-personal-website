'use client';

import { useEffect, useRef, useState } from 'react';

type Item = { id: number; number: string; title: string };

/**
 * The strip of section links that sticks under the top of the page.
 *
 * It marks the section currently being read, so on a long page a reader always
 * knows where they are. An observer watches the sections rather than the
 * scroll position, which stays accurate whatever the section heights are, and
 * the strip scrolls the active chip into view on a narrow screen.
 */
export default function PoliticalNav({ sections }: { sections: Item[] }) {
  const [active, setActive] = useState<number | null>(sections[0]?.id ?? null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const id = Number(visible.target.id.replace('s-', ''));
        if (Number.isFinite(id)) setActive(id);
      },
      { rootMargin: '-25% 0px -60% 0px', threshold: [0.01, 0.2, 0.5] },
    );

    for (const section of sections) {
      const el = document.getElementById(`s-${section.id}`);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [sections]);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar || active === null) return;
    const chip = bar.querySelector<HTMLElement>(`[data-for="${active}"]`);
    if (!chip) return;
    const left = chip.offsetLeft - bar.clientWidth / 2 + chip.clientWidth / 2;
    bar.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
  }, [active]);

  return (
    <nav className="pol-nav" aria-label="पृष्ठका खण्डहरू">
      <div className="pol-nav-scroll" ref={barRef}>
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#s-${section.id}`}
            data-for={section.id}
            className={`pol-chip${active === section.id ? ' is-active' : ''}`}
            aria-current={active === section.id ? 'true' : undefined}
          >
            {section.number && <span className="pol-chip-no">{section.number}</span>}
            <span className="pol-chip-title">{section.title}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}
