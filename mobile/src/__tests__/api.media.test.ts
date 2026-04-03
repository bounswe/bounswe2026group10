import { uploadImage } from '../api/images';
import { uploadVideo } from '../api/video';
import { fetchApi } from '../api/client';

jest.mock('../api/client', () => ({
  fetchApi: jest.fn(),
}));

const mockFetchApi = fetchApi as jest.MockedFunction<typeof fetchApi>;

let mockAppend: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockAppend = jest.fn();
  (global as any).FormData = jest.fn(() => ({ append: mockAppend }));
  mockFetchApi.mockResolvedValue({ url: 'https://cdn.example.com/file', type: 'image/jpeg', size: 1000 } as any);
});

// ── uploadImage ────────────────────────────────────────────────────────────────

describe('uploadImage', () => {
  it('detects .jpg as image/jpeg', async () => {
    await uploadImage('file:///var/mobile/photo.jpg');
    expect(mockAppend).toHaveBeenCalledWith(
      'file',
      expect.objectContaining({ type: 'image/jpeg' })
    );
  });

  it('detects .JPG (uppercase) as image/jpeg', async () => {
    await uploadImage('file:///var/mobile/PHOTO.JPG');
    expect(mockAppend).toHaveBeenCalledWith(
      'file',
      expect.objectContaining({ type: 'image/jpeg' })
    );
  });

  it('detects .png as image/png', async () => {
    await uploadImage('file:///var/mobile/photo.png');
    expect(mockAppend).toHaveBeenCalledWith(
      'file',
      expect.objectContaining({ type: 'image/png' })
    );
  });

  it('detects .webp as image/webp', async () => {
    await uploadImage('file:///var/mobile/photo.webp');
    expect(mockAppend).toHaveBeenCalledWith(
      'file',
      expect.objectContaining({ type: 'image/webp' })
    );
  });

  it('falls back to image/jpeg for unknown extension', async () => {
    await uploadImage('file:///var/mobile/photo.bmp');
    expect(mockAppend).toHaveBeenCalledWith(
      'file',
      expect.objectContaining({ type: 'image/jpeg' })
    );
  });

  it('calls fetchApi with POST /media/upload', async () => {
    await uploadImage('file:///var/mobile/photo.jpg');
    expect(mockFetchApi).toHaveBeenCalledWith(
      '/media/upload',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('returns the url from the fetchApi response', async () => {
    mockFetchApi.mockResolvedValueOnce({ url: 'https://cdn.example.com/photo.jpg', type: 'image/jpeg', size: 5000 } as any);
    const result = await uploadImage('file:///var/mobile/photo.jpg');
    expect(result.url).toBe('https://cdn.example.com/photo.jpg');
  });
});

// ── uploadVideo ────────────────────────────────────────────────────────────────

describe('uploadVideo', () => {
  it('uses video/mp4 for .mp4 files', async () => {
    await uploadVideo('file:///var/mobile/clip.mp4');
    expect(mockAppend).toHaveBeenCalledWith(
      'file',
      expect.objectContaining({ type: 'video/mp4' })
    );
  });

  it('uses video/mp4 regardless of extension (hardcoded)', async () => {
    await uploadVideo('file:///var/mobile/clip.mov');
    expect(mockAppend).toHaveBeenCalledWith(
      'file',
      expect.objectContaining({ type: 'video/mp4' })
    );
  });

  it('calls fetchApi with POST /media/upload', async () => {
    await uploadVideo('file:///var/mobile/clip.mp4');
    expect(mockFetchApi).toHaveBeenCalledWith(
      '/media/upload',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('returns the url from the fetchApi response', async () => {
    mockFetchApi.mockResolvedValueOnce({ url: 'https://cdn.example.com/clip.mp4', type: 'video/mp4', size: 50000 } as any);
    const result = await uploadVideo('file:///var/mobile/clip.mp4');
    expect(result.url).toBe('https://cdn.example.com/clip.mp4');
  });
});
