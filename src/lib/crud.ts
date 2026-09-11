import 'server-only';
import { sql } from './db';
import { withSchema } from './schema';
import { getResource, type Field, type ResourceDef } from './resources';
import { acceptMediaUrl, deleteUpload } from './upload';
import { normalizeUrl, sanitizeHtml, slugify, excerptOf } from './utils';

export type Row = Record<string, unknown>;

/** Make a slug unique inside its table. */
async function uniqueSlug(table: string, slug: string, ignoreId?: number): Promise<string> {
  const base = slug;
  let candidate = slug;
  let n = 1;

  for (;;) {
    const rows = ignoreId
      ? await sql.unsafe<{ count: string }[]>(
          `SELECT COUNT(*)::text AS count FROM ${table} WHERE slug = $1 AND id <> $2`, [candidate, ignoreId])
      : await sql.unsafe<{ count: string }[]>(
          `SELECT COUNT(*)::text AS count FROM ${table} WHERE slug = $1`, [candidate]);
    if (Number(rows[0]?.count ?? 0) === 0) return candidate;
    candidate = `${base}-${++n}`;
  }
}

export type ListResult = { rows: Row[]; total: number; pages: number; page: number };

/** Rows for a dashboard list screen, with search, pagination and derived columns. */
export async function listRows(
  def: ResourceDef, search = '', page = 1, perPage = 20,
): Promise<ListResult> {
  const params: unknown[] = [];
  let where = 'TRUE';

  if (search && def.search?.length) {
    const clauses = def.search.map((col) => {
      params.push(`%${search}%`);
      return `${col} ILIKE $${params.length}`;
    });
    where = `(${clauses.join(' OR ')})`;
  }

  const countRows = await sql.unsafe<{ count: string }[]>(
    `SELECT COUNT(*)::text AS count FROM ${def.table} WHERE ${where}`, params as never[]);
  const total = Number(countRows[0]?.count ?? 0);

  const offset = Math.max(0, (page - 1) * perPage);
  const select = def.table === 'posts'
    ? `SELECT p.*, c.name AS category_name FROM posts p LEFT JOIN categories c ON c.id = p.category_id
       WHERE ${where.replace(/\b(title|excerpt|tags)\b/g, 'p.$1')}
       ORDER BY ${def.order.replace(/\b(published_at|id)\b/g, 'p.$1')}`
    : def.table === 'categories'
      ? `SELECT c.*, (SELECT COUNT(*)::int FROM posts p WHERE p.category_id = c.id) AS post_count
         FROM categories c WHERE ${where} ORDER BY ${def.order}`
      : `SELECT * FROM ${def.table} WHERE ${where} ORDER BY ${def.order}`;

  const rows = await withSchema(() => sql.unsafe<Row[]>(
    `${select} LIMIT ${perPage} OFFSET ${offset}`, params as never[]));

  return { rows, total, pages: Math.max(1, Math.ceil(total / perPage)), page };
}

export async function findRow(def: ResourceDef, id: number): Promise<Row | null> {
  const rows = await sql.unsafe<Row[]>(`SELECT * FROM ${def.table} WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

/** A blank record filled with each field's default. */
export function blankRow(def: ResourceDef): Row {
  const row: Row = { id: 0 };
  for (const [name, field] of Object.entries(def.fields)) {
    row[name] = field.default ?? (field.type === 'checkbox' ? false : '');
  }
  return row;
}

export type SaveResult =
  | { ok: true; id: number }
  | { ok: false; errors: Record<string, string>; values: Row };

/** Read one form field into the shape its column expects. */
async function readField(
  name: string, field: Field, formData: FormData, existing: Row | null, table: string, id: number,
): Promise<{ value: unknown; error?: string }> {
  const raw = formData.get(name);

  switch (field.type) {
    case 'checkbox':
      return { value: raw !== null && raw !== '' };

    case 'number':
    case 'range': {
      let n = Number.parseInt(String(raw ?? field.default ?? 0), 10);
      if (!Number.isFinite(n)) n = Number(field.default ?? 0);
      if (field.min !== undefined) n = Math.max(field.min, n);
      if (field.max !== undefined) n = Math.min(field.max, n);
      return { value: n };
    }

    case 'select': {
      const text = String(raw ?? '');
      if (name === 'category_id') return { value: text === '' ? null : Number(text) };
      if (field.options && field.options !== 'categories') {
        const keys = Object.keys(field.options);
        return { value: keys.includes(text) ? text : (field.default ?? keys[0]) };
      }
      return { value: text };
    }

    case 'image':
    case 'file': {
      // The browser uploads straight to Blob and posts back the resulting URL,
      // so nothing larger than a few hundred bytes reaches this action.
      const next = acceptMediaUrl(String(formData.get(`${name}_url`) ?? ''));
      const previous = String(existing?.[name] ?? '');
      if (previous && previous !== next) {
        await deleteUpload(previous);
      }
      return { value: next };
    }

    case 'dimensions': {
      // Written by the uploader, not by a person.
      return { value: Math.max(0, Number(formData.get(name) ?? 0) || 0) };
    }

    case 'url': {
      const text = normalizeUrl(String(raw ?? ''));
      if (text && !/^https?:\/\//i.test(text)) {
        return { value: text, error: 'That does not look like a valid web address.' };
      }
      return { value: text };
    }

    case 'date':
    case 'datetime': {
      const text = String(raw ?? '').trim();
      return { value: text === '' ? null : text };
    }

    case 'richtext':
      return { value: sanitizeHtml(String(raw ?? '')) };

    case 'slug': {
      const text = String(raw ?? '').trim();
      const source = text || String(formData.get(field.from ?? 'title') ?? '');
      return { value: await uniqueSlug(table, slugify(source, table), id || undefined) };
    }

    default:
      return { value: String(raw ?? '').trim() };
  }
}

/** Validate a submitted form and write it. */
export async function saveRow(
  resource: string, id: number, formData: FormData, authorId: number,
): Promise<SaveResult> {
  const def = getResource(resource);
  if (!def) return { ok: false, errors: { _: 'Unknown content type.' }, values: {} };

  const existing = id > 0 ? await findRow(def, id) : null;
  const errors: Record<string, string> = {};
  const data: Row = {};

  for (const [name, field] of Object.entries(def.fields)) {
    const { value, error } = await readField(name, field, formData, existing, def.table, id);
    data[name] = value;
    if (error) errors[name] = error;
    if (field.required && (value === '' || value === null || value === undefined)) {
      errors[name] = `${field.label} is required.`;
    }
  }

  // A resource with a dimensions field stores the size the uploader measured.
  if (Object.values(def.fields).some((f) => f.type === 'dimensions')) {
    data.width = Math.max(0, Number(formData.get('width') ?? 0) || 0);
    data.height = Math.max(0, Number(formData.get('height') ?? 0) || 0);
    delete data.dimensions;
  }

  // Posts carry author, timestamps and a publish date of their own.
  if (def.table === 'posts') {
    if (!data.excerpt || String(data.excerpt).trim() === '') {
      data.excerpt = excerptOf(String(data.content ?? ''), 28);
    }
    if (data.status === 'published' && !data.published_at) {
      data.published_at = new Date().toISOString();
    }
    data.updated_at = new Date().toISOString();
    if (id === 0) data.author_id = authorId;
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, values: { ...(existing ?? blankRow(def)), ...data, id } };
  }

  if (id > 0) {
    const columns = Object.keys(data);
    await sql`UPDATE ${sql(def.table)} SET ${sql(data as never, ...columns)} WHERE id = ${id}`;
    return { ok: true, id };
  }

  const inserted = await sql<{ id: number }[]>`
    INSERT INTO ${sql(def.table)} ${sql(data as never, ...Object.keys(data))} RETURNING id`;
  return { ok: true, id: inserted[0].id };
}

export async function deleteRow(resource: string, id: number): Promise<boolean> {
  const def = getResource(resource);
  if (!def) return false;

  const row = await findRow(def, id);
  if (!row) return false;

  // Clean up any files this record owned.
  for (const [name, field] of Object.entries(def.fields)) {
    if ((field.type === 'image' || field.type === 'file') && row[name]) {
      await deleteUpload(row[name] as string);
    }
  }

  await sql.unsafe(`DELETE FROM ${def.table} WHERE id = $1`, [id]);
  return true;
}

export async function toggleRow(resource: string, id: number, column: string): Promise<void> {
  const def = getResource(resource);
  if (!def) return;
  // Only a column this resource actually declares may be toggled.
  if (!Object.prototype.hasOwnProperty.call(def.fields, column)) return;
  await sql.unsafe(`UPDATE ${def.table} SET ${column} = NOT ${column} WHERE id = $1`, [id]);
}
