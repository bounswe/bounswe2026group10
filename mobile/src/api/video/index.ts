import { mockDelay } from '../client';

export interface UploadVideoResult {
  url: string;
}

/**
 * Uploads a video file and returns its hosted URL.
 * Currently mocked — backend stores a single videoUrl per recipe.
 * Per-step video support is pending a backend schema update.
 *
 * @param localUri - Local file URI from expo-image-picker (e.g. file:///...)
 */
export async function uploadVideo(localUri: string): Promise<UploadVideoResult> {
  await mockDelay(800);
  const filename = localUri.split('/').pop() ?? 'video.mp4';
  return {
    url: `https://mock-cdn.rootsandrecipes.app/videos/${filename}`,
  };
}
