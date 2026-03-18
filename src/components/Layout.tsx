import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  BarChart3,
  Bell,
  LogOut,
  Menu,
  X,
  Shield,
  MessageSquare,
  ChevronRight,
  WifiOff,
  CreditCard,
  Crown
} from 'lucide-react';
import { api } from '../services/api';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (user?.id) {
      api.getUnreadCount(user.id).then(count => setUnreadCount(count));
      const interval = setInterval(() => {
        api.getUnreadCount(user.id).then(count => setUnreadCount(count));
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  // Calcular dias restantes da assinatura
  useEffect(() => {
    if (user) {
      const createdAt = new Date(user.createdAt || Date.now());
      const expiresAt = user.subscriptionExpiresAt
        ? new Date(user.subscriptionExpiresAt)
        : new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
      const now = new Date();
      const diff = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      setDaysRemaining(diff);
    }
  }, [user]);

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

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'activated') {
                setShowUpdatePrompt(true);
              }
            });
          }
        });
      });
    }
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Famílias', href: '/families', icon: Users },
    { name: 'Visitas', href: '/visits', icon: ClipboardList },
    { name: 'Relatórios', href: '/reports', icon: BarChart3 },
    { name: 'Reunião', href: '/meeting', icon: MessageSquare },
    { name: 'Notificações', href: '/notifications', icon: Bell, badge: unreadCount },
  ];

  const bottomNav = [
    { name: 'Início', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Famílias', href: '/families', icon: Users },
    { name: 'Visitas', href: '/visits', icon: ClipboardList },
    { name: 'Alertas', href: '/notifications', icon: Bell, badge: unreadCount },
  ];

  const isActive = (href: string) => location.pathname === href;

  const pageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/families') return 'Famílias';
    if (path.startsWith('/families/')) return 'Detalhes da Família';
    if (path === '/visits') return 'Visitas';
    if (path === '/reports') return 'Relatórios';
    if (path === '/notifications') return 'Notificações';
    if (path === '/meeting') return 'Reunião';
    if (path === '/admin') return 'Administração';
    if (path === '/subscription') return 'Assinatura';
    return 'ACS Top';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Indicador offline */}
      {!isOnline && (
        <div className="bg-amber-500 text-white text-center py-1 px-4 text-sm flex items-center justify-center gap-2 fixed top-0 left-0 right-0 z-50">
          <WifiOff className="w-4 h-4" />
          <span>Sem conexão com a internet</span>
        </div>
      )}

      {/* Prompt de atualização */}
      {showUpdatePrompt && (
        <div className="bg-blue-600 text-white text-center py-2 px-4 text-sm fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-3">
          <span>Nova versão disponível!</span>
          <button
            onClick={() => window.location.reload()}
            className="bg-white text-blue-600 px-3 py-1 rounded text-xs font-semibold"
          >
            Atualizar
          </button>
        </div>
      )}

      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200 shadow-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-xl flex items-center justify-center">
            <span className="text-white text-lg">🏥</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800">ACS Top</h1>
            <p className="text-xs text-gray-500">Saúde da Família</p>
          </div>
        </div>

        {/* Perfil do usuário */}
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{user?.name || 'Usuário'}</p>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-xs text-gray-500">{isOnline ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          </div>

          {/* Badge de assinatura */}
          {daysRemaining !== null && (
            <button
              onClick={() => navigate('/subscription')}
              className={`mt-3 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                daysRemaining <= 0
                  ? 'bg-red-50 text-red-700 hover:bg-red-100'
                  : daysRemaining <= 7
                  ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  : 'bg-green-50 text-green-700 hover:bg-green-100'
              }`}
            >
              <Crown className="w-4 h-4" />
              <span>
                {daysRemaining <= 0
                  ? 'Assinatura expirada'
                  : daysRemaining <= 7
                  ? `Expira em ${daysRemaining} dia${daysRemaining !== 1 ? 's' : ''}`
                  : `${daysRemaining} dias restantes`
                }
              </span>
            </button>
          )}
        </div>

        {/* Navegação */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive(item.href)
                  ? 'bg-blue-50 text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive(item.href) ? 'text-blue-600' : 'text-gray-400'}`} />
              <span className="flex-1">{item.name}</span>
              {item.badge && item.badge > 0 ? (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              ) : null}
              {isActive(item.href) && <ChevronRight className="w-4 h-4 text-blue-400" />}
            </Link>
          ))}

          {/* Link Assinatura */}
          <Link
            to="/subscription"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              isActive('/subscription')
                ? 'bg-blue-50 text-blue-700 shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
            }`}
          >
            <CreditCard className={`w-5 h-5 ${isActive('/subscription') ? 'text-blue-600' : 'text-gray-400'}`} />
            <span className="flex-1">Assinatura</span>
            {isActive('/subscription') && <ChevronRight className="w-4 h-4 text-blue-400" />}
          </Link>

          {/* Admin */}
          {user?.role === UserRole.ADMIN && (
            <Link
              to="/admin"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive('/admin')
                  ? 'bg-blue-50 text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <Shield className={`w-5 h-5 ${isActive('/admin') ? 'text-blue-600' : 'text-gray-400'}`} />
              <span className="flex-1">Administração</span>
              {isActive('/admin') && <ChevronRight className="w-4 h-4 text-blue-400" />}
            </Link>
          )}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-72 bg-white shadow-xl z-50 flex flex-col">
            {/* Header mobile sidebar */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-green-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-sm">🏥</span>
                </div>
                <h1 className="text-lg font-bold text-gray-800">ACS Top</h1>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Perfil mobile */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{user?.name || 'Usuário'}</p>
                  <p className="text-xs text-gray-500">{user?.email || ''}</p>
                </div>
              </div>

              {daysRemaining !== null && (
                <button
                  onClick={() => { navigate('/subscription'); setSidebarOpen(false); }}
                  className={`mt-3 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    daysRemaining <= 0
                      ? 'bg-red-50 text-red-700'
                      : daysRemaining <= 7
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-green-50 text-green-700'
                  }`}
                >
                  <Crown className="w-4 h-4" />
                  <span>
                    {daysRemaining <= 0
                      ? 'Assinatura expirada'
                      : daysRemaining <= 7
                      ? `Expira em ${daysRemaining} dia${daysRemaining !== 1 ? 's' : ''}`
                      : `${daysRemaining} dias restantes`
                    }
                  </span>
                </button>
              )}
            </div>

            {/* Nav mobile */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive(item.href)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive(item.href) ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className="flex-1">{item.name}</span>
                  {item.badge && item.badge > 0 ? (
                    <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  ) : null}
                </Link>
              ))}

              <Link
                to="/subscription"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive('/subscription')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <CreditCard className={`w-5 h-5 ${isActive('/subscription') ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className="flex-1">Assinatura</span>
              </Link>

              {user?.role === UserRole.ADMIN && (
                <Link
                  to="/admin"
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive('/admin')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Shield className={`w-5 h-5 ${isActive('/admin') ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className="flex-1">Administração</span>
                </Link>
              )}
            </nav>

            <div className="p-3 border-t border-gray-100">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 w-full"
              >
                <LogOut className="w-5 h-5" />
                <span>Sair</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header mobile */}
        <header className={`bg-white border-b border-gray-200 sticky ${!isOnline ? 'top-7' : 'top-0'} z-30 lg:hidden`}>
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-lg font-semibold text-gray-800">{pageTitle()}</h1>
            <Link to="/notifications" className="p-2 rounded-lg hover:bg-gray-100 relative">
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          </div>
        </header>

        {/* Header desktop */}
        <header className={`bg-white border-b border-gray-200 sticky ${!isOnline ? 'top-7' : 'top-0'} z-30 hidden lg:block`}>
          <div className="flex items-center justify-between px-6 py-3">
            <h1 className="text-xl font-semibold text-gray-800">{pageTitle()}</h1>
            <div className="flex items-center gap-4">
              {!isOnline && (
                <div className="flex items-center gap-1 text-amber-600 text-sm">
                  <WifiOff className="w-4 h-4" />
                  <span>Offline</span>
                </div>
              )}
              <Link to="/notifications" className="p-2 rounded-lg hover:bg-gray-100 relative">
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </header>

        {/* Conteúdo da página */}
        <main className="p-4 lg:p-6 pb-20 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Bottom nav mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 lg:hidden">
        <div className="flex items-center justify-around py-2">
          {bottomNav.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg min-w-0 ${
                isActive(item.href) ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              <div className="relative">
                <item.icon className="w-5 h-5" />
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center" style={{ fontSize: '10px' }}>
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-xs truncate">{item.name}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
