import { upload } from '@vercel/blob/client';

/** No progress for this long means the upload is not going to finish. */
const STALL_MS = 20_000;

/**
 * Send one file straight from the browser to Blob storage.
 *
 * The Blob client retries with backoff, so a misconfigured token leaves the
 * caller waiting indefinitely. A stall watchdog turns that into a visible
 * error. Real progress resets the clock, so a large file on a slow connection
 * is never cut off.
 */
export async function uploadToBlob(
  folder: string,
  file: File,
  onProgress: (percent: number) => void,
): Promise<string> {
  const safeFolder = folder.replace(/[^a-z0-9_-]/gi, '') || 'media';
  let lastTick = Date.now();
  let settled = false;

  const running = upload(`${safeFolder}/${file.name}`, file, {
    access: 'public',
    handleUploadUrl: '/api/blob',
    onUploadProgress: (event) => {
      lastTick = Date.now();
      onProgress(Math.round(event.percentage));
    },
  })
    .then((blob) => blob.url)
    .finally(() => { settled = true; });

  const watchdog = new Promise<never>((_, reject) => {
    const timer = setInterval(() => {
      if (settled) { clearInterval(timer); return; }
      if (Date.now() - lastTick > STALL_MS) {
        clearInterval(timer);
        reject(new Error(
          'The upload stopped responding. Check that a Blob store is connected to this project in Vercel, then try again.',
        ));
      }
    }, 2000);
    void running.catch(() => {}).finally(() => clearInterval(timer));
  });

  return Promise.race([running, watchdog]);
}
