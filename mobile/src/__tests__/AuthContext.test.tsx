import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getMe,
} from '../api/auth';
import {
  persistToken,
  loadPersistedToken,
  setToken,
  persistRefreshToken,
  loadPersistedRefreshToken,
  setRefreshToken,
} from '../api/client';

jest.mock('../api/auth');
jest.mock('../api/client', () => ({
  persistToken: jest.fn(),
  loadPersistedToken: jest.fn(),
  setToken: jest.fn(),
  persistRefreshToken: jest.fn(),
  loadPersistedRefreshToken: jest.fn(),
  setRefreshToken: jest.fn(),
}));

const mockApiLogin = apiLogin as jest.MockedFunction<typeof apiLogin>;
const mockApiRegister = apiRegister as jest.MockedFunction<typeof apiRegister>;
const mockApiLogout = apiLogout as jest.MockedFunction<typeof apiLogout>;
const mockGetMe = getMe as jest.MockedFunction<typeof getMe>;
const mockPersistToken = persistToken as jest.MockedFunction<typeof persistToken>;
const mockLoadPersistedToken = loadPersistedToken as jest.MockedFunction<typeof loadPersistedToken>;
const mockPersistRefreshToken = persistRefreshToken as jest.MockedFunction<typeof persistRefreshToken>;
const mockLoadPersistedRefreshToken = loadPersistedRefreshToken as jest.MockedFunction<typeof loadPersistedRefreshToken>;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

const fakeTokens = {
  userId: 'u1',
  email: 'test@test.com',
  username: 'testuser',
  role: 'COOK' as const,
  accessToken: 'access123',
  refreshToken: 'refresh123',
};

const registerParams = {
  email: 'new@test.com',
  password: 'pass1234',
  username: 'newuser',
  firstName: 'New',
  lastName: 'User',
  role: 'learner' as const,
  region: 'Turkey',
  preferredLanguage: 'en',
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPersistToken.mockResolvedValue(undefined);
    mockPersistRefreshToken.mockResolvedValue(undefined);
    mockLoadPersistedRefreshToken.mockResolvedValue(null);
  });

  // ─── Initial token check ────────────────────────────────────────────────────

  describe('startup token check', () => {
    it('starts in loading state before the async check resolves', () => {
      mockLoadPersistedToken.mockReturnValue(new Promise(() => {})); // never resolves
      mockLoadPersistedRefreshToken.mockReturnValue(new Promise(() => {})); // never resolves
      const { result } = renderHook(() => useAuth(), { wrapper });
      expect(result.current.authState.status).toBe('loading');
    });

    it('sets unauthenticated when no token is stored', async () => {
      mockLoadPersistedToken.mockResolvedValue(null);
      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {});
      expect(result.current.authState).toEqual({ status: 'unauthenticated', isGuest: false });
    });

    it('sets authenticated when stored token passes getMe validation', async () => {
      mockLoadPersistedToken.mockResolvedValue('access123');
      mockGetMe.mockResolvedValue({
        userId: 'u1',
        email: 'test@test.com',
        username: 'testuser',
        role: 'COOK',
        createdAt: '2024-01-01',
      });
      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {});
      expect(result.current.authState.status).toBe('authenticated');
      if (result.current.authState.status === 'authenticated') {
        expect(result.current.authState.user.email).toBe('test@test.com');
        expect(result.current.authState.user.accessToken).toBe('access123');
      }
    });

    it('clears token and sets unauthenticated when getMe fails', async () => {
      mockLoadPersistedToken.mockResolvedValue('expired-token');
      mockGetMe.mockRejectedValue(new Error('Unauthorized'));
      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {});
      expect(result.current.authState).toEqual({ status: 'unauthenticated', isGuest: false });
      expect(mockPersistToken).toHaveBeenCalledWith(null);
    });
  });

  // ─── login() ───────────────────────────────────────────────────────────────

  describe('login()', () => {
    beforeEach(() => {
      mockLoadPersistedToken.mockResolvedValue(null);
    });

    it('sets authenticated state with returned user on success', async () => {
      mockApiLogin.mockResolvedValue(fakeTokens);
      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {});
      await act(async () => {
        await result.current.login({ email: 'test@test.com', password: 'pass123' });
      });
      expect(result.current.authState.status).toBe('authenticated');
      if (result.current.authState.status === 'authenticated') {
        expect(result.current.authState.user).toEqual(fakeTokens);
      }
    });

    it('persists the access token to secure storage', async () => {
      mockApiLogin.mockResolvedValue(fakeTokens);
      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {});
      await act(async () => {
        await result.current.login({ email: 'test@test.com', password: 'pass123' });
      });
      expect(mockPersistToken).toHaveBeenCalledWith('access123');
    });

    it('propagates API errors to the caller', async () => {
      mockApiLogin.mockRejectedValue(new Error('Invalid credentials'));
      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {});
      await expect(
        act(async () => {
          await result.current.login({ email: 'bad@test.com', password: 'wrong' });
        })
      ).rejects.toThrow('Invalid credentials');
    });

    it('does not change auth state on failure', async () => {
      mockApiLogin.mockRejectedValue(new Error('Invalid credentials'));
      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {});
      try {
        await act(async () => {
          await result.current.login({ email: 'bad@test.com', password: 'wrong' });
        });
      } catch {}
      expect(result.current.authState).toEqual({ status: 'unauthenticated', isGuest: false });
    });
  });

  // ─── register() ────────────────────────────────────────────────────────────

  describe('register()', () => {
    beforeEach(() => {
      mockLoadPersistedToken.mockResolvedValue(null);
    });

    it('sets authenticated state with returned user on success', async () => {
      mockApiRegister.mockResolvedValue(fakeTokens);
      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {});
      await act(async () => {
        await result.current.register(registerParams);
      });
      expect(result.current.authState.status).toBe('authenticated');
    });

    it('persists the access token to secure storage', async () => {
      mockApiRegister.mockResolvedValue(fakeTokens);
      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {});
      await act(async () => {
        await result.current.register(registerParams);
      });
      expect(mockPersistToken).toHaveBeenCalledWith('access123');
    });

    it('propagates API errors to the caller', async () => {
      mockApiRegister.mockRejectedValue(new Error('Email already taken'));
      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {});
      await expect(
        act(async () => {
          await result.current.register(registerParams);
        })
      ).rejects.toThrow('Email already taken');
    });
  });

  // ─── logout() ──────────────────────────────────────────────────────────────

  describe('logout()', () => {
    async function loginFirst(result: ReturnType<typeof renderHook>['result']) {
      mockApiLogin.mockResolvedValue(fakeTokens);
      await act(async () => {
        await result.current.login({ email: 'test@test.com', password: 'pass' });
      });
    }

    beforeEach(() => {
      mockLoadPersistedToken.mockResolvedValue(null);
    });

    it('sets unauthenticated state after logout', async () => {
      mockApiLogout.mockResolvedValue(undefined);
      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {});
      await loginFirst(result);
      await act(async () => { await result.current.logout(); });
      expect(result.current.authState).toEqual({ status: 'unauthenticated', isGuest: false });
    });

    it('clears the persisted token', async () => {
      mockApiLogout.mockResolvedValue(undefined);
      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {});
      await loginFirst(result);
      mockPersistToken.mockClear();
      await act(async () => { await result.current.logout(); });
      expect(mockPersistToken).toHaveBeenCalledWith(null);
    });

    it('still logs out locally when the server call fails', async () => {
      mockApiLogout.mockRejectedValue(new Error('Network error'));
      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {});
      await loginFirst(result);
      await act(async () => { await result.current.logout(); });
      expect(result.current.authState).toEqual({ status: 'unauthenticated', isGuest: false });
    });
  });

  // ─── continueAsGuest() / exitGuest() ───────────────────────────────────────

  describe('continueAsGuest()', () => {
    it('sets isGuest to true', async () => {
      mockLoadPersistedToken.mockResolvedValue(null);
      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {});
      act(() => { result.current.continueAsGuest(); });
      expect(result.current.authState).toEqual({ status: 'unauthenticated', isGuest: true });
    });
  });

  describe('exitGuest()', () => {
    it('sets isGuest back to false', async () => {
      mockLoadPersistedToken.mockResolvedValue(null);
      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {});
      act(() => { result.current.continueAsGuest(); });
      act(() => { result.current.exitGuest(); });
      expect(result.current.authState).toEqual({ status: 'unauthenticated', isGuest: false });
    });
  });

  // ─── useAuth() guard ───────────────────────────────────────────────────────

  describe('useAuth()', () => {
    it('throws when used outside AuthProvider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within AuthProvider');
      consoleError.mockRestore();
    });
  });
});
