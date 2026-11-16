import { countTechCopy } from '@/lib/tech';

/** One press of a Copy button on a Simplified Tech post. */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { id?: unknown };
    const id = Number(body.id);
    if (Number.isInteger(id) && id > 0) await countTechCopy(id);
  } catch {
    // Malformed beacons are ignored.
  }
  return new Response(null, { status: 204 });
}
