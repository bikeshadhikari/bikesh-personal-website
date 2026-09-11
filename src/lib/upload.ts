import 'server-only';
import { randomBytes } from 'node:crypto';
import { sql } from './db';
import { withSchema } from './schema';

/**
 * Media is stored in Postgres alongside everything else.
 *
 * That means uploads work the moment the database does — no second storage
 * service to create, no extra token, no redeploy to pick one up, and the same
 * behaviour locally as in production. Images are downscaled in the browser
 * before they are sent, so what lands here is web-sized rather than the
 * multi-megabyte original off a phone camera.
 */

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

/** Vercel refuses a request body over 4.5 MB, so stop short of it with a clear message. */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export const MEDIA_PREFIX = '/api/media/';

export type MediaItem = {
  id: string;
  url: string;
  filename: string;
  folder: string;
  mime: string;
  size: number;
  width: number;
  height: number;
  createdAt: string;
};

export type StoredMedia = { mime: string; size: number; bytes: Buffer; filename: string };

function newId(): string {
  return randomBytes(12).toString('hex');
}

export async function storeMedia(
  file: File, folder: string, width = 0, height = 0,
): Promise<{ id: string; url: string; width: number; height: number }> {
  const bytes = Buffer.from(await file.arrayBuffer());
  const id = newId();
  const safeFolder = (folder || 'media').replace(/[^a-z0-9_-]/gi, '').slice(0, 60) || 'media';
  const filename = file.name.replace(/[^\w.\- ]+/g, '').slice(0, 255) || 'file';

  await withSchema(() => sql`
    INSERT INTO media (id, filename, folder, mime, size, width, height, bytes)
    VALUES (${id}, ${filename}, ${safeFolder}, ${file.type}, ${bytes.length},
            ${Math.max(0, Math.round(width))}, ${Math.max(0, Math.round(height))}, ${bytes})`);

  return { id, url: `${MEDIA_PREFIX}${id}`, width, height };
}

export async function readMedia(id: string): Promise<StoredMedia | null> {
  if (!/^[0-9a-f]{1,64}$/i.test(id)) return null;
  const rows = await withSchema(() => sql<
    { mime: string; size: number; bytes: Buffer; filename: string }[]
  >`SELECT mime, size, bytes, filename FROM media WHERE id = ${id} LIMIT 1`);
  return rows[0] ?? null;
}

/** Everything in the library, newest first. Never throws. */
export async function listMedia(): Promise<{ items: MediaItem[]; error: string | null }> {
  try {
    const rows = await withSchema(() => sql<
      { id: string; filename: string; folder: string; mime: string; size: number;
        width: number; height: number; created_at: string }[]
    >`SELECT id, filename, folder, mime, size, width, height, created_at
      FROM media ORDER BY created_at DESC LIMIT 500`);

    return {
      items: rows.map((r) => ({
        id: r.id,
        url: `${MEDIA_PREFIX}${r.id}`,
        filename: r.filename,
        folder: r.folder,
        mime: r.mime,
        size: r.size,
        width: r.width,
        height: r.height,
        createdAt: new Date(r.created_at).toISOString(),
      })),
      error: null,
    };
  } catch (error) {
    return {
      items: [],
      error: error instanceof Error ? error.message : 'Could not read the media library.',
    };
  }
}

export function isOwnMedia(url: string | null | undefined): boolean {
  return Boolean(url && url.startsWith(MEDIA_PREFIX));
}

/** Delete a file we own. Links to pictures hosted elsewhere are left alone. */
export async function deleteUpload(url: string | null | undefined): Promise<void> {
  if (!isOwnMedia(url)) return;
  const id = (url as string).slice(MEDIA_PREFIX.length).split(/[?#]/)[0];
  try {
    await withSchema(() => sql`DELETE FROM media WHERE id = ${id}`);
  } catch {
    // A row that is already gone is not an error worth surfacing.
  }
}

/**
 * Accept a value for an image or document field: either something we stored,
 * or an https link to a file hosted elsewhere. Anything else is discarded.
 */
export function acceptMediaUrl(value: string): string {
  const trimmed = value.trim();
  if (trimmed === '') return '';
  if (trimmed.startsWith(MEDIA_PREFIX)) {
    return /^\/api\/media\/[0-9a-f]{1,64}$/i.test(trimmed) ? trimmed : '';
  }
  try {
    const url = new URL(trimmed);
    return url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
}

export function humanSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) { value /= 1024; i++; }
  return `${i === 0 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
}

export function isImageMime(mime: string): boolean {
  return mime.startsWith('image/');
}
