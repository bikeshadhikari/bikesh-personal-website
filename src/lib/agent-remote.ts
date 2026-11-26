import 'server-only';
import { timingSafeEqual } from 'node:crypto';
import { sql } from './db';
import { ensureSchema } from './schema';
import { getSettings, saveSettings } from './settings';
import {
  ArticleSchema, SYSTEM_PROMPT, agentSetting, materialFor, on, pagesNeedingDescriptions, publish,
  publishTool, queueTechPosts, queueYouTube, saveDescriptions, submitIndexNow, type AgentJob,
} from './agent';

/*
 * The subscription mode of the SEO & blog agent.
 *
 * Instead of the website calling the Anthropic API (billed per use), a Claude
 * Code scheduled task — running on Bikesh's Claude subscription — does the
 * writing. Each morning it:
 *   GET  /api/agent/work          → the brief, the output format and the jobs to write
 *   POST /api/agent/publish       → one finished article per job
 *   POST /api/agent/fail          → when a job cannot be written
 *   POST /api/agent/descriptions  → search descriptions for older pages
 * Every call carries "Authorization: Bearer <AGENT_TOKEN>". The token lives in
 * Vercel and, for the scheduled task, as a network secret that the session's
 * proxy adds to requests for this site, so it is never written in a prompt.
 */

export function remoteEnabled(): boolean {
  return (process.env.AGENT_TOKEN ?? '').length >= 24;
}

export function remoteAuthorized(request: Request): boolean {
  const token = process.env.AGENT_TOKEN ?? '';
  if (token.length < 24) return false;
  const given = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  const a = Buffer.from(given);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function note(line: string): Promise<void> {
  const s = await getSettings();
  const today = new Date().toISOString().slice(0, 10);
  const previous = (s.agent_last_run ?? '').slice(0, 10) === today ? (s.agent_last_report ?? '') : '';
  await saveSettings({
    agent_last_run: new Date().toISOString(),
    agent_last_report: `${previous}${previous ? '\n' : ''}${line}`.slice(-2000),
  }, 'agent');
}

/** Collect new material, then hand out up to `limit` jobs to write. */
export async function claimWork(limit: number) {
  await ensureSchema();
  const s = await getSettings();
  if (!on(s, 'agent_enabled')) {
    return { enabled: false, jobs: [], descriptions: [], message: 'The agent is switched off in the dashboard.' };
  }

  await sql`UPDATE agent_jobs SET status = 'queued'
    WHERE status = 'running' AND started_at < NOW() - INTERVAL '3 hours' AND attempts < 3`;
  await sql`UPDATE agent_jobs SET status = 'failed', error = 'Handed out three times without an article coming back.'
    WHERE status = 'running' AND started_at < NOW() - INTERVAL '3 hours'`;

  const found: string[] = [];
  if (on(s, 'agent_from_tech')) {
    const n = await queueTechPosts();
    if (n) found.push(`${n} Simplified Tech post(s)`);
  }
  const channel = agentSetting(s, 'agent_youtube_channel_id').trim();
  if (channel) {
    try {
      const n = await queueYouTube(channel);
      if (n) found.push(`${n} YouTube video(s)`);
    } catch { /* the feed is retried tomorrow */ }
  }

  const max = Math.min(5, Math.max(1, limit || Number(agentSetting(s, 'agent_jobs_per_run')) || 1));
  const jobs = await sql<AgentJob[]>`
    UPDATE agent_jobs SET status = 'running', started_at = NOW(), attempts = attempts + 1, error = ''
    WHERE id IN (SELECT id FROM agent_jobs WHERE status = 'queued' ORDER BY created_at ASC LIMIT ${max} FOR UPDATE SKIP LOCKED)
    RETURNING *`;

  const out = [];
  for (const job of jobs) {
    out.push({ id: job.id, target: job.target, title: job.title, material: await materialFor(job) });
  }
  const descriptions = on(s, 'agent_seo_pass') ? await pagesNeedingDescriptions(8) : [];
  await note(`Scheduled task picked up ${out.length} article(s)${found.length ? `; new material: ${found.join(', ')}` : ''}.`);

  return {
    enabled: true,
    brief: SYSTEM_PROMPT,
    standing_instructions: agentSetting(s, 'agent_instructions').trim(),
    article_format: publishTool.input_schema,
    jobs: out,
    descriptions,
    descriptions_rule: 'One meta_description per page: 120–155 characters, plain English, specific to the page, active voice, no hype, no invented facts.',
  };
}

export async function completeJob(jobId: number, input: unknown) {
  const parsed = ArticleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, status: 422, error: parsed.error.issues.slice(0, 8).map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') };
  }
  const rows = await sql<AgentJob[]>`SELECT * FROM agent_jobs WHERE id = ${jobId}`;
  const job = rows[0];
  if (!job) return { ok: false, status: 404, error: 'No such job.' };
  if (job.status === 'done') return { ok: false, status: 409, error: 'This job is already published.' };

  const s = await getSettings();
  const urls = await publish(job, parsed.data, s);
  await sql`UPDATE agent_jobs SET status = 'done', finished_at = NOW(), usage_note = 'Written by the scheduled task (Claude subscription)',
    title = CASE WHEN title = '' THEN ${parsed.data.title.slice(0, 300)} ELSE title END WHERE id = ${jobId}`;
  let indexed = '';
  if (on(s, 'agent_indexnow') && urls.length) {
    try { indexed = await submitIndexNow(urls); } catch { indexed = 'IndexNow unreachable'; }
  }
  await note(`Published “${parsed.data.title}”.${indexed ? ` ${indexed}.` : ''}`);
  return { ok: true, status: 200, urls, indexed };
}

export async function failJob(jobId: number, error: string) {
  await sql`UPDATE agent_jobs SET status = 'failed', finished_at = NOW(), error = ${error.slice(0, 500) || 'Not written.'}
    WHERE id = ${jobId} AND status = 'running'`;
  await note(`Job ${jobId} not written: ${error.slice(0, 200)}`);
}

export async function storeDescriptions(items: { key: string; meta_description: string }[]) {
  const map = new Map(items.filter((i) => /^[pt]\d+$/.test(i.key)).map((i) => [i.key, String(i.meta_description ?? '')]));
  const urls = await saveDescriptions(map);
  const s = await getSettings();
  if (on(s, 'agent_indexnow') && urls.length) {
    try { await submitIndexNow(urls); } catch { /* next time */ }
  }
  if (urls.length) await note(`Wrote search descriptions for ${urls.length} older page(s).`);
  return urls;
}
