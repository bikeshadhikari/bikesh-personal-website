import 'server-only';
import postgres from 'postgres';

/**
 * One Postgres client for the whole app, created the first time a query runs.
 *
 * Nothing connects when this module is imported. That matters at build time:
 * `next build` imports every page to read its configuration, and a client that
 * connected on import would fail the whole build on a machine with no
 * DATABASE_URL — which is exactly what a first deploy looks like before the
 * variable is added. Deferring it means the build succeeds and a missing
 * variable is reported at the moment a page actually asks for data.
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

function client(): postgres.Sql {
  globalThis.__sql ??= connect();
  return globalThis.__sql;
}

/**
 * Stands in for the client until one is needed. postgres.js is used both as a
 * tagged template (`sql\`SELECT …\``) and as an object (`sql.unsafe`, `sql.end`),
 * so both calling and property access are forwarded to the real client.
 */
export const sql: postgres.Sql = new Proxy(
  (() => {}) as unknown as postgres.Sql,
  {
    apply(_target, _thisArg, args: unknown[]) {
      return (client() as unknown as (...a: unknown[]) => unknown)(...args);
    },
    get(_target, property) {
      const real = client() as unknown as Record<string | symbol, unknown>;
      const value = real[property];
      return typeof value === 'function' ? value.bind(real) : value;
    },
    has(_target, property) {
      return property in (client() as unknown as object);
    },
  },
);

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
