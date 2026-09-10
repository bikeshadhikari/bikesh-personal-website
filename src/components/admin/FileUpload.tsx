'use client';

import { useRef, useState } from 'react';
import { uploadMedia } from '@/lib/client-upload';
import Icon from '../Icon';

/**
 * Uploads the chosen file and writes the resulting URL into a hidden input, so
 * the form itself only ever carries a short string. A link to a file hosted
 * elsewhere can be pasted instead.
 */
export default function FileUpload({
  name, value, folder = 'media', isImage = true, withDimensions = false,
  initialWidth = 0, initialHeight = 0,
}: {
  name: string;
  value: string;
  folder?: string;
  isImage?: boolean;
  withDimensions?: boolean;
  initialWidth?: number;
  initialHeight?: number;
}) {
  const [url, setUrl] = useState(value);
  const [size, setSize] = useState({ width: initialWidth, height: initialHeight });
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<number | null>(null);
  const [showLink, setShowLink] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError('');
    setProgress(1);
    try {
      const result = await uploadMedia(folder, file, setProgress);
      setUrl(result.url);
      setSize({ width: result.width, height: result.height });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setProgress(null);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  return (
    <div className="upload-field">
      {url && (
        <div className="upload-current">
          {isImage
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={url} alt="" />
            : <Icon name="download" />}
          <div>
            <code>{url.startsWith('/api/media/') ? 'Stored file' : url}</code>
            <button type="button" className="btn btn-ghost btn-xs" onClick={() => setUrl('')}>
              Remove
            </button>
          </div>
        </div>
      )}

      <input
        ref={fileInput}
        type="file"
        id={`f-${name}`}
        accept={isImage ? 'image/*' : undefined}
        disabled={progress !== null}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
      <input type="hidden" name={`${name}_url`} value={url} />
      {withDimensions && (
        <>
          <input type="hidden" name="width" value={size.width} />
          <input type="hidden" name="height" value={size.height} />
        </>
      )}

      {progress !== null && (
        <div className="upload-progress" role="status">
          <span className="upload-bar"><span style={{ width: `${progress}%` }} /></span>
          <span>{progress}%</span>
        </div>
      )}

      {error && <p className="field-error">{error}</p>}

      {progress === null && !error && (
        <p className="field-hint">
          {isImage
            ? 'Photos are resized automatically, so a picture straight off your phone is fine.'
            : 'PDF or Word document, up to 4 MB.'}
          {' '}It uploads as soon as you choose it, then save the form.
        </p>
      )}

      {showLink ? (
        <input
          type="url"
          value={url.startsWith('/api/media/') ? '' : url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/image.jpg"
          aria-label="Link to a file hosted elsewhere"
        />
      ) : (
        <button type="button" className="btn btn-link btn-xs" onClick={() => setShowLink(true)}>
          or paste a link instead
        </button>
      )}
    </div>
  );
}
