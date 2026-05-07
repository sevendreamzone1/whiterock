import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { LoginResponse, PublicUser } from '../api/types';

interface AuthContextValue {
  session: LoginResponse | null;
  token: string | undefined;
  storeSession: (nextSession: LoginResponse) => void;
  clearSession: () => void;
  syncSessionUser: (user: PublicUser) => void;
}

const sessionStorageKey = 'registration_api_session';
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function loadStoredSession(): LoginResponse | null {
  const value = window.localStorage.getItem(sessionStorageKey);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as LoginResponse;
  } catch (_err) {
    window.localStorage.removeItem(sessionStorageKey);
    return null;
  }
}

function persistSession(nextSession: LoginResponse | null): void {
  if (!nextSession) {
    window.localStorage.removeItem(sessionStorageKey);
    return;
  }

  window.localStorage.setItem(sessionStorageKey, JSON.stringify(nextSession));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<LoginResponse | null>(() =>
    loadStoredSession(),
  );

  const storeSession = useCallback((nextSession: LoginResponse) => {
    persistSession(nextSession);
    setSession(nextSession);
  }, []);

  const clearSession = useCallback(() => {
    persistSession(null);
    setSession(null);
  }, []);

  useEffect(() => {
    window.addEventListener('api:unauthorized', clearSession);

    return () => {
      window.removeEventListener('api:unauthorized', clearSession);
    };
  }, [clearSession]);

  const syncSessionUser = useCallback((user: PublicUser) => {
    setSession((current) => {
      if (!current || current.user.id !== user.id) {
        return current;
      }

      const nextSession = {
        ...current,
        user: {
          ...current.user,
          firstName: user.first_name,
          email: user.email,
        },
      };

      persistSession(nextSession);
      return nextSession;
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      token: session?.access_token,
      storeSession,
      clearSession,
      syncSessionUser,
    }),
    [clearSession, session, storeSession, syncSessionUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
