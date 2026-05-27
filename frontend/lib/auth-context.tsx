'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from './api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  accountType: string;
  kycStatus?: string;
  country?: string;
  region?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<{ email: string; devOtpCode?: string }>;
  verify: (email: string, code: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

type StoredSession = {
  token: string;
  user: User | null;
};

const AUTH_STORAGE_KEY = 'agrib2b-auth';

const persistSession = (token: string, user: User | null) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('token', token);
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token, user }));
};

const clearSession = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem('token');
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
};

const readStoredSession = (): StoredSession | null => {
  if (typeof window === 'undefined') return null;

  const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored) as StoredSession;
    if (!parsed?.token) return null;
    return parsed;
  } catch {
    return null;
  }
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedSession = readStoredSession();
    const activeToken = storedSession?.token || (typeof window !== 'undefined' ? window.localStorage.getItem('token') : null);

    if (!activeToken) {
      setLoading(false);
      return;
    }

    setToken(activeToken);
    if (storedSession?.user) {
      setUser(storedSession.user);
    }

    authApi.profile()
      .then((res) => {
        const profileUser = res.data as User;
        setUser(profileUser);
        persistSession(activeToken, profileUser);
      })
      .catch(() => {
        clearSession();
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    persistSession(res.data.token, res.data.user);
    setToken(res.data.token);
    setUser(res.data.user);
  };

  const register = async (data: any): Promise<{ email: string; devOtpCode?: string }> => {
    const res = await authApi.register(data);
    return { email: res.data.email, devOtpCode: res.data.devOtpCode };
  };

  const verify = async (email: string, code: string) => {
    const res = await authApi.verify(email, code);
    persistSession(res.data.token, res.data.user);
    setToken(res.data.token);
    setUser(res.data.user);
  };

  const logout = () => {
    clearSession();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, verify, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
