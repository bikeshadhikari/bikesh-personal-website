import { remoteAuthorized, storeDescriptions } from '@/lib/agent-remote';

export const dynamic = 'force-dynamic';

/** Search descriptions for older pages: { items: [{ key, meta_description }] }. */
export async function POST(request: Request) {
  if (!remoteAuthorized(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  let body: { items?: unknown };
  try { body = await request.json(); } catch { return Response.json({ error: 'Send JSON.' }, { status: 400 }); }
  const items = Array.isArray(body.items) ? body.items.slice(0, 40) : [];
  const urls = await storeDescriptions(items as { key: string; meta_description: string }[]);
  return Response.json({ ok: true, updated: urls.length });
}
