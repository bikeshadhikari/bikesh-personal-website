import { runAgent } from '@/lib/agent';

export const dynamic = 'force-dynamic';
// Writing an article with web research takes a few minutes.
export const maxDuration = 300;

/**
 * Called by Vercel Cron once a day (see vercel.json). Vercel sends
 * "Authorization: Bearer <CRON_SECRET>"; without a matching secret nothing runs,
 * so nobody else can make the site spend API credit.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  const started = Date.now();
  const report = await runAgent({ deadline: started + 150_000 });
  return Response.json(report);
}
