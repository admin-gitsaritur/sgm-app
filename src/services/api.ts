import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_APP_URL ? \`\${import.meta.env.VITE_APP_URL}/api\` : '/api';

export const api = async (endpoint: string, options: RequestInit = {}) => {
  const token = useAuthStore.getState().token;
  
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', \`Bearer \${token}\`);
  }

  const response = await fetch(\`\${API_URL}\${endpoint}\`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      useAuthStore.getState().logout();
    }
    throw new Error(data.error || 'Erro na requisição');
  }

  return data;
};
