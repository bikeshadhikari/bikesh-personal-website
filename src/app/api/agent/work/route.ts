import { claimWork, remoteAuthorized } from '@/lib/agent-remote';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** The scheduled task asks what to write today. */
export async function GET(request: Request) {
  if (!remoteAuthorized(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const limit = Number(new URL(request.url).searchParams.get('limit') ?? 0);
  return Response.json(await claimWork(limit));
}
