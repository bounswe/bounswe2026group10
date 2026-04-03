import type { UserRole } from '../types/common';
import { fetchApi, setToken } from './client';

export interface RegisterParams {
  email: string;
  password: string;
  username: string;
  firstName: string;
  lastName: string;
  role: 'learner' | 'cook' | 'expert';
  region: string;
  preferredLanguage: string;
}

export interface AuthTokens {
  userId: string;
  email: string;
  username: string;
  role: UserRole;
  accessToken: string;
  refreshToken: string;
}

export interface LoginParams {
  email: string;
  password: string;
}

export interface MeResponse {
  userId: string;
  email: string;
  username: string;
  role: UserRole;
  createdAt: string;
}

export async function register(params: RegisterParams): Promise<AuthTokens> {
  const data = await fetchApi<AuthTokens>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  setToken(data.accessToken);
  return data;
}

export async function login(params: LoginParams): Promise<AuthTokens> {
  const data = await fetchApi<AuthTokens>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  setToken(data.accessToken);
  return data;
}

export async function logout(): Promise<void> {
  await fetchApi<void>('/auth/logout', { method: 'POST' });
  setToken(null);
}

export async function refreshToken(
  token: string
): Promise<Pick<AuthTokens, 'accessToken' | 'refreshToken'>> {
  return fetchApi('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: token }),
  });
}

export async function getMe(): Promise<MeResponse> {
  return fetchApi<MeResponse>('/auth/me');
}
