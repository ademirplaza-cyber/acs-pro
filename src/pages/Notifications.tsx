import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Trash2,
  RefreshCw,
  Search,
  ExternalLink,
  AlertTriangle,
  Calendar,
  Home,
  Heart,
  Baby,
  Droplets,
  UserCheck,
  Clock,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
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
  related_entity_id?: string;
  related_entity_type?: string;
}

type FilterTab = 'ALL' | 'UNREAD' | 'URGENT' | 'VISITS' | 'HEALTH' | 'SYSTEM';

const Notifications: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadNotifications();
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await api.getNotifications(user.id);
      setNotifications(data);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!user) return;
    setRefreshing(true);
    setMessage('');
    try {
      notificationService.clearCache();
      const isAdmin = user.role === 'ADMIN';
      const count = await notificationService.runAllChecks(user.id, isAdmin);
      await loadNotifications();
      setMessage(`✅ Verificação concluída! ${count} notificação(ões) não lida(s).`);
    } catch (error) {
      setMessage('❌ Erro ao atualizar notificações.');
    } finally {
      setRefreshing(false);
      setTimeout(() => setMessage(''), 4000);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    await api.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await api.markAllAsRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setMessage('✅ Todas as notificações marcadas como lidas.');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleDelete = async (id: string) => {
    await api.deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClearRead = async () => {
    if (!user) return;
    await api.clearReadNotifications(user.id);
    setNotifications((prev) => prev.filter((n) => !n.is_read));
    setShowDeleteConfirm(false);
    setMessage('✅ Notificações lidas removidas.');
    setTimeout(() => setMessage(''), 3000);
  };

  // ============================================
  // CORREÇÃO: navegar para a entidade específica
  // ============================================
    const handleClickNotification = (notification: NotificationItem) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }

    const entityId = notification.related_entity_id;
    const entityType = notification.related_entity_type;

    // Navegar para a família específica
    if (entityId && entityType === 'family') {
      navigate(`/families/${entityId}`);
      return;
    }
    // Visita: ir para visitas
    if (entityId && entityType === 'visit') {
      navigate('/visits');
      return;
    }
    // Usuário (admin): ir para admin
    if (entityId && entityType === 'user') {
      navigate('/admin');
      return;
    }

    // Fallback: usa action_url se existir
    if (notification.action_url) {
      navigate(notification.action_url);
      return;
    }

    // Último fallback
    navigate('/dashboard');
  };


  // Filtros
  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications];

    switch (activeFilter) {
      case 'UNREAD':
        filtered = filtered.filter((n) => !n.is_read);
        break;
      case 'URGENT':
        filtered = filtered.filter((n) => n.priority === 'URGENT' || n.priority === 'HIGH');
        break;
      case 'VISITS':
        filtered = filtered.filter((n) =>
          ['OVERDUE_VISIT', 'UPCOMING_VISIT', 'FAMILY_NO_VISIT'].includes(n.type)
        );
        break;
      case 'HEALTH':
        filtered = filtered.filter((n) =>
          ['PREGNANT_NO_CARE', 'HYPERTENSIVE_NO_CARE', 'DIABETIC_NO_CARE'].includes(n.type)
        );
        break;
      case 'SYSTEM':
        filtered = filtered.filter((n) =>
          ['SUBSCRIPTION_EXPIRING', 'PENDING_AGENT'].includes(n.type)
        );
        break;
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(term) ||
          n.message.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [notifications, activeFilter, searchTerm]);

  const counts = useMemo(() => {
    return {
      all: notifications.length,
      unread: notifications.filter((n) => !n.is_read).length,
      urgent: notifications.filter((n) => n.priority === 'URGENT' || n.priority === 'HIGH').length,
      visits: notifications.filter((n) =>
        ['OVERDUE_VISIT', 'UPCOMING_VISIT', 'FAMILY_NO_VISIT'].includes(n.type)
      ).length,
      health: notifications.filter((n) =>
        ['PREGNANT_NO_CARE', 'HYPERTENSIVE_NO_CARE', 'DIABETIC_NO_CARE'].includes(n.type)
      ).length,
      system: notifications.filter((n) =>
        ['SUBSCRIPTION_EXPIRING', 'PENDING_AGENT'].includes(n.type)
      ).length,
    };
  }, [notifications]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'OVERDUE_VISIT': return <AlertTriangle size={18} className="text-red-500" />;
      case 'UPCOMING_VISIT': return <Calendar size={18} className="text-blue-500" />;
      case 'FAMILY_NO_VISIT': return <Home size={18} className="text-orange-500" />;
      case 'PREGNANT_NO_CARE': return <Baby size={18} className="text-pink-500" />;
      case 'HYPERTENSIVE_NO_CARE': return <Heart size={18} className="text-red-500" />;
      case 'DIABETIC_NO_CARE': return <Droplets size={18} className="text-purple-500" />;
      case 'SUBSCRIPTION_EXPIRING': return <Clock size={18} className="text-yellow-600" />;
      case 'PENDING_AGENT': return <UserCheck size={18} className="text-green-500" />;
      default: return <Bell size={18} className="text-gray-500" />;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'OVERDUE_VISIT': return 'Visita Atrasada';
      case 'UPCOMING_VISIT': return 'Visita Próxima';
      case 'FAMILY_NO_VISIT': return 'Família sem Visita';
      case 'PREGNANT_NO_CARE': return 'Gestante';
      case 'HYPERTENSIVE_NO_CARE': return 'Hipertenso';
      case 'DIABETIC_NO_CARE': return 'Diabético';
      case 'SUBSCRIPTION_EXPIRING': return 'Assinatura';
      case 'PENDING_AGENT': return 'Agente Pendente';
      default: return 'Geral';
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'URGENT': return { border: 'border-l-red-500', bg: 'bg-red-50', badge: 'bg-red-100 text-red-700', label: 'Urgente' };
      case 'HIGH': return { border: 'border-l-orange-500', bg: 'bg-orange-50', badge: 'bg-orange-100 text-orange-700', label: 'Alta' };
      case 'MEDIUM': return { border: 'border-l-yellow-500', bg: 'bg-yellow-50', badge: 'bg-yellow-100 text-yellow-700', label: 'Média' };
      case 'LOW': return { border: 'border-l-blue-500', bg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-700', label: 'Baixa' };
      default: return { border: 'border-l-gray-500', bg: 'bg-gray-50', badge: 'bg-gray-100 text-gray-700', label: 'Normal' };
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Agora mesmo';
    if (diffMin < 60) return `Há ${diffMin} minuto(s)`;
    if (diffHours < 24) return `Há ${diffHours} hora(s)`;
    if (diffDays < 7) return `Há ${diffDays} dia(s)`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const groupedNotifications = useMemo(() => {
    const groups: { [key: string]: NotificationItem[] } = {};
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    for (const n of filteredNotifications) {
      const dateKey = n.created_at.split('T')[0];
      let label = '';
      if (dateKey === today) label = 'Hoje';
      else if (dateKey === yesterday) label = 'Ontem';
      else label = new Date(dateKey).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });

      if (!groups[label]) groups[label] = [];
      groups[label].push(n);
    }

    return groups;
  }, [filteredNotifications]);

  const filterTabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'ALL', label: 'Todas', count: counts.all },
    { key: 'UNREAD', label: 'Não Lidas', count: counts.unread },
    { key: 'URGENT', label: 'Urgentes', count: counts.urgent },
    { key: 'VISITS', label: 'Visitas', count: counts.visits },
    { key: 'HEALTH', label: 'Saúde', count: counts.health },
    { key: 'SYSTEM', label: 'Sistema', count: counts.system },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-blue-600 mx-auto" />
          <p className="mt-3 text-gray-500">Carregando notificações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <BellRing size={24} />
                <h1 className="text-xl sm:text-2xl font-bold">Notificações</h1>
              </div>
              <p className="text-blue-100 text-sm mt-1">
                Central de alertas e avisos do sistema
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Verificando...' : 'Atualizar'}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{counts.unread}</p>
            <p className="text-xs text-blue-100">Não Lidas</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{counts.urgent}</p>
            <p className="text-xs text-blue-100">Urgentes</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{counts.all}</p>
            <p className="text-xs text-blue-100">Total</p>
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm font-medium ${
          message.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' :
          'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar notificações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2">
            {counts.unread > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors whitespace-nowrap"
              >
                <CheckCheck size={16} />
                Ler todas
              </button>
            )}
            {notifications.some((n) => n.is_read) && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1 px-3 py-2 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors whitespace-nowrap"
              >
                <Trash2 size={16} />
                Limpar lidas
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-1 mt-3 overflow-x-auto pb-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                activeFilter === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  activeFilter === tab.key ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 text-center">
          <Bell size={48} strokeWidth={1} className="text-gray-300 mx-auto" />
          <p className="mt-3 text-gray-500 font-medium">Nenhuma notificação encontrada</p>
          <p className="text-sm text-gray-400 mt-1">
            {activeFilter !== 'ALL' ? 'Tente mudar o filtro ou ' : ''}
            Clique em "Atualizar" para verificar novos alertas.
          </p>
        </div>
      ) : (
        Object.entries(groupedNotifications).map(([dateLabel, items]) => (
          <div key={dateLabel}>
            <h3 className="text-sm font-semibold text-gray-500 mb-2 px-1">{dateLabel}</h3>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {items.map((notification, index) => {
                const style = getPriorityStyle(notification.priority);
                return (
                  <div
                    key={notification.id}
                    onClick={() => handleClickNotification(notification)}
                    className={`flex items-start gap-3 px-4 py-3 border-l-4 ${style.border} ${style.bg} ${
                      index < items.length - 1 ? 'border-b border-gray-100' : ''
                    } cursor-pointer transition-all duration-150 hover:brightness-95 ${
                      !notification.is_read ? '' : 'opacity-60'
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {getTypeIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className={`text-sm ${!notification.is_read ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                          {notification.title}
                        </p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${style.badge}`}>
                          {style.label}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          {getTypeName(notification.type)}
                        </span>
                        {!notification.is_read && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">{notification.message}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] text-gray-400">{formatDate(notification.created_at)}</span>
                        {(notification.related_entity_id || notification.action_url) && (
                          <span className="flex items-center gap-0.5 text-[10px] text-blue-500">
                            <ExternalLink size={10} />
                            Ver detalhes
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 shrink-0">
                      {!notification.is_read && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notification.id); }}
                          className="p-1.5 rounded-lg hover:bg-white/70 text-gray-400 hover:text-green-600 transition-colors"
                          title="Marcar como lida"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(notification.id); }}
                        className="p-1.5 rounded-lg hover:bg-white/70 text-gray-400 hover:text-red-600 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Limpar Notificações Lidas</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Tem certeza que deseja remover todas as notificações já lidas? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleClearRead}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Sim, Limpar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
