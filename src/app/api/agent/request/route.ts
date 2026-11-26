import { remoteAuthorized, requestArticle } from '@/lib/agent-remote';

export const dynamic = 'force-dynamic';

/**
 * Queue an article Bikesh asked for: { title, text, url, target }.
 * Written on the next run whatever the topic, ahead of everything else.
 */
export async function POST(request: Request) {
  if (!remoteAuthorized(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  let body: { title?: unknown; text?: unknown; url?: unknown; target?: unknown };
  try { body = await request.json(); } catch { return Response.json({ error: 'Send JSON.' }, { status: 400 }); }
  const title = String(body.title ?? '').trim();
  const text = String(body.text ?? '').trim();
  const url = String(body.url ?? '').trim();
  if (!title && !text && !url) return Response.json({ error: 'Give a title, text or url.' }, { status: 400 });
  if (url && !/^https?:\/\//i.test(url)) return Response.json({ error: 'url must start with https://' }, { status: 400 });
  const id = await requestArticle({ title, text, url, target: String(body.target ?? 'both') });
  return Response.json({ ok: true, job_id: id, note: id ? 'Queued at the front.' : 'Already queued (same url).' });
}
