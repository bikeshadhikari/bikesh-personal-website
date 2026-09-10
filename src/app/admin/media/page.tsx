import Shell from '@/components/admin/Shell';
import MediaManager from './MediaManager';
import { blobConfigured, listMedia } from '@/lib/upload';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Media library' };

export default async function MediaPage() {
  const ready = blobConfigured();
  const files = ready ? await listMedia() : [];

  return (
    <Shell title="Media library" current="media">
      <MediaManager files={files} ready={ready} />
    </Shell>
  );
}
