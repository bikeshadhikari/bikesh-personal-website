'use client';

import { useActionState } from 'react';
import { loginAction, type FormState } from '../actions';

export default function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, null);

  return (
    <form action={action} noValidate>
      <input type="hidden" name="next" value={next} />
      {state && !state.ok && <p className="alert alert-error">{state.message}</p>}

      <div className="field">
        <label htmlFor="l-email">Email</label>
        <input type="email" id="l-email" name="email" required autoFocus autoComplete="username" />
      </div>
      <div className="field">
        <label htmlFor="l-pass">Password</label>
        <input type="password" id="l-pass" name="password" required autoComplete="current-password" />
      </div>

      <button className="btn btn-primary btn-block" type="submit" disabled={pending}>
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
