import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserStatus } from '../types';
import { Layout } from './Layout';
import { Clock, Ban, UserCog, Shield, WifiOff, RefreshCw } from 'lucide-react';

// ============================================
// PROTEÇÃO DE ROTAS
// Verifica autenticação, status e assinatura
// Agora usando dados do Supabase
// ============================================

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutos
const OFFLINE_GRACE_PERIOD = 2 * 24 * 60 * 60 * 1000; // 2 dias

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, isAuthenticated, isLoading, refreshUser, logout } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Monitorar conexão
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-refresh a cada 5 minutos quando online
  useEffect(() => {
    if (isAuthenticated && isOnline) {
      const interval = setInterval(() => {
        console.log('🔄 Auto-refresh dos dados do usuário...');
        refreshUser();
      }, REFRESH_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, isOnline, refreshUser]);

  // Refresh manual
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshUser();
    } catch (error) {
      console.error('Erro ao atualizar:', error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  // ============================================
  // LOADING
  // ============================================
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
          <p className="text-gray-400 text-sm mt-1">Verificando sua sessão</p>
        </div>
      </div>
    );
  }

  // ============================================
  // NÃO AUTENTICADO — redirecionar para login
  // ============================================
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // ============================================
  // VERIFICAR ROLE REQUERIDA
  // ============================================
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  // ============================================
  // USUÁRIO PENDENTE — aguardando aprovação
  // ============================================
  if (user.status === UserStatus.PENDING) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Conta Pendente</h2>
          <p className="text-gray-600 mb-4">
            Olá, <strong>{user.name}</strong>! Sua conta foi criada com sucesso.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            O administrador precisa aprovar seu acesso antes de você utilizar o sistema.
            Isso geralmente leva algumas horas.
          </p>

          {/* Indicador de conexão */}
          <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm mb-4 ${
            isOnline ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {isOnline ? '☁️ Conectado à nuvem' : '📴 Sem conexão'}
          </div>

          <div className="space-y-3">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="w-full py-3 px-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Verificando...' : 'Verificar aprovação'}
            </button>
            <button
              onClick={logout}
              className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all"
            >
              Sair da conta
            </button>
          </div>

          <div className="mt-6 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">
              <UserCog className="w-4 h-4 inline mr-1" />
              Caso precise de acesso urgente, entre em contato com o administrador do sistema.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // USUÁRIO BLOQUEADO
  // ============================================
  if (user.status === UserStatus.BLOCKED) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <Ban className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Acesso Bloqueado</h2>
          <p className="text-gray-600 mb-4">
            Olá, <strong>{user.name}</strong>. Sua conta foi bloqueada pelo administrador.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Se você acredita que isso é um erro, entre em contato com o administrador do sistema
            para resolver a situação.
          </p>

          <div className="space-y-3">
            <a
              href="https://wa.me/5511999999999?text=Olá, minha conta no ACS TOP foi bloqueada. Pode verificar?"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
            >
              Contatar via WhatsApp
            </a>
            <button
              onClick={logout}
              className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all"
            >
              Sair da conta
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // VERIFICAR ASSINATURA
  // ============================================
  if (user.subscriptionExpiresAt) {
    const expirationDate = new Date(user.subscriptionExpiresAt);
    const now = new Date();

    // Assinatura expirada
    if (expirationDate < now) {
      // Se offline, dar período de graça de 2 dias
      if (!isOnline) {
        const lastSync = localStorage.getItem('acs_last_sync');
        if (lastSync) {
          const lastSyncDate = new Date(lastSync);
          const timeSinceSync = now.getTime() - lastSyncDate.getTime();
          if (timeSinceSync < OFFLINE_GRACE_PERIOD) {
            console.log('📴 Modo offline com período de graça ativo');
            return (
              <Layout>
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
                  <WifiOff className="w-5 h-5 text-yellow-600" />
                  <span className="text-yellow-700 text-sm">
                    Modo offline — sua assinatura precisa ser renovada quando conectar à internet.
                  </span>
                </div>
                {children}
              </Layout>
            );
          }
        }
      }

      // Assinatura expirada e online
      return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
              <Shield className="w-8 h-8 text-orange-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Assinatura Expirada</h2>
            <p className="text-gray-600 mb-4">
              Olá, <strong>{user.name}</strong>. Sua assinatura expirou em{' '}
              <strong>{expirationDate.toLocaleDateString('pt-BR')}</strong>.
            </p>
            <p className="text-gray-500 text-sm mb-6">
              Para continuar usando o sistema, é necessário renovar sua assinatura.
              Entre em contato com o administrador.
            </p>

            <div className="space-y-3">
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Verificando...' : 'Verificar renovação'}
              </button>
              <a
                href="https://wa.me/5511986373147?text=Olá, preciso renovar minha assinatura do ACS TOP."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
              >
                Contatar via WhatsApp
              </a>
              <button
                onClick={logout}
                className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all"
              >
                Sair da conta
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  // ============================================
  // SALVAR TIMESTAMP DO ÚLTIMO ACESSO ONLINE
  // ============================================
  if (isOnline) {
    localStorage.setItem('acs_last_sync', new Date().toISOString());
  }

  // ============================================
  // TUDO OK — renderizar a página
  // ============================================
  return <Layout>{children}</Layout>;
};
