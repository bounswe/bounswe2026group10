import type { UserRole } from '../types/common';
import { mockDelay } from './client';

export interface RegisterParams {
  email: string;
  password: string;
  username: string;
  role: 'learner' | 'cook' | 'expert';
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
  await mockDelay();
  return {
    userId: 'mock-user-001',
    email: params.email,
    username: params.username,
    role: params.role.toUpperCase() as UserRole,
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  };
}

export async function login(params: LoginParams): Promise<AuthTokens> {
  await mockDelay();
  return {
    userId: 'mock-user-001',
    email: params.email,
    username: 'mock_user',
    role: 'COOK',
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  };
}

export async function logout(): Promise<void> {
  await mockDelay(200);
}

export async function refreshToken(token: string): Promise<Pick<AuthTokens, 'accessToken' | 'refreshToken'>> {
  await mockDelay(200);
  return {
    accessToken: 'mock-access-token-refreshed',
    refreshToken: token,
  };
}

export async function getMe(): Promise<MeResponse> {
  await mockDelay();
  return {
    userId: 'mock-user-001',
    email: 'mock@example.com',
    username: 'mock_user',
    role: 'COOK',
    createdAt: new Date().toISOString(),
  };
}
