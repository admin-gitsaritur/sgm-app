import { create } from 'zustand';

interface User {
  id: string;
  nome: string;
  email: string;
  role: string;
  avatar?: string;
  departamento?: string;
  cargo?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  deveTrocarSenha: boolean;
  login: (user: User, token: string, refreshToken: string, deveTrocarSenha?: boolean) => void;
  setToken: (token: string) => void;
  clearDeveTrocarSenha: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: !!localStorage.getItem('token'),
  deveTrocarSenha: localStorage.getItem('deveTrocarSenha') === 'true',
  login: (user, token, refreshToken, deveTrocarSenha = false) => {
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('deveTrocarSenha', String(deveTrocarSenha));
    set({ user, token, refreshToken, isAuthenticated: true, deveTrocarSenha });
  },
  setToken: (token) => {
    localStorage.setItem('token', token);
    set({ token });
  },
  clearDeveTrocarSenha: () => {
    localStorage.setItem('deveTrocarSenha', 'false');
    set({ deveTrocarSenha: false });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('deveTrocarSenha');
    set({ user: null, token: null, refreshToken: null, isAuthenticated: false, deveTrocarSenha: false });
  },
}));
