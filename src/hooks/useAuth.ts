import { useState, useEffect } from 'react';
import { authService } from '../services/authService';

export interface User {
  id: string;
  email: string;
  tipo: 'parceiro' | 'admin';
  nome: string;
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null); // Tipagem correta

  useEffect(() => {
    const checkAuth = () => {
      const isAuth = authService.isAuthenticated();
      const currentUser = authService.getCurrentUser();
      setIsAuthenticated(isAuth);
      setUser(currentUser);
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, senha: string) => {
    try {
      const response = await authService.login({ email, senha });
      setIsAuthenticated(true);
      setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  };
  
  const logout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  const register = async (data: any) => {
    try {
      await authService.register(data)
    } catch (error) {
      throw error
    }
  }

  return {
    isAuthenticated,
    loading,
    user,
    login,
    logout,
    register
  }

}