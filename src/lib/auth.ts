import 'server-only';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { sql } from './db';

export type SessionUser = { id: number; name: string; email: string; role: 'admin' | 'editor' };

const COOKIE = 'bikesh_session';
const MAX_AGE = 60 * 60 * 24 * 7; // one week
const MAX_ATTEMPTS = 6;
const LOCK_MINUTES = 15;

function secret(): Uint8Array {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 16) {
    throw new Error('AUTH_SECRET is missing or too short. Set it to a long random string.');
  }
  return new TextEncoder().encode(value);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function createSession(user: SessionUser): Promise<void> {
  const token = await new SignJWT({ name: user.name, email: user.email, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

/** The signed-in user, or null. Reads the cookie only — no database round trip. */
export async function currentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      id: Number(payload.sub),
      name: String(payload.name ?? ''),
      email: String(payload.email ?? ''),
      role: payload.role === 'admin' ? 'admin' : 'editor',
    };
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) throw new Error('UNAUTHENTICATED');
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== 'admin') throw new Error('FORBIDDEN');
  return user;
}

/** How many minutes this identifier is locked out for, or 0. */
export async function lockoutMinutes(identifier: string): Promise<number> {
  const rows = await sql<{ count: string; latest: Date }[]>`
    SELECT COUNT(*)::text AS count, MAX(created_at) AS latest
    FROM login_attempts
    WHERE identifier = ${identifier} AND created_at > NOW() - ${`${LOCK_MINUTES} minutes`}::interval
  `;
  const count = Number(rows[0]?.count ?? 0);
  if (count < MAX_ATTEMPTS || !rows[0]?.latest) return 0;
  const unlocksAt = new Date(rows[0].latest).getTime() + LOCK_MINUTES * 60_000;
  return Math.max(0, Math.ceil((unlocksAt - Date.now()) / 60_000));
}

export type LoginResult =
  | { ok: true; user: SessionUser }
  | { ok: false; error: string };

export async function attemptLogin(
  email: string,
  password: string,
  identifier: string,
): Promise<LoginResult> {
  const locked = await lockoutMinutes(identifier);
  if (locked > 0) {
    return { ok: false, error: `Too many failed attempts. Try again in ${locked} minute${locked > 1 ? 's' : ''}.` };
  }

  const rows = await sql<
    { id: number; name: string; email: string; role: string; password_hash: string }[]
  >`SELECT id, name, email, role, password_hash FROM users
    WHERE email = ${email.trim().toLowerCase()} AND is_active = TRUE LIMIT 1`;

  const record = rows[0];
  const matches = record ? await bcrypt.compare(password, record.password_hash) : false;

  if (!record || !matches) {
    await sql`INSERT INTO login_attempts (identifier) VALUES (${identifier})`;
    return { ok: false, error: 'That email and password combination did not work.' };
  }

  await sql`DELETE FROM login_attempts WHERE identifier = ${identifier}`;
  await sql`UPDATE users SET last_login_at = NOW() WHERE id = ${record.id}`;

  return {
    ok: true,
    user: {
      id: record.id,
      name: record.name,
      email: record.email,
      role: record.role === 'admin' ? 'admin' : 'editor',
    },
  };
}

export async function verifyPassword(userId: number, password: string): Promise<boolean> {
  const rows = await sql<{ password_hash: string }[]>`
    SELECT password_hash FROM users WHERE id = ${userId} LIMIT 1`;
  return rows[0] ? bcrypt.compare(password, rows[0].password_hash) : false;
}
