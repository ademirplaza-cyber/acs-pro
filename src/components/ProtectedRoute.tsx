import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import Layout from './Layout';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Verificar se a assinatura expirou (não bloquear admin nem a página de assinatura)
  if (user.role !== UserRole.ADMIN && location.pathname !== '/subscription') {
    const createdAt = new Date(user.createdAt || Date.now());
    const expiresAt = user.subscriptionExpiresAt
      ? new Date(user.subscriptionExpiresAt)
      : new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);

    const now = new Date();
    if (now > expiresAt) {
      return <Navigate to="/subscription" replace />;
    }
  }

  // Verificar role
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Layout>{children}</Layout>;
}
