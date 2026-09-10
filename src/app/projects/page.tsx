import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import SiteShell from '@/components/site/SiteShell';
import { PageHero, Projects } from '@/components/site/blocks';
import { menuEnabled } from '@/lib/menu';
import { getProjectCategories, getProjects } from '@/lib/content';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Selected web systems, portals and programmes.',
};

export default async function ProjectsPage({
  searchParams,
}: { searchParams: Promise<{ category?: string }> }) {
  if (!(await menuEnabled('projects'))) notFound();

  const { category = '' } = await searchParams;
  const [all, categories] = await Promise.all([getProjects(), getProjectCategories()]);
  const projects = category ? all.filter((p) => p.category === category) : all;

  return (
    <SiteShell current="projects">
      <PageHero
        eyebrow="Portfolio"
        heading="Projects"
        sub="Web systems, portals and programmes I have designed, built or run."
      />

      <section className="section">
        <div className="container">
          {categories.length > 0 && (
            <div className="filter-bar">
              <Link className={`filter-chip${category === '' ? ' is-active' : ''}`} href="/projects">All</Link>
              {categories.map((c) => (
                <Link
                  key={c}
                  className={`filter-chip${category === c ? ' is-active' : ''}`}
                  href={`/projects?category=${encodeURIComponent(c)}`}
                >
                  {c}
                </Link>
              ))}
            </div>
          )}

          {projects.length > 0
            ? <Projects items={projects} />
            : <p className="empty-state">No projects in this category yet.</p>}
        </div>
      </section>
    </SiteShell>
  );
}
