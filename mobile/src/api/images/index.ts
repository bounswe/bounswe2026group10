import { fetchApi } from '../client';

export interface UploadImageResult {
  url: string;
}

/**
 * Uploads an image file to Supabase Storage via the backend media endpoint.
 * Requires cook/expert role auth token to be set.
 *
 * @param localUri - Local file URI from expo-image-picker (e.g. file:///...)
 */
export async function uploadImage(localUri: string): Promise<UploadImageResult> {
  const filename = localUri.split('/').pop() ?? 'photo.jpg';
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeType =
    ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  const formData = new FormData();
  formData.append('file', { uri: localUri, name: filename, type: mimeType } as any);

  const result = await fetchApi<{ url: string; type: string; size: number }>(
    '/media/upload',
    { method: 'POST', body: formData }
  );
  return { url: result.url };
}
