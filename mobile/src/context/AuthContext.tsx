import React, { createContext, useContext, useEffect, useState } from 'react';
import { login as apiLogin, register as apiRegister, logout as apiLogout, getMe } from '../api/auth';
import type { RegisterParams, LoginParams, AuthTokens } from '../api/auth';
import {
  persistToken,
  loadPersistedToken,
  setToken,
  persistRefreshToken,
  loadPersistedRefreshToken,
  setRefreshToken,
  persistUserProfile,
  loadPersistedUserProfile,
  registerSessionExpiredHandler,
  ApiError,
} from '../api/client';

type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated'; isGuest: boolean }
  | { status: 'authenticated'; user: AuthTokens };

interface AuthContextValue {
  authState: AuthState;
  login: (params: LoginParams) => Promise<void>;
  register: (params: RegisterParams) => Promise<void>;
  logout: () => Promise<void>;
  continueAsGuest: () => void;
  exitGuest: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    registerSessionExpiredHandler(() => {
      setAuthState({ status: 'unauthenticated', isGuest: false });
    });

    async function checkStoredToken() {
      try {
        const [token, refreshToken, profile] = await Promise.all([
          loadPersistedToken(),
          loadPersistedRefreshToken(),
          loadPersistedUserProfile(),
        ]);

        if (!token || !profile) {
          setAuthState({ status: 'unauthenticated', isGuest: false });
          return;
        }

        if (refreshToken) {
          setRefreshToken(refreshToken);
        }

        // Restore session immediately from stored data — no network required
        setAuthState({
          status: 'authenticated',
          user: {
            userId: profile.userId,
            email: profile.email,
            username: profile.username,
            role: profile.role as AuthTokens['role'],
            accessToken: token,
            refreshToken: refreshToken ?? '',
          },
        });

        // Verify and refresh profile in the background
        try {
          const me = await getMe();
          setAuthState((prev) => {
            if (prev.status !== 'authenticated') return prev;
            return {
              status: 'authenticated',
              user: { ...prev.user, userId: me.userId, email: me.email, username: me.username, role: me.role },
            };
          });
          await persistUserProfile({ userId: me.userId, email: me.email, username: me.username, role: me.role });
        } catch (err) {
          if (err instanceof ApiError) {
            // Token is invalid and refresh failed — log out
            setToken(null);
            setRefreshToken(null);
            await Promise.all([persistToken(null), persistRefreshToken(null), persistUserProfile(null)]);
            setAuthState({ status: 'unauthenticated', isGuest: false });
          }
          // Network error: keep the restored auth state — tokens may still be valid
        }
      } catch {
        setAuthState({ status: 'unauthenticated', isGuest: false });
      }
    }
    checkStoredToken();
  }, []);

  async function login(params: LoginParams) {
    const tokens = await apiLogin(params);
    await Promise.all([
      persistToken(tokens.accessToken),
      persistRefreshToken(tokens.refreshToken),
      persistUserProfile({ userId: tokens.userId, email: tokens.email, username: tokens.username, role: tokens.role }),
    ]);
    setAuthState({ status: 'authenticated', user: tokens });
  }

  async function register(params: RegisterParams) {
    const tokens = await apiRegister(params);
    await Promise.all([
      persistToken(tokens.accessToken),
      persistRefreshToken(tokens.refreshToken),
      persistUserProfile({ userId: tokens.userId, email: tokens.email, username: tokens.username, role: tokens.role }),
    ]);
    setAuthState({ status: 'authenticated', user: tokens });
  }

  async function logout() {
    try {
      await apiLogout();
    } catch {
      // continue logout even if server call fails
    }
    setToken(null);
    setRefreshToken(null);
    await Promise.all([persistToken(null), persistRefreshToken(null), persistUserProfile(null)]);
    setAuthState({ status: 'unauthenticated', isGuest: false });
  }

  function continueAsGuest() {
    setAuthState({ status: 'unauthenticated', isGuest: true });
  }

  function exitGuest() {
    setAuthState({ status: 'unauthenticated', isGuest: false });
  }

  return (
    <AuthContext.Provider value={{ authState, login, register, logout, continueAsGuest, exitGuest }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
