'use client';

import { useActionState } from 'react';
import { updateAccountAction, type FormState } from '../actions';

export default function AccountForms({ name, email }: { name: string; email: string }) {
  const [details, detailsAction, detailsPending] =
    useActionState<FormState, FormData>(updateAccountAction, null);
  const [password, passwordAction, passwordPending] =
    useActionState<FormState, FormData>(updateAccountAction, null);

  const detailErrors = details?.errors ?? {};
  const passwordErrors = password?.errors ?? {};

  return (
    <>
      <div className="page-head">
        <div>
          <h2>My account</h2>
          <p className="muted">Your sign-in details. Changing your email changes what you log in with.</p>
        </div>
      </div>

      <div className="split-layout">
        <section className="form-panel">
          <div className="panel-head"><h3>Details</h3></div>
          {details && <div className={`alert alert-${details.ok ? 'success' : 'error'}`}>{details.message}</div>}

          <form action={detailsAction} className="admin-form" noValidate>
            <input type="hidden" name="form" value="details" />
            <div className={`field${detailErrors.name ? ' has-error' : ''}`}>
              <label htmlFor="a-name">Name</label>
              <input type="text" id="a-name" name="name" defaultValue={name} required />
              {detailErrors.name && <p className="field-error">{detailErrors.name}</p>}
            </div>
            <div className={`field${detailErrors.email ? ' has-error' : ''}`}>
              <label htmlFor="a-email">Email</label>
              <input type="email" id="a-email" name="email" defaultValue={email} required />
              {detailErrors.email && <p className="field-error">{detailErrors.email}</p>}
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" type="submit" disabled={detailsPending}>
                {detailsPending ? 'Saving…' : 'Save details'}
              </button>
            </div>
          </form>
        </section>

        <section className="form-panel">
          <div className="panel-head"><h3>Change password</h3></div>
          {password && <div className={`alert alert-${password.ok ? 'success' : 'error'}`}>{password.message}</div>}

          <form action={passwordAction} className="admin-form" noValidate>
            <input type="hidden" name="form" value="password" />
            <div className={`field${passwordErrors.current_password ? ' has-error' : ''}`}>
              <label htmlFor="a-cur">Current password</label>
              <input type="password" id="a-cur" name="current_password" required autoComplete="current-password" />
              {passwordErrors.current_password && <p className="field-error">{passwordErrors.current_password}</p>}
            </div>
            <div className={`field${passwordErrors.new_password ? ' has-error' : ''}`}>
              <label htmlFor="a-new">New password <small>(10 characters or more)</small></label>
              <input type="password" id="a-new" name="new_password" required autoComplete="new-password" />
              {passwordErrors.new_password && <p className="field-error">{passwordErrors.new_password}</p>}
            </div>
            <div className={`field${passwordErrors.confirm_password ? ' has-error' : ''}`}>
              <label htmlFor="a-con">Repeat the new password</label>
              <input type="password" id="a-con" name="confirm_password" required autoComplete="new-password" />
              {passwordErrors.confirm_password && <p className="field-error">{passwordErrors.confirm_password}</p>}
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" type="submit" disabled={passwordPending}>
                {passwordPending ? 'Saving…' : 'Change password'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </>
  );
}
