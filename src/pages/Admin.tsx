import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { User, UserRole, UserStatus } from '../types';
import {
  Users, UserCheck, UserPlus, Clock, Ban, CheckCircle2, XCircle,
  Shield, Edit2, Trash2, RefreshCw, Search, Filter, AlertCircle,
  Calendar, Activity, Eye, EyeOff, Save, X,
  BarChart3, MapPin, Building2, CreditCard, TrendingUp,
  LogIn, MousePointerClick, UserX
} from 'lucide-react';

const StatCard: React.FC<{
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}> = ({ title, value, icon, color, subtitle }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-lg ${color.replace('text-', 'bg-').replace('600', '100').replace('500', '100')}`}>
        {icon}
      </div>
    </div>
  </div>
);

const displayCPF = (cpf?: string): string => {
  if (!cpf) return '—';
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return cpf;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

export const Admin: React.FC = () => {
  const { refreshUser } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'usage' | 'subscriptions'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  const [usagePeriod, setUsagePeriod] = useState(30);
  const [usageSummary, setUsageSummary] = useState<{
    totalActions: number;
    uniqueUsers: number;
    actionCounts: Record<string, number>;
    pageCounts: Record<string, number>;
    userActivity: { userId: string; userName: string; count: number; lastAction: string }[];
    dailyActivity: { date: string; count: number }[];
  } | null>(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(false);

  const [formData, setFormData] = useState({
    name: '', email: '', password: '123456', role: 'AGENT' as string, status: 'ACTIVE' as string,
    phone: '', cns: '', microarea: '', equipe: '', cpf: '',
    address: '', cityState: '', healthUnit: '', subscriptionDays: 30,
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const usersData = await api.getUsers();
      setUsers(usersData);
    } catch (_error) {
      showMessage('error', 'Erro ao carregar dados.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsageSummary = async (days: number) => {
    try {
      setIsLoadingUsage(true);
      const summary = await api.getActivitySummary(days);
      setUsageSummary(summary);
    } catch (_error) {
      console.error('Erro ao carregar métricas');
    } finally {
      setIsLoadingUsage(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (activeTab === 'usage') loadUsageSummary(usagePeriod);
  }, [activeTab, usagePeriod]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 5000);
  };

  const stats = useMemo(() => {
    const now = new Date();
    const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return {
      total: users.length,
      agents: users.filter(u => u.role === UserRole.AGENT).length,
      admins: users.filter(u => u.role === UserRole.ADMIN).length,
      active: users.filter(u => u.status === UserStatus.ACTIVE).length,
      pending: users.filter(u => u.status === UserStatus.PENDING).length,
      blocked: users.filter(u => u.status === UserStatus.BLOCKED).length,
      expiringSoon: users.filter(u => {
        if (!u.subscriptionExpiresAt) return false;
        const exp = new Date(u.subscriptionExpiresAt);
        return exp > now && exp <= sevenDays;
      }).length,
      expired: users.filter(u => {
        if (!u.subscriptionExpiresAt) return false;
        return new Date(u.subscriptionExpiresAt) < now;
      }).length,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const s = searchTerm.toLowerCase();
      const matchesSearch = u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s) ||
        (u.cpf && u.cpf.includes(searchTerm.replace(/\D/g, ''))) ||
        (u.healthUnit && u.healthUnit.toLowerCase().includes(s));
      const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [users, searchTerm, statusFilter]);

  const actionLabels: Record<string, string> = {
    LOGIN: 'Login', LOGOUT: 'Logout', VIEW_DASHBOARD: 'Painel inicial',
    VIEW_FAMILIES: 'Famílias', CREATE_FAMILY: 'Cadastrou família', EDIT_FAMILY: 'Editou família',
    VIEW_FAMILY_DETAILS: 'Detalhes da família', CREATE_PERSON: 'Cadastrou pessoa',
    EDIT_PERSON: 'Editou pessoa', VIEW_VISITS: 'Visitas', CREATE_VISIT: 'Cadastrou visita',
    COMPLETE_VISIT: 'Finalizou visita', VIEW_REPORTS: 'Relatórios', SEARCH_REPORTS: 'Busca avançada',
    EXPORT_REPORT: 'Exportou relatório', VIEW_NOTIFICATIONS: 'Notificações',
    VIEW_PROFILE: 'Perfil', VIEW_MEETING: 'Reunião',
  };

  const pageLabels: Record<string, string> = {
    DASHBOARD: 'Painel inicial', FAMILIES: 'Famílias', FAMILY_DETAILS: 'Detalhes da família',
    VISITS: 'Visitas', REPORTS: 'Relatórios', NOTIFICATIONS: 'Notificações',
    PROFILE: 'Perfil', MEETING: 'Reunião', LOGIN: 'Login',
  };

  const inactiveAgents = useMemo(() => {
    if (!usageSummary) return [];
    const activeIds = new Set(usageSummary.userActivity.map(u => u.userId));
    return users.filter(u => u.role === UserRole.AGENT && u.status === UserStatus.ACTIVE && !activeIds.has(u.id));
  }, [users, usageSummary]);

  const handleApprove = async (userId: string) => {
    try { await api.updateUserStatus(userId, UserStatus.ACTIVE); showMessage('success', 'Usuário aprovado!'); await loadData(); }
    catch (_e) { showMessage('error', 'Erro ao aprovar.'); }
  };
  const handleBlock = async (userId: string) => {
    if (!confirm('Bloquear este usuário?')) return;
    try { await api.updateUserStatus(userId, UserStatus.BLOCKED); showMessage('success', 'Usuário bloqueado.'); await loadData(); }
    catch (_e) { showMessage('error', 'Erro ao bloquear.'); }
  };
  const handleUnblock = async (userId: string) => {
    try { await api.updateUserStatus(userId, UserStatus.ACTIVE); showMessage('success', 'Usuário desbloqueado!'); await loadData(); }
    catch (_e) { showMessage('error', 'Erro ao desbloquear.'); }
  };
  const handleRenew = async (userId: string, days: number) => {
    try { await api.renewSubscription(userId, days); showMessage('success', `Renovado por ${days} dias!`); await loadData(); refreshUser(); }
    catch (_e) { showMessage('error', 'Erro ao renovar.'); }
  };
  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`EXCLUIR "${userName}"? Não pode ser desfeito.`)) return;
    try { await api.deleteUser(userId); showMessage('success', `"${userName}" excluído.`); await loadData(); }
    catch (_e) { showMessage('error', 'Erro ao excluir.'); }
  };

  const openNewUserForm = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '123456', role: 'AGENT', status: 'ACTIVE', phone: '', cns: '', microarea: '', equipe: '', cpf: '', address: '', cityState: '', healthUnit: '', subscriptionDays: 30 });
    setIsFormOpen(true);
  };
  const openEditForm = (u: User) => {
    setEditingUser(u);
    setFormData({ name: u.name, email: u.email, password: u.password || '', role: u.role, status: u.status, phone: u.phone || '', cns: u.cns || '', microarea: u.microarea || '', equipe: u.equipe || '', cpf: u.cpf || '', address: u.address || '', cityState: u.cityState || '', healthUnit: u.healthUnit || '', subscriptionDays: 30 });
    setIsFormOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) { showMessage('error', 'Nome e email são obrigatórios.'); return; }
    setIsSaving(true);
    try {
      const userData: User = {
        id: editingUser?.id || '', name: formData.name.trim(), email: formData.email.toLowerCase().trim(),
        password: formData.password || '123456', role: formData.role as UserRole, status: formData.status as UserStatus,
        subscriptionExpiresAt: editingUser?.subscriptionExpiresAt || new Date(Date.now() + formData.subscriptionDays * 86400000).toISOString(),
        createdAt: editingUser?.createdAt || new Date().toISOString(),
        phone: formData.phone || '', cns: formData.cns || '', microarea: formData.microarea || '',
        equipe: formData.equipe || '', cpf: formData.cpf.replace(/\D/g, '') || '',
        address: formData.address.trim() || '', cityState: formData.cityState.trim() || '', healthUnit: formData.healthUnit.trim() || '',
      };
      await api.saveUser(userData);
      showMessage('success', editingUser ? 'Atualizado!' : 'Criado com sucesso!');
      setIsFormOpen(false);
      await loadData();
    } catch (error: any) {
      showMessage('error', error?.code === '23505' ? 'Email já cadastrado.' : 'Erro ao salvar.');
    } finally { setIsSaving(false); }
  };

  const getStatusBadge = (status: string) => {
    if (status === UserStatus.ACTIVE) return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3" />Ativo</span>;
    if (status === UserStatus.PENDING) return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3" />Pendente</span>;
    if (status === UserStatus.BLOCKED) return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700"><Ban className="w-3 h-3" />Bloqueado</span>;
    return <span className="text-xs text-gray-500">{status}</span>;
  };
  const getRoleBadge = (role: string) => {
    if (role === UserRole.ADMIN) return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700"><Shield className="w-3 h-3" />Admin</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"><Users className="w-3 h-3" />Agente</span>;
  };
  const getSubscriptionInfo = (u: User) => {
    if (!u.subscriptionExpiresAt) return { text: 'Sem assinatura', color: 'text-gray-400' };
    const daysLeft = Math.ceil((new Date(u.subscriptionExpiresAt).getTime() - Date.now()) / 86400000);
    if (daysLeft < 0) return { text: `Expirou há ${Math.abs(daysLeft)}d`, color: 'text-red-600' };
    if (daysLeft <= 7) return { text: `Expira em ${daysLeft}d`, color: 'text-orange-600' };
    if (daysLeft <= 30) return { text: `Expira em ${daysLeft}d`, color: 'text-yellow-600' };
    return { text: `Válida por ${daysLeft}d`, color: 'text-green-600' };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando painel...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Shield className="w-7 h-7 text-purple-600" /> Painel Administrativo
          </h1>
          <p className="text-gray-500 text-sm mt-1">Usuários, assinaturas e métricas de uso</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg"><RefreshCw className="w-4 h-4" />Atualizar</button>
          <button onClick={openNewUserForm} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"><UserPlus className="w-4 h-4" />Novo Agente</button>
        </div>
      </div>

      {actionMessage && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${actionMessage.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {actionMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Abas */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        {[
          { key: 'users' as const, icon: <Users className="w-4 h-4" />, label: 'Usuários', count: stats.total },
          { key: 'subscriptions' as const, icon: <Calendar className="w-4 h-4" />, label: 'Assinaturas', count: undefined },
          { key: 'usage' as const, icon: <BarChart3 className="w-4 h-4" />, label: 'Uso do Sistema', count: undefined },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${activeTab === tab.key ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab.icon}<span className="hidden sm:inline">{tab.label}</span>{tab.count !== undefined && ` (${tab.count})`}
          </button>
        ))}
      </div>

      {/* ========== ABA USUÁRIOS ========== */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard title="Total" value={stats.total} icon={<Users className="w-5 h-5 text-blue-600" />} color="text-blue-600" />
            <StatCard title="Ativos" value={stats.active} icon={<UserCheck className="w-5 h-5 text-green-600" />} color="text-green-600" />
            <StatCard title="Pendentes" value={stats.pending} icon={<Clock className="w-5 h-5 text-yellow-600" />} color="text-yellow-600" />
            <StatCard title="Bloqueados" value={stats.blocked} icon={<Ban className="w-5 h-5 text-red-600" />} color="text-red-600" />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Buscar por nome, email, CPF ou unidade..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg outline-none appearance-none bg-white">
                <option value="ALL">Todos</option>
                <option value={UserStatus.ACTIVE}>Ativos</option>
                <option value={UserStatus.PENDING}>Pendentes</option>
                <option value={UserStatus.BLOCKED}>Bloqueados</option>
              </select>
            </div>
          </div>

          {stats.pending > 0 && statusFilter === 'ALL' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-yellow-800 font-medium flex items-center gap-2 mb-3"><Clock className="w-5 h-5" />Aguardando Aprovação ({stats.pending})</h3>
              <div className="space-y-2">
                {users.filter(u => u.status === UserStatus.PENDING).map(u => (
                  <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white rounded-lg p-3 border border-yellow-100 gap-3">
                    <div>
                      <p className="font-medium text-gray-800">{u.name}</p>
                      <p className="text-sm text-gray-500">{u.email}</p>
                      {u.healthUnit && <p className="text-xs text-gray-400 flex items-center gap-1 mt-1"><Building2 className="w-3 h-3" />{u.healthUnit}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(u.id)} className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg flex items-center gap-1"><CheckCircle2 className="w-4 h-4" />Aprovar</button>
                      <button onClick={() => handleBlock(u.id)} className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg flex items-center gap-1"><XCircle className="w-4 h-4" />Rejeitar</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredUsers.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhum usuário encontrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map(u => {
                const subInfo = getSubscriptionInfo(u);
                const isExpanded = expandedUserId === u.id;
                return (
                  <div key={u.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-800">{u.name}</h3>
                          {getRoleBadge(u.role)}{getStatusBadge(u.status)}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{u.email}</p>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
                          {u.healthUnit && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{u.healthUnit}</span>}
                          {u.phone && <span className="flex items-center gap-1"><Activity className="w-3 h-3" />{u.phone}</span>}
                          {u.microarea && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />Microárea: {u.microarea}</span>}
                          <span className={subInfo.color}><Calendar className="w-3 h-3 inline mr-1" />{subInfo.text}</span>
                        </div>

                        <button onClick={() => setExpandedUserId(isExpanded ? null : u.id)}
                          className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                          {isExpanded ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          {isExpanded ? 'Ocultar dados' : 'Ver dados pessoais'}
                        </button>

                        {isExpanded && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1"><Shield className="w-3 h-3 text-purple-500" />Dados pessoais</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              <div><span className="text-gray-400">CPF:</span> <span className="text-gray-700 font-medium">{displayCPF(u.cpf)}</span></div>
                              <div><span className="text-gray-400">Telefone:</span> <span className="text-gray-700 font-medium">{u.phone || '—'}</span></div>
                              <div className="sm:col-span-2"><span className="text-gray-400">Endereço:</span> <span className="text-gray-700 font-medium">{u.address || '—'}</span></div>
                              <div><span className="text-gray-400">Cidade/UF:</span> <span className="text-gray-700 font-medium">{u.cityState || '—'}</span></div>
                              <div><span className="text-gray-400">Unidade:</span> <span className="text-gray-700 font-medium">{u.healthUnit || '—'}</span></div>
                              <div><span className="text-gray-400">CNS:</span> <span className="text-gray-700 font-medium">{u.cns || '—'}</span></div>
                              <div><span className="text-gray-400">Equipe:</span> <span className="text-gray-700 font-medium">{u.equipe || '—'}</span></div>
                              <div><span className="text-gray-400">Cadastro:</span> <span className="text-gray-700 font-medium">{u.createdAt ? new Date(u.createdAt).toLocaleDateString('pt-BR') : '—'}</span></div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {u.status === UserStatus.PENDING && <button onClick={() => handleApprove(u.id)} className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs rounded-lg flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Aprovar</button>}
                        {u.status === UserStatus.ACTIVE && u.role !== UserRole.ADMIN && <button onClick={() => handleBlock(u.id)} className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs rounded-lg flex items-center gap-1"><Ban className="w-3 h-3" />Bloquear</button>}
                        {u.status === UserStatus.BLOCKED && <button onClick={() => handleUnblock(u.id)} className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 text-xs rounded-lg flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Desbloquear</button>}
                        <button onClick={() => handleRenew(u.id, 30)} className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs rounded-lg flex items-center gap-1"><Calendar className="w-3 h-3" />+30d</button>
                        <button onClick={() => handleRenew(u.id, 365)} className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 text-xs rounded-lg flex items-center gap-1"><Calendar className="w-3 h-3" />+1 ano</button>
                        <button onClick={() => openEditForm(u)} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-lg flex items-center gap-1"><Edit2 className="w-3 h-3" />Editar</button>
                        {u.role !== UserRole.ADMIN && <button onClick={() => handleDelete(u.id, u.name)} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs rounded-lg flex items-center gap-1"><Trash2 className="w-3 h-3" /></button>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========== ABA ASSINATURAS ========== */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <StatCard title="Expirando em 7 dias" value={stats.expiringSoon} icon={<AlertCircle className="w-5 h-5 text-orange-600" />} color="text-orange-600" />
            <StatCard title="Expiradas" value={stats.expired} icon={<XCircle className="w-5 h-5 text-red-600" />} color="text-red-600" />
          </div>
          <div className="space-y-3">
            {users.filter(u => u.role !== UserRole.ADMIN).sort((a, b) => {
              if (!a.subscriptionExpiresAt) return 1;
              if (!b.subscriptionExpiresAt) return -1;
              return new Date(a.subscriptionExpiresAt).getTime() - new Date(b.subscriptionExpiresAt).getTime();
            }).map(u => {
              const subInfo = getSubscriptionInfo(u);
              return (
                <div key={u.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">{u.name}</h3>
                      <p className="text-sm text-gray-500">{u.email}</p>
                      {u.healthUnit && <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><Building2 className="w-3 h-3" />{u.healthUnit}</p>}
                      <p className={`text-sm font-medium mt-1 ${subInfo.color}`}>{subInfo.text}</p>
                      {u.subscriptionExpiresAt && <p className="text-xs text-gray-400">Data: {new Date(u.subscriptionExpiresAt).toLocaleDateString('pt-BR')}</p>}
                    </div>
                    <div className="flex flex-col gap-2">
                      <button onClick={() => handleRenew(u.id, 30)} className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg">+30 dias</button>
                      <button onClick={() => handleRenew(u.id, 90)} className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs rounded-lg">+90 dias</button>
                      <button onClick={() => handleRenew(u.id, 365)} className="px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white text-xs rounded-lg">+1 ano</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========== ABA USO DO SISTEMA ========== */}
      {activeTab === 'usage' && (
        <div className="space-y-6">
          {/* Período */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-blue-600" />Métricas de Uso</h2>
            <select value={usagePeriod} onChange={(e) => setUsagePeriod(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white">
              <option value={7}>Últimos 7 dias</option>
              <option value={15}>Últimos 15 dias</option>
              <option value={30}>Últimos 30 dias</option>
              <option value={60}>Últimos 60 dias</option>
              <option value={90}>Últimos 90 dias</option>
            </select>
          </div>

          {isLoadingUsage ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : !usageSummary || usageSummary.totalActions === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
              <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Nenhuma atividade registrada</p>
              <p className="text-gray-400 text-sm mt-1">Os dados aparecerão conforme os agentes usarem o sistema</p>
            </div>
          ) : (
            <>
              {/* Cards resumo */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard title="Total de ações" value={usageSummary.totalActions} icon={<MousePointerClick className="w-5 h-5 text-blue-600" />} color="text-blue-600" subtitle={`em ${usagePeriod} dias`} />
                <StatCard title="Usuários ativos" value={usageSummary.uniqueUsers} icon={<UserCheck className="w-5 h-5 text-green-600" />} color="text-green-600" subtitle="que usaram o sistema" />
                <StatCard title="Média diária" value={usageSummary.dailyActivity.length > 0 ? Math.round(usageSummary.totalActions / usageSummary.dailyActivity.length) : 0} icon={<TrendingUp className="w-5 h-5 text-purple-600" />} color="text-purple-600" subtitle="ações por dia" />
                <StatCard title="Inativos" value={inactiveAgents.length} icon={<UserX className="w-5 h-5 text-red-600" />} color="text-red-600" subtitle={`sem uso em ${usagePeriod}d`} />
              </div>

              {/* Atividade diária - gráfico de barras simples */}
              {usageSummary.dailyActivity.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-blue-600" />Atividade Diária</h3>
                  <div className="flex items-end gap-1 h-32 overflow-x-auto pb-2">
                    {usageSummary.dailyActivity.slice(-30).map((day) => {
                      const maxCount = Math.max(...usageSummary.dailyActivity.slice(-30).map(d => d.count), 1);
                      const heightPercent = (day.count / maxCount) * 100;
                      return (
                        <div key={day.date} className="flex flex-col items-center gap-1 flex-1 min-w-[20px]" title={`${day.date}: ${day.count} ações`}>
                          <span className="text-[10px] text-gray-400">{day.count}</span>
                          <div className="w-full bg-blue-500 rounded-t-sm transition-all hover:bg-blue-600" style={{ height: `${Math.max(heightPercent, 4)}%` }}></div>
                          <span className="text-[9px] text-gray-400 transform -rotate-45 origin-top-left whitespace-nowrap">{day.date.slice(5)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Ranking de agentes */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-600" />Ranking de Uso por Agente</h3>
                <div className="space-y-2">
                  {usageSummary.userActivity.slice(0, 10).map((ua, idx) => {
                    const maxCount = usageSummary.userActivity[0]?.count || 1;
                    const widthPercent = (ua.count / maxCount) * 100;
                    return (
                      <div key={ua.userId} className="flex items-center gap-3">
                        <span className={`text-sm font-bold w-6 text-center ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-orange-400' : 'text-gray-300'}`}>{idx + 1}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">{ua.userName}</span>
                            <span className="text-xs text-gray-500">{ua.count} ações</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${widthPercent}%` }}></div>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-0.5">Último acesso: {new Date(ua.lastAction).toLocaleString('pt-BR')}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Funcionalidades mais usadas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><MousePointerClick className="w-4 h-4 text-purple-600" />Ações Mais Executadas</h3>
                  <div className="space-y-2">
                    {Object.entries(usageSummary.actionCounts).sort(([, a], [, b]) => b - a).slice(0, 8).map(([action, count]) => (
                      <div key={action} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                        <span className="text-sm text-gray-600">{actionLabels[action] || action}</span>
                        <span className="text-sm font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><LogIn className="w-4 h-4 text-teal-600" />Páginas Mais Visitadas</h3>
                  <div className="space-y-2">
                    {Object.entries(usageSummary.pageCounts).sort(([, a], [, b]) => b - a).slice(0, 8).map(([page, count]) => (
                      <div key={page} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                        <span className="text-sm text-gray-600">{pageLabels[page] || page}</span>
                        <span className="text-sm font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Agentes inativos */}
              {inactiveAgents.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2"><UserX className="w-4 h-4" />Agentes Inativos ({inactiveAgents.length})</h3>
                  <p className="text-xs text-red-600 mb-3">Não utilizaram o sistema nos últimos {usagePeriod} dias</p>
                  <div className="space-y-2">
                    {inactiveAgents.map(agent => (
                      <div key={agent.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-red-100">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{agent.name}</p>
                          <p className="text-xs text-gray-500">{agent.email}</p>
                        </div>
                        <span className="text-xs text-red-500 font-medium">Sem atividade</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ========== MODAL FORMULÁRIO ========== */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">{editingUser ? 'Editar Usuário' : 'Novo Agente'}</h2>
                <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSaveUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nome do agente" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={formData.cpf} onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
                      let f = digits;
                      if (digits.length > 3) f = `${digits.slice(0, 3)}.${digits.slice(3)}`;
                      if (digits.length > 6) f = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
                      if (digits.length > 9) f = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
                      setFormData({ ...formData, cpf: f });
                    }} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="000.000.000-00" maxLength={14} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="email@exemplo.com" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pr-10" placeholder="Senha" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Função</label>
                    <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none bg-white">
                      <option value="AGENT">Agente</option>
                      <option value="ADMIN">Administrador</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none bg-white">
                      <option value="ACTIVE">Ativo</option>
                      <option value="PENDING">Pendente</option>
                      <option value="BLOCKED">Bloqueado</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Rua, número, bairro" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cidade / UF</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="text" value={formData.cityState} onChange={(e) => setFormData({ ...formData, cityState: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none" placeholder="São Paulo / SP" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unidade de Saúde</label>
                    <div className="relative">
                      <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="text" value={formData.healthUnit} onChange={(e) => setFormData({ ...formData, healthUnit: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none" placeholder="Nome da UBS / ESF" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                    <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" placeholder="(11) 99999-9999" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CNS</label>
                    <input type="text" value={formData.cns} onChange={(e) => setFormData({ ...formData, cns: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" placeholder="Cartão Nacional de Saúde" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Microárea</label>
                    <input type="text" value={formData.microarea} onChange={(e) => setFormData({ ...formData, microarea: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" placeholder="Ex: 001" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Equipe</label>
                    <input type="text" value={formData.equipe} onChange={(e) => setFormData({ ...formData, equipe: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" placeholder="Ex: ESF 01" />
                  </div>
                </div>
                {!editingUser && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dias de assinatura</label>
                    <select value={formData.subscriptionDays} onChange={(e) => setFormData({ ...formData, subscriptionDays: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none bg-white">
                      <option value={7}>7 dias (teste)</option>
                      <option value={30}>30 dias</option>
                      <option value={90}>90 dias</option>
                      <option value={180}>180 dias</option>
                      <option value={365}>1 ano</option>
                    </select>
                  </div>
                )}
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium">Cancelar</button>
                  <button type="submit" disabled={isSaving}
                    className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                    {isSaving ? <><RefreshCw className="w-4 h-4 animate-spin" />Salvando...</> : <><Save className="w-4 h-4" />{editingUser ? 'Atualizar' : 'Criar Agente'}</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
