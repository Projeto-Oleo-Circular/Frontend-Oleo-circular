import { useState, useEffect } from 'react';
import { adminAuthService, type AdminUser } from '../services/adminAuthService';

export function useAdminAuth() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [admin, setAdmin] = useState<AdminUser | null>(null);

    useEffect(() => {
        const checkAuth = () => {
            const isAuth = adminAuthService.isAuthenticated();
            const currentAdmin = adminAuthService.getCurrentAdmin();
            setIsAuthenticated(isAuth);
            setAdmin(currentAdmin);
            setLoading(false);
        };

        checkAuth();
    }, []);

    const login = async (email: string, senha: string) => {
        try {
            const response = await adminAuthService.login({ email, senha });
            setIsAuthenticated(true);
            setAdmin(response.usuario as AdminUser);
            return response;
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        adminAuthService.logout();
        setIsAuthenticated(false);
        setAdmin(null);
    };

    return {
        isAuthenticated,
        loading,
        admin,
        login,
        logout,
    };
}