import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod/v4';
import { sql } from './db';
import { ensureSchema } from './schema';
import { getSettings, saveSettings, setting, type SettingsMap } from './settings';
import { sanitizeHtml, siteOrigin, slugify } from './utils';

/*
 * The SEO & blog agent.
 *
 * A scheduled workflow, not an open-ended agent: once a day (Vercel Cron) or
 * when "Run now" is pressed, it
 *   1. collects new material: published Simplified Tech posts without an
 *      article yet, and new videos on the YouTube channel if one is set;
 *   2. writes each queued item up as a detailed English article — the model
 *      may search the web to check facts — and publishes it to the blog
 *      and/or Simplified Tech, cross-linked;
 *   3. fills in missing search descriptions on older pages;
 *   4. tells Bing and the other IndexNow engines (which feed ChatGPT search
 *      and Copilot) about every page it created or changed.
 *
 * It needs ANTHROPIC_API_KEY in the hosting environment. Without one it does
 * nothing and the dashboard says so.
 */

export const AGENT_MODEL = 'claude-opus-5-5';

export const AGENT_DEFAULTS: Record<string, string> = {
  agent_enabled: '1',
  agent_auto_publish: '1',
  agent_jobs_per_run: '2',
  agent_from_tech: '1',
  agent_youtube_channel_id: '',
  agent_blog_category: 'Tech Explainer',
  agent_tech_collection: '',
  agent_seo_pass: '1',
  agent_indexnow: '1',
  agent_instructions: '',
};

export function agentSetting(s: SettingsMap, key: string): string {
  return setting(s, key, AGENT_DEFAULTS[key] ?? '');
}
export const on = (s: SettingsMap, key: string) => ['1', 'true', 'yes', 'on'].includes(agentSetting(s, key).toLowerCase());

export function agentConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

export type AgentJob = {
  id: number; source: string; target: string; title: string; source_text: string; source_url: string;
  tech_link_id: number | null; collection_id: number | null; status: string; attempts: number;
  post_id: number | null; result_tech_id: number | null; error: string; usage_note: string;
  started_at: string | null; finished_at: string | null; created_at: string;
};

/* -------------------------------------------------------------------------- */
/* The writer                                                                 */
/* -------------------------------------------------------------------------- */

export const ArticleSchema = z.object({
  title: z.string().min(8).max(120),
  slug: z.string().min(3).max(90),
  meta_title: z.string().max(80),
  meta_description: z.string().min(50).max(200),
  excerpt: z.string().max(320),
  tags: z.array(z.string()).max(10),
  kicker: z.string().max(40),
  card_summary: z.string().max(260),
  article_html: z.string().min(400),
  faq: z.array(z.object({ question: z.string(), answer: z.string() })).max(8),
  copy_blocks: z.array(z.object({
    title: z.string(), description: z.string(), label: z.string(), body: z.string(),
  })).max(12),
});
export type Article = z.infer<typeof ArticleSchema>;

/** The writer's standing brief. Kept byte-stable so it is cached between runs. */
export const SYSTEM_PROMPT = `You write the long-form English articles for Bikesh Adhikari, a tech creator from Nepal who publishes as "Simplified Tech by Bikesh" (handle @bikesh.adh) and runs the Tech Explainer series of short videos on Instagram, Facebook, YouTube and TikTok. His videos are in Nepali; your articles turn each one into a detailed English write-up that ranks in search and that AI search engines can quote.

Brand
- Name it exactly "Simplified Tech by Bikesh" when you name it; never "by Bks". The handle is @bikesh.adh.
- Voice: plain, friendly, practical, confident. Short sentences. Explain jargon the first time it appears. Write for a smart reader who is not technical, often in Nepal or South Asia: mention local context (Nepali banks, NTC/Ncell, eSewa/Khalti, Nepali-language settings) only where it genuinely helps.

Accuracy
- Never invent numbers, prices, dates, version numbers, quotes or statistics. When the article states a fact about a product, a price, a version or a policy, check it with the web search tool first, and prefer the vendor's own pages. If something cannot be confirmed, say so or leave it out.
- Free tools first. Say clearly when something costs money.
- Do not claim rankings or titles for Bikesh (no "top", "best", "No. 1"). Do not mention that the article was written with AI.

What to write
- A detailed, genuinely useful article: what it is, why it matters, then numbered step-by-step instructions where there are steps, then tips, common mistakes and what to do next. 900–1,800 words; shorter only when the topic is small.
- Put every prompt, command, setting or text the reader should copy in a <pre> block, exactly as it should be pasted.
- SEO: one clear primary keyword phrase, used naturally in the title, the first paragraph, one <h2> and the meta description. Descriptive <h2>/<h3> headings phrased the way people search ("How to…", "Why…", "What is…"). No keyword stuffing.
- End with one short paragraph inviting readers to follow @bikesh.adh for the video version and to find the copy-paste version on Simplified Tech by Bikesh.

Output
- When the article is finished, call the publish_article tool once with everything filled in. Do not write the article as a normal reply.
- article_html: HTML only, using <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <a href>, <blockquote>, <pre>, <code>. No <h1> (the page adds the title), no inline styles, no images, no FAQ section (the FAQ goes in the faq field).
- slug: short, lower-case, hyphenated, with the primary keyword (e.g. "speed-up-wifi-prompt").
- meta_title: up to 60 characters. meta_description: 120–155 characters, active, with the keyword. excerpt: 1–2 sentences for listing cards.
- kicker: one or two words for a small label (e.g. "Prompt", "Wi-Fi", "Free tool").
- card_summary: two short sentences for a card, saying what the reader gets.
- faq: 3–6 real questions people search for, each answered in 1–3 sentences.
- copy_blocks: only the prompts, commands or texts from the source that a reader should copy (heading, one-line instruction, a label such as Prompt/Command/Text, and the exact body). Empty list if there are none.`;

export const publishTool = {
  name: 'publish_article',
  description: 'Publish the finished article. Call exactly once, with every field filled in.',
  strict: true,
  eager_input_streaming: true,
  input_schema: {
    type: 'object' as const,
    additionalProperties: false,
    required: ['title', 'slug', 'meta_title', 'meta_description', 'excerpt', 'tags', 'kicker', 'card_summary',
      'article_html', 'faq', 'copy_blocks'],
    properties: {
      title: { type: 'string', description: 'Headline, under 70 characters if possible.' },
      slug: { type: 'string' },
      meta_title: { type: 'string' },
      meta_description: { type: 'string' },
      excerpt: { type: 'string' },
      tags: { type: 'array', items: { type: 'string' } },
      kicker: { type: 'string' },
      card_summary: { type: 'string' },
      article_html: { type: 'string' },
      faq: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false, required: ['question', 'answer'],
          properties: { question: { type: 'string' }, answer: { type: 'string' } },
        },
      },
      copy_blocks: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false, required: ['title', 'description', 'label', 'body'],
          properties: {
            title: { type: 'string' }, description: { type: 'string' },
            label: { type: 'string' }, body: { type: 'string' },
          },
        },
      },
    },
  },
};

function client(): Anthropic {
  // Long writes with web research; one retry is enough inside a cron window.
  return new Anthropic({ maxRetries: 1, timeout: 270_000 });
}

/** Ask Claude for one article about the given material. */
async function writeArticle(material: string, extra: string): Promise<{ article: Article; note: string }> {
  const anthropic = client();
  const messages: Anthropic.Beta.BetaMessageParam[] = [{
    role: 'user',
    content: `${extra ? `Standing instructions from Bikesh:\n${extra}\n\n` : ''}Write the article for this piece of content.\n\n<content>\n${material}\n</content>`,
  }];

  let inputTokens = 0;
  let outputTokens = 0;
  let searches = 0;

  for (let round = 0; round < 6; round++) {
    const stream = anthropic.beta.messages.stream({
      model: AGENT_MODEL,
      max_tokens: 32000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium' },
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      tools: [
        { type: 'web_search_20260209', name: 'web_search', max_uses: 5 },
        publishTool,
      ],
      tool_choice: { type: 'auto' },
      messages,
    });
    const message = await stream.finalMessage();
    inputTokens += message.usage.input_tokens + (message.usage.cache_read_input_tokens ?? 0);
    outputTokens += message.usage.output_tokens;
    searches += message.usage.server_tool_use?.web_search_requests ?? 0;

    if (message.stop_reason === 'refusal') {
      throw new Error(`The model declined to write about this (${message.stop_details?.category ?? 'no category'}).`);
    }

    const call = message.content.find(
      (b): b is Anthropic.Beta.BetaToolUseBlock => b.type === 'tool_use' && b.name === 'publish_article');
    if (call) {
      // With eager input streaming the input is not validated by the API, so check it here.
      const parsed = ArticleSchema.safeParse(call.input);
      if (parsed.success) {
        return {
          article: parsed.data,
          note: `${inputTokens.toLocaleString()} in / ${outputTokens.toLocaleString()} out tokens, ${searches} searches`,
        };
      }
      if (message.stop_reason === 'max_tokens') throw new Error('The article was cut off (max_tokens).');
      messages.push({ role: 'assistant', content: message.content });
      messages.push({ role: 'user', content: [{
        type: 'tool_result', tool_use_id: call.id, is_error: true,
        content: `INVALID_INPUT: ${parsed.error.issues.slice(0, 5).map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}. Call publish_article again with corrected fields.`,
      }] });
      continue;
    }

    if (message.stop_reason === 'max_tokens') throw new Error('The article was cut off (max_tokens).');
    messages.push({ role: 'assistant', content: message.content });
    if (message.stop_reason !== 'pause_turn') {
      messages.push({ role: 'user', content: 'Now call publish_article with the finished article.' });
    }
  }
  throw new Error('The writer did not deliver an article after several rounds.');
}

const MetaSchema = z.object({
  items: z.array(z.object({ key: z.string(), meta_description: z.string() })),
});

/** Search descriptions for pages that have none, in one inexpensive call. */
async function writeDescriptions(pages: { key: string; title: string; text: string }[]): Promise<Map<string, string>> {
  const anthropic = client();
  const response = await anthropic.messages.parse({
    model: AGENT_MODEL,
    max_tokens: 8000,
    output_config: { effort: 'low', format: zodOutputFormat(MetaSchema) },
    system: 'You write search-result descriptions (meta descriptions) for Simplified Tech by Bikesh (@bikesh.adh), a Nepali tech creator. Each is 120–155 characters, plain English, specific to the page, active voice, no quotes, no hype, no invented facts.',
    messages: [{
      role: 'user',
      content: `Write one meta_description per page. Return the same key for each.\n\n${pages.map((p) =>
        `<page key="${p.key}">\n<title>${p.title}</title>\n${p.text.slice(0, 1500)}\n</page>`).join('\n')}`,
    }],
  });
  const out = new Map<string, string>();
  for (const item of response.parsed_output?.items ?? []) {
    const text = item.meta_description.trim();
    if (text.length >= 50) out.set(item.key, text.slice(0, 300));
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* Material                                                                   */
/* -------------------------------------------------------------------------- */

export const strip = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

export async function materialFor(job: AgentJob): Promise<string> {
  const parts: string[] = [];
  if (job.tech_link_id) {
    const [link] = await sql<{ title: string; summary: string; content: string; slug: string; video_url: string;
      external_url: string; collection: string | null }[]>`
      SELECT l.title, l.summary, l.content, l.slug, l.video_url, l.external_url, c.name AS collection
      FROM tech_links l LEFT JOIN tech_collections c ON c.id = l.collection_id WHERE l.id = ${job.tech_link_id}`;
    if (link) {
      parts.push(`Type: a Simplified Tech by Bikesh post (page: ${siteOrigin()}/tech/${link.slug})`);
      parts.push(`Title: ${link.title}`);
      if (link.collection) parts.push(`Category: ${link.collection}`);
      if (link.summary) parts.push(`Summary: ${link.summary}`);
      if (link.content) parts.push(`Existing notes: ${strip(link.content).slice(0, 6000)}`);
      if (link.video_url) parts.push(`Video: ${link.video_url}`);
      if (link.external_url) parts.push(`Main link: ${link.external_url}`);
      const blocks = await sql<{ title: string; description: string; label: string; body: string }[]>`
        SELECT title, description, label, body FROM tech_blocks WHERE link_id = ${job.tech_link_id} AND enabled
        ORDER BY sort_order, id`;
      blocks.forEach((b, i) => parts.push(`Copy block ${i + 1} (${b.label}): ${b.title}\n${b.description}\n${b.body}`));
    }
  }
  if (job.title) parts.push(`Title: ${job.title}`);
  if (job.source_url) parts.push(`Source link: ${job.source_url}`);
  if (job.source_text) parts.push(`Notes, script or caption from Bikesh:\n${job.source_text.slice(0, 20000)}`);
  return parts.join('\n');
}

/* -------------------------------------------------------------------------- */
/* Publishing                                                                 */
/* -------------------------------------------------------------------------- */

async function uniqueSlug(table: 'posts' | 'tech_links', wanted: string): Promise<string> {
  const base = slugify(wanted, 'article').slice(0, 80);
  let candidate = base;
  for (let n = 2; ; n++) {
    const rows = await sql.unsafe<{ n: number }[]>(`SELECT COUNT(*)::int AS n FROM ${table} WHERE slug = $1`, [candidate]);
    if (rows[0].n === 0) return candidate;
    candidate = `${base}-${n}`;
  }
}

async function blogCategoryId(name: string): Promise<number | null> {
  const clean = name.trim();
  if (!clean) return null;
  const found = await sql<{ id: number }[]>`SELECT id FROM categories WHERE lower(name) = lower(${clean}) LIMIT 1`;
  if (found[0]) return found[0].id;
  const [row] = await sql<{ id: number }[]>`
    INSERT INTO categories (name, slug, description, sort_order)
    VALUES (${clean}, ${await uniqueCategorySlug(clean)}, ${'Detailed write-ups of the Tech Explainer videos by @bikesh.adh.'}, 50)
    RETURNING id`;
  return row.id;
}

async function uniqueCategorySlug(name: string): Promise<string> {
  const base = slugify(name, 'category');
  let candidate = base;
  for (let n = 2; ; n++) {
    const rows = await sql<{ n: number }[]>`SELECT COUNT(*)::int AS n FROM categories WHERE slug = ${candidate}`;
    if (rows[0].n === 0) return candidate;
    candidate = `${base}-${n}`;
  }
}

async function authorId(): Promise<number | null> {
  const rows = await sql<{ id: number }[]>`SELECT id FROM users ORDER BY (role = 'admin') DESC, id ASC LIMIT 1`;
  return rows[0]?.id ?? null;
}

const faqJson = (a: Article) => JSON.stringify(a.faq.filter((f) => f.question.trim() && f.answer.trim()).slice(0, 8));

/** Put one job's article on the site. Returns the addresses it created or changed. */
export async function publish(job: AgentJob, a: Article, s: SettingsMap): Promise<string[]> {
  const base = siteOrigin();
  const status = on(s, 'agent_auto_publish') ? 'published' : 'draft';
  const html = sanitizeHtml(a.article_html);
  const changed: string[] = [];
  const wantBlog = job.target === 'both' || job.target === 'blog';
  const wantTech = job.target === 'both' || job.target === 'tech';

  // The Simplified Tech side: an existing post is only filled in where empty.
  let techId: number | null = job.tech_link_id;
  let techSlug = '';
  if (techId) {
    const [row] = await sql<{ slug: string }[]>`
      UPDATE tech_links SET
        content = CASE WHEN COALESCE(content, '') = '' THEN ${html} ELSE content END,
        summary = CASE WHEN COALESCE(summary, '') = '' THEN ${a.card_summary} ELSE summary END,
        kicker = CASE WHEN COALESCE(kicker, '') = '' THEN ${a.kicker} ELSE kicker END,
        meta_description = CASE WHEN COALESCE(meta_description, '') = '' THEN ${a.meta_description.slice(0, 300)} ELSE meta_description END,
        faq = CASE WHEN COALESCE(faq, '') IN ('', '[]') THEN ${faqJson(a)} ELSE faq END,
        updated_at = NOW()
      WHERE id = ${techId} RETURNING slug`;
    techSlug = row?.slug ?? '';
  } else if (wantTech) {
    techSlug = await uniqueSlug('tech_links', a.slug);
    const collectionId = job.collection_id ?? (Number(agentSetting(s, 'agent_tech_collection')) || null);
    const [row] = await sql<{ id: number }[]>`
      INSERT INTO tech_links (title, slug, collection_id, kicker, summary, content, status, published_at,
                              video_url, meta_description, faq)
      VALUES (${a.title}, ${techSlug}, ${collectionId}, ${a.kicker}, ${a.card_summary}, ${html}, ${status},
              ${status === 'published' ? new Date().toISOString() : null},
              ${job.source_url && /youtu|instagram|facebook|tiktok/i.test(job.source_url) ? job.source_url : ''},
              ${a.meta_description.slice(0, 300)}, ${faqJson(a)})
      RETURNING id`;
    techId = row.id;
    let order = 10;
    for (const b of a.copy_blocks.filter((x) => x.body.trim())) {
      await sql`INSERT INTO tech_blocks (link_id, title, description, label, body, sort_order)
        VALUES (${techId}, ${b.title.slice(0, 220)}, ${b.description}, ${(b.label || 'Prompt').slice(0, 60)}, ${b.body}, ${order})`;
      order += 10;
    }
  }
  if (techSlug && status === 'published') changed.push(`${base}/tech/${techSlug}`);

  // The blog side.
  let postId: number | null = null;
  if (wantBlog) {
    const slug = await uniqueSlug('posts', a.slug);
    const link = techSlug
      ? `<p><strong>Copy-paste version:</strong> the prompts and links from this article are on <a href="/tech/${techSlug}">Simplified Tech by Bikesh</a>.</p>`
      : '';
    const [row] = await sql<{ id: number }[]>`
      INSERT INTO posts (title, slug, excerpt, content, category_id, author_id, tags, status, is_featured,
                         allow_comments, meta_title, meta_description, published_at, faq, source_tech_id)
      VALUES (${a.title}, ${slug}, ${a.excerpt}, ${html + link}, ${await blogCategoryId(agentSetting(s, 'agent_blog_category'))},
              ${await authorId()}, ${a.tags.map((t) => t.replace(/,/g, ' ').trim()).filter(Boolean).slice(0, 8).join(', ').slice(0, 250)},
              ${status}, FALSE, TRUE, ${a.meta_title.slice(0, 200)}, ${a.meta_description.slice(0, 300)},
              ${status === 'published' ? new Date().toISOString() : null}, ${faqJson(a)}, ${techId})
      RETURNING id`;
    postId = row.id;
    if (techId) await sql`UPDATE tech_links SET blog_post_id = ${postId} WHERE id = ${techId}`;
    if (status === 'published') changed.push(`${base}/blog/${slug}`);
  }

  await sql`UPDATE agent_jobs SET post_id = ${postId}, result_tech_id = ${techId} WHERE id = ${job.id}`;
  return changed;
}

/* -------------------------------------------------------------------------- */
/* Collecting material                                                        */
/* -------------------------------------------------------------------------- */

/** Published Simplified Tech posts that have no article yet. */
export async function queueTechPosts(): Promise<number> {
  const rows = await sql<{ id: number; title: string }[]>`
    SELECT l.id, l.title FROM tech_links l
    WHERE l.status = 'published' AND l.blog_post_id IS NULL
      AND NOT EXISTS (SELECT 1 FROM agent_jobs j WHERE j.tech_link_id = l.id)
    ORDER BY l.published_at ASC NULLS LAST LIMIT 20`;
  for (const r of rows) {
    await sql`INSERT INTO agent_jobs (source, target, title, tech_link_id) VALUES ('tech', 'blog', ${r.title}, ${r.id})`;
  }
  return rows.length;
}

const decode = (t: string) => t.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'");

/** New videos on the YouTube channel, from its public feed. */
export async function queueYouTube(channelId: string): Promise<number> {
  if (!/^UC[\w-]{20,}$/.test(channelId)) return 0;
  const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, { cache: 'no-store' });
  if (!res.ok) return 0;
  const xml = await res.text();
  const cutoff = Date.now() - 21 * 24 * 3600 * 1000;
  let added = 0;
  for (const entry of xml.split('<entry>').slice(1)) {
    const id = /<yt:videoId>([^<]+)</.exec(entry)?.[1];
    const title = decode(/<title>([^<]*)</.exec(entry)?.[1] ?? '');
    const published = Date.parse(/<published>([^<]+)</.exec(entry)?.[1] ?? '');
    const description = decode(/<media:description>([\s\S]*?)<\/media:description>/.exec(entry)?.[1] ?? '');
    if (!id || !title || !(published > cutoff)) continue;
    const url = `https://www.youtube.com/watch?v=${id}`;
    const inserted = await sql`
      INSERT INTO agent_jobs (source, target, title, source_text, source_url)
      VALUES ('youtube', 'both', ${title.slice(0, 300)}, ${description}, ${url})
      ON CONFLICT DO NOTHING RETURNING id`;
    added += inserted.length;
  }
  return added;
}

/* -------------------------------------------------------------------------- */
/* IndexNow                                                                   */
/* -------------------------------------------------------------------------- */

export async function indexNowKey(): Promise<string> {
  const s = await getSettings();
  let key = s.indexnow_key;
  if (!key || !/^[a-f0-9]{32}$/.test(key)) {
    key = crypto.randomUUID().replace(/-/g, '');
    await saveSettings({ indexnow_key: key }, 'agent');
  }
  return key;
}

/** Tell Bing, Yandex and the other IndexNow engines that pages changed. */
export async function submitIndexNow(urls: string[]): Promise<string> {
  const list = [...new Set(urls)].filter((u) => u.startsWith('https://')).slice(0, 1000);
  if (list.length === 0) return 'nothing to submit';
  const host = new URL(list[0]).host;
  const key = await indexNowKey();
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host, key, keyLocation: `https://${host}/indexnow-key`, urlList: list }),
  });
  return `IndexNow ${res.status} for ${list.length} page${list.length === 1 ? '' : 's'}`;
}

/* -------------------------------------------------------------------------- */
/* The run                                                                    */
/* -------------------------------------------------------------------------- */

export type RunReport = { lines: string[]; wrote: number; failed: number };

/**
 * One pass of the agent. `deadline` is a timestamp after which no new
 * article is started, so a run stays inside the hosting time limit.
 */
export async function runAgent(opts: { deadline: number; jobId?: number; force?: boolean }): Promise<RunReport> {
  const report: RunReport = { lines: [], wrote: 0, failed: 0 };
  await ensureSchema();
  const s = await getSettings();

  if (!opts.force && !on(s, 'agent_enabled')) {
    report.lines.push('The agent is switched off in its settings.');
    return report;
  }
  if (!agentConfigured()) {
    report.lines.push('ANTHROPIC_API_KEY is not set in the hosting environment, so nothing was written.');
    return report;
  }

  // A run that died mid-article (a timeout) leaves its job "running"; give it another go.
  await sql`UPDATE agent_jobs SET status = 'queued'
    WHERE status = 'running' AND started_at < NOW() - INTERVAL '15 minutes' AND attempts < 3`;
  await sql`UPDATE agent_jobs SET status = 'failed', error = 'Stopped three times without finishing.'
    WHERE status = 'running' AND started_at < NOW() - INTERVAL '15 minutes'`;

  if (!opts.jobId) {
    if (on(s, 'agent_from_tech')) {
      const n = await queueTechPosts();
      if (n) report.lines.push(`Queued ${n} Simplified Tech post${n === 1 ? '' : 's'} for a full article.`);
    }
    const channel = agentSetting(s, 'agent_youtube_channel_id').trim();
    if (channel) {
      try {
        const n = await queueYouTube(channel);
        if (n) report.lines.push(`Queued ${n} new YouTube video${n === 1 ? '' : 's'}.`);
      } catch {
        report.lines.push('Could not read the YouTube feed this time.');
      }
    }
  }

  const limit = opts.jobId ? 1 : Math.min(5, Math.max(1, Number(agentSetting(s, 'agent_jobs_per_run')) || 1));
  const changed: string[] = [];
  const extra = agentSetting(s, 'agent_instructions').trim();

  for (let i = 0; i < limit; i++) {
    if (Date.now() > opts.deadline) break;
    const picked = opts.jobId
      ? await sql<AgentJob[]>`UPDATE agent_jobs SET status = 'running', started_at = NOW(), attempts = attempts + 1, error = ''
          WHERE id = ${opts.jobId} AND status IN ('queued', 'failed') RETURNING *`
      : await sql<AgentJob[]>`UPDATE agent_jobs SET status = 'running', started_at = NOW(), attempts = attempts + 1, error = ''
          WHERE id = (SELECT id FROM agent_jobs WHERE status = 'queued' ORDER BY created_at ASC LIMIT 1 FOR UPDATE SKIP LOCKED)
          RETURNING *`;
    const job = picked[0];
    if (!job) break;

    try {
      const material = await materialFor(job);
      if (!material.trim()) throw new Error('There is nothing to write about: the job has no text, link or post.');
      const { article, note } = await writeArticle(material, extra);
      const urls = await publish(job, article, s);
      changed.push(...urls);
      await sql`UPDATE agent_jobs SET status = 'done', finished_at = NOW(), usage_note = ${note.slice(0, 200)},
        title = CASE WHEN title = '' THEN ${article.title.slice(0, 300)} ELSE title END WHERE id = ${job.id}`;
      report.wrote++;
      report.lines.push(`Wrote “${article.title}” (${note}).`);
    } catch (error) {
      const message = errorText(error);
      await sql`UPDATE agent_jobs SET status = 'failed', finished_at = NOW(), error = ${message} WHERE id = ${job.id}`;
      report.failed++;
      report.lines.push(`Job ${job.id} failed: ${message}`);
      if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) break;
    }
  }

  // Descriptions for older pages that have none.
  if (!opts.jobId && on(s, 'agent_seo_pass') && Date.now() < opts.deadline + 60_000) {
    try {
      const n = await seoPass(changed);
      if (n) report.lines.push(`Wrote search descriptions for ${n} older page${n === 1 ? '' : 's'}.`);
    } catch (error) {
      report.lines.push(`Search descriptions skipped: ${errorText(error)}`);
    }
  }

  if (on(s, 'agent_indexnow') && changed.length > 0) {
    try {
      report.lines.push(await submitIndexNow(changed));
    } catch {
      report.lines.push('IndexNow could not be reached this time.');
    }
  }

  await saveSettings({
    agent_last_run: new Date().toISOString(),
    agent_last_report: report.lines.join('\n').slice(0, 2000) || 'Nothing to do.',
  }, 'agent');
  return report;
}

export type PageForDescription = { key: string; title: string; text: string };

/** Published pages with no search description yet (p = blog post, t = tech post). */
export async function pagesNeedingDescriptions(limit = 8): Promise<PageForDescription[]> {
  const posts = await sql<{ id: number; title: string; text: string }[]>`
    SELECT id, title, COALESCE(NULLIF(excerpt, ''), content) AS text FROM posts
    WHERE status = 'published' AND COALESCE(meta_description, '') = '' ORDER BY published_at DESC NULLS LAST LIMIT ${limit}`;
  const techs = await sql<{ id: number; title: string; text: string }[]>`
    SELECT id, title, COALESCE(NULLIF(summary, ''), content) AS text FROM tech_links
    WHERE status = 'published' AND COALESCE(meta_description, '') = '' ORDER BY published_at DESC NULLS LAST LIMIT ${limit}`;
  return [
    ...posts.map((p) => ({ key: `p${p.id}`, title: p.title, text: strip(p.text).slice(0, 1500) })),
    ...techs.map((t) => ({ key: `t${t.id}`, title: t.title, text: strip(t.text).slice(0, 1500) })),
  ];
}

/** Store descriptions, never over one already written. Returns the addresses changed. */
export async function saveDescriptions(items: Map<string, string>): Promise<string[]> {
  const base = siteOrigin();
  const changed: string[] = [];
  for (const [key, raw] of items) {
    const text = raw.replace(/\s+/g, ' ').trim().slice(0, 300);
    const id = Number(key.slice(1));
    if (text.length < 50 || !Number.isInteger(id)) continue;
    if (key.startsWith('p')) {
      const rows = await sql<{ slug: string }[]>`UPDATE posts SET meta_description = ${text}
        WHERE id = ${id} AND COALESCE(meta_description, '') = '' RETURNING slug`;
      if (rows[0]) changed.push(`${base}/blog/${rows[0].slug}`);
    } else if (key.startsWith('t')) {
      const rows = await sql<{ slug: string }[]>`UPDATE tech_links SET meta_description = ${text}
        WHERE id = ${id} AND COALESCE(meta_description, '') = '' RETURNING slug`;
      if (rows[0]) changed.push(`${base}/tech/${rows[0].slug}`);
    }
  }
  return changed;
}

async function seoPass(changed: string[]): Promise<number> {
  const pages = await pagesNeedingDescriptions();
  if (pages.length === 0) return 0;
  const urls = await saveDescriptions(await writeDescriptions(pages));
  changed.push(...urls);
  return urls.length;
}

function errorText(error: unknown): string {
  if (error instanceof Anthropic.AuthenticationError) return 'The Anthropic API key was rejected. Check ANTHROPIC_API_KEY.';
  if (error instanceof Anthropic.PermissionDeniedError) return 'The API key is not allowed to use this model.';
  if (error instanceof Anthropic.RateLimitError) return 'Rate limited by the API; it will try again next run.';
  if (error instanceof Anthropic.BadRequestError) return `The API rejected the request: ${error.message}`.slice(0, 500);
  if (error instanceof Anthropic.APIError) return `API error ${error.status ?? ''}: ${error.message}`.slice(0, 500);
  return (error instanceof Error ? error.message : String(error)).slice(0, 500);
}

/** Add something for the agent to write up. */
export async function queueJob(input: {
  title: string; text: string; url: string; target: string; collectionId: number | null;
}): Promise<void> {
  await ensureSchema();
  const target = ['both', 'blog', 'tech'].includes(input.target) ? input.target : 'both';
  await sql`INSERT INTO agent_jobs (source, target, title, source_text, source_url, collection_id)
    VALUES ('inbox', ${target}, ${input.title.slice(0, 300)}, ${input.text.slice(0, 40000)},
            ${input.url.slice(0, 500)}, ${input.collectionId})
    ON CONFLICT DO NOTHING`;
}

export async function listJobs(limit = 40): Promise<(AgentJob & { post_slug: string | null; tech_slug: string | null })[]> {
  await ensureSchema();
  return [...await sql<(AgentJob & { post_slug: string | null; tech_slug: string | null })[]>`
    SELECT j.*, p.slug AS post_slug, t.slug AS tech_slug FROM agent_jobs j
    LEFT JOIN posts p ON p.id = j.post_id
    LEFT JOIN tech_links t ON t.id = COALESCE(j.result_tech_id, j.tech_link_id)
    ORDER BY j.created_at DESC LIMIT ${limit}`];
}
