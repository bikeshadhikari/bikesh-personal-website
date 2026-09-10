'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { uploadMedia } from '@/lib/client-upload';
import { mediaDeleteAction, refreshMediaAction } from '../actions';
import { ConfirmButton } from '@/components/admin/ShellClient';
import Icon from '@/components/Icon';
import { formatDate } from '@/lib/utils';
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
        const absolute = url.startsWith('/') ? `${window.location.origin}${url}` : url;
        try { await navigator.clipboard.writeText(absolute); } catch { /* no clipboard */ }
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? 'Copied' : 'Copy link'}
    </button>
  );
}

export default function MediaManager({
  files, error,
}: { files: MediaItem[]; error: string | null }) {
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

    let done = 0;
    for (const file of Array.from(list)) {
      setBusy(file.name);
      setProgress(0);
      try {
        await uploadMedia(folder, file, setProgress);
        done++;
      } catch (err) {
        setBusy(null);
        setMessage({
          ok: false,
          text: err instanceof Error ? err.message : `Could not upload ${file.name}.`,
        });
        break;
      }
    }

    setBusy(null);
    if (done > 0) {
      setMessage((current) => current ?? {
        ok: true,
        text: done === 1 ? 'File uploaded.' : `${done} files uploaded.`,
      });
      startTransition(async () => {
        await refreshMediaAction();
        router.refresh();
      });
    }
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

      {error && <div className="alert alert-error">Could not read the library: {error}</div>}
      {message && <div className={`alert alert-${message.ok ? 'success' : 'error'}`}>{message.text}</div>}

      <div className="form-panel upload-panel">
        <div className="field-grid">
          <div className="field field-half">
            <label htmlFor="m-file">Upload files</label>
            <input
              type="file" id="m-file" multiple disabled={Boolean(busy)}
              onChange={(e) => { void uploadFiles(e.target.files); e.target.value = ''; }}
            />
            <p className="field-hint">
              Photos are resized automatically before uploading, so pictures straight off a phone
              are fine. They upload as soon as you choose them.
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
          {files.map((file) => (
            <figure className="media-item" key={file.id}>
              <div className="media-thumb">
                {file.mime.startsWith('image/')
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={file.url} alt={file.filename} loading="lazy" />
                  : <span><Icon name="download" /></span>}
              </div>
              <figcaption>
                <strong title={file.filename}>{file.filename}</strong>
                <small>
                  {humanSize(file.size)} · {file.folder} ·{' '}
                  {formatDate(file.createdAt)}
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
          ))}
        </div>
      )}
    </>
  );
}
