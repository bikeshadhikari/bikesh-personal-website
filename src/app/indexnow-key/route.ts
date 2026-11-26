import { indexNowKey } from '@/lib/agent';

export const dynamic = 'force-dynamic';

/** The key file IndexNow fetches to confirm that submitted pages are ours. */
export async function GET() {
  return new Response(await indexNowKey(), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
