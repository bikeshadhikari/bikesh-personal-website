import Shell from '@/components/admin/Shell';
import AccountForms from './AccountForms';
import { currentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'My account' };

export default async function AccountPage() {
  const user = await currentUser();
  return (
    <Shell title="My account" current="account">
      <AccountForms name={user?.name ?? ''} email={user?.email ?? ''} />
    </Shell>
  );
}
