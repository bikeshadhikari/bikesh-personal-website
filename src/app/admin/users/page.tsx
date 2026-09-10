import { redirect } from 'next/navigation';
import Shell from '@/components/admin/Shell';
import UsersScreen from './UsersScreen';
import { currentUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import type { UserRow } from '@/lib/types';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Users' };

export default async function UsersPage({
  searchParams,
}: { searchParams: Promise<{ edit?: string }> }) {
  const me = await currentUser();
  if (me?.role !== 'admin') redirect('/admin');

  const { edit } = await searchParams;
  const users = await sql<UserRow[]>`SELECT * FROM users ORDER BY id ASC`;
  const editing = edit ? users.find((u) => u.id === Number(edit)) ?? null : null;

  return (
    <Shell title="Users" current="users">
      <UsersScreen users={users} editing={editing} myId={me.id} />
    </Shell>
  );
}
