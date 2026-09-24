'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import Field, { type SelectOption } from './Field';
import { ConfirmButton } from './ShellClient';
import { deleteResourceAction, saveResourceAction, type FormState } from '@/app/admin/actions';
import type { ResourceDef } from '@/lib/resources';
import type { Row } from '@/lib/crud';
import Icon from '../Icon';

export default function ResourceForm({
  resource, def, record, isEdit, categoryOptions, pageOptions = [], viewHref, saved,
}: {
  resource: string;
  def: ResourceDef;
  record: Row;
  isEdit: boolean;
  categoryOptions: SelectOption[];
  pageOptions?: SelectOption[];
  viewHref?: string;
  saved?: boolean;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveResourceAction, null);
  const errors = state?.errors ?? {};

  const hasDimensions = Object.values(def.fields).some((f) => f.type === 'dimensions');
  const main = Object.entries(def.fields).filter(([, f]) => f.group !== 'seo');
  const seo = Object.entries(def.fields).filter(([, f]) => f.group === 'seo');
  const values = state?.errors ? { ...record } : record;

  return (
    <>
      <div className="page-head">
        <div>
          <h2>{isEdit ? 'Edit' : 'New'} {def.singular.toLowerCase()}</h2>
          <p className="muted">
            <Link href={`/admin/${resource}`}>← Back to {def.label.toLowerCase()}</Link>
          </p>
        </div>
        {isEdit && viewHref && (
          <a className="btn btn-ghost btn-sm" href={viewHref} target="_blank" rel="noopener noreferrer">
            <Icon name="external" className="icon icon-sm" /> View
          </a>
        )}
      </div>

      {saved && !state && <div className="alert alert-success">Saved.</div>}
      {state && !state.ok && <div className="alert alert-error">{state.message}</div>}

      <form action={action} className="admin-form" noValidate>
        <input type="hidden" name="_resource" value={resource} />
        <input type="hidden" name="_id" value={String(record.id ?? 0)} />

        <div className="form-panel">
          <div className="field-grid">
            {main.map(([name, field]) => (
              <Field
                key={name}
                name={name}
                field={field}
                value={values[name]}
                error={errors[name]}
                categoryOptions={categoryOptions}
                pageOptions={pageOptions}
                withDimensions={hasDimensions && field.type === 'image'}
                initialWidth={Number(values.width ?? 0)}
                initialHeight={Number(values.height ?? 0)}
              />
            ))}
          </div>
        </div>

        {seo.length > 0 && (
          <details className="form-panel collapsible" open={seo.some(([n]) => errors[n])}>
            <summary>
              <h3>Search engine settings</h3>
              <span className="muted">Optional. Leave empty to use the title and summary.</span>
            </summary>
            <div className="field-grid">
              {seo.map(([name, field]) => (
                <Field key={name} name={name} field={field} value={values[name]} error={errors[name]} />
              ))}
            </div>
          </details>
        )}

        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={pending}>
            {pending ? 'Saving…' : 'Save'}
          </button>
          <button className="btn btn-ghost" type="submit" name="_close" value="1" disabled={pending}>
            Save and close
          </button>
          <Link className="btn btn-link" href={`/admin/${resource}`}>Cancel</Link>
        </div>
      </form>

      {isEdit && (
        <form action={deleteResourceAction} className="form-actions">
          <input type="hidden" name="_resource" value={resource} />
          <input type="hidden" name="_id" value={String(record.id ?? 0)} />
          <ConfirmButton
            className="btn btn-danger btn-sm"
            message={`Delete this ${def.singular.toLowerCase()}? This cannot be undone.`}
          >
            Delete this {def.singular.toLowerCase()}
          </ConfirmButton>
        </form>
      )}
    </>
  );
}
