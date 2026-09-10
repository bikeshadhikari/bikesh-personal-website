import Shell from '@/components/admin/Shell';
import MediaManager from './MediaManager';
import { listMedia } from '@/lib/upload';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Media library' };

export default async function MediaPage() {
  // listMedia never throws: a database hiccup shows a message, not an error page.
  const { items, error } = await listMedia();

  return (
    <Shell title="Media library" current="media">
      <MediaManager files={items} error={error} />
    </Shell>
  );
}
