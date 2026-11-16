'use client';

import { useState } from 'react';

export type EditorBlock = {
  id?: number;
  key: string;
  label: string;
  title: string;
  title_ne: string;
  description: string;
  description_ne: string;
  body: string;
  body_ne: string;
  url: string;
  enabled: boolean;
  open: boolean;
};

let counter = 0;
const newKey = () => `b${Date.now().toString(36)}${(counter++).toString(36)}`;

function blank(): EditorBlock {
  return {
    key: newKey(), label: 'Prompt', title: '', title_ne: '', description: '', description_ne: '',
    body: '', body_ne: '', url: '', enabled: true, open: true,
  };
}

/**
 * The copy blocks of one post, edited inside that post's form. Their order
 * here is their order on the page (01, 02, 03…); move them with the arrows.
 * Everything is saved together with the post.
 */
export default function BlocksEditor({ initial }: { initial: Partial<EditorBlock>[] }) {
  const [blocks, setBlocks] = useState<EditorBlock[]>(() =>
    initial.map((b) => ({ ...blank(), ...b, key: newKey(), open: false,
      label: b.label || 'Prompt', url: b.url ?? '', title_ne: b.title_ne ?? '', description: b.description ?? '',
      description_ne: b.description_ne ?? '', body_ne: b.body_ne ?? '', enabled: b.enabled !== false })));

  const update = (key: string, patch: Partial<EditorBlock>) =>
    setBlocks((list) => list.map((b) => (b.key === key ? { ...b, ...patch } : b)));
  const move = (index: number, dir: -1 | 1) =>
    setBlocks((list) => {
      const next = [...list];
      const to = index + dir;
      if (to < 0 || to >= next.length) return list;
      [next[index], next[to]] = [next[to], next[index]];
      return next;
    });
  const remove = (key: string) => {
    if (window.confirm('Remove this copy block? It is deleted when you save the post.')) {
      setBlocks((list) => list.filter((b) => b.key !== key));
    }
  };

  const payload = JSON.stringify(blocks.map(({ key: _k, open: _o, ...b }) => b));

  return (
    <section className="form-panel blocks-editor">
      <input type="hidden" name="_blocks" value={payload} />
      <div className="panel-head">
        <h3>Copy blocks in this post ({blocks.length})</h3>
        <span className="muted">Shown on the post as 01, 02, 03… in this order. Saved with the post.</span>
      </div>

      {blocks.length === 0 && (
        <p className="muted">
          No copy blocks yet. Add one for each prompt, command or text the reader should copy — each gets
          its own heading, instruction and Copy button.
        </p>
      )}

      <ol className="blocks-list">
        {blocks.map((b, i) => (
          <li key={b.key} className={`block-item${b.enabled ? '' : ' is-hidden'}`}>
            <div className="block-bar">
              <span className="block-no">{String(i + 1).padStart(2, '0')}</span>
              <button type="button" className="block-toggle" onClick={() => update(b.key, { open: !b.open })}
                      aria-expanded={b.open}>
                <strong>{b.title || '(no heading)'}</strong>
                <small>{b.label} · {b.body ? `${b.body.slice(0, 70)}${b.body.length > 70 ? '…' : ''}` : 'empty'}</small>
              </button>
              <span className="block-tools">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => move(i, -1)}
                        disabled={i === 0} aria-label="Move up" title="Move up">↑</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => move(i, 1)}
                        disabled={i === blocks.length - 1} aria-label="Move down" title="Move down">↓</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => update(b.key, { open: !b.open })}>
                  {b.open ? 'Close' : 'Edit'}
                </button>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(b.key)}
                        aria-label="Remove block">✕</button>
              </span>
            </div>

            {b.open && (
              <div className="field-grid block-fields">
                <div className="field field-half">
                  <label>Heading (English)</label>
                  <input type="text" value={b.title} placeholder="The prompt from the reel"
                         onChange={(e) => update(b.key, { title: e.target.value })} />
                </div>
                <div className="field field-half">
                  <label>Heading (नेपाली)</label>
                  <input type="text" value={b.title_ne} onChange={(e) => update(b.key, { title_ne: e.target.value })} />
                </div>
                <div className="field field-half">
                  <label>Instruction (English)</label>
                  <input type="text" value={b.description} placeholder="Put your plan speed in the brackets, then paste it in."
                         onChange={(e) => update(b.key, { description: e.target.value })} />
                </div>
                <div className="field field-half">
                  <label>Instruction (नेपाली)</label>
                  <input type="text" value={b.description_ne} onChange={(e) => update(b.key, { description_ne: e.target.value })} />
                </div>
                <div className="field field-full">
                  <label>Text to copy (English) *</label>
                  <textarea rows={7} value={b.body} onChange={(e) => update(b.key, { body: e.target.value })}
                            placeholder="Exactly what the Copy button copies. Line breaks are kept." />
                </div>
                <div className="field field-full">
                  <label>Text to copy (नेपाली)</label>
                  <textarea rows={5} value={b.body_ne} onChange={(e) => update(b.key, { body_ne: e.target.value })}
                            placeholder="Optional. Leave empty and Nepali readers copy the English text." />
                </div>
                <div className="field field-half">
                  <label>Box label</label>
                  <input type="text" value={b.label} placeholder="Prompt"
                         onChange={(e) => update(b.key, { label: e.target.value })} />
                  <p className="field-hint">Shown on the box: Prompt, Code, Command, Text…</p>
                </div>
                <div className="field field-half">
                  <label>Link (optional)</label>
                  <input type="url" value={b.url} placeholder="https://…"
                         onChange={(e) => update(b.key, { url: e.target.value })} />
                  <p className="field-hint">Adds an Open button, and the heading row opens it.</p>
                </div>
                <div className="field field-full">
                  <label className="checkbox">
                    <input type="checkbox" checked={b.enabled} onChange={(e) => update(b.key, { enabled: e.target.checked })} />
                    <span>Show this block</span>
                  </label>
                </div>
              </div>
            )}
          </li>
        ))}
      </ol>

      <button type="button" className="btn btn-primary btn-sm"
              onClick={() => setBlocks((list) => [...list, blank()])}>
        + Add a copy block
      </button>
    </section>
  );
}
