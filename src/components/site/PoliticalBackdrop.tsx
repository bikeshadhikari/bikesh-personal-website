/**
 * The drift behind the political page: party flags on their poles, the tree
 * the party is voted by, and a few soft lights.
 *
 * Everything is drawn here in SVG rather than loaded as an image, so it costs
 * nothing to fetch, stays sharp at any size and can be tinted from the page's
 * own palette. It is decoration only, hidden from assistive technology, and
 * holds still for anyone who has asked for reduced motion.
 */
function Tree({ className }: { className: string }) {
  return (
    <span className={className} aria-hidden="true">
      <svg viewBox="0 0 64 64" width="100%" height="100%" fill="none"
           stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M32 60V34" />
        <path d="M32 34 20 24M32 41 44 31M32 28 24 16M32 21 40 11" />
        <circle cx="32" cy="17" r="11" />
        <circle cx="19" cy="27" r="8" />
        <circle cx="45" cy="27" r="8" />
        <circle cx="32" cy="33" r="6.5" />
      </svg>
    </span>
  );
}

function Flag({ className }: { className: string }) {
  return (
    <span className={className} aria-hidden="true">
      <svg viewBox="0 0 80 90" width="100%" height="100%">
        {/* The pole. */}
        <rect x="6" y="2" width="3" height="86" rx="1.5" fill="currentColor" opacity=".55" />
        {/* A green field that ripples, with the tree standing on it. */}
        <g className="pol-flag-cloth">
          <path
            d="M9 6c14-5 28 5 42 0 8-3 14-2 20 1v40c-6-3-12-4-20-1-14 5-28-5-42 0z"
            fill="currentColor" opacity=".8"
          />
          <g transform="translate(30 12) scale(.36)" stroke="#ffffff" strokeWidth="3.4"
             fill="none" strokeLinecap="round" opacity=".85">
            <path d="M32 60V34" />
            <path d="M32 34 20 24M32 41 44 31" />
            <circle cx="32" cy="18" r="12" />
            <circle cx="18" cy="29" r="8.5" />
            <circle cx="46" cy="29" r="8.5" />
          </g>
        </g>
      </svg>
    </span>
  );
}

export default function PoliticalBackdrop() {
  return (
    <div className="pol-backdrop" aria-hidden="true">
      <span className="pol-glow pol-glow-1" />
      <span className="pol-glow pol-glow-2" />
      <span className="pol-glow pol-glow-3" />

      <div className="pol-layer pol-layer-far">
        <Tree className="pol-sym pol-sym-1" />
        <Flag className="pol-sym pol-sym-2" />
        <Tree className="pol-sym pol-sym-3" />
      </div>

      <div className="pol-layer pol-layer-near">
        <Flag className="pol-sym pol-sym-4" />
        <Tree className="pol-sym pol-sym-5" />
        <Flag className="pol-sym pol-sym-6" />
      </div>
    </div>
  );
}
