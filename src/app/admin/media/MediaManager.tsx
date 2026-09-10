'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { uploadToBlob } from '@/lib/client-upload';
import { mediaDeleteAction, refreshMediaAction } from '../actions';
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

export default function MediaManager({
  files, ready, error,
}: { files: MediaItem[]; ready: boolean; error: string | null }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [folder, setFolder] = useState('media');
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const total = files.reduce((sum, f) => sum + f.size, 0);

  async function uploadFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    setMessage(null);

    for (const file of Array.from(list)) {
      setBusy(file.name);
      setProgress(0);
      try {
        await uploadToBlob(folder, file, setProgress);
      } catch (err) {
        setBusy(null);
        setMessage({
          ok: false,
          text: err instanceof Error ? err.message : `Could not upload ${file.name}.`,
        });
        return;
      }
    }

    setBusy(null);
    setMessage({ ok: true, text: list.length === 1 ? 'File uploaded.' : `${list.length} files uploaded.` });
    startTransition(async () => {
      await refreshMediaAction();
      router.refresh();
    });
  }

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

      {error && (
        <div className="alert alert-error">
          Could not reach file storage: {error}
        </div>
      )}

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
          {message && (
            <div className={`alert alert-${message.ok ? 'success' : 'error'}`}>{message.text}</div>
          )}

          <div className="form-panel upload-panel">
            <div className="field-grid">
              <div className="field field-half">
                <label htmlFor="m-file">Upload files</label>
                <input
                  type="file" id="m-file" multiple disabled={Boolean(busy)}
                  onChange={(e) => { void uploadFiles(e.target.files); e.target.value = ''; }}
                />
                <p className="field-hint">
                  Images, PDFs and documents up to 10 MB each. They upload as soon as you choose
                  them — there is no separate button.
                </p>
              </div>
              <div className="field field-half">
                <label htmlFor="m-folder">Put them in</label>
                <select id="m-folder" value={folder} onChange={(e) => setFolder(e.target.value)}>
                  <option value="media">General</option>
                  <option value="posts">Blog covers</option>
                  <option value="projects">Project images</option>
                  <option value="profile">Profile</option>
                  <option value="documents">Documents</option>
                </select>
              </div>
            </div>

            {busy && (
              <div className="upload-progress" role="status">
                <span className="upload-bar"><span style={{ width: `${progress}%` }} /></span>
                <span>{progress}% · {busy}</span>
              </div>
            )}
          </div>

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
                      <small>
                        {humanSize(file.size)} · {new Date(file.uploadedAt).toLocaleDateString('en-GB')}
                      </small>
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
