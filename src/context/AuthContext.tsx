import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { User, UserRole, UserStatus } from '../types';
import { api } from '../services/api';
import { notificationService } from '../services/notificationService';

// ============================================
// CONTEXTO DE AUTENTICAÇÃO
// Login e registro agora usam Supabase (nuvem)
// + Notificações automáticas após login
// ============================================

interface RegisterExtraData {
  cpf?: string;
  address?: string;
  cityState?: string;
  healthUnit?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, extraData?: RegisterExtraData) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Intervalo de checagem de notificações (30 minutos)
const NOTIFICATION_CHECK_INTERVAL = 30 * 60 * 1000;

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const notificationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notificationCheckRunning = useRef(false);

  // ============================================
  // NOTIFICAÇÕES AUTOMÁTICAS
  // ============================================
  const runNotificationCheck = useCallback(async (currentUser: User) => {
    if (notificationCheckRunning.current) return;
    if (!currentUser || !currentUser.id) return;

    try {
      notificationCheckRunning.current = true;
      const isAdmin = currentUser.role === UserRole.ADMIN;
      console.log(`🔔 Checagem automática de notificações (${isAdmin ? 'ADMIN' : 'AGENTE'})...`);
      await notificationService.runAllChecks(currentUser.id, isAdmin);
    } catch (error) {
      console.error('❌ Erro na checagem automática de notificações:', error);
    } finally {
      notificationCheckRunning.current = false;
    }
  }, []);

  const startNotificationScheduler = useCallback((currentUser: User) => {
    // Limpar intervalo anterior se existir
    if (notificationIntervalRef.current) {
      clearInterval(notificationIntervalRef.current);
      notificationIntervalRef.current = null;
    }

    // Executar primeira checagem após 5 segundos (dar tempo da UI carregar)
    setTimeout(() => {
      runNotificationCheck(currentUser);
    }, 5000);

    // Agendar checagens periódicas a cada 30 minutos
    notificationIntervalRef.current = setInterval(() => {
      runNotificationCheck(currentUser);
    }, NOTIFICATION_CHECK_INTERVAL);

    console.log('⏰ Scheduler de notificações iniciado (a cada 30min)');
  }, [runNotificationCheck]);

  const stopNotificationScheduler = useCallback(() => {
    if (notificationIntervalRef.current) {
      clearInterval(notificationIntervalRef.current);
      notificationIntervalRef.current = null;
      console.log('⏰ Scheduler de notificações parado');
    }
    notificationService.clearCache();
  }, []);

  // ============================================
  // INICIALIZAR — restaurar sessão salva
  // ============================================
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedUser = localStorage.getItem('acs_current_user');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          console.log('🔄 Sessão local encontrada para:', parsed.name);

          // Tentar buscar dados atualizados do Supabase
          try {
            const freshUser = await api.getUserById(parsed.id);
            if (freshUser) {
              console.log('☁️ Dados atualizados do Supabase:', freshUser.name, freshUser.status);
              setUser(freshUser);
              localStorage.setItem('acs_current_user', JSON.stringify(freshUser));
              startNotificationScheduler(freshUser);
            } else {
              // Usuário não existe mais no banco — manter local como fallback
              console.log('⚠️ Usuário não encontrado no Supabase, usando dados locais');
              setUser(parsed);
              startNotificationScheduler(parsed);
            }
          } catch (networkError) {
            // Sem internet — usar dados locais
            console.log('📴 Sem conexão, usando sessão local');
            setUser(parsed);
            // Não inicia scheduler sem internet
          }
        }
      } catch (error) {
        console.error('❌ Erro ao restaurar sessão:', error);
        localStorage.removeItem('acs_current_user');
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();

    // Cleanup ao desmontar
    return () => {
      stopNotificationScheduler();
    };
  }, []);

  // ============================================
  // LOGIN — busca usuário no Supabase
  // ============================================
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 Tentando login:', email);

      // Buscar usuário no Supabase pelo email
      const foundUser = await api.getUserByEmail(email);

      if (!foundUser) {
        console.log('❌ Usuário não encontrado no Supabase:', email);
        return false;
      }

      // Verificar senha
      if (foundUser.password !== password) {
        console.log('❌ Senha incorreta para:', email);
        return false;
      }

      // Login bem-sucedido
      setUser(foundUser);
      localStorage.setItem('acs_current_user', JSON.stringify(foundUser));
      console.log('✅ Usuário carregado:', foundUser.name, `(${foundUser.role})`);

      // Iniciar notificações automáticas
      startNotificationScheduler(foundUser);

      return true;

    } catch (error) {
      console.error('❌ Erro no login:', error);

      // FALLBACK OFFLINE — tentar login com dados locais
      console.log('📴 Tentando login offline...');
      try {
        const savedUser = localStorage.getItem('acs_current_user');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          if (parsed.email === email.toLowerCase().trim() && parsed.password === password) {
            console.log('✅ Login offline bem-sucedido:', parsed.name);
            setUser(parsed);
            return true;
          }
        }
      } catch (offlineError) {
        console.error('❌ Erro no login offline:', offlineError);
      }

      return false;
    }
  };

  // ============================================
  // REGISTRO — cria usuário no Supabase
  // ============================================
  const register = async (
    name: string,
    email: string,
    password: string,
    extraData?: RegisterExtraData
  ): Promise<boolean> => {
    try {
      console.log('📝 Registrando novo usuário:', email);

      // Verificar se email já existe no Supabase
      const existingUser = await api.getUserByEmail(email);
      if (existingUser) {
        console.log('❌ Email já cadastrado no Supabase:', email);
        return false;
      }

      // Criar novo usuário com dados completos
      const newUser: User = {
        id: '',
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: password,
        role: UserRole.AGENT,
        status: UserStatus.PENDING,
        subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        acceptedTermsAt: '',
        createdAt: new Date().toISOString(),
        cpf: extraData?.cpf || '',
        address: extraData?.address || '',
        cityState: extraData?.cityState || '',
        healthUnit: extraData?.healthUnit || '',
      };

      // Salvar no Supabase (o banco gera o ID automaticamente)
      const savedData = await api.saveUser(newUser);
      console.log('✅ Usuário registrado no Supabase:', savedData);

      return true;

    } catch (error) {
      console.error('❌ Erro no registro:', error);
      return false;
    }
  };

  // ============================================
  // LOGOUT
  // ============================================
  const logout = () => {
    console.log('🚪 Logout:', user?.name);
    stopNotificationScheduler();
    setUser(null);
    localStorage.removeItem('acs_current_user');
    window.location.hash = '#/home';
  };

  // ============================================
  // REFRESH — atualizar dados do usuário
  // ============================================
  const refreshUser = useCallback(async () => {
    if (user) {
      try {
        const updated = await api.getUserById(user.id);
        if (updated) {
          console.log('🔄 Dados do usuário atualizados:', updated.name, updated.status);
          setUser(updated);
          localStorage.setItem('acs_current_user', JSON.stringify(updated));
        }
      } catch (error) {
        console.log('📴 Sem conexão para atualizar usuário, mantendo dados locais');
      }
    }
  }, [user]);

  // Auto-refresh a cada 5 minutos
  useEffect(() => {
    if (user) {
      const interval = setInterval(refreshUser, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user, refreshUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
