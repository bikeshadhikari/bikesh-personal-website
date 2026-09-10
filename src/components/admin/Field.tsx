'use client';

import { useState } from 'react';
import { ICON_CHOICES, type Field as FieldDef } from '@/lib/resources';
import Icon from '../Icon';
import Editor from './Editor';
import FileUpload from './FileUpload';

export type SelectOption = { value: string; label: string };

/** Renders one dashboard control from a Resource field definition. */
export default function Field({
  name, field, value, error, categoryOptions = [],
}: {
  name: string;
  field: FieldDef;
  value: unknown;
  error?: string;
  categoryOptions?: SelectOption[];
}) {
  const id = `f-${name}`;
  const label = field.label;
  const width = field.full ? 'field-full' : 'field-half';
  const text = value === null || value === undefined ? '' : String(value);

  return (
    <div className={`field ${width}${error ? ' has-error' : ''}`}>
      {field.type !== 'checkbox' && (
        <label htmlFor={id}>
          {label}{field.required && <span aria-hidden="true"> *</span>}
        </label>
      )}

      {field.type === 'textarea' && (
        <textarea id={id} name={name} rows={field.rows ?? 4} defaultValue={text} required={field.required} />
      )}

      {field.type === 'richtext' && <Editor name={name} initialHtml={text} label={label} />}

      {field.type === 'select' && (
        <select id={id} name={name} defaultValue={text}>
          {field.options === 'categories'
            ? [{ value: '', label: '— none —' }, ...categoryOptions].map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))
            : Object.entries(field.options ?? {}).map(([key, text2]) => (
                <option key={key} value={key}>{text2}</option>
              ))}
        </select>
      )}

      {field.type === 'icon' && <IconPicker id={id} name={name} value={text} />}

      {field.type === 'checkbox' && (
        <label className="checkbox">
          <input type="checkbox" id={id} name={name} value="1" defaultChecked={value === true || value === '1' || value === 1} />
          <span>{label}</span>
        </label>
      )}

      {field.type === 'range' && <RangeInput id={id} name={name} value={Number(value) || 0} />}

      {(field.type === 'image' || field.type === 'file') && (
        <FileUpload
          name={name}
          value={text}
          folder={field.folder}
          isImage={field.type === 'image'}
        />
      )}

      {field.type === 'datetime' && (
        <input type="datetime-local" id={id} name={name}
               defaultValue={text ? new Date(text).toISOString().slice(0, 16) : ''} />
      )}

      {field.type === 'date' && (
        <input type="date" id={id} name={name} defaultValue={text ? text.slice(0, 10) : ''} />
      )}

      {field.type === 'color' && (
        <input type="color" id={id} name={name} defaultValue={text || '#2563eb'} />
      )}

      {field.type === 'number' && (
        <input type="number" id={id} name={name} defaultValue={text} min={field.min} max={field.max} />
      )}

      {(field.type === 'text' || field.type === 'slug' || field.type === 'url') && (
        <input
          type={field.type === 'url' ? 'url' : 'text'}
          id={id}
          name={name}
          defaultValue={text}
          required={field.required}
          data-slug={field.type === 'slug' ? 'true' : undefined}
        />
      )}

      {field.hint && <p className="field-hint">{field.hint}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

function RangeInput({ id, name, value }: { id: string; name: string; value: number }) {
  const [level, setLevel] = useState(value);
  return (
    <div className="range-row">
      <input
        type="range" id={id} name={name} min={0} max={100} step={1}
        value={level} onChange={(e) => setLevel(Number(e.target.value))}
      />
      <output>{level}%</output>
    </div>
  );
}

function IconPicker({ id, name, value }: { id: string; name: string; value: string }) {
  const [chosen, setChosen] = useState(value);
  return (
    <div className="icon-picker">
      <select id={id} name={name} value={chosen} onChange={(e) => setChosen(e.target.value)}>
        <option value="">— none —</option>
        {ICON_CHOICES.map((choice) => <option key={choice} value={choice}>{choice}</option>)}
      </select>
      <span className="icon-preview" style={{ opacity: chosen ? 1 : 0.35 }}>
        <Icon name={chosen || 'sparkle'} />
      </span>
    </div>
  );
}
