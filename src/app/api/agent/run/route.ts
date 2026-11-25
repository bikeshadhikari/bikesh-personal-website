import { currentUser } from '@/lib/auth';
import { runAgent } from '@/lib/agent';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/** "Run now" from the dashboard: one article at a time, administrators only. */
export async function POST(request: Request) {
  const user = await currentUser();
  if (user?.role !== 'admin') return new Response('Forbidden', { status: 403 });
  // Same-site only, like the dashboard's own forms.
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return new Response('Forbidden', { status: 403 });
  }
  let jobId: number | undefined;
  try {
    const body = (await request.json()) as { jobId?: unknown };
    const n = Number(body.jobId);
    if (Number.isInteger(n) && n > 0) jobId = n;
  } catch { /* no body: take the next job in the queue */ }
  const report = await runAgent({ deadline: Date.now() + 30_000, jobId, force: true });
  return Response.json(report);
}
