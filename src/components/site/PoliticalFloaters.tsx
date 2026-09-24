/**
 * The small drawings that drift across the hero.
 *
 * They are vectors rather than cut-down photographs so they stay crisp at any
 * size and cost the page nothing to load, and they are drawn small on purpose:
 * at every width they read as ornament behind the words, never as something
 * competing with them. Three subjects, each from the party's own iconography —
 * the flag, the tree on the ballot, and the four stars the flag carries.
 *
 * Purely decorative, so the whole field is hidden from assistive technology.
 */

/** The four stars sit in this arrangement on the flag itself. */
const STARS: [number, number][] = [[7, 5.5], [17, 4], [11.5, 12], [21, 11]];

function Star({ x, y, r = 2.6 }: { x: number; y: number; r?: number }) {
  // A five-pointed star, drawn from its centre so it can be placed by point.
  const points = Array.from({ length: 10 }, (_, i) => {
    const radius = i % 2 === 0 ? r : r * 0.4;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    return `${(x + radius * Math.cos(angle)).toFixed(2)},${(y + radius * Math.sin(angle)).toFixed(2)}`;
  }).join(' ');
  return <polygon points={points} />;
}

function Flag() {
  return (
    <svg viewBox="0 0 32 22" className="pol-float-art" role="presentation">
      {/* A pennant with a gentle wave along its lower edge. */}
      <path d="M2 2 h28 v13 q-7 4 -14 1 T2 17 Z" fill="#c8102e" />
      <path d="M2 7.4 h28 v4.2 q-7 3.4 -14 .9 T2 11.6 Z" fill="#fff" />
      <g fill="#c8102e">
        {STARS.map(([x, y], i) => <Star key={i} x={x + 2} y={y + 1.5} r={1.7} />)}
      </g>
      {/* The white band would disappear into a pale page without an edge. */}
      <path
        d="M2 2 h28 v13 q-7 4 -14 1 T2 17 Z"
        fill="none" stroke="#8d0f24" strokeWidth=".7" strokeLinejoin="round"
      />
      <rect x=".6" y="1" width="1.8" height="20" rx=".9" fill="#0b6b3a" />
    </svg>
  );
}

function Tree() {
  return (
    <svg viewBox="0 0 24 24" className="pol-float-art" role="presentation">
      <g fill="#0b6b3a">
        {/* Canopy: overlapping rounds rather than one blob, so the outline
            still reads as foliage at twenty pixels across. */}
        <circle cx="12" cy="8" r="5.4" />
        <circle cx="7" cy="10.5" r="3.9" />
        <circle cx="17" cy="10.5" r="3.9" />
        <circle cx="9.5" cy="6" r="3.2" />
        <circle cx="14.5" cy="6" r="3.2" />
      </g>
      <path
        d="M11.2 12 v4.6 l-3 3.4 M12.8 12 v4.6 l3 3.4 M12 13.5 v8"
        stroke="#0b6b3a" strokeWidth="1.35" strokeLinecap="round" fill="none"
      />
    </svg>
  );
}

function Stars() {
  return (
    <svg viewBox="0 0 26 18" className="pol-float-art" role="presentation">
      <g fill="#c8102e" stroke="#8d0f24" strokeWidth=".35" strokeLinejoin="round">
        {STARS.map(([x, y], i) => <Star key={i} x={x + 1} y={y + 1} r={3.4} />)}
      </g>
    </svg>
  );
}

/**
 * Where each piece sits, how big it is, and how long its drift takes.
 *
 * `edge` marks the pieces standing clear of the column the words occupy. On a
 * narrow screen that column is the whole width and the pledge cards fill
 * everything below the middle, so there only the upper edge pieces stay: a
 * drawing half-hidden behind a white card reads as a smudge, not as ornament.
 *
 * The pieces hugging the left margin are a third case. They need a gutter to
 * stand in, and between the hero going two-column and the page reaching the
 * width of its own wrapper there is none, so a laptop had them sitting on the
 * words. The stylesheet drops them across exactly that band.
 */
const PIECES = [
  { art: 'flag',  top: '11%', left: '4%',  size: 58, spin: -14, dur: 13, delay: 0,   edge: true },
  { art: 'stars', top: '5%',  left: '47%', size: 44, spin: 8,   dur: 17, delay: 2.5, edge: true },
  { art: 'tree',  top: '24%', left: '90%', size: 40, spin: 6,   dur: 15, delay: 1.2, edge: true },
  { art: 'stars', top: '52%', left: '5%',  size: 36, spin: -10, dur: 19, delay: 4,   edge: true },
  { art: 'tree',  top: '74%', left: '3%',  size: 44, spin: 9,   dur: 14, delay: 3.1, edge: true },
  { art: 'flag',  top: '78%', left: '66%', size: 50, spin: 12,  dur: 16, delay: 1.8, edge: false },
  { art: 'stars', top: '90%', left: '62%', size: 34, spin: -7,  dur: 18, delay: 5.2, edge: false },
  { art: 'tree',  top: '88%', left: '93%', size: 36, spin: -9,  dur: 20, delay: 2.2, edge: true },
] as const;

export default function PoliticalFloaters() {
  return (
    <div className="pol-floats" aria-hidden="true">
      {PIECES.map((piece, i) => (
        <span
          key={i}
          className={[
            'pol-float',
            `is-${piece.art}`,
            piece.edge ? 'is-edge' : '',
            parseFloat(piece.top) >= 60 ? 'is-low' : '',
            parseFloat(piece.left) < 8 ? 'is-side' : '',
          ].filter(Boolean).join(' ')}
          style={{
            top: piece.top,
            left: piece.left,
            '--size': `${piece.size}px`,
            '--spin': `${piece.spin}deg`,
            '--dur': `${piece.dur}s`,
            '--delay': `${piece.delay}s`,
          } as React.CSSProperties}
        >
          {piece.art === 'flag' ? <Flag /> : piece.art === 'tree' ? <Tree /> : <Stars />}
        </span>
      ))}
    </div>
  );
}
