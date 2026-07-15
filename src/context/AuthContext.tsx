'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApiService } from '../services/auth.service';
import { MOCK_TOKEN_PREFIX } from '../mocks/authAccounts';
import type { AuthUser } from '../types/auth';

export type { AuthUser };

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const hydrate = async () => {
      try {
        const storedToken = localStorage.getItem('bnwems_token');
        const storedUser = localStorage.getItem('bnwems_user');
        if (!storedToken || !storedUser) return;

        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time session hydration from localStorage on mount, not a render loop
        setToken(storedToken);
        setUser(JSON.parse(storedUser));

        // Phiên đăng nhập ảo (xem src/mocks/authAccounts.ts) không có backend thật để xác thực lại —
        // tin thẳng dữ liệu đã lưu trong localStorage, bỏ qua bước gọi getProfile() bên dưới.
        if (storedToken.startsWith(MOCK_TOKEN_PREFIX)) return;

        // Re-validate the stored token against the current backend — a token
        // issued by a previously configured backend (e.g. after switching
        // NEXT_PUBLIC_API_BASE_URL) must not be trusted just because it exists.
        const profile = await authApiService.getProfile();
        setUser(profile.data);
      } catch {
        localStorage.removeItem('bnwems_token');
        localStorage.removeItem('bnwems_user');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    hydrate();
  }, []);

  const login = (newToken: string, newUser: AuthUser) => {
    localStorage.setItem('bnwems_token', newToken);
    localStorage.setItem('bnwems_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('bnwems_token');
    localStorage.removeItem('bnwems_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthContext must be used within AuthProvider');
  return context;
};
