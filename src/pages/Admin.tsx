import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { User, UserRole, UserStatus } from '../types';
import {
  Users, UserCheck, UserPlus, Clock, Ban, CheckCircle2, XCircle,
  Shield, Edit2, Trash2, RefreshCw, Search, Filter, AlertCircle,
  Calendar, Activity, Home, Eye, EyeOff, Save, X,
  Award, BarChart3, MapPin, Building2, CreditCard
} from 'lucide-react';

// ============================================
// PAINEL ADMINISTRATIVO
// Gerenciamento de agentes via Supabase
// ============================================

// Componente de card de estatística
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

// Formatar CPF para exibição
const displayCPF = (cpf?: string): string => {
  if (!cpf) return '—';
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return cpf;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

export const Admin: React.FC = () => {
  const { refreshUser } = useAuth();

  // ============================================
  // ESTADOS
  // ============================================
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'stats' | 'subscriptions'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  // Estatísticas do sistema
  const [totalFamilies, setTotalFamilies] = useState(0);
  const [totalPeople, setTotalPeople] = useState(0);
  const [totalVisits, setTotalVisits] = useState(0);

  // Formulário
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '123456',
    role: 'AGENT' as string,
    status: 'ACTIVE' as string,
    phone: '',
    cns: '',
    microarea: '',
    equipe: '',
    cpf: '',
    address: '',
    cityState: '',
    healthUnit: '',
    subscriptionDays: 30,
  });

  // ============================================
  // CARREGAR DADOS
  // ============================================
  const loadData = async () => {
    try {
      setIsLoading(true);
      console.log('📡 Carregando dados do painel admin...');

      const [usersData, familiesCount, peopleCount, visitsCount] = await Promise.all([
        api.getUsers(),
        api.getTotalFamilies(),
        api.getTotalPeople(),
        api.getTotalVisits(),
      ]);

      setUsers(usersData);
      setTotalFamilies(familiesCount);
      setTotalPeople(peopleCount);
      setTotalVisits(visitsCount);

      console.log('✅ Dados admin carregados:', {
        users: usersData.length,
        families: familiesCount,
        people: peopleCount,
        visits: visitsCount,
      });
    } catch (error) {
      console.error('❌ Erro ao carregar dados admin:', error);
      showMessage('error', 'Erro ao carregar dados. Verifique sua conexão.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ============================================
  // MENSAGENS DE FEEDBACK
  // ============================================
  const showMessage = (type: 'success' | 'error', text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 5000);
  };

  // ============================================
  // ESTATÍSTICAS CALCULADAS
  // ============================================
  const stats = useMemo(() => {
    const agents = users.filter(u => u.role === UserRole.AGENT);
    const admins = users.filter(u => u.role === UserRole.ADMIN);
    const active = users.filter(u => u.status === UserStatus.ACTIVE);
    const pending = users.filter(u => u.status === UserStatus.PENDING);
    const blocked = users.filter(u => u.status === UserStatus.BLOCKED);

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const expiringSoon = users.filter(u => {
      if (!u.subscriptionExpiresAt) return false;
      const exp = new Date(u.subscriptionExpiresAt);
      return exp > now && exp <= sevenDaysFromNow;
    });

    const expired = users.filter(u => {
      if (!u.subscriptionExpiresAt) return false;
      return new Date(u.subscriptionExpiresAt) < now;
    });

    return {
      total: users.length,
      agents: agents.length,
      admins: admins.length,
      active: active.length,
      pending: pending.length,
      blocked: blocked.length,
      expiringSoon: expiringSoon.length,
      expired: expired.length,
    };
  }, [users]);

  // ============================================
  // FILTRAR USUÁRIOS
  // ============================================
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.cpf && u.cpf.includes(searchTerm.replace(/\D/g, ''))) ||
        (u.healthUnit && u.healthUnit.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [users, searchTerm, statusFilter]);

  // ============================================
  // AÇÕES DE USUÁRIO
  // ============================================
  const handleApprove = async (userId: string) => {
    try {
      await api.updateUserStatus(userId, UserStatus.ACTIVE);
      showMessage('success', 'Usuário aprovado com sucesso!');
      await loadData();
    } catch (error) {
      console.error('Erro ao aprovar:', error);
      showMessage('error', 'Erro ao aprovar usuário.');
    }
  };

  const handleBlock = async (userId: string) => {
    if (!confirm('Tem certeza que deseja bloquear este usuário?')) return;
    try {
      await api.updateUserStatus(userId, UserStatus.BLOCKED);
      showMessage('success', 'Usuário bloqueado.');
      await loadData();
    } catch (error) {
      console.error('Erro ao bloquear:', error);
      showMessage('error', 'Erro ao bloquear usuário.');
    }
  };

  const handleUnblock = async (userId: string) => {
    try {
      await api.updateUserStatus(userId, UserStatus.ACTIVE);
      showMessage('success', 'Usuário desbloqueado!');
      await loadData();
    } catch (error) {
      console.error('Erro ao desbloquear:', error);
      showMessage('error', 'Erro ao desbloquear usuário.');
    }
  };

  const handleRenew = async (userId: string, days: number) => {
    try {
      await api.renewSubscription(userId, days);
      showMessage('success', `Assinatura renovada por ${days} dias!`);
      await loadData();
      refreshUser();
    } catch (error) {
      console.error('Erro ao renovar:', error);
      showMessage('error', 'Erro ao renovar assinatura.');
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`Tem certeza que deseja EXCLUIR o usuário "${userName}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await api.deleteUser(userId);
      showMessage('success', `Usuário "${userName}" excluído.`);
      await loadData();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      showMessage('error', 'Erro ao excluir usuário.');
    }
  };

  // ============================================
  // FORMULÁRIO — ABRIR / EDITAR / SALVAR
  // ============================================
  const openNewUserForm = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '123456',
      role: 'AGENT',
      status: 'ACTIVE',
      phone: '',
      cns: '',
      microarea: '',
      equipe: '',
      cpf: '',
      address: '',
      cityState: '',
      healthUnit: '',
      subscriptionDays: 30,
    });
    setIsFormOpen(true);
  };

  const openEditForm = (userToEdit: User) => {
    setEditingUser(userToEdit);
    setFormData({
      name: userToEdit.name,
      email: userToEdit.email,
      password: userToEdit.password || '',
      role: userToEdit.role,
      status: userToEdit.status,
      phone: userToEdit.phone || '',
      cns: userToEdit.cns || '',
      microarea: userToEdit.microarea || '',
      equipe: userToEdit.equipe || '',
      cpf: userToEdit.cpf || '',
      address: userToEdit.address || '',
      cityState: userToEdit.cityState || '',
      healthUnit: userToEdit.healthUnit || '',
      subscriptionDays: 30,
    });
    setIsFormOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim()) {
      showMessage('error', 'Nome e email são obrigatórios.');
      return;
    }

    setIsSaving(true);
    try {
      const userData: User = {
        id: editingUser?.id || '',
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password || '123456',
        role: formData.role as UserRole,
        status: formData.status as UserStatus,
        subscriptionExpiresAt: editingUser?.subscriptionExpiresAt ||
          new Date(Date.now() + formData.subscriptionDays * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: editingUser?.createdAt || new Date().toISOString(),
        phone: formData.phone || '',
        cns: formData.cns || '',
        microarea: formData.microarea || '',
        equipe: formData.equipe || '',
        cpf: formData.cpf.replace(/\D/g, '') || '',
        address: formData.address.trim() || '',
        cityState: formData.cityState.trim() || '',
        healthUnit: formData.healthUnit.trim() || '',
      };

      await api.saveUser(userData);
      showMessage('success', editingUser ? 'Usuário atualizado!' : 'Usuário criado com sucesso!');
      setIsFormOpen(false);
      await loadData();
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      if (error?.code === '23505') {
        showMessage('error', 'Este email já está cadastrado.');
      } else {
        showMessage('error', 'Erro ao salvar usuário.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================
  // HELPERS
  // ============================================
  const getStatusBadge = (status: string) => {
    switch (status) {
      case UserStatus.ACTIVE:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle2 className="w-3 h-3" /> Ativo
          </span>
        );
      case UserStatus.PENDING:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3" /> Pendente
          </span>
        );
      case UserStatus.BLOCKED:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <Ban className="w-3 h-3" /> Bloqueado
          </span>
        );
      default:
        return <span className="text-xs text-gray-500">{status}</span>;
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === UserRole.ADMIN) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
          <Shield className="w-3 h-3" /> Admin
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
        <Users className="w-3 h-3" /> Agente
      </span>
    );
  };

  const getSubscriptionInfo = (u: User) => {
    if (!u.subscriptionExpiresAt) return { text: 'Sem assinatura', color: 'text-gray-400' };
    const exp = new Date(u.subscriptionExpiresAt);
    const now = new Date();
    const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return { text: `Expirou há ${Math.abs(daysLeft)} dias`, color: 'text-red-600' };
    if (daysLeft <= 7) return { text: `Expira em ${daysLeft} dias`, color: 'text-orange-600' };
    if (daysLeft <= 30) return { text: `Expira em ${daysLeft} dias`, color: 'text-yellow-600' };
    return { text: `Válida por ${daysLeft} dias`, color: 'text-green-600' };
  };

  // ============================================
  // LOADING
  // ============================================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando painel administrativo...</p>
          <p className="text-gray-400 text-sm mt-1">Buscando dados na nuvem</p>
        </div>
      </div>
    );
  }  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Shield className="w-7 h-7 text-purple-600" />
            Painel Administrativo
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Gerencie usuários, agentes e assinaturas — ☁️ Dados na nuvem
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
          <button
            onClick={openNewUserForm}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Novo Agente
          </button>
        </div>
      </div>

      {/* Mensagem de feedback */}
      {actionMessage && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          actionMessage.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Abas */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            activeTab === 'users' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="w-4 h-4" />
          Usuários ({stats.total})
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            activeTab === 'stats' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Estatísticas
        </button>
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            activeTab === 'subscriptions' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Assinaturas
        </button>
      </div>

      {/* ============================================ */}
      {/* ABA: USUÁRIOS */}
      {/* ============================================ */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Barra de busca e filtro */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome, email, CPF ou unidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white"
              >
                <option value="ALL">Todos os status</option>
                <option value={UserStatus.ACTIVE}>Ativos</option>
                <option value={UserStatus.PENDING}>Pendentes</option>
                <option value={UserStatus.BLOCKED}>Bloqueados</option>
              </select>
            </div>
          </div>

          {/* Pendentes (destaque) */}
          {stats.pending > 0 && statusFilter === 'ALL' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-yellow-800 font-medium flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5" />
                Aguardando Aprovação ({stats.pending})
              </h3>
              <div className="space-y-2">
                {users
                  .filter(u => u.status === UserStatus.PENDING)
                  .map(u => (
                    <div key={u.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-yellow-100">
                      <div>
                        <p className="font-medium text-gray-800">{u.name}</p>
                        <p className="text-sm text-gray-500">{u.email}</p>
                        <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-400">
                          {u.cpf && <span>📋 CPF: {displayCPF(u.cpf)}</span>}
                          {u.healthUnit && <span>🏥 {u.healthUnit}</span>}
                          {u.cityState && <span>📍 {u.cityState}</span>}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Registrado em: {u.createdAt ? new Date(u.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(u.id)}
                          className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-all flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Aprovar
                        </button>
                        <button
                          onClick={() => handleBlock(u.id)}
                          className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-all flex items-center gap-1"
                        >
                          <XCircle className="w-4 h-4" />
                          Rejeitar
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Lista de usuários */}
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhum usuário encontrado</p>
              <p className="text-gray-400 text-sm">Tente ajustar a busca ou o filtro</p>
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
                          {getRoleBadge(u.role)}
                          {getStatusBadge(u.status)}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{u.email}</p>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
                          {u.healthUnit && <span>🏥 {u.healthUnit}</span>}
                          {u.phone && <span>📱 {u.phone}</span>}
                          {u.microarea && <span>📍 Microárea: {u.microarea}</span>}
                          {u.equipe && <span>👥 Equipe: {u.equipe}</span>}
                          {u.cns && <span>🏥 CNS: {u.cns}</span>}
                          <span className={subInfo.color}>📅 {subInfo.text}</span>
                        </div>

                        {/* Botão expandir dados pessoais */}
                        <button
                          onClick={() => setExpandedUserId(isExpanded ? null : u.id)}
                          className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline flex items-center gap-1"
                        >
                          {isExpanded ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          {isExpanded ? 'Ocultar dados pessoais' : 'Ver dados pessoais'}
                        </button>

                        {/* Dados pessoais expandidos (só admin vê) */}
                        {isExpanded && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5">
                            <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                              <Shield className="w-3 h-3 text-purple-500" />
                              Dados pessoais (visível apenas para admin)
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-gray-400">CPF:</span>{' '}
                                <span className="text-gray-700 font-medium">{displayCPF(u.cpf)}</span>
                              </div>
                              <div>
                                <span className="text-gray-400">Telefone:</span>{' '}
                                <span className="text-gray-700 font-medium">{u.phone || '—'}</span>
                              </div>
                              <div className="sm:col-span-2">
                                <span className="text-gray-400">Endereço:</span>{' '}
                                <span className="text-gray-700 font-medium">{u.address || '—'}</span>
                              </div>
                              <div>
                                <span className="text-gray-400">Cidade/UF:</span>{' '}
                                <span className="text-gray-700 font-medium">{u.cityState || '—'}</span>
                              </div>
                              <div>
                                <span className="text-gray-400">Unidade de Saúde:</span>{' '}
                                <span className="text-gray-700 font-medium">{u.healthUnit || '—'}</span>
                              </div>
                              <div>
                                <span className="text-gray-400">CNS:</span>{' '}
                                <span className="text-gray-700 font-medium">{u.cns || '—'}</span>
                              </div>
                              <div>
                                <span className="text-gray-400">Microárea:</span>{' '}
                                <span className="text-gray-700 font-medium">{u.microarea || '—'}</span>
                              </div>
                              <div>
                                <span className="text-gray-400">Equipe:</span>{' '}
                                <span className="text-gray-700 font-medium">{u.equipe || '—'}</span>
                              </div>
                              <div>
                                <span className="text-gray-400">Cadastro:</span>{' '}
                                <span className="text-gray-700 font-medium">
                                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString('pt-BR') : '—'}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Ações */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {u.status === UserStatus.PENDING && (
                          <button
                            onClick={() => handleApprove(u.id)}
                            className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs rounded-lg transition-all flex items-center gap-1"
                            title="Aprovar"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Aprovar
                          </button>
                        )}
                        {u.status === UserStatus.ACTIVE && u.role !== UserRole.ADMIN && (
                          <button
                            onClick={() => handleBlock(u.id)}
                            className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs rounded-lg transition-all flex items-center gap-1"
                            title="Bloquear"
                          >
                            <Ban className="w-3 h-3" /> Bloquear
                          </button>
                        )}
                        {u.status === UserStatus.BLOCKED && (
                          <button
                            onClick={() => handleUnblock(u.id)}
                            className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 text-xs rounded-lg transition-all flex items-center gap-1"
                            title="Desbloquear"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Desbloquear
                          </button>
                        )}
                                                <button
                          onClick={() => handleRenew(u.id, 30)}
                          className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs rounded-lg transition-all flex items-center gap-1"
                          title="Renovar 30 dias"
                        >
                          <Calendar className="w-3 h-3" /> +30d
                        </button>
                        <button
                          onClick={() => handleRenew(u.id, 365)}
                          className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 text-xs rounded-lg transition-all flex items-center gap-1"
                          title="Renovar 1 ano"
                        >
                          <Calendar className="w-3 h-3" /> +1 ano
                        </button>

                        <button
                          onClick={() => openEditForm(u)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-lg transition-all flex items-center gap-1"
                          title="Editar"
                        >
                          <Edit2 className="w-3 h-3" /> Editar
                        </button>
                        {u.role !== UserRole.ADMIN && (
                          <button
                            onClick={() => handleDelete(u.id, u.name)}
                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs rounded-lg transition-all flex items-center gap-1"
                            title="Excluir"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================ */}
      {/* ABA: ESTATÍSTICAS */}
      {/* ============================================ */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Estatísticas do Sistema
          </h2>

          {/* Cards de usuários */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">Usuários</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard title="Total" value={stats.total} icon={<Users className="w-5 h-5 text-blue-600" />} color="text-blue-600" />
              <StatCard title="Ativos" value={stats.active} icon={<UserCheck className="w-5 h-5 text-green-600" />} color="text-green-600" />
              <StatCard title="Pendentes" value={stats.pending} icon={<Clock className="w-5 h-5 text-yellow-600" />} color="text-yellow-600" />
              <StatCard title="Bloqueados" value={stats.blocked} icon={<Ban className="w-5 h-5 text-red-600" />} color="text-red-600" />
            </div>
          </div>

          {/* Cards do sistema */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">Dados no Sistema</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatCard title="Famílias" value={totalFamilies} icon={<Home className="w-5 h-5 text-indigo-600" />} color="text-indigo-600" subtitle="Cadastradas" />
              <StatCard title="Pessoas" value={totalPeople} icon={<Users className="w-5 h-5 text-purple-600" />} color="text-purple-600" subtitle="Membros de famílias" />
              <StatCard title="Visitas" value={totalVisits} icon={<Activity className="w-5 h-5 text-teal-600" />} color="text-teal-600" subtitle="Registradas" />
            </div>
          </div>

          {/* Resumo de roles */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">Por Função</h3>
            <div className="grid grid-cols-2 gap-4">
              <StatCard title="Administradores" value={stats.admins} icon={<Shield className="w-5 h-5 text-purple-600" />} color="text-purple-600" />
              <StatCard title="Agentes" value={stats.agents} icon={<Award className="w-5 h-5 text-blue-600" />} color="text-blue-600" />
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* ABA: ASSINATURAS */}
      {/* ============================================ */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Gerenciar Assinaturas
          </h2>

          {/* Alertas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard title="Expirando em 7 dias" value={stats.expiringSoon} icon={<AlertCircle className="w-5 h-5 text-orange-600" />} color="text-orange-600" />
            <StatCard title="Expiradas" value={stats.expired} icon={<XCircle className="w-5 h-5 text-red-600" />} color="text-red-600" />
          </div>

          {/* Lista de assinaturas */}
          <div className="space-y-3">
            {users
              .filter(u => u.role !== UserRole.ADMIN)
              .sort((a, b) => {
                if (!a.subscriptionExpiresAt) return 1;
                if (!b.subscriptionExpiresAt) return -1;
                return new Date(a.subscriptionExpiresAt).getTime() - new Date(b.subscriptionExpiresAt).getTime();
              })
              .map(u => {
                const subInfo = getSubscriptionInfo(u);
                return (
                  <div key={u.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-800">{u.name}</h3>
                        <p className="text-sm text-gray-500">{u.email}</p>
                        {u.healthUnit && <p className="text-xs text-gray-400 mt-0.5">🏥 {u.healthUnit}</p>}
                        {u.cityState && <p className="text-xs text-gray-400">📍 {u.cityState}</p>}
                        <p className={`text-sm font-medium mt-1 ${subInfo.color}`}>
                          📅 {subInfo.text}
                        </p>
                        {u.subscriptionExpiresAt && (
                          <p className="text-xs text-gray-400">
                            Data: {new Date(u.subscriptionExpiresAt).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleRenew(u.id, 30)}
                          className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg transition-all"
                        >
                          +30 dias
                        </button>
                        <button
                          onClick={() => handleRenew(u.id, 90)}
                          className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs rounded-lg transition-all"
                        >
                          +90 dias
                        </button>
                        <button
                          onClick={() => handleRenew(u.id, 365)}
                          className="px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white text-xs rounded-lg transition-all"
                        >
                          +1 ano
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* MODAL: FORMULÁRIO DE USUÁRIO */}
      {/* ============================================ */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingUser ? 'Editar Usuário' : 'Novo Agente'}
                </h2>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveUser} className="space-y-4">
                {/* Nome */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Nome do agente"
                    required
                  />
                </div>

                {/* CPF */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.cpf}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
                        let formatted = digits;
                        if (digits.length > 3) formatted = `${digits.slice(0, 3)}.${digits.slice(3)}`;
                        if (digits.length > 6) formatted = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
                        if (digits.length > 9) formatted = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
                        setFormData({ ...formData, cpf: formatted });
                      }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="000.000.000-00"
                      maxLength={14}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="email@exemplo.com"
                    required
                  />
                </div>

                {/* Senha */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none pr-10"
                      placeholder="Senha do usuário"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Função e Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Função</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                    >
                      <option value="AGENT">Agente</option>
                      <option value="ADMIN">Administrador</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                    >
                      <option value="ACTIVE">Ativo</option>
                      <option value="PENDING">Pendente</option>
                      <option value="BLOCKED">Bloqueado</option>
                    </select>
                  </div>
                </div>

                {/* Endereço */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="Rua, número, bairro"
                    />
                  </div>
                </div>

                {/* Cidade/UF e Unidade de Saúde */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cidade / UF</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.cityState}
                        onChange={(e) => setFormData({ ...formData, cityState: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="São Paulo / SP"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unidade de Saúde</label>
                    <div className="relative">
                      <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.healthUnit}
                        onChange={(e) => setFormData({ ...formData, healthUnit: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="Nome da UBS / ESF"
                      />
                    </div>
                  </div>
                </div>

                {/* Telefone e CNS */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CNS</label>
                    <input
                      type="text"
                      value={formData.cns}
                      onChange={(e) => setFormData({ ...formData, cns: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="Cartão Nacional de Saúde"
                    />
                  </div>
                </div>

                {/* Microárea e Equipe */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Microárea</label>
                    <input
                      type="text"
                      value={formData.microarea}
                      onChange={(e) => setFormData({ ...formData, microarea: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="Ex: 001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Equipe</label>
                    <input
                      type="text"
                      value={formData.equipe}
                      onChange={(e) => setFormData({ ...formData, equipe: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="Ex: ESF 01"
                    />
                  </div>
                </div>

                {/* Assinatura (só para novo) */}
                {!editingUser && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dias de assinatura</label>
                    <select
                      value={formData.subscriptionDays}
                      onChange={(e) => setFormData({ ...formData, subscriptionDays: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                    >
                      <option value={7}>7 dias (teste)</option>
                      <option value={30}>30 dias</option>
                      <option value={90}>90 dias</option>
                      <option value={180}>180 dias</option>
                      <option value={365}>1 ano</option>
                    </select>
                  </div>
                )}

                {/* Botões */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Salvando na nuvem...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {editingUser ? 'Atualizar' : 'Criar Agente'}
                      </>
                    )}
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
