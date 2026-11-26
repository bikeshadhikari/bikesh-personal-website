import Link from 'next/link';
import { redirect } from 'next/navigation';
import Shell from '@/components/admin/Shell';
import SettingsForm, { type SettingsGroup } from '@/components/admin/SettingsForm';
import { QueueForm, RunButton } from '@/components/admin/AgentClient';
import { currentUser } from '@/lib/auth';
import { getSettings } from '@/lib/settings';
import { AGENT_DEFAULTS, AGENT_MODEL, agentConfigured, listJobs } from '@/lib/agent';
import { jobAction } from './actions';
import { remoteEnabled } from '@/lib/agent-remote';
import { techCollectionChoices } from '@/lib/tech';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'SEO & blog agent' };

const d = (k: string) => AGENT_DEFAULTS[k];

const GROUPS: SettingsGroup[] = [
  {
    key: 'agent',
    title: 'What the agent does',
    fields: {
      agent_enabled: { type: 'checkbox', label: 'Run every day automatically (9:00 Nepal time)', default: true },
      agent_auto_publish: { type: 'checkbox', label: 'Publish articles straight away',
                            hint: 'Off: they are saved as drafts for you to read and publish yourself.', default: true },
      agent_from_tech: { type: 'checkbox', label: 'Write a full blog article for every published Simplified Tech post', default: true },
      agent_seo_pass: { type: 'checkbox', label: 'Fill in missing search descriptions on older posts', default: true },
      agent_indexnow: { type: 'checkbox', label: 'Notify Bing / ChatGPT search / Copilot (IndexNow) of new pages', default: true },
      agent_jobs_per_run: { type: 'number', label: 'Articles per daily run', default: 2, min: 1, max: 5,
                            hint: 'On your Claude subscription this uses part of your plan’s usage; with an API key each article costs roughly US$0.20–0.60.' },
    },
  },
  {
    key: 'agent',
    title: 'Sources and where articles go',
    fields: {
      agent_youtube_channel_id: { type: 'text', label: 'YouTube channel ID (optional)', default: d('agent_youtube_channel_id'),
                                  hint: 'Starts with UC… (YouTube Studio → Settings → Channel → Advanced settings). New videos are picked up automatically each day.' },
      agent_blog_category: { type: 'text', label: 'Blog category for articles', default: d('agent_blog_category'),
                             hint: 'Created automatically if it does not exist.' },
      agent_tech_collection: { type: 'select', label: 'Default Simplified Tech category', options: 'tech_collections',
                               hint: 'For new Simplified Tech posts the agent creates from your notes or videos.' },
      agent_instructions: { type: 'textarea', label: 'Standing instructions for the writer (optional)', rows: 4, full: true,
                            hint: 'e.g. “Mention that all tools are free to try”, “Always add a section for Android and iPhone”.' },
    },
  },
];

export default async function AgentPage() {
  if ((await currentUser())?.role !== 'admin') redirect('/admin');
  const [s, jobs, collections] = await Promise.all([getSettings(), listJobs(), techCollectionChoices()]);
  const apiMode = agentConfigured();
  const subMode = remoteEnabled();
  const cronReady = Boolean(process.env.CRON_SECRET);
  const queued = jobs.filter((j) => j.status === 'queued').length;

  // SettingsForm cannot load related options itself, so the category list is given as fixed choices.
  const groups = GROUPS.map((g) => ({
    ...g,
    fields: Object.fromEntries(Object.entries(g.fields).map(([k, f]) => [k,
      f.options === 'tech_collections'
        ? { ...f, options: Object.fromEntries([['', '— none —'], ...collections.map((c) => [c.value, c.label])]) }
        : f])),
  }));

  return (
    <Shell title="SEO & blog agent" current="agent">
      <div className="welcome-card">
        <div>
          <h2>SEO &amp; blog agent</h2>
          <p>
            Every day it turns your Tech Explainer content into detailed English articles, checks facts on the web,
            publishes them to your <Link href="/admin/posts">blog</Link> and <Link href="/admin/tech_links">Simplified Tech</Link>,
            links the two, fills in missing search descriptions and tells search engines about new pages.
            {' '}{subMode
              ? <>Runs on your <strong>Claude subscription</strong> through a Claude Code scheduled task, every morning — no API charges.</>
              : apiMode ? <>Runs on the Anthropic API (<code>{AGENT_MODEL}</code>), billed per article.</> : null}
          </p>
        </div>
        <div className="welcome-actions">
          {apiMode
            ? <RunButton label={queued ? `Run now (${queued} waiting)` : 'Run now'} />
            : <span className="muted">{queued} waiting for the next run</span>}
        </div>
      </div>

      {!apiMode && !subMode && (
        <div className="alert alert-error">
          <strong>One step left — free, on your Claude subscription:</strong> in Vercel open your project →
          Settings → Environment Variables and add <code>AGENT_TOKEN</code> with a long random value (at least
          24 characters, e.g. from a password generator). Redeploy. Give the same value to the Claude Code scheduled
          task when it asks for the credential for this site. Nothing is written until then.
          <br /><small>Alternatively, <code>ANTHROPIC_API_KEY</code> makes the website write the articles itself, billed per use.</small>
        </div>
      )}
      {apiMode && !cronReady && (
        <div className="alert alert-error">
          <strong>Daily run not active:</strong> add an environment variable <code>CRON_SECRET</code> in Vercel
          (any long random text) and redeploy. Vercel uses it to start the daily run. “Run now” works without it.
        </div>
      )}

      <div className="panel-grid">
        <section className="panel">
          <div className="panel-head"><h3>Give the agent something to write</h3></div>
          <QueueForm collections={collections} />
        </section>

        <section className="panel">
          <div className="panel-head"><h3>Last run</h3></div>
          <p className="muted">
            {s.agent_last_run ? formatDate(s.agent_last_run, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Not run yet.'}
          </p>
          {s.agent_last_report && <pre className="agent-report">{s.agent_last_report}</pre>}
          <p className="field-hint">
            Search engines: submit <code>/sitemap.xml</code> once in Google Search Console and Bing Webmaster Tools.
            AI assistants read <a href="/llms.txt" target="_blank" rel="noopener noreferrer">/llms.txt</a>.
          </p>
        </section>
      </div>

      <section className="panel">
        <div className="panel-head"><h3>Queue and history</h3><span className="muted">{jobs.length} shown</span></div>
        {jobs.length === 0 ? (
          <p className="muted">Nothing yet. Add something above, or publish a Simplified Tech post — it is picked up on the next run.</p>
        ) : (
          <table className="data-table compact">
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id}>
                  <td>
                    <strong>{j.title || j.source_url || `Job ${j.id}`}</strong>
                    <br />
                    <small className="muted">
                      {j.source === 'tech' ? 'Simplified Tech post' : j.source === 'youtube' ? 'YouTube video' : 'Your notes'}
                      {' → '}{j.target === 'both' ? 'blog + Simplified Tech' : j.target === 'blog' ? 'blog' : 'Simplified Tech'}
                      {j.usage_note && <> · {j.usage_note}</>}
                    </small>
                    {j.error && <><br /><small className="field-error">{j.error}</small></>}
                  </td>
                  <td><span className={`status status-${j.status === 'done' ? 'published' : j.status === 'failed' ? 'draft' : 'pending'}`}>{j.status}</span></td>
                  <td className="num nowrap">
                    {j.post_slug && <a href={`/blog/${j.post_slug}`} target="_blank" rel="noopener noreferrer">Blog</a>}
                    {j.post_slug && j.tech_slug && ' · '}
                    {j.tech_slug && j.status === 'done' && <a href={`/tech/${j.tech_slug}`} target="_blank" rel="noopener noreferrer">Tech</a>}
                  </td>
                  <td className="num nowrap">
                    {(j.status === 'queued' || j.status === 'failed') && <RunButton jobId={j.id} label="Write it now" className="btn btn-ghost btn-sm" />}
                    {j.status === 'failed' && (
                      <form action={jobAction} style={{ display: 'inline' }}>
                        <input type="hidden" name="id" value={j.id} /><input type="hidden" name="op" value="retry" />
                        <button className="btn btn-ghost btn-sm" type="submit">Retry on the next run</button>
                      </form>
                    )}
                    {j.status !== 'running' && (
                      <form action={jobAction} style={{ display: 'inline' }}>
                        <input type="hidden" name="id" value={j.id} /><input type="hidden" name="op" value="delete" />
                        <button className="btn btn-ghost btn-sm" type="submit">Remove</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <div className="page-head"><div><h2>Settings</h2></div></div>
      <SettingsForm groups={groups} values={s} previewHref="/blog" />
    </Shell>
  );
}
