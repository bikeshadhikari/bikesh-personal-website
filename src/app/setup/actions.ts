'use server';

import { redirect } from 'next/navigation';
import { hasAnyUser, isInstalled, sql } from '@/lib/db';
import { createSchema } from '@/lib/schema';
import { seed } from '@/lib/seed';
import { createSession, hashPassword } from '@/lib/auth';
import { saveSettings } from '@/lib/settings';
import { isValidEmail } from '@/lib/utils';

export type SetupResult = { ok: boolean; message: string; errors?: Record<string, string> };

/**
 * One-time installation. Creates the tables, loads the starting content and
 * makes the first administrator. It refuses to run once a user exists, so
 * leaving the page reachable afterwards is harmless.
 */
export async function runSetup(_prev: SetupResult | null, formData: FormData): Promise<SetupResult> {
  const secret = String(formData.get('secret') ?? '');
  const expected = process.env.SETUP_SECRET ?? '';

  if (!expected) {
    return { ok: false, message: 'SETUP_SECRET is not set. Add it to the environment variables and redeploy.' };
  }
  if (secret !== expected) {
    return { ok: false, message: 'That setup key does not match SETUP_SECRET.', errors: { secret: 'Incorrect key.' } };
  }
  if (await isInstalled().then(async (i) => i && (await hasAnyUser()))) {
    return { ok: false, message: 'This site is already set up. Sign in at /admin instead.' };
  }

  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('password_confirm') ?? '');

  const errors: Record<string, string> = {};
  if (!name) errors.name = 'Enter the name that will appear as the author.';
  if (!isValidEmail(email)) errors.email = 'Enter a valid email address — this is your login.';
  if (password.length < 10) errors.password = 'Use at least 10 characters.';
  if (password !== confirm) errors.password_confirm = 'The two passwords do not match.';

  if (Object.keys(errors).length > 0) {
    return { ok: false, message: 'Please correct the highlighted fields.', errors };
  }

  try {
    await createSchema();
    const rows = await sql<{ id: number }[]>`
      INSERT INTO users (name, email, password_hash, role, is_active)
      VALUES (${name}, ${email}, ${await hashPassword(password)}, 'admin', TRUE)
      RETURNING id`;
    await seed();
    await saveSettings({ full_name: name }, 'profile');
    await saveSettings({ site_name: name }, 'site');
    await saveSettings({ contact_email: email }, 'contact');

    await createSession({ id: rows[0].id, name, email, role: 'admin' });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    return { ok: false, message: `Setup failed: ${detail}` };
  }

  redirect('/admin');
}
