import { currentUser } from '@/lib/auth';
import { ALLOWED_TYPES, MAX_UPLOAD_BYTES, humanSize, resolveType, storeMedia } from '@/lib/upload';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Receives one file from a signed-in user and stores it in the database. */
export async function POST(request: Request): Promise<Response> {
  const user = await currentUser();
  if (!user) {
    return Response.json({ error: 'You need to be signed in to upload files.' }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json(
      { error: 'That file was too large for the server to accept. Please use a smaller one.' },
      { status: 413 },
    );
  }

  const file = form.get('file');
  const folder = String(form.get('folder') ?? 'media');
  const width = Number(form.get('width') ?? 0) || 0;
  const height = Number(form.get('height') ?? 0) || 0;

  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: 'No file was received.' }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return Response.json(
      { error: `That file is ${humanSize(file.size)}. The limit is ${humanSize(MAX_UPLOAD_BYTES)}.` },
      { status: 413 },
    );
  }
  // Resolved first: a phone often reports nothing at all for a voice memo, and
  // the file's own name is the only thing that says what it is.
  const mime = resolveType(file.type, file.name);
  if (!ALLOWED_TYPES.includes(mime)) {
    return Response.json(
      {
        error: `Files of type "${mime || 'unknown'}" are not allowed. `
          + 'Use an image, an audio recording, a PDF or a Word document.',
      },
      { status: 415 },
    );
  }

  try {
    const stored = await storeMedia(file, folder, width, height);
    return Response.json(stored);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not save the file.';
    return Response.json({ error: message }, { status: 500 });
  }
}
