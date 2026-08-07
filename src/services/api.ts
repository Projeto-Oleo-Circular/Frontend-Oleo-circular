import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar o token correto em cada requisição
api.interceptors.request.use(
  (config) => {
    // Identifica se a navegação atual ou a rota da API pertence ao admin
    const isAdminRoute =
      window.location.pathname.startsWith('/admin') ||
      config.url?.startsWith('/admin');

    const tokenKey = isAdminRoute ? 'admin_token' : 'token';
    const token = localStorage.getItem(tokenKey);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para tratar erros de autenticação separando Admin e Parceiro
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAdminRoute =
        window.location.pathname.startsWith('/admin') ||
        error.config?.url?.startsWith('/admin');

      if (isAdminRoute) {
        // Limpa apenas as chaves da sessão de admin
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');

        if (window.location.pathname !== '/admin/login') {
          window.location.href = '/admin/login';
        }
      } else {
        // Limpa a sessão padrão de parceiro
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;