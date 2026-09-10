import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import SiteShell from '@/components/site/SiteShell';
import { PageHero } from '@/components/site/blocks';
import Gallery from '@/components/site/Gallery';
import { menuEnabled, menuLabel } from '@/lib/menu';
import { getGallery } from '@/lib/content';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Gallery',
  description: 'Moments from classrooms, workshops, competitions and the road.',
};

export default async function GalleryPage() {
  if (!(await menuEnabled('gallery'))) notFound();

  const [items, heading] = await Promise.all([
    getGallery(),
    menuLabel('gallery', 'Gallery'),
  ]);

  return (
    <SiteShell current="gallery">
      <PageHero
        eyebrow="In pictures"
        heading={heading}
        sub="Classrooms, workshops, competitions and the people behind them."
      />
      <section className="section">
        <div className="container">
          <Gallery items={items} />
        </div>
      </section>
    </SiteShell>
  );
}
