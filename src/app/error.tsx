'use client';

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="section error-page">
      <div className="container narrow">
        <p className="error-code">500</p>
        <h1>Something went wrong</h1>
        <p>An unexpected error stopped this page from loading. Please try again in a moment.</p>
        <div className="detail-actions">
          <button className="btn btn-primary" type="button" onClick={reset}>Try again</button>
          <a className="btn btn-ghost" href="/">Back to home</a>
        </div>
      </div>
    </section>
  );
}
