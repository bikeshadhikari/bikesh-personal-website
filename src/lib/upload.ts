import 'server-only';
import { del, list } from '@vercel/blob';

export const IMAGE_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'image/avif', 'image/x-icon', 'image/vnd.microsoft.icon',
];
export const DOC_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
export const ALLOWED_TYPES = [...IMAGE_TYPES, ...DOC_TYPES];

/** 10 MB. Files go straight from the browser to Blob, so no server limit applies. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export function blobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

const BLOB_HOST = '.public.blob.vercel-storage.com';

/**
 * Accept a URL for an image or document field.
 *
 * Uploads arrive as a Blob URL the browser already wrote; a person may also
 * paste a link to a file hosted elsewhere. Anything that is not an https URL
 * is discarded rather than stored.
 */
export function acceptMediaUrl(value: string): string {
  const trimmed = value.trim();
  if (trimmed === '') return '';
  try {
    const url = new URL(trimmed);
    return url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
}

export function isBlobUrl(url: string | null | undefined): boolean {
  return Boolean(url && url.includes(BLOB_HOST));
}

/** Remove a file we own. External links are left alone. */
export async function deleteUpload(url: string | null | undefined): Promise<void> {
  if (!isBlobUrl(url) || !blobConfigured()) return;
  try {
    await del(url as string);
  } catch {
    // A file that is already gone is not an error worth surfacing.
  }
}

export type MediaItem = { url: string; pathname: string; size: number; uploadedAt: string };

/**
 * Everything in the Blob store, newest first.
 *
 * Never throws and never hangs: the Blob client retries with backoff, so a bad
 * or revoked token would otherwise leave the page loading for a long time.
 */
export async function listMedia(): Promise<{ items: MediaItem[]; error: string | null }> {
  if (!blobConfigured()) return { items: [], error: null };

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('File storage did not respond in time.')), 8000),
  );

  try {
    const { blobs } = await Promise.race([list({ limit: 500 }), timeout]);
    const items = blobs
      .map((b) => ({
        url: b.url,
        pathname: b.pathname,
        size: b.size,
        uploadedAt: new Date(b.uploadedAt).toISOString(),
      }))
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
    return { items, error: null };
  } catch (error) {
    return {
      items: [],
      error: error instanceof Error ? error.message : 'Could not reach file storage.',
    };
  }
}

export function humanSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) { value /= 1024; i++; }
  return `${i === 0 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
}

export function isImageUrl(url: string): boolean {
  return /\.(jpe?g|png|gif|webp|svg|avif|ico)(\?|$)/i.test(url);
}
