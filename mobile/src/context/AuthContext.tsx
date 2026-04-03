import React, { createContext, useContext, useEffect, useState } from 'react';
import { login as apiLogin, register as apiRegister, logout as apiLogout, getMe } from '../api/auth';
import type { RegisterParams, LoginParams, AuthTokens } from '../api/auth';
import { persistToken, loadPersistedToken, setToken } from '../api/client';

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
    async function checkStoredToken() {
      try {
        const token = await loadPersistedToken();
        if (!token) {
          setAuthState({ status: 'unauthenticated', isGuest: false });
          return;
        }
        const me = await getMe();
        setAuthState({
          status: 'authenticated',
          user: {
            userId: me.userId,
            email: me.email,
            username: me.username,
            role: me.role,
            accessToken: token,
            refreshToken: '',
          },
        });
      } catch {
        await persistToken(null);
        setAuthState({ status: 'unauthenticated', isGuest: false });
      }
    }
    checkStoredToken();
  }, []);

  async function login(params: LoginParams) {
    const tokens = await apiLogin(params);
    await persistToken(tokens.accessToken);
    setAuthState({ status: 'authenticated', user: tokens });
  }

  async function register(params: RegisterParams) {
    const tokens = await apiRegister(params);
    await persistToken(tokens.accessToken);
    setAuthState({ status: 'authenticated', user: tokens });
  }

  async function logout() {
    try {
      await apiLogout();
    } catch {
      // continue logout even if server call fails
    }
    setToken(null);
    await persistToken(null);
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
