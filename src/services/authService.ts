// src/services/authService.ts
import api from './api';

export interface User {
  id: string;
  email: string;
  tipo: 'parceiro' | 'admin';
  nome: string;
}

interface LoginCredentials {
  email: string;
  senha: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    tipo: 'parceiro' | 'admin';
    nome: string;
  };
}


export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await api.post('/parceiros/login', credentials);
    // Armazena o token e dados do usuário
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },


  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Opcional: chamar o endpoint de logout
    api.put('/parceiros/logout').catch(() => {});
  },

   getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as User;
    } catch {
      return null;
    }
  },
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }
};