/**
 * Command-line alternative to the /setup page.
 *
 *   npm run db:setup -- --email you@example.com --password 'your password' --name 'Your Name'
 *
 * Useful for local development and for re-seeding a fresh database.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Load .env.local by hand so the script needs no extra dependency.
for (const file of ['.env.local', '.env']) {
  try {
    const text = readFileSync(resolve(process.cwd(), file), 'utf8');
    for (const line of text.split('\n')) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
      }
    }
  } catch {
    // The file is optional — real environment variables win anyway.
  }
}

function arg(name: string, fallback = ''): string {
  const index = process.argv.indexOf(`--${name}`);
  return index > -1 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

async function main() {
  const { sql, hasAnyUser } = await import('../src/lib/db');
  const { createSchema } = await import('../src/lib/schema');
  const { seed } = await import('../src/lib/seed');
  const bcrypt = (await import('bcryptjs')).default;

  console.log('Creating tables…');
  await createSchema();

  const email = arg('email').toLowerCase();
  const password = arg('password');
  const name = arg('name', 'Bikesh Adhikari');

  if (!(await hasAnyUser())) {
    if (!email || !password) {
      console.error('\nNo user exists yet. Re-run with:\n  npm run db:setup -- --email you@example.com --password "a long password"\n');
      process.exit(1);
    }
    await sql`
      INSERT INTO users (name, email, password_hash, role, is_active)
      VALUES (${name}, ${email}, ${await bcrypt.hash(password, 10)}, 'admin', TRUE)`;
    console.log(`Created administrator ${email}`);
  } else {
    console.log('A user already exists, skipping account creation.');
  }

  console.log('Loading starting content…');
  await seed();

  console.log('Done. Sign in at /admin');
  await sql.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
