/** Longest edge an uploaded photo is scaled down to before sending. */
const MAX_EDGE = 2400;
/** Anything smaller than this is sent untouched. */
const SKIP_RESIZE_BELOW = 400 * 1024;
/** Keep going until the result is at least this small, if we can. */
const TARGET_BYTES = 900 * 1024;
/** Progressively harder settings, tried in order until one is small enough. */
const ATTEMPTS: [edge: number, quality: number][] = [
  [MAX_EDGE, 0.85],
  [1800, 0.8],
  [1400, 0.75],
  [1100, 0.7],
];

const RESIZABLE = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Shrink a photo in the browser before uploading it.
 *
 * A phone camera produces four or five megabytes; the site never needs more
 * than about two thousand pixels on the longest edge. Doing this here keeps
 * uploads inside the request limit and makes every page that shows the image
 * load faster afterwards.
 */
export type Prepared = { file: File; width: number; height: number };

async function measure(file: File): Promise<{ width: number; height: number }> {
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    return { width: 0, height: 0 };
  }
}

async function downscale(file: File): Promise<Prepared> {
  if (!RESIZABLE.includes(file.type)) {
    return { file, ...(file.type.startsWith('image/') ? await measure(file) : { width: 0, height: 0 }) };
  }
  if (file.size < SKIP_RESIZE_BELOW) {
    return { file, ...(await measure(file)) };
  }

  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      const size = { width: bitmap.width, height: bitmap.height };
      bitmap.close();
      return { file, ...size };
    }

    let best: Blob | null = null;
    let bestWidth = 0;
    let bestHeight = 0;
    for (const [edge, quality] of ATTEMPTS) {
      const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/webp', quality),
      );
      if (!blob) break;
      best = blob;
      bestWidth = canvas.width;
      bestHeight = canvas.height;
      if (blob.size <= TARGET_BYTES) break;
    }
    const original = { width: bitmap.width, height: bitmap.height };
    bitmap.close();

    if (!best || best.size >= file.size) return { file, ...original };

    const name = file.name.replace(/\.[^.]+$/, '') + '.webp';
    return {
      file: new File([best], name, { type: 'image/webp' }),
      width: bestWidth,
      height: bestHeight,
    };
  } catch {
    // If anything about the resize fails, send the original and let the
    // server's size check decide.
    return { file, width: 0, height: 0 };
  }
}

export type UploadResult = { id: string; url: string; width: number; height: number };

/** Upload one file and return the URL it was stored at. */
export async function uploadMedia(
  folder: string,
  file: File,
  onProgress: (percent: number) => void,
): Promise<UploadResult> {
  onProgress(1);
  const prepared = await downscale(file);

  const form = new FormData();
  form.append('file', prepared.file);
  form.append('folder', folder);
  form.append('width', String(prepared.width));
  form.append('height', String(prepared.height));

  // XMLHttpRequest rather than fetch, because it reports upload progress.
  return new Promise<UploadResult>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('POST', '/api/media/upload');
    request.timeout = 120_000;

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.max(1, Math.round((event.loaded / event.total) * 100)));
      }
    };

    request.onload = () => {
      let payload: { url?: string; id?: string; width?: number; height?: number; error?: string } = {};
      try { payload = JSON.parse(request.responseText); } catch { /* non-JSON error page */ }

      if (request.status >= 200 && request.status < 300 && payload.url && payload.id) {
        onProgress(100);
        resolve({
          id: payload.id,
          url: payload.url,
          width: payload.width ?? prepared.width,
          height: payload.height ?? prepared.height,
        });
        return;
      }
      reject(new Error(
        payload.error ??
        (request.status === 413
          ? 'That file is too large. Please use a smaller one.'
          : `Upload failed (${request.status}).`),
      ));
    };

    request.onerror = () => reject(new Error('The connection dropped during upload. Please try again.'));
    request.ontimeout = () => reject(new Error('The upload timed out. Check your connection and try again.'));

    request.send(form);
  });
}
