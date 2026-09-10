'use client';

import { useActionState } from 'react';
import { runSetup, type SetupResult } from './actions';

export default function SetupForm() {
  const [state, action, pending] = useActionState<SetupResult | null, FormData>(runSetup, null);
  const errors = state?.errors ?? {};

  return (
    <form action={action} noValidate>
      {state && !state.ok && Object.keys(errors).length === 0 && (
        <p className="alert alert-error">{state.message}</p>
      )}

      <div className={`field${errors.name ? ' has-error' : ''}`}>
        <label htmlFor="s-name">Your full name</label>
        <input type="text" id="s-name" name="name" defaultValue="Bikesh Adhikari" required />
        {errors.name && <p className="field-error">{errors.name}</p>}
      </div>

      <div className={`field${errors.email ? ' has-error' : ''}`}>
        <label htmlFor="s-email">Email <small>(this is your login)</small></label>
        <input type="email" id="s-email" name="email" required autoComplete="username" />
        {errors.email && <p className="field-error">{errors.email}</p>}
      </div>

      <div className={`field${errors.password ? ' has-error' : ''}`}>
        <label htmlFor="s-pass">Password <small>(10 characters or more)</small></label>
        <input type="password" id="s-pass" name="password" required autoComplete="new-password" />
        {errors.password && <p className="field-error">{errors.password}</p>}
      </div>

      <div className={`field${errors.password_confirm ? ' has-error' : ''}`}>
        <label htmlFor="s-pass2">Repeat the password</label>
        <input type="password" id="s-pass2" name="password_confirm" required autoComplete="new-password" />
        {errors.password_confirm && <p className="field-error">{errors.password_confirm}</p>}
      </div>

      <div className={`field${errors.secret ? ' has-error' : ''}`}>
        <label htmlFor="s-secret">Setup key</label>
        <input type="password" id="s-secret" name="secret" required
               placeholder="The SETUP_SECRET from your environment variables" />
        {errors.secret && <p className="field-error">{errors.secret}</p>}
      </div>

      <button className="btn btn-primary btn-block" type="submit" disabled={pending}>
        {pending ? 'Setting up…' : 'Install now'}
      </button>
    </form>
  );
}
