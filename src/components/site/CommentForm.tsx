'use client';

import { useActionState } from 'react';
import { commentAction, type ActionResult } from '@/app/actions';
import Icon from '../Icon';

export default function CommentForm({ postSlug }: { postSlug: string }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(commentAction, null);

  return (
    <>
      {state && (
        <p className={`alert alert-${state.ok ? 'success' : 'error'}`}>
          {state.ok && <Icon name="check" className="icon icon-sm" />} {state.message}
        </p>
      )}

      <form className="comment-form" action={action}>
        <input type="hidden" name="post_slug" value={postSlug} />
        <input type="text" name="website" className="hp-field" tabIndex={-1} autoComplete="off" aria-hidden="true" />
        <h3>Leave a comment</h3>
        <div className="field-row">
          <div className="field">
            <label htmlFor="c-name">Name <span aria-hidden="true">*</span></label>
            <input type="text" id="c-name" name="comment_name" required />
          </div>
          <div className="field">
            <label htmlFor="c-email">Email <small>(not published)</small></label>
            <input type="email" id="c-email" name="comment_email" />
          </div>
        </div>
        <div className="field">
          <label htmlFor="c-body">Comment <span aria-hidden="true">*</span></label>
          <textarea id="c-body" name="comment_body" rows={5} required />
        </div>
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? 'Posting…' : 'Post comment'}
        </button>
      </form>
    </>
  );
}
