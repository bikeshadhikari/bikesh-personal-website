import { addPoliticalReadTime } from '@/lib/political';

export const dynamic = 'force-dynamic';

/**
 * How long a visitor actually spent on the political page.
 *
 * The page sends the seconds it measured when the reader leaves, by beacon, so
 * this has to be cheap and has to answer while the page is already being torn
 * down. Nothing comes back but 204.
 *
 * A single report is clamped at both ends for the same reasons as a post's:
 * under four seconds is a glance rather than a read, and over an hour is a tab
 * left open rather than a person.
 */
const MIN_SECONDS = 4;
const MAX_SECONDS = 60 * 60;

export async function POST(request: Request): Promise<Response> {
  let seconds = 0;
  try {
    const body = await request.text();
    seconds = Math.round(Number(JSON.parse(body || '{}').seconds));
  } catch {
    return new Response(null, { status: 204 });
  }

  if (!Number.isFinite(seconds) || seconds < MIN_SECONDS) return new Response(null, { status: 204 });
  await addPoliticalReadTime(Math.min(seconds, MAX_SECONDS));
  return new Response(null, { status: 204 });
}
