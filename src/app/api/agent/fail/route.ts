import { failJob, remoteAuthorized } from '@/lib/agent-remote';

export const dynamic = 'force-dynamic';

/**
 * The scheduled task could not, or should not, write a job:
 * { job_id, error, skip? }. With skip: true the job is marked "skipped",
 * for content that is not a technology explainer.
 */
export async function POST(request: Request) {
  if (!remoteAuthorized(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  let body: { job_id?: unknown; error?: unknown; skip?: unknown };
  try { body = await request.json(); } catch { return Response.json({ error: 'Send JSON.' }, { status: 400 }); }
  const id = Number(body.job_id);
  if (!Number.isInteger(id) || id <= 0) return Response.json({ error: 'job_id is required.' }, { status: 400 });
  await failJob(id, String(body.error ?? ''), body.skip === true);
  return Response.json({ ok: true });
}
