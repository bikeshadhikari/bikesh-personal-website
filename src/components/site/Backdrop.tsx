/**
 * The soft geometry behind the page.
 *
 * Pure CSS and one inline SVG, no images and no JavaScript, so it costs
 * nothing to load and nothing to run. The shapes drift on the compositor via
 * transform and opacity only, and stop entirely when a visitor has asked for
 * reduced motion.
 */
export default function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      {/* Two depths that lean opposite ways as the pointer moves, so the
          background has a little parallax without any layout work. */}
      <div className="backdrop-parallax-far">
        <span className="backdrop-orb backdrop-orb-1" />
        <span className="backdrop-orb backdrop-orb-2" />
        <span className="backdrop-orb backdrop-orb-3" />
        <span className="backdrop-orb backdrop-orb-4" />
        <span className="backdrop-orb backdrop-orb-5" />
      </div>

      <svg className="backdrop-grid" width="100%" height="100%">
        <defs>
          <pattern id="bd-grid" width="46" height="46" patternUnits="userSpaceOnUse">
            <path d="M46 0H0V46" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#bd-grid)" />
      </svg>

      <div className="backdrop-parallax">
        {/* Outlined shapes that turn as they drift, each in its own colour. */}
        <span className="backdrop-shape backdrop-shape-1" />
        <span className="backdrop-shape backdrop-shape-2" />
        <span className="backdrop-shape backdrop-shape-3" />

        {/* A few marks from the subject's own world: a bracket, a terminal
            prompt, a chevron and a tag, drifting slowly. */}
        <span className="backdrop-glyph backdrop-glyph-1">{'{ }'}</span>
        <span className="backdrop-glyph backdrop-glyph-2">{'</>'}</span>
        <span className="backdrop-glyph backdrop-glyph-3">{'$_'}</span>
        <span className="backdrop-glyph backdrop-glyph-4">{'#'}</span>
      </div>
    </div>
  );
}
