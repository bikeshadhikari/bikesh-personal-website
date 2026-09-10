import type { GalleryItem } from '@/lib/types';

/**
 * Masonry that arranges itself around whatever gets uploaded.
 *
 * Each photo's real aspect ratio is stored when it is uploaded, so a tile can
 * be given its exact height in grid rows before the image loads. Nothing jumps
 * as the page fills in, and portrait, landscape and square all sit together
 * without cropping.
 */
export default function Gallery({ items }: { items: GalleryItem[] }) {
  if (items.length === 0) {
    return (
      <p className="empty-state">
        No photos yet. Add them under <strong>Gallery</strong> in the dashboard.
      </p>
    );
  }

  return (
    <div className="masonry">
      {items.map((item) => {
        // The stored shape reserves the tile's height before the image loads,
        // so nothing shifts as the gallery fills in. Older rows without
        // measurements fall back to 4:3.
        const ratio = item.width > 0 && item.height > 0
          ? `${item.width} / ${item.height}`
          : '4 / 3';

        return (
          <figure
            className="masonry-item"
            key={item.id}
            style={{ aspectRatio: ratio }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.image}
              alt={item.title || 'Gallery photograph'}
              width={item.width || undefined}
              height={item.height || undefined}
              loading="lazy"
              decoding="async"
            />
            {(item.title || item.caption) && (
              <figcaption>
                {item.title && <strong>{item.title}</strong>}
                {item.caption && <span>{item.caption}</span>}
              </figcaption>
            )}
          </figure>
        );
      })}
    </div>
  );
}
