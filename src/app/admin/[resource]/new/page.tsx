import { notFound } from 'next/navigation';
import Shell from '@/components/admin/Shell';
import ResourceForm from '@/components/admin/ResourceForm';
import { getResource } from '@/lib/resources';
import { blankRow } from '@/lib/crud';
import { blobConfigured } from '@/lib/upload';
import { getCategories } from '@/lib/content';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ resource: string }> };

export async function generateMetadata({ params }: Props) {
  const { resource } = await params;
  const def = getResource(resource);
  return { title: def ? `New ${def.singular.toLowerCase()}` : 'Not found' };
}

export default async function NewResourcePage({ params }: Props) {
  const { resource } = await params;
  const def = getResource(resource);
  if (!def) notFound();

  const needsCategories = Object.values(def.fields).some((f) => f.options === 'categories');
  const categories = needsCategories ? await getCategories() : [];

  return (
    <Shell title={`New ${def.singular.toLowerCase()}`} current={resource}>
      <ResourceForm
        resource={resource}
        def={def}
        record={blankRow(def)}
        isEdit={false}
        blobReady={blobConfigured()}
        categoryOptions={categories.map((c) => ({ value: String(c.id), label: c.name }))}
      />
    </Shell>
  );
}
