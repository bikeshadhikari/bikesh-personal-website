import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: { searchParams: Promise<{ next?: string }> }) {
  if (await currentUser()) redirect('/admin');
  const { next = '/admin' } = await searchParams;

  return (
    <div className="auth-body">
      <main className="auth-card">
        <span className="brand-mark" aria-hidden="true">B</span>
        <h1>Sign in</h1>
        <p className="auth-sub">The dashboard for your website.</p>
        <LoginForm next={next.startsWith('/admin') ? next : '/admin'} />
        <p className="auth-foot"><Link href="/">← Back to the website</Link></p>
      </main>
    </div>
  );
}
