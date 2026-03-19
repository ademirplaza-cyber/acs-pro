import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { api } from '../services/api';
import { notificationService } from '../services/notificationService';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  UserCog, 
  LogOut, 
  Menu,
  Activity,
  X,
  Bell,
  BellRing,
  PieChart,
  WifiOff,
  Check,
  Trash2,
  ExternalLink,
  CheckCheck,
  CreditCard,
  Crown,
  MessageSquare,
  UserCircle
} from 'lucide-react';

interface NotificationItem {
  id: string;
  type: string;
  priority: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  action_url?: string;
}

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

  const getDaysRemaining = () => {
    if (!user?.subscriptionExpiresAt || user.role === UserRole.ADMIN) return null;
    const expiration = new Date(user.subscriptionExpiresAt);
    const today = new Date();
    const diff = expiration.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const daysRemaining = getDaysRemaining();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user) return;

    const loadAndCheck = async () => {
      try {
        if (isOnline) {
          const isAdmin = user.role === 'ADMIN';
          await notificationService.runAllChecks(user.id, isAdmin);
        }
        await loadNotifications();
      } catch (error) {
        console.error('Erro ao verificar notificações:', error);
      }
    };

    loadAndCheck();

    const interval = setInterval(loadAndCheck, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user, isOnline]);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const data = await api.getNotifications(user.id);
      setNotifications(data.slice(0, 15));
      const count = data.filter((n: NotificationItem) => !n.is_read).length;
      
      if (count > unreadCount && unreadCount > 0) {
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 2000);
      }
      setUnreadCount(count);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  };

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await api.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await api.markAllAsRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleDeleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const wasUnread = notifications.find((n) => n.id === id && !n.is_read);
    await api.deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleClickNotification = (notification: NotificationItem) => {
    if (!notification.is_read) {
      api.markAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    if (notification.action_url) {
      navigate(notification.action_url);
      setIsDropdownOpen(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'border-l-red-500 bg-red-50';
      case 'HIGH': return 'border-l-orange-500 bg-orange-50';
      case 'MEDIUM': return 'border-l-yellow-500 bg-yellow-50';
      case 'LOW': return 'border-l-blue-500 bg-blue-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Agora';
    if (diffMin < 60) return `${diffMin}min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('pt-BR');
  };

  const NotificationBellComponent = ({ isMobile = false }: { isMobile?: boolean }) => {
    return (
      <div className="relative" ref={!isMobile ? dropdownRef : undefined}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`relative p-2 rounded-lg transition-all duration-200 ${
            isDropdownOpen
              ? 'bg-blue-100 text-blue-600'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
          } ${isAnimating ? 'animate-bounce' : ''}`}
          title={unreadCount > 0 ? `${unreadCount} notificação(ões) não lida(s)` : 'Notificações'}
        >
          {unreadCount > 0 ? (
            <BellRing size={22} className={isAnimating ? 'text-orange-500' : ''} />
          ) : (
            <Bell size={22} />
          )}

          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full shadow-lg">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {isDropdownOpen && (
          <div className={`absolute ${isMobile ? 'right-0' : 'right-0'} top-full mt-2 w-80 sm:w-96 max-h-[450px] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden`}>
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <div className="flex items-center gap-2">
                <Bell size={16} />
                <span className="font-semibold text-sm">Notificações</span>
                {unreadCount > 0 && (
                  <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-xs text-white/80 hover:text-white"
                >
                  <CheckCheck size={14} />
                  Ler todas
                </button>
              )}
            </div>

            <div className="max-h-[320px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <Bell size={36} strokeWidth={1} />
                  <p className="mt-2 text-sm">Nenhuma notificação</p>
                  <p className="text-xs">Tudo tranquilo!</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleClickNotification(notification)}
                    className={`flex items-start gap-2 px-3 py-2.5 border-l-4 border-b border-gray-100 cursor-pointer transition-all hover:brightness-95 ${
                      getPriorityColor(notification.priority)
                    } ${!notification.is_read ? 'font-medium' : 'opacity-60'}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs truncate ${!notification.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                        {notification.title}
                      </p>
                      <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">{notification.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-gray-400">{formatTime(notification.created_at)}</span>
                        {notification.action_url && <ExternalLink size={9} className="text-gray-400" />}
                      </div>
                    </div>
                    <div className="flex flex-col gap-0.5 shrink-0">
                      {!notification.is_read && (
                        <button
                          onClick={(e) => handleMarkAsRead(notification.id, e)}
                          className="p-1 rounded hover:bg-white/50 text-gray-400 hover:text-green-600"
                          title="Marcar como lida"
                        >
                          <Check size={12} />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDeleteNotification(notification.id, e)}
                        className="p-1 rounded hover:bg-white/50 text-gray-400 hover:text-red-600"
                        title="Excluir"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                <button
                  onClick={() => { navigate('/notifications'); setIsDropdownOpen(false); }}
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Ver todas as notificações →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const NavItem = ({ to, icon: Icon, label, mobile }: { to: string; icon: any; label: string; mobile?: boolean }) => (
    <Link
      to={to}
      className={`flex items-center transition-colors ${
        mobile 
          ? `flex-col justify-center space-y-1 flex-1 py-2 h-full ${isActive(to) ? 'text-blue-600' : 'text-slate-500'}`
          : `space-x-3 px-4 py-4 md:py-3 rounded-xl mb-1 ${
              isActive(to) 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                : 'text-slate-600 hover:bg-slate-100'
            }`
      }`}
      onClick={() => setIsSidebarOpen(false)}
    >
      <Icon size={mobile ? 24 : 22} className={!mobile && isActive(to) ? 'text-white' : ''} />
      <span className={`${mobile ? 'text-[10px] font-bold uppercase tracking-tighter' : 'font-medium text-base'}`}>{label}</span>
      {mobile && isActive(to) && <span className="absolute bottom-1 w-1 h-1 bg-blue-600 rounded-full"></span>}
    </Link>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Header Mobile */}
      <div className="md:hidden fixed w-full bg-white shadow-sm z-30 h-16 flex items-center justify-between px-4 transition-all">
        <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-3 -ml-3 text-slate-600 hover:bg-slate-100 rounded-full"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        
        <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
              <Activity size={18} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-xl text-blue-600">ACS Top</span>
        </div>

        <div className="flex items-center space-x-1">
          {!isOnline && <WifiOff size={18} className="text-orange-500" />}
          <NotificationBellComponent isMobile={true} />
        </div>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 w-[280px] bg-white shadow-2xl md:shadow-none transform transition-transform duration-300 ease-out z-40 flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-100 hidden md:flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
              <Activity size={22} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
                <span className="text-2xl font-bold text-blue-600 block leading-none">ACS Top</span>
                <p className="text-xs text-slate-400 font-medium">Saúde Integrada</p>
            </div>
          </div>
        </div>

        <div className="md:hidden p-4 border-b border-slate-100 flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                <Activity size={18} className="text-white" strokeWidth={2.5} />
              </div>
              <span className="text-xl font-bold text-blue-600">Menu</span>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 -mr-2 text-slate-400 hover:text-slate-600"
            >
              <X size={24} />
            </button>
        </div>

        {/* Menu Items */}
        <div className="p-4 flex flex-col flex-1 overflow-y-auto">
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/reports" icon={PieChart} label="Relatórios e Grupos" />
          <NavItem to="/visits" icon={ClipboardList} label="Visitas Pendentes" />
          <NavItem to="/families" icon={Users} label="Famílias & Pacientes" />
          <NavItem to="/meeting" icon={MessageSquare} label="Reunião" />
          <NavItem to="/notifications" icon={Bell} label="Notificações" />
          <NavItem to="/profile" icon={UserCircle} label="Meu Perfil" />
          <NavItem to="/subscription" icon={CreditCard} label="Assinatura" />
          
          {user?.role === UserRole.ADMIN && (
            <div className="pt-4 mt-4 border-t border-slate-100">
              <p className="px-4 text-xs font-semibold text-slate-400 uppercase mb-2">Administração</p>
              <NavItem to="/admin" icon={UserCog} label="Gerenciar Agentes" />
            </div>
          )}
        </div>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 safe-area-bottom">
          {daysRemaining !== null && (
            <button
              onClick={() => { navigate('/subscription'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium mb-3 transition-colors ${
                daysRemaining <= 0
                  ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                  : daysRemaining <= 7
                  ? 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'
                  : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
              }`}
            >
              <Crown size={14} />
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

          <div className="hidden md:flex items-center justify-between mb-4 px-2 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-slate-600">Notificações</span>
                {!isOnline && <WifiOff size={16} className="text-orange-500" />}
              </div>
              <NotificationBellComponent />
          </div>

          <button
            onClick={() => { navigate('/profile'); setIsSidebarOpen(false); }}
            className="flex items-center space-x-3 mb-4 px-2 w-full hover:bg-white rounded-xl p-2 transition-colors cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.role === UserRole.ADMIN ? 'Administrador' : 'Agente de Saúde'}</p>
            </div>
          </button>
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors shadow-sm font-medium"
          >
            <LogOut size={18} />
            <span>Sair do Sistema</span>
          </button>
        </div>
      </aside>

      {/* Overlay Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Conteúdo Principal */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pt-16 md:pt-0 pb-20 md:pb-0 bg-slate-50">
        <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-full">
          {daysRemaining !== null && daysRemaining <= 7 && daysRemaining >= 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Bell size={20} className="text-orange-600" />
              </div>
              <div>
                <p className="font-semibold text-orange-800 text-sm">Assinatura expirando</p>
                <p className="text-xs text-orange-600">
                  Sua assinatura expira em {daysRemaining} dia(s). Entre em contato com o administrador.
                </p>
              </div>
            </div>
          )}

          {!isOnline && (
            <div className="bg-slate-800 text-white p-4 rounded-xl mb-6 flex items-center shadow-lg">
              <div className="bg-orange-500 p-2 rounded-lg mr-3">
                <WifiOff size={20} />
              </div>
              <div>
                <p className="font-semibold text-sm">Modo Offline Ativo</p>
                <p className="text-xs text-slate-300 mt-1">
                  Os dados serão sincronizados quando houver conexão.
                </p>
              </div>
            </div>
          )}

          {children}
        </div>
      </main>

      {/* Navegação Mobile Bottom */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-16 flex items-center justify-around z-30 safe-area-bottom shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
        <NavItem to="/" icon={LayoutDashboard} label="Início" mobile />
        <NavItem to="/visits" icon={ClipboardList} label="Visitas" mobile />
        <NavItem to="/families" icon={Users} label="Famílias" mobile />
        <NavItem to="/reports" icon={PieChart} label="Relatórios" mobile />
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="flex flex-col items-center justify-center space-y-1 flex-1 py-2 h-full text-slate-500 relative"
        >
          <Menu size={24} />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Mais</span>
          {(unreadCount > 0 || !isOnline) && (
            <span className={`absolute top-1 right-4 w-2.5 h-2.5 rounded-full ${unreadCount > 0 ? 'bg-red-500' : 'bg-orange-500'}`}></span>
          )}
        </button>
      </nav>
    </div>
  );
};

export { Layout };
export default Layout;
