import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

const mockUseAuth = jest.fn();
jest.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockListComments = jest.fn();
const mockCreateComment = jest.fn();
const mockUpdateComment = jest.fn();
const mockDeleteComment = jest.fn();

jest.mock('../api/comments', () => ({
  listComments: (...args: any[]) => mockListComments(...args),
  createComment: (...args: any[]) => mockCreateComment(...args),
  updateComment: (...args: any[]) => mockUpdateComment(...args),
  deleteComment: (...args: any[]) => mockDeleteComment(...args),
}));

jest.mock('../api/client', () => {
  class ApiError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  }
  return { ApiError };
});

import { ApiError } from '../api/client';
import { CommentsSection } from '../components/recipe-detail/CommentsSection';

function authenticatedAs(username: string) {
  mockUseAuth.mockReturnValue({
    authState: {
      status: 'authenticated',
      user: { userId: 'u1', email: 'a@b.c', username, role: 'cook' },
    },
  });
}

function unauthenticated() {
  mockUseAuth.mockReturnValue({
    authState: { status: 'unauthenticated', isGuest: false },
  });
}

const sampleComment = (overrides: Partial<any> = {}) => ({
  id: 'c1',
  recipeId: 'r1',
  userId: 'u-other',
  username: 'alice',
  body: 'Loved it!',
  score: 5,
  createdAt: '2026-05-01T00:00:00Z',
  updatedAt: '2026-05-01T00:00:00Z',
  ...overrides,
});

async function renderAndFlush(ui: React.ReactElement) {
  const result = render(ui);
  await act(async () => {
    await Promise.resolve();
  });
  return result;
}

describe('CommentsSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows the empty-state message when there are no comments', async () => {
    unauthenticated();
    mockListComments.mockResolvedValueOnce({
      comments: [],
      pagination: { page: 1, limit: 20, total: 0 },
    });
    const { findByText } = await renderAndFlush(<CommentsSection recipeId="r1" />);
    expect(await findByText(/No comments yet/i)).toBeTruthy();
  });

  it('renders fetched comments', async () => {
    unauthenticated();
    mockListComments.mockResolvedValueOnce({
      comments: [sampleComment(), sampleComment({ id: 'c2', username: 'bob', body: 'Tasty!' })],
      pagination: { page: 1, limit: 20, total: 2 },
    });
    const { findByText } = await renderAndFlush(<CommentsSection recipeId="r1" />);
    expect(await findByText('alice')).toBeTruthy();
    expect(await findByText('Loved it!')).toBeTruthy();
    expect(await findByText('bob')).toBeTruthy();
    expect(await findByText('Tasty!')).toBeTruthy();
  });

  it('hides the composer for the recipe creator', async () => {
    authenticatedAs('chef-creator');
    mockListComments.mockResolvedValueOnce({
      comments: [],
      pagination: { page: 1, limit: 20, total: 0 },
    });
    const { queryByPlaceholderText } = await renderAndFlush(
      <CommentsSection recipeId="r1" creatorUsername="chef-creator" />
    );
    expect(queryByPlaceholderText(/Share your experience/i)).toBeNull();
  });

  it('hides the composer when user already has their own comment', async () => {
    authenticatedAs('alice');
    mockListComments.mockResolvedValueOnce({
      comments: [sampleComment()],
      pagination: { page: 1, limit: 20, total: 1 },
    });
    const { queryByPlaceholderText, findByText } = await renderAndFlush(
      <CommentsSection recipeId="r1" creatorUsername="someone-else" />
    );
    await findByText('alice');
    expect(queryByPlaceholderText(/Share your experience/i)).toBeNull();
  });

  it('shows Edit/Delete only on the current user’s comment', async () => {
    authenticatedAs('alice');
    mockListComments.mockResolvedValueOnce({
      comments: [
        sampleComment({ id: 'c-mine', username: 'alice', body: 'mine' }),
        sampleComment({ id: 'c-other', username: 'bob', body: 'theirs' }),
      ],
      pagination: { page: 1, limit: 20, total: 2 },
    });
    const { findAllByText } = await renderAndFlush(
      <CommentsSection recipeId="r1" creatorUsername="creator" />
    );
    const edits = await findAllByText('Edit');
    const deletes = await findAllByText('Delete');
    expect(edits).toHaveLength(1);
    expect(deletes).toHaveLength(1);
  });

  it('submits a comment and reloads the list', async () => {
    authenticatedAs('alice');
    mockListComments
      .mockResolvedValueOnce({
        comments: [],
        pagination: { page: 1, limit: 20, total: 0 },
      })
      .mockResolvedValueOnce({
        comments: [sampleComment({ username: 'alice', body: 'great' })],
        pagination: { page: 1, limit: 20, total: 1 },
      });
    mockCreateComment.mockResolvedValueOnce({ comment: { id: 'c1' }, rating: null });

    const onSubmitted = jest.fn();
    const { getByPlaceholderText, getByText, findByText } = await renderAndFlush(
      <CommentsSection recipeId="r1" creatorUsername="creator" onCommentSubmitted={onSubmitted} />
    );

    fireEvent.changeText(getByPlaceholderText(/Share your experience/i), 'great');
    await act(async () => {
      fireEvent.press(getByText('Post comment'));
    });

    await waitFor(() => expect(mockCreateComment).toHaveBeenCalledWith('r1', 'great'));
    await waitFor(() => expect(onSubmitted).toHaveBeenCalled());
    expect(await findByText('great')).toBeTruthy();
  });

  it('does not render a rating star picker in the composer', async () => {
    authenticatedAs('alice');
    mockListComments.mockResolvedValueOnce({
      comments: [],
      pagination: { page: 1, limit: 20, total: 0 },
    });
    const { queryByText } = await renderAndFlush(
      <CommentsSection recipeId="r1" creatorUsername="creator" />
    );
    expect(queryByText(/Your rating/i)).toBeNull();
  });

  it('shows a popup (not inline error) when backend rejects with RATING_REQUIRED', async () => {
    authenticatedAs('alice');
    mockListComments.mockResolvedValueOnce({
      comments: [],
      pagination: { page: 1, limit: 20, total: 0 },
    });
    mockCreateComment.mockRejectedValueOnce(new ApiError('RATING_REQUIRED', 'rate first'));

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByPlaceholderText, getByText, queryByText } = await renderAndFlush(
      <CommentsSection recipeId="r1" creatorUsername="creator" />
    );
    fireEvent.changeText(getByPlaceholderText(/Share your experience/i), 'no rating yet');
    await act(async () => {
      fireEvent.press(getByText('Post comment'));
    });

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        'Rating required',
        expect.stringMatching(/rate this recipe/i)
      )
    );
    expect(queryByText(/rate this recipe/i)).toBeNull();

    alertSpy.mockRestore();
  });

  it('deletes own comment after confirmation and removes the row', async () => {
    authenticatedAs('alice');
    mockListComments.mockResolvedValueOnce({
      comments: [sampleComment({ id: 'c-mine', username: 'alice', body: 'remove me' })],
      pagination: { page: 1, limit: 20, total: 1 },
    });
    mockDeleteComment.mockResolvedValueOnce(undefined);

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      const destructive = (buttons ?? []).find((b: any) => b.style === 'destructive');
      destructive?.onPress?.();
    });

    const { findByText, getByText, queryByText } = await renderAndFlush(
      <CommentsSection recipeId="r1" creatorUsername="creator" />
    );
    await findByText('remove me');

    await act(async () => {
      fireEvent.press(getByText('Delete'));
    });

    await waitFor(() => expect(mockDeleteComment).toHaveBeenCalledWith('c-mine'));
    await waitFor(() => expect(queryByText('remove me')).toBeNull());

    alertSpy.mockRestore();
  });
});
