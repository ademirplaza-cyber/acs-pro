import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellRing, Check, CheckCheck, Trash2, ExternalLink } from 'lucide-react';
import { api } from '../services/api';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';

interface NotificationItem {
  id: string;
  type: string;
  priority: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  action_url?: string;
  related_entity_type?: string;
}

const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Carrega notificações e inicia verificação periódica
  useEffect(() => {
    if (!user) return;

    const loadAndCheck = async () => {
      try {
        const isAdmin = user.role === 'ADMIN';
        await notificationService.runAllChecks(user.id, isAdmin);
        await loadNotifications();
      } catch (error) {
        console.error('Erro ao verificar notificações:', error);
      }
    };

    // Primeira verificação
    loadAndCheck();

    // Verificação a cada 5 minutos
    intervalRef.current = setInterval(loadAndCheck, 5 * 60 * 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const data = await api.getNotifications(user.id);
      setNotifications(data.slice(0, 20)); // Últimas 20
      const count = data.filter((n: NotificationItem) => !n.is_read).length;
      setUnreadCount(count);

      // Animação se tem novas
      if (count > 0) {
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 2000);
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  };

  const handleToggle = async () => {
    setIsOpen(!isOpen);
    if (!isOpen && notifications.length === 0) {
      setLoading(true);
      await loadNotifications();
      setLoading(false);
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

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await api.deleteNotification(id);
    const wasUnread = notifications.find((n) => n.id === id && !n.is_read);
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
      setIsOpen(false);
    }
  };

  const handleViewAll = () => {
    setIsOpen(false);
    navigate('/notifications');
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

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-700';
      case 'HIGH': return 'bg-orange-100 text-orange-700';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700';
      case 'LOW': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
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

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão do sininho */}
      <button
        onClick={handleToggle}
        className={`relative p-2 rounded-lg transition-all duration-200 ${
          isOpen
            ? 'bg-blue-100 text-blue-600'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
        } ${isAnimating ? 'animate-bounce' : ''}`}
        title="Notificações"
      >
        {unreadCount > 0 ? (
          <BellRing size={22} className={isAnimating ? 'text-orange-500' : ''} />
        ) : (
          <Bell size={22} />
        )}

        {/* Contador vermelho */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold text-white bg-red-500 rounded-full shadow-lg">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 max-h-[500px] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <div className="flex items-center gap-2">
              <Bell size={18} />
              <span className="font-semibold">Notificações</span>
              {unreadCount > 0 && (
                <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
                  {unreadCount} nova(s)
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs text-white/80 hover:text-white transition-colors"
                title="Marcar todas como lidas"
              >
                <CheckCheck size={14} />
                Ler todas
              </button>
            )}
          </div>

          {/* Lista de notificações */}
          <div className="max-h-[360px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                <span className="ml-2 text-sm text-gray-500">Carregando...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <Bell size={40} strokeWidth={1} />
                <p className="mt-2 text-sm">Nenhuma notificação</p>
                <p className="text-xs">Tudo tranquilo por aqui!</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleClickNotification(notification)}
                  className={`flex items-start gap-3 px-4 py-3 border-l-4 border-b border-gray-100 cursor-pointer transition-all duration-150 hover:brightness-95 ${
                    getPriorityColor(notification.priority)
                  } ${!notification.is_read ? 'font-medium' : 'opacity-70'}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className={`text-sm truncate ${!notification.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                        {notification.title}
                      </p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap ${getPriorityBadge(notification.priority)}`}>
                        {notification.priority === 'URGENT' ? 'Urgente' :
                         notification.priority === 'HIGH' ? 'Alta' :
                         notification.priority === 'MEDIUM' ? 'Média' : 'Baixa'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{notification.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-gray-400">{formatTime(notification.created_at)}</span>
                      {notification.action_url && (
                        <ExternalLink size={10} className="text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex flex-col gap-1 shrink-0">
                    {!notification.is_read && (
                      <button
                        onClick={(e) => handleMarkAsRead(notification.id, e)}
                        className="p-1 rounded hover:bg-white/50 text-gray-400 hover:text-green-600 transition-colors"
                        title="Marcar como lida"
                      >
                        <Check size={14} />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(notification.id, e)}
                      className="p-1 rounded hover:bg-white/50 text-gray-400 hover:text-red-600 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
              <button
                onClick={handleViewAll}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
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

export default NotificationBell;
