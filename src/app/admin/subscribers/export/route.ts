import { currentUser } from '@/lib/auth';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

/** Subscriber list as CSV, for use in any mailing tool. */
export async function GET(): Promise<Response> {
  if (!(await currentUser())) {
    return new Response('Not authorised', { status: 401 });
  }

  const rows = await sql<{ email: string; created_at: string }[]>`
    SELECT email, created_at FROM subscribers WHERE is_active ORDER BY id DESC`;

  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const csv = [
    'Email,Subscribed on',
    ...rows.map((r) => `${escape(r.email)},${escape(new Date(r.created_at).toISOString())}`),
  ].join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
