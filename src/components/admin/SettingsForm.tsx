'use client';

import { useActionState } from 'react';
import Field from './Field';
import { saveSettingsGroupAction, type FormState } from '@/app/admin/actions';
import type { Field as FieldDef } from '@/lib/resources';

export type SettingsGroup = {
  key: string;
  title: string;
  note?: string;
  fields: Record<string, FieldDef>;
};

/** How each key should be read back on the server. */
function specFor(name: string, field: FieldDef) {
  const kind =
    field.type === 'checkbox' ? 'bool'
    : field.type === 'number' ? 'number'
    : field.type === 'url' ? 'url'
    : field.type === 'image' ? 'image'
    : field.type === 'file' || field.type === 'audio' ? 'file'
    : field.type === 'color' ? 'color'
    : name === 'map_embed' ? 'html'
    : 'text';
  return { key: name, kind, folder: field.folder };
}

export default function SettingsForm({
  groups, values, intro,
}: {
  groups: SettingsGroup[];
  values: Record<string, string>;
  intro?: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveSettingsGroupAction, null);
  const errors = state?.errors ?? {};

  const specs = groups.flatMap((g) => Object.entries(g.fields).map(([name, f]) => specFor(name, f)));
  const groupMap = Object.fromEntries(
    groups.flatMap((g) => Object.keys(g.fields).map((name) => [name, g.key])),
  );

  return (
    <>
      {intro && <p className="muted">{intro}</p>}
      {state && <div className={`alert alert-${state.ok ? 'success' : 'error'}`}>{state.message}</div>}

      <form action={action} className="admin-form" noValidate>
        <input type="hidden" name="_specs" value={JSON.stringify(specs)} />
        <input type="hidden" name="_groups" value={JSON.stringify(groupMap)} />

        {groups.map((group, index) => (
          <section className="form-panel" key={`${group.key}-${index}`}>
            <div className="panel-head">
              <h3>{group.title}</h3>
              {group.note && <span className="muted">{group.note}</span>}
            </div>
            <div className="field-grid">
              {Object.entries(group.fields).map(([name, field]) => (
                <Field
                  key={name}
                  name={name}
                  field={field}
                  value={values[name] ?? field.default ?? ''}
                  error={errors[name]}
                />
              ))}
            </div>
          </section>
        ))}

        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={pending}>
            {pending ? 'Saving…' : 'Save changes'}
          </button>
          <a className="btn btn-link" href="/" target="_blank" rel="noopener noreferrer">Preview the site</a>
        </div>
      </form>
    </>
  );
}
