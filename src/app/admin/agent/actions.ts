'use server';

import { revalidatePath } from 'next/cache';
import { currentUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import { queueJob } from '@/lib/agent';

async function requireAdmin() {
  const user = await currentUser();
  if (user?.role !== 'admin') throw new Error('Administrators only.');
}

export type QueueState = { ok: boolean; message: string } | null;

export async function queueAction(_prev: QueueState, formData: FormData): Promise<QueueState> {
  await requireAdmin();
  const text = String(formData.get('text') ?? '').trim();
  const url = String(formData.get('url') ?? '').trim();
  const title = String(formData.get('title') ?? '').trim();
  if (!text && !url && !title) return { ok: false, message: 'Give the agent a title, some notes or a link to work from.' };
  if (url && !/^https?:\/\//i.test(url)) return { ok: false, message: 'The link should start with https://' };
  const collection = Number(formData.get('collection_id') ?? 0);
  await queueJob({
    title, text, url,
    target: String(formData.get('target') ?? 'both'),
    collectionId: Number.isInteger(collection) && collection > 0 ? collection : null,
  });
  revalidatePath('/admin/agent');
  return { ok: true, message: 'Added. It will be written on the next run — or press “Write it now” in the list below.' };
}

export async function jobAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get('id'));
  const op = String(formData.get('op'));
  if (!Number.isInteger(id) || id <= 0) return;
  if (op === 'delete') await sql`DELETE FROM agent_jobs WHERE id = ${id} AND status <> 'running'`;
  if (op === 'retry') await sql`UPDATE agent_jobs SET status = 'queued', error = '', attempts = 0 WHERE id = ${id} AND status IN ('failed', 'done')`;
  revalidatePath('/admin/agent');
}
