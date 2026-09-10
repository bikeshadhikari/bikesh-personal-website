'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db';
import { getSettings, settingBool } from '@/lib/settings';
import { menuEnabled } from '@/lib/menu';
import { isValidEmail } from '@/lib/utils';

/** Public form endpoints. Next.js checks the request Origin on every action. */

async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get('x-forwarded-for') ?? '';
  return (forwarded.split(',')[0] || h.get('x-real-ip') || '').trim().slice(0, 45);
}

export type ActionResult = { ok: boolean; message: string; errors?: Record<string, string> };

export async function subscribeAction(formData: FormData): Promise<ActionResult> {
  const s = await getSettings();
  if (!settingBool(s, 'newsletter_enabled', true) || !(await menuEnabled('newsletter'))) {
    return { ok: false, message: 'Signups are closed at the moment.' };
  }
  if (String(formData.get('website') ?? '')) {
    return { ok: true, message: 'Thank you for subscribing.' }; // honeypot
  }

  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  if (!isValidEmail(email)) {
    return { ok: false, message: 'Please enter a valid email address.' };
  }

  await sql`
    INSERT INTO subscribers (email) VALUES (${email.slice(0, 190)})
    ON CONFLICT (email) DO UPDATE SET is_active = TRUE`;

  return { ok: true, message: 'You are on the list. Thank you.' };
}

export async function contactAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  if (String(formData.get('website') ?? '')) {
    return { ok: false, message: 'Your message could not be sent.' }; // honeypot
  }

  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();
  const subject = String(formData.get('subject') ?? '').trim();
  const body = String(formData.get('body') ?? '').trim();

  const errors: Record<string, string> = {};
  if (!name) errors.name = 'Please tell me your name.';
  if (!isValidEmail(email)) errors.email = 'A valid email address is needed so I can reply.';
  if (body.length < 10) errors.body = 'Please write a little more detail.';
  if (body.length > 5000) errors.body = 'Please keep the message under 5000 characters.';

  if (Object.keys(errors).length > 0) {
    return { ok: false, message: 'Please correct the highlighted fields.', errors };
  }

  const ip = await clientIp();
  if (ip) {
    const recent = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM messages
      WHERE ip = ${ip} AND created_at > NOW() - INTERVAL '1 minute'`;
    if (Number(recent[0]?.count ?? 0) > 0) {
      return { ok: false, message: 'You just sent a message. Please wait a minute before sending another.' };
    }
  }

  await sql`
    INSERT INTO messages (name, email, phone, subject, body, ip)
    VALUES (${name.slice(0, 140)}, ${email.slice(0, 190)}, ${phone.slice(0, 60)},
            ${subject.slice(0, 200)}, ${body}, ${ip})`;

  revalidatePath('/admin');
  return { ok: true, message: 'Thank you. Your message has arrived and I will reply soon.' };
}

export async function commentAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const s = await getSettings();
  const postSlug = String(formData.get('post_slug') ?? '');

  if (String(formData.get('website') ?? '')) {
    return { ok: false, message: 'Your comment could not be posted.' };
  }
  if (!settingBool(s, 'comments_enabled', true)) {
    return { ok: false, message: 'Comments are closed at the moment.' };
  }

  const rows = await sql<{ id: number; allow_comments: boolean }[]>`
    SELECT id, allow_comments FROM posts WHERE slug = ${postSlug} AND status = 'published' LIMIT 1`;
  const post = rows[0];
  if (!post || !post.allow_comments) {
    return { ok: false, message: 'Comments are closed on this post.' };
  }

  const name = String(formData.get('comment_name') ?? '').trim();
  const email = String(formData.get('comment_email') ?? '').trim();
  const body = String(formData.get('comment_body') ?? '').trim();

  if (!name || !body) return { ok: false, message: 'Please add your name and a comment.' };
  if (email && !isValidEmail(email)) return { ok: false, message: 'That email address does not look right.' };
  if (body.length > 3000) return { ok: false, message: 'Please keep comments under 3000 characters.' };

  const moderated = settingBool(s, 'comments_moderated', true);
  await sql`
    INSERT INTO comments (post_id, name, email, body, status, ip)
    VALUES (${post.id}, ${name.slice(0, 120)}, ${email.slice(0, 190)}, ${body},
            ${moderated ? 'pending' : 'approved'}, ${await clientIp()})`;

  if (!moderated) revalidatePath(`/blog/${postSlug}`);
  revalidatePath('/admin/comments');

  return {
    ok: true,
    message: moderated
      ? 'Thank you. Your comment is waiting to be approved.'
      : 'Thank you. Your comment is published.',
  };
}

