/// <reference types="vite/client" />
import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_APP_URL ? `${import.meta.env.VITE_APP_URL}/api` : '/api';

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: Error) => void }> = [];

function processQueue(error: Error | null, token: string | null) {
  failedQueue.forEach(p => {
    if (error) p.reject(error);
    else if (token) p.resolve(token);
  });
  failedQueue = [];
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) throw new Error('No refresh token');

  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    useAuthStore.getState().logout();
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  const data = await response.json();
  useAuthStore.getState().setToken(data.data.token);
  return data.data.token;
}

export const api = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const token = useAuthStore.getState().token;

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

  // Auto-refresh on 401
  if (response.status === 401 && useAuthStore.getState().refreshToken) {
    if (isRefreshing) {
      // Queue this request
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: async (newToken: string) => {
            headers.set('Authorization', `Bearer ${newToken}`);
            const retryRes = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
            const retryData = await retryRes.json();
            if (!retryRes.ok) reject(new Error(retryData.error || 'Erro na requisição'));
            else resolve(retryData);
          },
          reject,
        });
      });
    }

    isRefreshing = true;
    try {
      const newToken = await refreshAccessToken();
      processQueue(null, newToken);
      isRefreshing = false;

      // Retry original request
      headers.set('Authorization', `Bearer ${newToken}`);
      response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    } catch (err) {
      processQueue(err as Error, null);
      isRefreshing = false;
      throw err;
    }
  }

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      useAuthStore.getState().logout();
    }
    throw new Error(data.error || 'Erro na requisição');
  }

  return data;
};
