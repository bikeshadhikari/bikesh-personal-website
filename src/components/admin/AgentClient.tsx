'use client';

import { useActionState, useState } from 'react';
import { useRouter } from 'next/navigation';
import { queueAction, type QueueState } from '@/app/admin/agent/actions';

/** The box where Bikesh hands the agent something to write about. */
export function QueueForm({ collections }: { collections: { value: string; label: string }[] }) {
  const [state, action, pending] = useActionState<QueueState, FormData>(queueAction, null);
  return (
    <form action={action} className="admin-form">
      {state && <div className={`alert alert-${state.ok ? 'success' : 'error'}`}>{state.message}</div>}
      <div className="field-grid">
        <div className="field field-full">
          <label htmlFor="q-title">Topic or video title</label>
          <input id="q-title" name="title" type="text" placeholder="e.g. Make your phone battery last a full day" />
        </div>
        <div className="field field-full">
          <label htmlFor="q-text">Script, caption or notes</label>
          <textarea id="q-text" name="text" rows={8}
                    placeholder="Paste the reel script (Nepali is fine), the caption, the prompt you showed, or a few notes. The agent turns it into a detailed English article." />
        </div>
        <div className="field field-half">
          <label htmlFor="q-url">Video or reel link (optional)</label>
          <input id="q-url" name="url" type="url" placeholder="https://www.instagram.com/reel/…" />
        </div>
        <div className="field field-half">
          <label htmlFor="q-target">Publish to</label>
          <select id="q-target" name="target" defaultValue="both">
            <option value="both">Blog and Simplified Tech (linked)</option>
            <option value="blog">Blog only</option>
            <option value="tech">Simplified Tech only</option>
          </select>
        </div>
        <div className="field field-half">
          <label htmlFor="q-col">Simplified Tech category</label>
          <select id="q-col" name="collection_id" defaultValue="">
            <option value="">— the default from the settings —</option>
            {collections.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>
      <div className="form-actions">
        <button className="btn btn-primary" type="submit" disabled={pending}>{pending ? 'Adding…' : 'Add to the queue'}</button>
      </div>
    </form>
  );
}

/** Runs the agent now, for the next job or a chosen one. */
export function RunButton({ jobId, label = 'Run now', className = 'btn btn-primary btn-sm' }: {
  jobId?: number; label?: string; className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  async function run() {
    setBusy(true);
    setNote('Writing… this takes one to three minutes.');
    try {
      const res = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobId ? { jobId } : {}),
      });
      if (!res.ok) {
        setNote(res.status === 504 ? 'The run took too long and was stopped; it will be retried.' : `Failed (${res.status}).`);
      } else {
        const report = (await res.json()) as { lines: string[] };
        setNote(report.lines.join(' ') || 'Nothing in the queue.');
      }
    } catch {
      setNote('The connection dropped. Refresh in a minute to see the result.');
    }
    setBusy(false);
    router.refresh();
  }

  return (
    <span className="agent-run">
      <button type="button" className={className} onClick={run} disabled={busy}>{busy ? 'Writing…' : label}</button>
      {note && <small className="muted">{note}</small>}
    </span>
  );
}
