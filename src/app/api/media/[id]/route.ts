import { readMedia } from '@/lib/upload';

export const runtime = 'nodejs';

/**
 * Serves one stored file. Ids never change once written, so the response is
 * cached hard at the edge and in the browser — the database is hit once.
 */
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
  if (request.headers.get('if-none-match') === etag) {
    return new Response(null, { status: 304, headers: { ETag: etag } });
  }

  return new Response(new Uint8Array(file.bytes), {
    headers: {
      'Content-Type': file.mime,
      'Content-Length': String(file.size),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Disposition': `inline; filename="${encodeURIComponent(file.filename)}"`,
      'X-Content-Type-Options': 'nosniff',
      ETag: etag,
    },
  });
}
