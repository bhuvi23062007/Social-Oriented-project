import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import { api, getApiError, setApiToken } from './api';
import type { AuthState, Role } from './types';

type JwtPayload = { sub: string; email: string; role: Role; name?: string };
interface AuthValue {
  auth: AuthState | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<AuthState>;
  register: (name: string, email: string, password: string) => Promise<AuthState>;
  logout: () => Promise<void>;
}
const AuthContext = createContext<AuthValue | undefined>(undefined);
const STORE_KEY = 'cleancity.auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    SecureStore.getItemAsync(STORE_KEY)
      .then((raw) => {
        if (!mounted) return;
        if (raw) {
          const saved = JSON.parse(raw) as AuthState;
          setAuth(saved);
          setApiToken(saved.token);
        }
      })
      .catch(() => undefined)
      .finally(() => { if (mounted) setReady(true); });
    return () => { mounted = false; };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const token = String(res.data.access_token);
      const payload = jwtDecode<JwtPayload>(token);
      const next: AuthState = {
        userId: payload.sub,
        name: payload.name ?? email,
        email: payload.email ?? email,
        role: payload.role,
        token,
      };
      setApiToken(token);
      await SecureStore.setItemAsync(STORE_KEY, JSON.stringify(next));
      setAuth(next);
      return next;
    } catch (error) {
      throw new Error(getApiError(error, 'Login failed'));
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      await api.post('/auth/register', { name, email, password });
      return await login(email, password);
    } catch (error) {
      throw new Error(getApiError(error, 'Registration failed'));
    }
  };

  const logout = async () => {
    setApiToken(null);
    setAuth(null);
    await SecureStore.deleteItemAsync(STORE_KEY).catch(() => undefined);
  };

  const value = useMemo(() => ({ auth, ready, login, register, logout }), [auth, ready]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
