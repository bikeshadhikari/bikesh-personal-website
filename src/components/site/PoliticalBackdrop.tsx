/**
 * The drift behind the political page: the party flag and the tree it is voted
 * by, floating on two depths.
 *
 * The flag keeps its own white stripe, which runs to the edge of the artwork
 * and so cannot be cut away from the white around it. It is drawn with
 * multiply blending instead: on this pale page the surrounding white falls
 * away and the stripe reads as the paper. The tree is a single shape, so it
 * carries a real transparent background.
 *
 * Decoration only, hidden from assistive technology, still for anyone who has
 * asked for reduced motion.
 */
export default function PoliticalBackdrop() {
  return (
    <div className="pol-backdrop" aria-hidden="true">
      <span className="pol-glow pol-glow-1" />
      <span className="pol-glow pol-glow-2" />
      <span className="pol-glow pol-glow-3" />

      <div className="pol-layer pol-layer-far">
        <span className="pol-mark pol-tree pol-mark-1" />
        <span className="pol-mark pol-banner pol-mark-2" />
        <span className="pol-mark pol-tree pol-mark-3" />
      </div>

      <div className="pol-layer pol-layer-near">
        <span className="pol-mark pol-banner pol-mark-4" />
        <span className="pol-mark pol-tree pol-mark-5" />
        <span className="pol-mark pol-banner pol-mark-6" />
      </div>
    </div>
  );
}
