'use client';

import { useState } from 'react';
import { subscribeAction } from '@/app/actions';
import TechIcon from './TechIcon';

/** The email signup, saving to the same subscriber list as the main site. */
export default function TechNewsletter({
  title, text, placeholder, button, note,
}: { title: string; text: string; placeholder: string; button: string; note: string }) {
  const [message, setMessage] = useState(note);
  const [state, setState] = useState<'idle' | 'busy' | 'ok' | 'error'>('idle');

  async function onSubmit(formData: FormData) {
    setState('busy');
    const result = await subscribeAction(formData);
    setState(result.ok ? 'ok' : 'error');
    setMessage(result.message);
  }

  return (
    <section className="st-news">
      <div className="st-frame st-news-grid">
        <span className="st-cross st-cross-tl" aria-hidden="true" />
        <span className="st-cross st-cross-tr" aria-hidden="true" />
        <div className="st-news-copy">
          <h2>{title}</h2>
          <p>{text}</p>
        </div>
        <form className="st-news-form" action={onSubmit}>
          <input type="text" name="website" className="st-hp" tabIndex={-1} autoComplete="off" aria-hidden="true" />
          <div className="st-news-row">
            <input type="email" name="email" placeholder={placeholder} required aria-label={placeholder} />
            <button className="st-btn st-btn-light" type="submit" disabled={state === 'busy'}>
              {button} <TechIcon name="arrow-right" />
            </button>
          </div>
          <p className={`st-mono st-news-note${state === 'error' ? ' is-error' : ''}`} role="status">{message}</p>
        </form>
      </div>
    </section>
  );
}
