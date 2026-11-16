import { notFound } from 'next/navigation';
import Link from 'next/link';
import Shell from '@/components/admin/Shell';
import ResourceForm from '@/components/admin/ResourceForm';
import { getResource } from '@/lib/resources';
import { findRow } from '@/lib/crud';
import { pageChoices } from '@/lib/menu';
import { relationChoices } from '@/lib/relations';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ resource: string; id: string }>;
  searchParams: Promise<{ saved?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { resource } = await params;
  const def = getResource(resource);
  return { title: def ? `Edit ${def.singular.toLowerCase()}` : 'Not found' };
}

export default async function EditResourcePage({ params, searchParams }: Props) {
  const [{ resource, id }, { saved }] = await Promise.all([params, searchParams]);
  const def = getResource(resource);
  if (!def) notFound();

  const record = await findRow(def, Number(id));
  if (!record) notFound();

  const needsPages = Object.values(def.fields).some((f) => f.type === 'pages');
  const [pages, relations] = await Promise.all([
    needsPages ? pageChoices() : Promise.resolve([]),
    relationChoices(def),
  ]);

  const viewColumn = def.list.find((c) => c.viewPath);
  const viewHref = viewColumn && record.slug ? `/${viewColumn.viewPath}/${record.slug}` : undefined;

  return (
    <Shell title={`Edit ${def.singular.toLowerCase()}`} current={resource}>
      <ResourceForm
        resource={resource}
        def={def}
        record={record}
        isEdit
        viewHref={viewHref}
        saved={saved === '1'}
        categoryOptions={relations.categories ?? []}
        pageOptions={pages}
        sectionOptions={relations.political_sections ?? []}
        relationOptions={relations}
      >
        {resource === 'tech_links' && <TechBlocksPanel linkId={Number(record.id)} />}
      </ResourceForm>
    </Shell>
  );
}

/** The copy blocks of a Simplified Tech post, listed under its form. */
async function TechBlocksPanel({ linkId }: { linkId: number }) {
  const blocks = await sql<{ id: number; title: string; label: string; body: string; enabled: boolean; sort_order: number }[]>`
    SELECT id, title, label, body, enabled, sort_order FROM tech_blocks
    WHERE link_id = ${linkId} ORDER BY sort_order ASC, id ASC`.catch(() => []);
  return (
    <section className="form-panel">
      <div className="panel-head">
        <h3>Copy blocks ({blocks.length})</h3>
        <Link className="btn btn-primary btn-sm" href={`/admin/tech_blocks/new?link_id=${linkId}`}>
          + Add a copy block
        </Link>
      </div>
      {blocks.length === 0 ? (
        <p className="muted">
          No copy blocks yet. Add one for each prompt, command or text the reader should copy.
          Each shows with a heading, an instruction and a Copy button.
        </p>
      ) : (
        <ol className="tech-block-list">
          {blocks.map((b, i) => (
            <li key={b.id}>
              <span className="mono">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <Link href={`/admin/tech_blocks/${b.id}`}><strong>{b.title || '(no heading)'}</strong></Link>
                {!b.enabled && <em className="muted"> — hidden</em>}
                <p className="muted">{b.label} · {b.body.slice(0, 120)}{b.body.length > 120 ? '…' : ''}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
      <p className="field-hint">Save the post first if you have changed it — adding a block opens a new screen.</p>
    </section>
  );
}
