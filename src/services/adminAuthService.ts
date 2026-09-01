import api from './api';

export interface AdminUser {
    id: string;
    nome: string;
    email: string;
    nivelAcesso?: string;
    ultimoAcesso: string;
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

interface UpdateAdminData {
    nome?: string;
    email?: string;
    senhaAtual?: string; 
    novaSenha?: string;  
    nivelAcesso?: string;
}

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
        if (response.data) {
            localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(response.data));
        }
        return response.data;
    },

    async updateAdmin(id: string | number, data: UpdateAdminData): Promise<AdminUser> {
        const response = await api.put<AdminUser>(`/admin/admins/${id}`, data);
        
        const currentAdmin = this.getCurrentAdmin();
        if (currentAdmin && String(currentAdmin.id) === String(id)) {
            const updatedUser = { ...currentAdmin, ...response.data };
            localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(updatedUser));
        }

        return response.data;
    },

    async atualizarPerfil(data: { nome: string; email: string }): Promise<AdminUser> {
        const admin = this.getCurrentAdmin();
        if (!admin) throw new Error("Usuário não autenticado.");
        return this.updateAdmin(admin.id, data);
    },

    async alterarSenha(data: { senhaAtual: string; novaSenha: string }): Promise<AdminUser> {
            const admin = this.getCurrentAdmin();
            if (!admin) throw new Error("Usuário não autenticado.");
            
            return this.updateAdmin(admin.id, { 
                senhaAtual: data.senhaAtual, 
                novaSenha: data.novaSenha 
            });
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