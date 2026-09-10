import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import Shell from '@/components/admin/Shell';
import MenusForm from './MenusForm';
import { getMenus } from '@/lib/menu';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Menus & sections' };

export default async function MenusPage() {
  if ((await currentUser())?.role !== 'admin') redirect('/admin');
  const menus = await getMenus();

  return (
    <Shell title="Menus & sections" current="menus">
      <MenusForm
        pages={menus.filter((m) => m.kind === 'page')}
        sections={menus.filter((m) => m.kind === 'section')}
      />
    </Shell>
  );
}
