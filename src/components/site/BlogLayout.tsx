import Link from 'next/link';
import { PageHero, Pagination, PostCard } from './blocks';
import { getCategories, getTags } from '@/lib/content';
import { menuEnabled } from '@/lib/menu';
import type { Paginated, Post } from '@/lib/types';
import Icon from '../Icon';

/** Shared shell for the blog index, category, tag and search screens. */
export default async function BlogLayout({
  heading, intro, result, baseUrl, activeCategory = '', searchTerm = '',
}: {
  heading: string;
  intro?: string;
  result: Paginated<Post>;
  baseUrl: string;
  activeCategory?: string;
  searchTerm?: string;
}) {
  const [categories, tags, contactOn] = await Promise.all([
    getCategories(), getTags(), menuEnabled('contact'),
  ]);

  return (
    <>
      <PageHero eyebrow="Blog" heading={heading} sub={intro} />

      <section className="section blog-layout-wrap">
        <div className="container blog-layout">
          <div className="blog-main">
            {result.items.length > 0 ? (
              <>
                <div className="cards-grid posts-grid">
                  {result.items.map((post) => <PostCard key={post.id} post={post} />)}
                </div>
                <Pagination page={result.page} pages={result.pages} baseUrl={baseUrl} />
              </>
            ) : (
              <p className="empty-state">
                {searchTerm ? 'Nothing matched that search.' : 'No articles here yet. Check back soon.'}
              </p>
            )}
          </div>

          <aside className="blog-side">
            <div className="side-box">
              <h3>Search</h3>
              <form className="inline-search" action="/search" method="get">
                <Icon name="search" className="icon icon-sm" />
                <label className="visually-hidden" htmlFor="sideSearch">Search articles</label>
                <input
                  type="search" id="sideSearch" name="q"
                  defaultValue={searchTerm} placeholder="Type and press enter"
                />
              </form>
            </div>

            {categories.length > 0 && (
              <div className="side-box">
                <h3>Categories</h3>
                <ul className="side-list">
                  {categories.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/blog/category/${c.slug}`}
                        className={activeCategory === c.slug ? 'is-active' : undefined}
                      >
                        {c.name}<span>{c.post_count ?? 0}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {tags.length > 0 && (
              <div className="side-box">
                <h3>Tags</h3>
                <ul className="tag-cloud">
                  {tags.map(([tag]) => (
                    <li key={tag}><Link href={`/blog/tag/${encodeURIComponent(tag)}`}>#{tag}</Link></li>
                  ))}
                </ul>
              </div>
            )}

            <div className="side-box side-cta">
              <h3>Work together?</h3>
              <p>Training, a website, or a session for your college.</p>
              {contactOn && <Link className="btn btn-primary btn-sm" href="/contact">Get in touch</Link>}
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
