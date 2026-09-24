import { readMedia } from '@/lib/upload';

export const runtime = 'nodejs';

/**
 * Serves one stored file. Ids never change once written, so the response is
 * cached hard at the edge and in the browser — the database is hit once.
 *
 * Byte ranges are answered because audio depends on them. WebKit asks for a
 * range before it will play a sound, and a server that replies 200 with the
 * whole file gets no playback at all — which is the browser inside Messenger
 * on an iPhone, the one place an uploaded greeting most needs to work.
 */

/** `bytes=start-end`, with either end allowed to be missing. */
function parseRange(header: string, size: number): { start: number; end: number } | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return null;

  const [, rawStart, rawEnd] = match;
  if (rawStart === '' && rawEnd === '') return null;

  // `bytes=-500` means the last 500 bytes, not a range starting below zero.
  const start = rawStart === '' ? Math.max(0, size - Number(rawEnd)) : Number(rawStart);
  const end = rawStart === '' || rawEnd === '' ? size - 1 : Math.min(Number(rawEnd), size - 1);

  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  if (start > end || start >= size) return null;
  return { start, end };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const file = await readMedia(id);

  if (!file) {
    return new Response('Not found', { status: 404 });
  }

  const etag = `"${id}"`;
  const shared = {
    'Content-Type': file.mime,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Content-Disposition': `inline; filename="${encodeURIComponent(file.filename)}"`,
    'X-Content-Type-Options': 'nosniff',
    ETag: etag,
  };

  if (request.headers.get('if-none-match') === etag) {
    return new Response(null, { status: 304, headers: { ETag: etag } });
  }

  const header = request.headers.get('range');
  if (header) {
    const range = parseRange(header, file.size);
    if (!range) {
      return new Response(null, {
        status: 416,
        headers: { ...shared, 'Content-Range': `bytes */${file.size}` },
      });
    }

    const slice = file.bytes.subarray(range.start, range.end + 1);
    return new Response(new Uint8Array(slice), {
      status: 206,
      headers: {
        ...shared,
        'Content-Length': String(slice.length),
        'Content-Range': `bytes ${range.start}-${range.end}/${file.size}`,
      },
    });
  }

  return new Response(new Uint8Array(file.bytes), {
    headers: { ...shared, 'Content-Length': String(file.size) },
  });
}
