import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../hooks/useAdminAuth';

interface AdminProtectedRouteProps {
    children: React.ReactNode;
}

export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
    const { isAuthenticated, loading } = useAdminAuth();

    if (loading) {
        return <div>Carregando...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/admin/login" replace />;
    }

    return <>{children}</>;
}
