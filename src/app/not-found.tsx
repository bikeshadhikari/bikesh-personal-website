import Link from 'next/link';
import SiteShell from '@/components/site/SiteShell';
import { menuEnabled } from '@/lib/menu';

export const dynamic = 'force-dynamic';

export default async function NotFound() {
  const blogOn = await menuEnabled('blog');
  return (
    <SiteShell current="">
      <section className="section error-page">
        <div className="container narrow">
          <p className="error-code">404</p>
          <h1>Page not found</h1>
          <p>The page you were looking for does not exist, or it has been switched off.</p>
          <div className="detail-actions">
            <Link className="btn btn-primary" href="/">Back to home</Link>
            {blogOn && <Link className="btn btn-ghost" href="/blog">Read the blog</Link>}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
