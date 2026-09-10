'use client';

import { useState } from 'react';
import { subscribeAction } from '@/app/actions';

export default function Newsletter() {
  const [note, setNote] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'ok' | 'error'>('idle');

  async function onSubmit(formData: FormData) {
    setState('busy');
    setNote('Sending…');
    const result = await subscribeAction(formData);
    setState(result.ok ? 'ok' : 'error');
    setNote(result.message);
  }

  return (
    <section className="newsletter">
      <div className="container newsletter-inner">
        <div>
          <h2>Occasional notes, no noise</h2>
          <p>New articles on IT education, building for the web and working in technology in Nepal. Nothing else.</p>
        </div>
        <form className="newsletter-form" action={onSubmit}>
          <input type="text" name="website" className="hp-field" tabIndex={-1} autoComplete="off" aria-hidden="true" />
          <label className="visually-hidden" htmlFor="newsletterEmail">Email address</label>
          <input type="email" id="newsletterEmail" name="email" placeholder="you@example.com" required />
          <button className="btn btn-primary" type="submit" disabled={state === 'busy'}>Subscribe</button>
          <p className={`form-note${state === 'ok' ? ' is-ok' : state === 'error' ? ' is-error' : ''}`} role="status">
            {note}
          </p>
        </form>
      </div>
    </section>
  );
}
