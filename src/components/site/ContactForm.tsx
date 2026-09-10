'use client';

import { useActionState } from 'react';
import { contactAction, type ActionResult } from '@/app/actions';
import Icon from '../Icon';

export default function ContactForm() {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(contactAction, null);
  const errors = state?.errors ?? {};

  return (
    <form className="contact-form" action={action} noValidate>
      <input type="text" name="website" className="hp-field" tabIndex={-1} autoComplete="off" aria-hidden="true" />

      {state?.ok && (
        <p className="alert alert-success"><Icon name="check" className="icon icon-sm" /> {state.message}</p>
      )}
      {state && !state.ok && Object.keys(errors).length === 0 && (
        <p className="alert alert-error">{state.message}</p>
      )}

      <div className="field-row">
        <div className="field">
          <label htmlFor="cf-name">Your name <span aria-hidden="true">*</span></label>
          <input type="text" id="cf-name" name="name" required />
          {errors.name && <small className="field-error">{errors.name}</small>}
        </div>
        <div className="field">
          <label htmlFor="cf-email">Email <span aria-hidden="true">*</span></label>
          <input type="email" id="cf-email" name="email" required />
          {errors.email && <small className="field-error">{errors.email}</small>}
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="cf-phone">Phone <small>(optional)</small></label>
          <input type="tel" id="cf-phone" name="phone" />
        </div>
        <div className="field">
          <label htmlFor="cf-subject">Subject</label>
          <input type="text" id="cf-subject" name="subject" placeholder="Training, project, speaking…" />
        </div>
      </div>

      <div className="field">
        <label htmlFor="cf-body">Message <span aria-hidden="true">*</span></label>
        <textarea id="cf-body" name="body" rows={6} required placeholder="Tell me what you have in mind." />
        {errors.body && <small className="field-error">{errors.body}</small>}
      </div>

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? 'Sending…' : 'Send message'} <Icon name="arrow-right" className="icon icon-sm" />
      </button>
      <p className="form-note">Your details are stored only so I can reply. They are never shared.</p>
    </form>
  );
}
