'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { sql } from '@/lib/db';
import {
  attemptLogin, createSession, destroySession, hashPassword, requireAdmin, requireUser, verifyPassword,
} from '@/lib/auth';
import { deleteRow, saveRow, toggleRow } from '@/lib/crud';
import { getResource } from '@/lib/resources';
import { saveSettings } from '@/lib/settings';
import { acceptMediaUrl, deleteUpload } from '@/lib/upload';
import { isValidEmail, normalizeUrl, safeColor, sanitizeEmbed } from '@/lib/utils';

export type FormState = { ok: boolean; message: string; errors?: Record<string, string> } | null;

/** Everything the public site reads is server-rendered, so a save clears it all. */
function refreshSite(): void {
  revalidatePath('/', 'layout');
}

/* -------------------------------------------------------------------------- */
/* Session                                                                     */
/* -------------------------------------------------------------------------- */

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const next = String(formData.get('next') ?? '/admin');

  if (!email || !password) {
    return { ok: false, message: 'Enter both your email and your password.' };
  }

  const h = await headers();
  const ip = (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
  const result = await attemptLogin(email, password, `${ip}:${email.toLowerCase()}`);

  if (!result.ok) return { ok: false, message: result.error };

  await createSession(result.user);
  redirect(next.startsWith('/admin') ? next : '/admin');
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect('/admin/login');
}

/* -------------------------------------------------------------------------- */
/* Generic content                                                             */
/* -------------------------------------------------------------------------- */

export async function saveResourceAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const resource = String(formData.get('_resource') ?? '');
  const id = Number(formData.get('_id') ?? 0);
  const closeAfter = formData.get('_close') !== null;

  const def = getResource(resource);
  if (!def) return { ok: false, message: 'Unknown content type.' };

  const result = await saveRow(resource, id, formData, user.id);
  if (!result.ok) {
    return { ok: false, message: 'Please correct the highlighted fields below.', errors: result.errors };
  }

  refreshSite();
  redirect(closeAfter ? `/admin/${resource}` : `/admin/${resource}/${result.id}?saved=1`);
}

export async function deleteResourceAction(formData: FormData): Promise<void> {
  await requireUser();
  const resource = String(formData.get('_resource') ?? '');
  const id = Number(formData.get('_id') ?? 0);

  await deleteRow(resource, id);
  refreshSite();
  redirect(`/admin/${resource}`);
}

export async function toggleResourceAction(formData: FormData): Promise<void> {
  await requireUser();
  const resource = String(formData.get('_resource') ?? '');
  const id = Number(formData.get('_id') ?? 0);
  const column = String(formData.get('_column') ?? 'enabled');

  await toggleRow(resource, id, column);
  refreshSite();
  revalidatePath(`/admin/${resource}`);
}

/* -------------------------------------------------------------------------- */
/* Menus and sections                                                          */
/* -------------------------------------------------------------------------- */

export async function saveMenusAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const rows = await sql<{ id: number; locked: boolean; kind: string }[]>`
    SELECT id, locked, kind FROM menus`;

  for (const row of rows) {
    const label = String(formData.get(`label_${row.id}`) ?? '').trim().slice(0, 80);
    const order = Number.parseInt(String(formData.get(`order_${row.id}`) ?? '0'), 10) || 0;
    // The home page must always stay reachable.
    const enabled = row.locked ? true : formData.get(`enabled_${row.id}`) !== null;
    const inNav = row.kind === 'page' ? formData.get(`nav_${row.id}`) !== null : false;

    await sql`
      UPDATE menus
      SET label = ${label || 'Untitled'}, sort_order = ${order}, enabled = ${enabled}, in_nav = ${inNav}
      WHERE id = ${row.id}`;
  }

  refreshSite();
  revalidatePath('/admin/menus');
  return { ok: true, message: 'Menus and sections updated. The website reflects this immediately.' };
}

/* -------------------------------------------------------------------------- */
/* Settings groups                                                             */
/* -------------------------------------------------------------------------- */

type SettingSpec = { key: string; kind: 'text' | 'bool' | 'number' | 'url' | 'image' | 'file' | 'html' | 'color'; folder?: string };

async function persistSettings(
  specs: SettingSpec[], group: string, formData: FormData, current: Record<string, string>,
): Promise<Record<string, string>> {
  const errors: Record<string, string> = {};
  const values: Record<string, string> = {};

  for (const spec of specs) {
    const raw = formData.get(spec.key);

    switch (spec.kind) {
      case 'bool':
        values[spec.key] = raw !== null && raw !== '' ? '1' : '0';
        break;

      case 'number':
        values[spec.key] = String(Number.parseInt(String(raw ?? '0'), 10) || 0);
        break;

      case 'url':
        values[spec.key] = normalizeUrl(String(raw ?? ''));
        break;

      case 'html':
        // The map embed is the one place an iframe is allowed, and only a
        // locked-down one: no event handlers, https sources only.
        values[spec.key] = sanitizeEmbed(String(raw ?? ''));
        break;

      case 'color':
        values[spec.key] = safeColor(String(raw ?? ''), spec.key === 'theme_accent' ? '#2563eb' : '#0ea5e9');
        break;

      case 'image':
      case 'file': {
        // Uploaded in the browser, posted back here as a URL.
        const next = acceptMediaUrl(String(formData.get(`${spec.key}_url`) ?? ''));
        const previous = current[spec.key] ?? '';
        if (previous && previous !== next) {
          await deleteUpload(previous);
        }
        values[spec.key] = next;
        break;
      }

      default:
        values[spec.key] = String(raw ?? '').trim();
    }
  }

  if (Object.keys(errors).length === 0) {
    await saveSettings(values, group);
  }
  return errors;
}

export async function saveSettingsGroupAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const specs = JSON.parse(String(formData.get('_specs') ?? '[]')) as SettingSpec[];
  const groups = JSON.parse(String(formData.get('_groups') ?? '{}')) as Record<string, string>;
  const currentRows = await sql<{ skey: string; svalue: string }[]>`SELECT skey, svalue FROM settings`;
  const current = Object.fromEntries(currentRows.map((r) => [r.skey, r.svalue]));

  const errors: Record<string, string> = {};
  const byGroup = new Map<string, SettingSpec[]>();
  for (const spec of specs) {
    const group = groups[spec.key] ?? 'general';
    if (!byGroup.has(group)) byGroup.set(group, []);
    byGroup.get(group)!.push(spec);
  }

  for (const [group, groupSpecs] of byGroup) {
    Object.assign(errors, await persistSettings(groupSpecs, group, formData, current));
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, message: 'Please correct the highlighted fields below.', errors };
  }

  // Keep the site name aligned with the profile name.
  const fullName = formData.get('full_name');
  if (typeof fullName === 'string' && fullName.trim()) {
    await saveSettings({ site_name: fullName.trim() }, 'site');
  }

  refreshSite();
  return { ok: true, message: 'Saved. The website is updated.' };
}

/* -------------------------------------------------------------------------- */
/* Inbox, comments, subscribers, media                                         */
/* -------------------------------------------------------------------------- */

export async function messageAction(formData: FormData): Promise<void> {
  await requireUser();
  const id = Number(formData.get('id') ?? 0);
  const op = String(formData.get('op') ?? '');

  if (op === 'delete') await sql`DELETE FROM messages WHERE id = ${id}`;
  else if (op === 'star') await sql`UPDATE messages SET is_starred = NOT is_starred WHERE id = ${id}`;
  else if (op === 'unread') await sql`UPDATE messages SET is_read = FALSE WHERE id = ${id}`;
  else if (op === 'read_all') await sql`UPDATE messages SET is_read = TRUE WHERE is_read = FALSE`;

  revalidatePath('/admin/messages');
  revalidatePath('/admin');
  if (op === 'delete' || op === 'unread') redirect('/admin/messages');
}

export async function commentModerationAction(formData: FormData): Promise<void> {
  await requireUser();
  const id = Number(formData.get('id') ?? 0);
  const op = String(formData.get('op') ?? '');

  if (op === 'approve') await sql`UPDATE comments SET status = 'approved' WHERE id = ${id}`;
  else if (op === 'spam') await sql`UPDATE comments SET status = 'spam' WHERE id = ${id}`;
  else if (op === 'delete') await sql`DELETE FROM comments WHERE id = ${id}`;

  refreshSite();
  revalidatePath('/admin/comments');
}

export async function subscriberAction(formData: FormData): Promise<void> {
  await requireUser();
  await sql`DELETE FROM subscribers WHERE id = ${Number(formData.get('id') ?? 0)}`;
  revalidatePath('/admin/subscribers');
}

/** Files land on Blob from the browser; this just refreshes the listing. */
export async function refreshMediaAction(): Promise<void> {
  await requireUser();
  revalidatePath('/admin/media');
}

export async function mediaDeleteAction(formData: FormData): Promise<void> {
  await requireUser();
  await deleteUpload(String(formData.get('url') ?? ''));
  revalidatePath('/admin/media');
}

/* -------------------------------------------------------------------------- */
/* Users and account                                                           */
/* -------------------------------------------------------------------------- */

export async function saveUserAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await requireAdmin();
  const id = Number(formData.get('id') ?? 0);
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const role = formData.get('role') === 'admin' ? 'admin' : 'editor';
  const isActive = formData.get('is_active') !== null;
  const password = String(formData.get('password') ?? '');

  const errors: Record<string, string> = {};
  if (!name) errors.name = 'A name is required.';
  if (!isValidEmail(email)) {
    errors.email = 'Enter a valid email address.';
  } else {
    const clash = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM users WHERE email = ${email} AND id <> ${id}`;
    if (Number(clash[0]?.count ?? 0) > 0) errors.email = 'Another account already uses that email.';
  }
  if (id === 0 && password.length < 10) errors.password = 'Use at least 10 characters.';
  if (id > 0 && password && password.length < 10) {
    errors.password = 'Use at least 10 characters, or leave it empty to keep the current one.';
  }

  // Never let the last active administrator lock themselves out.
  if (id === me.id && (role !== 'admin' || !isActive)) {
    const others = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM users
      WHERE role = 'admin' AND is_active AND id <> ${id}`;
    if (Number(others[0]?.count ?? 0) === 0) {
      errors.role = 'You are the only active administrator, so this account must stay an active admin.';
    }
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, message: 'Please correct the highlighted fields.', errors };
  }

  if (id > 0) {
    await sql`UPDATE users SET name = ${name}, email = ${email}, role = ${role}, is_active = ${isActive} WHERE id = ${id}`;
    if (password) {
      await sql`UPDATE users SET password_hash = ${await hashPassword(password)} WHERE id = ${id}`;
    }
  } else {
    await sql`
      INSERT INTO users (name, email, password_hash, role, is_active)
      VALUES (${name}, ${email}, ${await hashPassword(password)}, ${role}, ${isActive})`;
  }

  revalidatePath('/admin/users');
  redirect('/admin/users');
}

export async function deleteUserAction(formData: FormData): Promise<void> {
  const me = await requireAdmin();
  const id = Number(formData.get('id') ?? 0);
  if (id === me.id) return;

  const admins = await sql<{ count: string }[]>`
    SELECT COUNT(*)::text AS count FROM users WHERE role = 'admin' AND id <> ${id}`;
  if (Number(admins[0]?.count ?? 0) === 0) return;

  await sql`DELETE FROM users WHERE id = ${id}`;
  revalidatePath('/admin/users');
}

export async function updateAccountAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await requireUser();
  const form = String(formData.get('form') ?? '');

  if (form === 'details') {
    const name = String(formData.get('name') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim().toLowerCase();
    const errors: Record<string, string> = {};

    if (!name) errors.name = 'A name is required.';
    if (!isValidEmail(email)) {
      errors.email = 'Enter a valid email address.';
    } else {
      const clash = await sql<{ count: string }[]>`
        SELECT COUNT(*)::text AS count FROM users WHERE email = ${email} AND id <> ${me.id}`;
      if (Number(clash[0]?.count ?? 0) > 0) errors.email = 'Another account already uses that email.';
    }
    if (Object.keys(errors).length > 0) {
      return { ok: false, message: 'Please correct the highlighted fields.', errors };
    }

    await sql`UPDATE users SET name = ${name}, email = ${email} WHERE id = ${me.id}`;
    await createSession({ ...me, name, email });
    revalidatePath('/admin', 'layout');
    return { ok: true, message: 'Your details were updated.' };
  }

  const current = String(formData.get('current_password') ?? '');
  const next = String(formData.get('new_password') ?? '');
  const confirm = String(formData.get('confirm_password') ?? '');
  const errors: Record<string, string> = {};

  if (!(await verifyPassword(me.id, current))) errors.current_password = 'That is not your current password.';
  if (next.length < 10) errors.new_password = 'Use at least 10 characters.';
  if (next !== confirm) errors.confirm_password = 'The two new passwords do not match.';

  if (Object.keys(errors).length > 0) {
    return { ok: false, message: 'Please correct the highlighted fields.', errors };
  }

  await sql`UPDATE users SET password_hash = ${await hashPassword(next)} WHERE id = ${me.id}`;
  return { ok: true, message: 'Your password was changed.' };
}

