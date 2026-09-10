import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { currentUser } from '@/lib/auth';
import { ALLOWED_TYPES, MAX_UPLOAD_BYTES, blobConfigured } from '@/lib/upload';

export const dynamic = 'force-dynamic';

/**
 * Hands the browser a short-lived token so it can upload straight to Blob.
 *
 * Files never pass through this app: a Server Action caps request bodies at
 * 1 MB and Vercel caps a function request at 4.5 MB, which is smaller than an
 * ordinary phone photo. Uploading direct from the browser avoids both.
 */
export async function POST(request: Request): Promise<Response> {
  if (!blobConfigured()) {
    return Response.json(
      { error: 'File storage is not connected. Add a Blob store in Vercel and redeploy.' },
      { status: 503 },
    );
  }

  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return Response.json({ error: 'Malformed request.' }, { status: 400 });
  }

  try {
    const result = await handleUpload({
      body,
      request,
      // Runs before any token is issued, so an anonymous visitor cannot upload.
      onBeforeGenerateToken: async () => {
        const user = await currentUser();
        if (!user) throw new Error('You need to be signed in to upload files.');
        return {
          allowedContentTypes: ALLOWED_TYPES,
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: true,
        };
      },
      // Vercel calls this from its own side once the file lands. It does not
      // fire on localhost, which is expected and harmless.
      onUploadCompleted: async () => {},
    });
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed.';
    return Response.json({ error: message }, { status: 400 });
  }
}
