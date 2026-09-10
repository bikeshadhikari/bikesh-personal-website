import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { hasAnyUser, isInstalled } from '@/lib/db';
import SetupForm from './SetupForm';
import '@/styles/admin.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Set up', robots: { index: false, follow: false } };

export default async function SetupPage() {
  if ((await isInstalled()) && (await hasAnyUser())) redirect('/admin');

  const checks: [string, boolean][] = [
    ['Database connection string is set', Boolean(process.env.DATABASE_URL)],
    ['Session secret is set', Boolean(process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 16)],
    ['Setup key is set', Boolean(process.env.SETUP_SECRET)],
  ];

  return (
    <main className="auth-card install-card">
      <span className="brand-mark" aria-hidden="true">B</span>
      <h1>Set up your website</h1>
      <p className="auth-sub">
        This creates the database tables, loads the starting content and makes your
        administrator account. It runs once.
      </p>

      <ul className="check-list">
        {checks.map(([label, ok]) => (
          <li key={label} className={ok ? 'is-ok' : 'is-bad'}>
            <span aria-hidden="true">{ok ? '✓' : '✕'}</span>{label}
          </li>
        ))}
      </ul>

      <SetupForm />
    </main>
  );
}
