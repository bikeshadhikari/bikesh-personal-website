import { completeJob, remoteAuthorized } from '@/lib/agent-remote';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** The scheduled task hands in one finished article: { job_id, article }. */
export async function POST(request: Request) {
  if (!remoteAuthorized(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  let body: { job_id?: unknown; article?: unknown };
  try { body = await request.json(); } catch { return Response.json({ error: 'Send JSON.' }, { status: 400 }); }
  const id = Number(body.job_id);
  if (!Number.isInteger(id) || id <= 0) return Response.json({ error: 'job_id is required.' }, { status: 400 });
  const result = await completeJob(id, body.article);
  return Response.json(result, { status: result.status });
}
