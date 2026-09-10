'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { deleteUserAction, saveUserAction, type FormState } from '../actions';
import { ConfirmButton } from '@/components/admin/ShellClient';
import type { UserRow } from '@/lib/types';

export default function UsersScreen({
  users, editing, myId,
}: { users: UserRow[]; editing: UserRow | null; myId: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveUserAction, null);
  const errors = state?.errors ?? {};

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Users</h2>
          <p className="muted">
            Administrators can change everything. Editors can manage content but not users or settings.
          </p>
        </div>
      </div>

      <div className="split-layout">
        <section className="form-panel">
          <div className="panel-head"><h3>{editing ? 'Edit user' : 'Add a user'}</h3></div>

          {state && !state.ok && <div className="alert alert-error">{state.message}</div>}

          <form action={action} className="admin-form" noValidate key={editing?.id ?? 'new'}>
            <input type="hidden" name="id" value={editing?.id ?? 0} />

            <div className={`field${errors.name ? ' has-error' : ''}`}>
              <label htmlFor="u-name">Name</label>
              <input type="text" id="u-name" name="name" defaultValue={editing?.name ?? ''} required />
              {errors.name && <p className="field-error">{errors.name}</p>}
            </div>

            <div className={`field${errors.email ? ' has-error' : ''}`}>
              <label htmlFor="u-email">Email</label>
              <input type="email" id="u-email" name="email" defaultValue={editing?.email ?? ''} required />
              {errors.email && <p className="field-error">{errors.email}</p>}
            </div>

            <div className={`field${errors.password ? ' has-error' : ''}`}>
              <label htmlFor="u-pass">
                Password {editing && <small>(leave empty to keep the current one)</small>}
              </label>
              <input type="password" id="u-pass" name="password" autoComplete="new-password" required={!editing} />
              {errors.password && <p className="field-error">{errors.password}</p>}
            </div>

            <div className={`field${errors.role ? ' has-error' : ''}`}>
              <label htmlFor="u-role">Role</label>
              <select id="u-role" name="role" defaultValue={editing?.role ?? 'editor'}>
                <option value="editor">Editor</option>
                <option value="admin">Administrator</option>
              </select>
              {errors.role && <p className="field-error">{errors.role}</p>}
            </div>

            <label className="checkbox">
              <input type="checkbox" name="is_active" value="1" defaultChecked={editing ? editing.is_active : true} />
              <span>Account is active</span>
            </label>

            <div className="form-actions">
              <button className="btn btn-primary" type="submit" disabled={pending}>
                {pending ? 'Saving…' : editing ? 'Save user' : 'Create user'}
              </button>
              {editing && <Link className="btn btn-link" href="/admin/users">Cancel</Link>}
            </div>
          </form>
        </section>

        <section className="form-panel">
          <div className="panel-head"><h3>All users</h3></div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Name</th><th>Role</th><th>Last signed in</th><th className="actions-col" /></tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <strong>{u.name}</strong>
                      {u.id === myId && <span className="chip chip-soft">you</span>}
                      <br /><small className="muted">{u.email}</small>
                    </td>
                    <td>
                      <span className={`status status-${u.role === 'admin' ? 'published' : 'draft'}`}>{u.role}</span>
                      {!u.is_active && <><br /><small className="muted">inactive</small></>}
                    </td>
                    <td>
                      <small className="muted">
                        {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString('en-GB') : 'never'}
                      </small>
                    </td>
                    <td className="actions-col">
                      <div className="row-actions">
                        <Link className="btn btn-ghost btn-xs" href={`/admin/users?edit=${u.id}`}>Edit</Link>
                        {u.id !== myId && (
                          <form action={deleteUserAction} className="inline-form">
                            <input type="hidden" name="id" value={u.id} />
                            <ConfirmButton message="Delete this user? Their posts stay, but lose their author.">
                              Delete
                            </ConfirmButton>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
