import api from './api';

export interface AdminUser {
    id: string;
    nome: string;
    email: string;
    nivelAcesso?: string;
}

interface AdminLoginCredentials {
    email: string;
    senha: string;
}

interface AdminLoginResponse {
    token: string;
    usuario: {
        id: string;
        nome: string;
        email: string;
    };
}

// Chaves próprias no localStorage — não podem ser as mesmas do authService de parceiro,
// senão logar como admin derruba a sessão de parceiro no mesmo navegador (e vice-versa).
const ADMIN_TOKEN_KEY = 'admin_token';
const ADMIN_USER_KEY = 'admin_user';

export const adminAuthService = {
    async login(credentials: AdminLoginCredentials): Promise<AdminLoginResponse> {
        const response = await api.post<AdminLoginResponse>('/admin/login', credentials);
        if (response.data.token) {
            localStorage.setItem(ADMIN_TOKEN_KEY, response.data.token);
            localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(response.data.usuario));
        }
        return response.data;
    },

    async getMe(): Promise<AdminUser> {
        const response = await api.get<AdminUser>('/admin/me');
        return response.data;
    },

    getToken(): string | null {
        return localStorage.getItem(ADMIN_TOKEN_KEY);
    },

    getCurrentAdmin(): AdminUser | null {
        const userStr = localStorage.getItem(ADMIN_USER_KEY);
        if (!userStr) return null;
        try {
            return JSON.parse(userStr) as AdminUser;
        } catch {
            return null;
        }
    },

    isAuthenticated(): boolean {
        return !!localStorage.getItem(ADMIN_TOKEN_KEY);
    },

    logout(): void {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        localStorage.removeItem(ADMIN_USER_KEY);
    },
};