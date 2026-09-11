import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * How long a visitor actually spent reading a post.
 *
 * The page sends the seconds it measured when the reader leaves or switches
 * away, using sendBeacon, so this has to be cheap and has to answer even when
 * the browser is already tearing the page down. Nothing is returned but 204.
 *
 * Only time on a published post counts, and a single report is clamped: under
 * four seconds is a glance rather than a read, and anything over an hour is a
 * tab left open, not a person. Both would distort the total.
 */
const MIN_SECONDS = 4;
const MAX_SECONDS = 60 * 60;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const postId = Number.parseInt(id, 10);
  if (!Number.isSafeInteger(postId) || postId <= 0) return new Response(null, { status: 204 });

  let seconds = 0;
  try {
    const body = await request.text();
    seconds = Math.round(Number(JSON.parse(body || '{}').seconds));
  } catch {
    return new Response(null, { status: 204 });
  }

  if (!Number.isFinite(seconds) || seconds < MIN_SECONDS) return new Response(null, { status: 204 });
  const counted = Math.min(seconds, MAX_SECONDS);

  try {
    await sql`
      UPDATE posts
      SET read_seconds = read_seconds + ${counted},
          read_sessions = read_sessions + 1
      WHERE id = ${postId} AND status = 'published'`;
  } catch {
    // A missed reading figure is never worth an error in the reader's console.
  }

  return new Response(null, { status: 204 });
}
