'use client';

import { useActionState, useState } from 'react';
import { mediaDeleteAction, mediaUploadAction, type FormState } from '../actions';
import { ConfirmButton } from '@/components/admin/ShellClient';
import Icon from '@/components/Icon';
import type { MediaItem } from '@/lib/upload';

function humanSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) { value /= 1024; i++; }
  return `${i === 0 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
}

function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="btn btn-ghost btn-xs"
      type="button"
      onClick={async () => {
        try { await navigator.clipboard.writeText(url); } catch { /* no clipboard */ }
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? 'Copied' : 'Copy link'}
    </button>
  );
}

export default function MediaManager({ files, ready }: { files: MediaItem[]; ready: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(mediaUploadAction, null);
  const total = files.reduce((sum, f) => sum + f.size, 0);

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Media library</h2>
          <p className="muted">
            {files.length} {files.length === 1 ? 'file' : 'files'}, {humanSize(total)} in total.
            Copy a link to reuse an image anywhere.
          </p>
        </div>
      </div>

      {!ready ? (
        <div className="panel panel-notice">
          <h3><Icon name="eye" className="icon icon-sm" /> File storage is not connected</h3>
          <p>
            In your Vercel project open <strong>Storage</strong>, create a <strong>Blob</strong> store
            and connect it to this project. Vercel sets <code>BLOB_READ_WRITE_TOKEN</code> for you.
            Redeploy afterwards and uploads will work everywhere in the dashboard.
          </p>
          <p className="muted">
            Until then, image fields accept a pasted link to a picture hosted elsewhere.
          </p>
        </div>
      ) : (
        <>
          {state && <div className={`alert alert-${state.ok ? 'success' : 'error'}`}>{state.message}</div>}

          <form className="form-panel upload-panel" action={action}>
            <div className="field-grid">
              <div className="field field-half">
                <label htmlFor="m-file">Upload a file</label>
                <input type="file" id="m-file" name="file" required />
                <p className="field-hint">Images, PDFs and documents up to 5 MB.</p>
              </div>
              <div className="field field-half">
                <label htmlFor="m-folder">Put it in</label>
                <select id="m-folder" name="folder" defaultValue="media">
                  <option value="media">General</option>
                  <option value="posts">Blog covers</option>
                  <option value="projects">Project images</option>
                  <option value="profile">Profile</option>
                  <option value="documents">Documents</option>
                </select>
              </div>
            </div>
            <button className="btn btn-primary" type="submit" disabled={pending}>
              {pending ? 'Uploading…' : 'Upload'}
            </button>
          </form>

          {files.length === 0 ? (
            <div className="empty-panel">
              <p><strong>Nothing uploaded yet.</strong></p>
              <p className="muted">Files you attach to posts, projects and your profile all appear here.</p>
            </div>
          ) : (
            <div className="media-grid">
              {files.map((file) => {
                const isImage = /\.(jpe?g|png|gif|webp|svg|avif|ico)(\?|$)/i.test(file.pathname);
                return (
                  <figure className="media-item" key={file.url}>
                    <div className="media-thumb">
                      {isImage
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={file.url} alt={file.pathname} loading="lazy" />
                        : <span><Icon name="download" /></span>}
                    </div>
                    <figcaption>
                      <strong title={file.pathname}>{file.pathname.split('/').pop()}</strong>
                      <small>{humanSize(file.size)} · {file.uploadedAt.toLocaleDateString('en-GB')}</small>
                      <div className="media-actions">
                        <CopyButton url={file.url} />
                        <a className="btn btn-ghost btn-xs" href={file.url} target="_blank" rel="noopener noreferrer">Open</a>
                        <form action={mediaDeleteAction} className="inline-form">
                          <input type="hidden" name="url" value={file.url} />
                          <ConfirmButton message="Delete this file? Anything using it will show a broken image.">
                            Delete
                          </ConfirmButton>
                        </form>
                      </div>
                    </figcaption>
                  </figure>
                );
              })}
            </div>
          )}
        </>
      )}
    </>
  );
}
