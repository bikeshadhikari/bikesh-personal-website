import 'server-only';
import { put, del, list } from '@vercel/blob';
import { slugify } from './utils';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif', 'image/x-icon', 'image/vnd.microsoft.icon'];
const DOC_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const MAX_BYTES = 5 * 1024 * 1024;

export function blobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/**
 * Store one uploaded file on Vercel Blob and return its public URL.
 * Returns null when the form field was left empty.
 */
export async function storeUpload(file: File | null, folder = 'media'): Promise<string | null> {
  if (!file || file.size === 0 || !file.name) return null;

  if (!blobConfigured()) {
    throw new Error(
      'File storage is not connected. Add Blob storage to the Vercel project, or paste an image URL in the field below instead.',
    );
  }
  if (file.size > MAX_BYTES) {
    throw new Error('That file is larger than 5 MB. Please compress it and try again.');
  }

  const allowed = [...IMAGE_TYPES, ...DOC_TYPES];
  if (!allowed.includes(file.type)) {
    throw new Error(`Files of type "${file.type || 'unknown'}" are not allowed. Use an image, PDF or Word document.`);
  }

  const ext = (file.name.split('.').pop() ?? 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
  const base = slugify(file.name.replace(/\.[^.]+$/, ''), 'file').slice(0, 60);
  const safeFolder = folder.replace(/[^a-z0-9_-]/gi, '') || 'media';

  const blob = await put(`${safeFolder}/${base}.${ext}`, file, {
    access: 'public',
    addRandomSuffix: true,
    contentType: file.type,
  });
  return blob.url;
}

export async function deleteUpload(url: string | null | undefined): Promise<void> {
  if (!url || !url.includes('.public.blob.vercel-storage.com') || !blobConfigured()) return;
  try {
    await del(url);
  } catch {
    // A file that is already gone is not an error worth surfacing.
  }
}

export type MediaItem = { url: string; pathname: string; size: number; uploadedAt: Date };

export async function listMedia(): Promise<MediaItem[]> {
  if (!blobConfigured()) return [];
  const { blobs } = await list({ limit: 500 });
  return blobs
    .map((b) => ({ url: b.url, pathname: b.pathname, size: b.size, uploadedAt: new Date(b.uploadedAt) }))
    .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
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
