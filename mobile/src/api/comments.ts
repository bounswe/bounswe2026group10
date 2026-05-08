import { fetchApi } from './client';
import type { UserRating } from './recipes';

export interface Comment {
  id: string;
  recipeId: string;
  userId: string;
  username: string | null;
  body: string;
  score: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CommentsPage {
  comments: Comment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface CreateCommentResult {
  comment: Comment;
  rating: UserRating | null;
}

export async function listComments(
  recipeId: string,
  page: number = 1,
  limit: number = 20
): Promise<CommentsPage> {
  return fetchApi<CommentsPage>(
    `/recipes/${recipeId}/comments?page=${page}&limit=${limit}`
  );
}

export async function createComment(
  recipeId: string,
  body: string,
  score?: number
): Promise<CreateCommentResult> {
  const payload: { body: string; score?: number } = { body };
  if (score !== undefined) payload.score = score;
  return fetchApi<CreateCommentResult>(`/recipes/${recipeId}/comments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateComment(commentId: string, body: string): Promise<Comment> {
  return fetchApi<Comment>(`/comments/${commentId}`, {
    method: 'PATCH',
    body: JSON.stringify({ body }),
  });
}

export async function deleteComment(commentId: string): Promise<void> {
  await fetchApi<null>(`/comments/${commentId}`, { method: 'DELETE' });
}
