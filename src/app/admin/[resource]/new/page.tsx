import { notFound } from 'next/navigation';
import Shell from '@/components/admin/Shell';
import ResourceForm from '@/components/admin/ResourceForm';
import { getResource } from '@/lib/resources';
import { blankRow } from '@/lib/crud';
import { pageChoices } from '@/lib/menu';
import { relationChoices } from '@/lib/relations';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ resource: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props) {
  const { resource } = await params;
  const def = getResource(resource);
  return { title: def ? `New ${def.singular.toLowerCase()}` : 'Not found' };
}

export default async function NewResourcePage({ params, searchParams }: Props) {
  const [{ resource }, query] = await Promise.all([params, searchParams]);
  const def = getResource(resource);
  if (!def) notFound();

  const needsPages = Object.values(def.fields).some((f) => f.type === 'pages');
  const [pages, relations] = await Promise.all([
    needsPages ? pageChoices() : Promise.resolve([]),
    relationChoices(def),
  ]);

  // A dropdown that points at another record can be preset from the address,
  // e.g. /admin/tech_blocks/new?link_id=4 from a post's "Add a copy block".
  const record = blankRow(def);
  for (const [name, field] of Object.entries(def.fields)) {
    const preset = query[name];
    if (typeof field.options === 'string' && typeof preset === 'string' && /^\d+$/.test(preset)) {
      record[name] = preset;
    }
  }

  return (
    <Shell title={`New ${def.singular.toLowerCase()}`} current={resource}>
      <ResourceForm
        resource={resource}
        def={def}
        record={record}
        isEdit={false}
        categoryOptions={relations.categories ?? []}
        pageOptions={pages}
        sectionOptions={relations.political_sections ?? []}
        relationOptions={relations}
      />
    </Shell>
  );
}
