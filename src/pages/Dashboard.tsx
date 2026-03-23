import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Family, Visit } from '../types';
import { usePageTracking } from '../hooks/usePageTracking';
import {
  Users,
  ClipboardList,
  AlertCircle,
  TrendingUp,
  Calendar,
  MapPin,
  Activity,
  Clock,
  CheckCircle2,
  Plus,
  Cloud,
  RefreshCw
} from 'lucide-react';
import { VisitStatus, PriorityLevel } from '../types';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  usePageTracking('DASHBOARD', 'VIEW_DASHBOARD');

  // ============================================
  // ESTADOS — dados carregados do Supabase
  // ============================================
  const [families, setFamilies] = useState<Family[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // ============================================
  // CARREGAR DADOS DO SUPABASE
  // ============================================
  const loadData = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      console.log('📡 Dashboard: carregando dados do Supabase...');

      const [familiesData, visitsData] = await Promise.all([
        api.getFamilies(user.id),
        api.getVisits(user.id),
      ]);

      setFamilies(familiesData);
      setVisits(visitsData);
      setLastUpdate(new Date().toLocaleTimeString('pt-BR'));

      console.log('✅ Dashboard carregado:', {
        families: familiesData.length,
        visits: visitsData.length,
      });
    } catch (error) {
      console.error('❌ Erro ao carregar dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // ============================================
  // CÁLCULOS DE MÉTRICAS
  // ============================================
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pendingVisits = visits.filter(v => v.status === VisitStatus.PENDING);
    const overdueVisits = pendingVisits.filter(v => new Date(v.scheduledDate) < today);
    const todayVisits = pendingVisits.filter(v => {
      const visitDate = new Date(v.scheduledDate);
      visitDate.setHours(0, 0, 0, 0);
      return visitDate.getTime() === today.getTime();
    });

    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const completedThisMonth = visits.filter(v =>
      v.status === VisitStatus.COMPLETED &&
      v.completedDate &&
      new Date(v.completedDate) >= thisMonthStart
    );

    const highPriorityPending = pendingVisits.filter(v =>
      v.priority === PriorityLevel.HIGH || v.priority === PriorityLevel.URGENT
    );

    return {
      totalFamilies: families.length,
      totalVisits: visits.length,
      pendingVisits: pendingVisits.length,
      overdueVisits: overdueVisits.length,
      todayVisits: todayVisits.length,
      completedThisMonth: completedThisMonth.length,
      highPriorityPending: highPriorityPending.length,
    };
  }, [families, visits]);

  // Próximas visitas ordenadas por data
  const upcomingVisits = useMemo(() => {
    return visits
      .filter(v => v.status === VisitStatus.PENDING)
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
      .slice(0, 5);
  }, [visits]);

  // ============================================
  // COMPONENTES INTERNOS
  // ============================================
  const StatCard = ({
    icon: Icon,
    label,
    value,
    color,
    trend,
    link,
  }: {
    icon: any;
    label: string;
    value: number;
    color: string;
    trend?: string;
    link?: string;
  }) => (
    <Link
      to={link || '#'}
      className={`bg-white p-6 rounded-2xl shadow-sm border-2 border-transparent hover:border-${color}-200 hover:shadow-md transition-all group`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 bg-${color}-100 rounded-xl group-hover:scale-110 transition-transform`}>
          <Icon size={24} className={`text-${color}-600`} />
        </div>
        {trend && (
          <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <h3 className="text-3xl font-bold text-slate-800 mb-1">{value}</h3>
      <p className="text-sm text-slate-500 font-medium">{label}</p>
    </Link>
  );

  const VisitItem = ({ visit }: { visit: Visit }) => {
    const family = families.find(f => f.id === visit.familyId);
    const visitDate = new Date(visit.scheduledDate);
    const isOverdue = visitDate < new Date() && visit.status === VisitStatus.PENDING;
    const isToday = visitDate.toDateString() === new Date().toDateString();

    const priorityColors: Record<string, string> = {
      [PriorityLevel.LOW]: 'bg-slate-100 text-slate-600',
      [PriorityLevel.MEDIUM]: 'bg-blue-100 text-blue-700',
      [PriorityLevel.HIGH]: 'bg-orange-100 text-orange-700',
      [PriorityLevel.URGENT]: 'bg-red-100 text-red-700',
    };

    return (
      <Link
        to="/visits"
        className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group"
      >
        <div className="flex items-center space-x-4 flex-1">
          <div className={`p-3 rounded-lg ${isOverdue ? 'bg-red-100' : isToday ? 'bg-green-100' : 'bg-slate-100'}`}>
            <Calendar size={20} className={isOverdue ? 'text-red-600' : isToday ? 'text-green-600' : 'text-slate-600'} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800 truncate">
              {family ? `${family.address.street}, ${family.address.number}` : 'Família não encontrada'}
            </p>
            <p className="text-sm text-slate-500">
              {visitDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
              {isToday && <span className="ml-2 text-green-600 font-semibold">• Hoje</span>}
              {isOverdue && <span className="ml-2 text-red-600 font-semibold">• Atrasada</span>}
            </p>
          </div>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${priorityColors[visit.priority] || 'bg-slate-100 text-slate-600'}`}>
          {visit.priority === PriorityLevel.URGENT ? 'Urgente' :
           visit.priority === PriorityLevel.HIGH ? 'Alta' :
           visit.priority === PriorityLevel.MEDIUM ? 'Média' : 'Baixa'}
        </span>
      </Link>
    );
  };

  // ============================================
  // LOADING
  // ============================================
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white shadow-lg">
          <h1 className="text-3xl font-bold mb-2">Olá, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="text-blue-100 text-lg">Carregando seus dados...</p>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-gray-500 text-sm">Buscando dados na nuvem...</p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6">
      {/* Header Personalizado */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Olá, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-blue-100 text-lg">
              {new Date().toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
            {/* Indicador de nuvem */}
            <div className="flex items-center gap-2 mt-2 text-blue-200 text-sm">
              <Cloud size={16} />
              <span>Dados da nuvem</span>
              {lastUpdate && <span>• Atualizado às {lastUpdate}</span>}
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={loadData}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-3 transition-all"
              title="Atualizar dados"
            >
              <RefreshCw size={24} className="text-white" />
            </button>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
              <Activity size={48} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Alertas Críticos */}
      {(stats.overdueVisits > 0 || stats.highPriorityPending > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          {stats.overdueVisits > 0 && (
            <Link
              to="/visits"
              className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center space-x-4 hover:bg-red-100 transition-colors group"
            >
              <div className="bg-red-100 p-3 rounded-lg group-hover:scale-110 transition-transform">
                <AlertCircle size={24} className="text-red-600" />
              </div>
              <div>
                <p className="font-bold text-red-900 text-lg">{stats.overdueVisits} Visitas Atrasadas</p>
                <p className="text-sm text-red-700">Requerem atenção imediata</p>
              </div>
            </Link>
          )}

          {stats.highPriorityPending > 0 && (
            <Link
              to="/visits"
              className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 flex items-center space-x-4 hover:bg-orange-100 transition-colors group"
            >
              <div className="bg-orange-100 p-3 rounded-lg group-hover:scale-110 transition-transform">
                <Clock size={24} className="text-orange-600" />
              </div>
              <div>
                <p className="font-bold text-orange-900 text-lg">{stats.highPriorityPending} Alta Prioridade</p>
                <p className="text-sm text-orange-700">Casos prioritários pendentes</p>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* Cards de Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Famílias Cadastradas"
          value={stats.totalFamilies}
          color="blue"
          link="/families"
        />
        <StatCard
          icon={Calendar}
          label="Visitas Hoje"
          value={stats.todayVisits}
          color="green"
          link="/visits"
        />
        <StatCard
          icon={ClipboardList}
          label="Visitas Pendentes"
          value={stats.pendingVisits}
          color="orange"
          link="/visits"
        />
        <StatCard
          icon={CheckCircle2}
          label="Realizadas (Mês)"
          value={stats.completedThisMonth}
          color="purple"
          link="/reports"
        />
      </div>

      {/* Próximas Visitas */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <MapPin size={20} className="text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Próximas Visitas</h2>
          </div>
          <Link
            to="/visits"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
          >
            <span>Ver todas</span>
            <TrendingUp size={16} />
          </Link>
        </div>

        <div className="p-6 space-y-3">
          {upcomingVisits.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium mb-2">Nenhuma visita pendente</p>
              <p className="text-sm text-slate-500">Você está em dia com suas visitas!</p>
              <Link
                to="/visits"
                className="mt-4 inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} />
                <span>Agendar Nova Visita</span>
              </Link>
            </div>
          ) : (
            <>
              {upcomingVisits.map(visit => (
                <VisitItem key={visit.id} visit={visit} />
              ))}

              {visits.filter(v => v.status === VisitStatus.PENDING).length > 5 && (
                <Link
                  to="/visits"
                  className="block text-center py-3 text-blue-600 font-semibold hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Ver mais {visits.filter(v => v.status === VisitStatus.PENDING).length - 5} visitas pendentes
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link
          to="/visits"
          className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl text-white hover:shadow-lg transition-all group"
        >
          <ClipboardList size={32} className="mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-lg mb-1">Registrar Visita</h3>
          <p className="text-sm text-blue-100">Adicionar nova visita domiciliar</p>
        </Link>

        <Link
          to="/families"
          className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl text-white hover:shadow-lg transition-all group"
        >
          <Users size={32} className="mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-lg mb-1">Cadastrar Família</h3>
          <p className="text-sm text-green-100">Adicionar nova família na área</p>
        </Link>

        <Link
          to="/reports"
          className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl text-white hover:shadow-lg transition-all group"
        >
          <TrendingUp size={32} className="mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-lg mb-1">Ver Relatórios</h3>
          <p className="text-sm text-purple-100">Acompanhar indicadores</p>
        </Link>
      </div>
    </div>
  );
};
