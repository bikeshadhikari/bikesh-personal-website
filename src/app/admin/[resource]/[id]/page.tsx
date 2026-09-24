import { notFound } from 'next/navigation';
import Shell from '@/components/admin/Shell';
import ResourceForm from '@/components/admin/ResourceForm';
import { getResource } from '@/lib/resources';
import { findRow } from '@/lib/crud';
import { getCategories } from '@/lib/content';
import { pageChoices } from '@/lib/menu';

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

  const needsCategories = Object.values(def.fields).some((f) => f.options === 'categories');
  const categories = needsCategories ? await getCategories() : [];
  const needsPages = Object.values(def.fields).some((f) => f.type === 'pages');
  const pages = needsPages ? await pageChoices() : [];

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
        categoryOptions={categories.map((c) => ({ value: String(c.id), label: c.name }))}
        pageOptions={pages}
      />
    </Shell>
  );
}
