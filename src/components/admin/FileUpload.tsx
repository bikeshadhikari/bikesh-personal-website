'use client';

import { useRef, useState } from 'react';
import { uploadToBlob } from '@/lib/client-upload';
import Icon from '../Icon';

type Status = { kind: 'idle' | 'busy' | 'error'; message: string };

/**
 * Sends the chosen file straight from the browser to Blob storage and writes
 * the resulting URL into a hidden input, so the form itself only ever carries
 * a short string. Falls back to a pasted link when storage is not connected.
 */
export default function FileUpload({
  name, value, folder = 'media', isImage = true, ready, onUploaded,
}: {
  name: string;
  value: string;
  folder?: string;
  isImage?: boolean;
  ready: boolean;
  onUploaded?: (url: string) => void;
}) {
  const [url, setUrl] = useState(value);
  const [status, setStatus] = useState<Status>({ kind: 'idle', message: '' });
  const [progress, setProgress] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setStatus({ kind: 'busy', message: `Uploading ${file.name}…` });
    setProgress(0);
    try {
      const uploaded = await uploadToBlob(folder, file, setProgress);
      setUrl(uploaded);
      setStatus({ kind: 'idle', message: '' });
      onUploaded?.(uploaded);
      if (fileInput.current) fileInput.current.value = '';
    } catch (error) {
      setStatus({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Upload failed. Please try again.',
      });
    }
  }

  if (!ready) {
    return (
      <div className="upload-field">
        {url && <Preview url={url} isImage={isImage} onClear={() => setUrl('')} />}
        <input
          type="url" id={`f-${name}`} value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/image.jpg"
        />
        <input type="hidden" name={`${name}_url`} value={url} />
        <p className="field-hint">
          File storage is not connected yet, so paste a link instead. Add a Blob store in Vercel
          to upload files directly.
        </p>
      </div>
    );
  }

  return (
    <div className="upload-field">
      {url && <Preview url={url} isImage={isImage} onClear={() => setUrl('')} />}

      <input
        ref={fileInput}
        type="file"
        id={`f-${name}`}
        accept={isImage ? 'image/*' : undefined}
        disabled={status.kind === 'busy'}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
      <input type="hidden" name={`${name}_url`} value={url} />

      {status.kind === 'busy' && (
        <div className="upload-progress" role="status">
          <span className="upload-bar"><span style={{ width: `${progress}%` }} /></span>
          <span>{progress}%</span>
        </div>
      )}
      {status.kind === 'error' && <p className="field-error">{status.message}</p>}
      {status.kind === 'idle' && (
        <p className="field-hint">
          Up to 10 MB.{isImage ? ' JPG, PNG, WebP, GIF or SVG.' : ' Image, PDF or Word document.'}
          {' '}The file uploads as soon as you choose it, then save the form.
        </p>
      )}
    </div>
  );
}

function Preview({ url, isImage, onClear }: { url: string; isImage: boolean; onClear: () => void }) {
  return (
    <div className="upload-current">
      {isImage
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={url} alt="" />
        : <Icon name="download" />}
      <div>
        <code>{decodeURIComponent(url.split('/').pop() ?? url)}</code>
        <button type="button" className="btn btn-ghost btn-xs" onClick={onClear}>
          Remove
        </button>
      </div>
    </div>
  );
}
