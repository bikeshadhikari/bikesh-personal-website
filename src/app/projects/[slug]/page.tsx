import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import SiteShell from '@/components/site/SiteShell';
import { Projects, SectionHead } from '@/components/site/blocks';
import { menuEnabled } from '@/lib/menu';
import { getProject, getProjects } from '@/lib/content';
import { csvList, excerptOf, sanitizeHtml } from '@/lib/utils';
import Icon from '@/components/Icon';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return { title: 'Project not found' };
  return {
    title: project.title,
    description: excerptOf(project.summary, 30),
    openGraph: { images: project.image ? [project.image] : undefined },
  };
}

export default async function ProjectPage({ params }: Props) {
  if (!(await menuEnabled('projects'))) notFound();

  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();

  const tech = csvList(project.tech);
  const more = (await getProjects()).filter((p) => p.id !== project.id).slice(0, 3);

  return (
    <SiteShell current="projects">
      <article className="section project-detail">
        <div className="container narrow">
          <p className="breadcrumb">
            <Link href="/projects">Projects</Link> <span>/</span> {project.title}
          </p>
          <h1>{project.title}</h1>
          <p className="lead">{project.summary}</p>

          <ul className="detail-meta">
            {project.category && <li><strong>Type</strong><span>{project.category}</span></li>}
            {project.year && <li><strong>Year</strong><span>{project.year}</span></li>}
            {project.client && <li><strong>Client</strong><span>{project.client}</span></li>}
            {tech.length > 0 && <li><strong>Built with</strong><span>{tech.join(', ')}</span></li>}
          </ul>

          {project.image && (
            <figure className="detail-figure">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={project.image} alt={project.title} />
            </figure>
          )}

          {project.description.trim() && (
            <div className="prose" dangerouslySetInnerHTML={{ __html: sanitizeHtml(project.description) }} />
          )}

          <div className="detail-actions">
            {project.live_url && (
              <a className="btn btn-primary" href={project.live_url} target="_blank" rel="noopener noreferrer">
                Visit the site <Icon name="external" className="icon icon-sm" />
              </a>
            )}
            {project.repo_url && (
              <a className="btn btn-ghost" href={project.repo_url} target="_blank" rel="noopener noreferrer">
                <Icon name="github" className="icon icon-sm" /> Source
              </a>
            )}
            <Link className="btn btn-link" href="/projects">Back to all projects</Link>
          </div>
        </div>
      </article>

      {more.length > 0 && (
        <section className="section section-alt">
          <div className="container">
            <SectionHead eyebrow="Keep looking" heading="Other projects" />
            <Projects items={more} />
          </div>
        </section>
      )}
    </SiteShell>
  );
}
