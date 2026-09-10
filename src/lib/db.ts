import 'server-only';
import postgres from 'postgres';

/**
 * One Postgres client for the whole app.
 *
 * Serverless functions come and go, so the client is cached on globalThis to
 * survive hot reloads in development and module re-evaluation in production.
 * Keep `max` low: Neon's pooler multiplexes connections for us, and a large
 * pool per function instance is how serverless apps exhaust a database.
 */

declare global {
  // eslint-disable-next-line no-var
  var __sql: postgres.Sql | undefined;
}

function connect(): postgres.Sql {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Add a Postgres database to the project and paste its pooled connection string.',
    );
  }
  return postgres(url, {
    max: 3,
    idle_timeout: 20,
    connect_timeout: 15,
    prepare: false, // Required when talking through a connection pooler.
    ssl: url.includes('localhost') || url.includes('127.0.0.1') ? false : 'require',
    onnotice: () => {},
  });
}

export const sql: postgres.Sql = globalThis.__sql ?? connect();
if (process.env.NODE_ENV !== 'production') {
  globalThis.__sql = sql;
}

/** True once the schema has been created. Used by the setup flow. */
export async function isInstalled(): Promise<boolean> {
  try {
    const rows = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name IN ('users', 'settings', 'menus')
    `;
    return Number(rows[0]?.count ?? 0) === 3;
  } catch {
    return false;
  }
}

export async function hasAnyUser(): Promise<boolean> {
  try {
    const rows = await sql<{ count: string }[]>`SELECT COUNT(*)::text AS count FROM users`;
    return Number(rows[0]?.count ?? 0) > 0;
  } catch {
    return false;
  }
}
