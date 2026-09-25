'use client';

import { useActionState } from 'react';
import type { ActionState } from '@/app/admin/play-nepali-congress-quiz/actions';

const EMPTY: ActionState = { ok: false, message: '' };

type Action = (state: ActionState, form: FormData) => Promise<ActionState>;

/** Whatever an action came back with, shown the same way every time. */
function Report({ state }: { state: ActionState }) {
  if (!state.message) return null;
  return (
    <div className={`quiz-report${state.ok ? ' is-ok' : ' is-bad'}`} role="status">
      <p>{state.message}</p>
      {state.detail && state.detail.length > 0 && (
        <ul>{state.detail.map((line, i) => <li key={i}>{line}</li>)}</ul>
      )}
    </div>
  );
}

/** A form whose action reports back in place. */
export function ActionForm({
  action, children, submitLabel, encType,
}: {
  action: Action; children: React.ReactNode; submitLabel: string;
  encType?: string;
}) {
  const [state, run, pending] = useActionState(action, EMPTY);
  return (
    <form action={run} encType={encType} className="quiz-form">
      {children}
      <div className="quiz-form-foot">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? 'Working…' : submitLabel}
        </button>
      </div>
      <Report state={state} />
    </form>
  );
}

/** The import tab: check first, then write. */
export function ImportForms({ reviewAction, importAction: runImport }: {
  reviewAction: Action; importAction: Action;
}) {
  const [checkState, check, checking] = useActionState(reviewAction, EMPTY);
  const [importState, write, writing] = useActionState(runImport, EMPTY);

  return (
    <>
      <form action={check} className="quiz-form">
        <div className="field">
          <label htmlFor="quiz-csv">CSV file</label>
          <input id="quiz-csv" type="file" name="file" accept=".csv,text/csv" required />
          <p className="hint">
            Columns: question_id, question, option_a–option_d, correct_option, difficulty,
            category, explanation, source, source_url, active, verified_date, content_type.
            A row is refused if an option is blank, two options are identical, the correct
            option is not A–D, or the explanation names a different answer.
          </p>
        </div>
        <div className="quiz-form-foot">
          <button type="submit" className="btn btn-ghost" disabled={checking}>
            {checking ? 'Checking…' : 'Check the file'}
          </button>
        </div>
        <Report state={checkState} />
      </form>

      <form action={write} className="quiz-form">
        <div className="field">
          <label htmlFor="quiz-csv-go">Import</label>
          <input id="quiz-csv-go" type="file" name="file" accept=".csv,text/csv" required />
          <p className="hint">
            Valid rows are written; a question id already in the bank is updated rather than
            doubled. Refused rows are listed and skipped.
          </p>
        </div>
        <div className="quiz-form-foot">
          <button type="submit" className="btn btn-primary" disabled={writing}>
            {writing ? 'Importing…' : 'Import valid questions'}
          </button>
        </div>
        <Report state={importState} />
      </form>
    </>
  );
}
