import { fetchApi } from '../client';

export interface UploadVideoResult {
  url: string;
}

/**
 * Uploads a video file to Supabase Storage via the backend media endpoint.
 * Requires cook/expert role auth token to be set.
 *
 * @param localUri - Local file URI from expo-image-picker (e.g. file:///...)
 */
export async function uploadVideo(localUri: string): Promise<UploadVideoResult> {
  const filename = localUri.split('/').pop() ?? 'video.mp4';

  const formData = new FormData();
  formData.append('file', {
    uri: localUri,
    name: filename,
    type: 'video/mp4',
  } as any);

  const result = await fetchApi<{ url: string; type: string; size: number }>(
    '/media/upload',
    {
      method: 'POST',
      body: formData,
    }
  );

  return { url: result.url };
}
