import {
  listComments,
  createComment,
  updateComment,
  deleteComment,
} from '../api/comments';
import { fetchApi } from '../api/client';

jest.mock('../api/client', () => ({
  fetchApi: jest.fn(),
}));

const mockFetchApi = fetchApi as jest.MockedFunction<typeof fetchApi>;

beforeEach(() => jest.clearAllMocks());

describe('listComments', () => {
  it('calls GET /recipes/:id/comments with default pagination', async () => {
    mockFetchApi.mockResolvedValueOnce({
      comments: [],
      pagination: { page: 1, limit: 20, total: 0 },
    } as any);
    await listComments('r1');
    expect(mockFetchApi).toHaveBeenCalledWith('/recipes/r1/comments?page=1&limit=20');
  });

  it('forwards page and limit when provided', async () => {
    mockFetchApi.mockResolvedValueOnce({
      comments: [],
      pagination: { page: 3, limit: 5, total: 0 },
    } as any);
    await listComments('r1', 3, 5);
    expect(mockFetchApi).toHaveBeenCalledWith('/recipes/r1/comments?page=3&limit=5');
  });

  it('returns the resolved value verbatim', async () => {
    const payload = {
      comments: [{ id: 'c1', body: 'hi' }],
      pagination: { page: 1, limit: 20, total: 1 },
    };
    mockFetchApi.mockResolvedValueOnce(payload as any);
    await expect(listComments('r1')).resolves.toEqual(payload);
  });
});

describe('createComment', () => {
  it('posts only body when score is omitted', async () => {
    mockFetchApi.mockResolvedValueOnce({ comment: { id: 'c1' }, rating: null } as any);
    await createComment('r1', 'great recipe');
    expect(mockFetchApi).toHaveBeenCalledWith('/recipes/r1/comments', {
      method: 'POST',
      body: JSON.stringify({ body: 'great recipe' }),
    });
  });

  it('includes score in payload when provided', async () => {
    mockFetchApi.mockResolvedValueOnce({ comment: { id: 'c1' }, rating: { score: 4 } } as any);
    await createComment('r1', 'great recipe', 4);
    expect(mockFetchApi).toHaveBeenCalledWith('/recipes/r1/comments', {
      method: 'POST',
      body: JSON.stringify({ body: 'great recipe', score: 4 }),
    });
  });

  it('propagates errors thrown by fetchApi', async () => {
    mockFetchApi.mockRejectedValueOnce(new Error('boom'));
    await expect(createComment('r1', 'x')).rejects.toThrow('boom');
  });
});

describe('updateComment', () => {
  it('calls PATCH /comments/:id with serialised body', async () => {
    mockFetchApi.mockResolvedValueOnce({ id: 'c1', body: 'edited' } as any);
    await updateComment('c1', 'edited');
    expect(mockFetchApi).toHaveBeenCalledWith('/comments/c1', {
      method: 'PATCH',
      body: JSON.stringify({ body: 'edited' }),
    });
  });
});

describe('deleteComment', () => {
  it('calls DELETE /comments/:id', async () => {
    mockFetchApi.mockResolvedValueOnce(null as any);
    await deleteComment('c1');
    expect(mockFetchApi).toHaveBeenCalledWith('/comments/c1', { method: 'DELETE' });
  });
});
