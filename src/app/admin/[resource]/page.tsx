import { notFound } from 'next/navigation';
import Shell from '@/components/admin/Shell';
import ResourceList from '@/components/admin/ResourceList';
import { getResource } from '@/lib/resources';
import { listRows } from '@/lib/crud';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ resource: string }>;
  searchParams: Promise<{ search?: string; p?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { resource } = await params;
  return { title: getResource(resource)?.label ?? 'Not found' };
}

export default async function ResourceIndexPage({ params, searchParams }: Props) {
  const [{ resource }, { search = '', p }] = await Promise.all([params, searchParams]);
  const def = getResource(resource);
  if (!def) notFound();

  const data = await listRows(def, search, Math.max(1, Number(p) || 1));

  return (
    <Shell title={def.label} current={resource}>
      <ResourceList resource={resource} def={def} data={data} search={search} />
    </Shell>
  );
}
