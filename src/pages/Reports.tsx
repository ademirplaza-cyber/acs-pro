import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Person, Visit, VisitStatus, Family } from '../types';
import {
  PieChart,
  Download,
  Users,
  Baby,
  Heart,
  Activity,
  User,
  TrendingUp,
  AlertCircle,
  Calendar,
  MapPin,
  Phone,
  Filter,
  Home,
  Cloud,
  RefreshCw
} from 'lucide-react';

type ReportTab = 'OVERVIEW' | 'PREGNANT' | 'HYPERTENSIVE' | 'DIABETIC' | 'CHILDREN' | 'ELDERLY';

interface PersonWithDetails {
  person: Person;
  family: Family | undefined;
  gestationalAge?: { weeks: number; days: number; trimester: number } | null;
  daysSinceLastVisit: number | null;
  age?: number;
  lastVisit?: any;
}

export const Reports = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ReportTab>('OVERVIEW');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [isLoading, setIsLoading] = useState(true);

  const [families, setFamilies] = useState<Family[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [allPeople, setAllPeople] = useState<Person[]>([]);

  const loadData = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      console.log('📡 Relatórios: carregando dados do Supabase...');

      const [familiesData, visitsData] = await Promise.all([
        api.getFamilies(user.id),
        api.getVisits(user.id),
      ]);

      setFamilies(familiesData);
      setVisits(visitsData);

      const allPeoplePromises = familiesData.map(f => api.getPeople(f.id));
      const peopleArrays = await Promise.all(allPeoplePromises);
      const allPeopleData = peopleArrays.flat();
      setAllPeople(allPeopleData);

      console.log('✅ Relatórios carregados:', {
        families: familiesData.length,
        visits: visitsData.length,
        people: allPeopleData.length,
      });
    } catch (error) {
      console.error('❌ Erro ao carregar relatórios:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const calculateGestationalAge = (dum: string): { weeks: number; days: number; trimester: number } => {
    const dumDate = new Date(dum);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - dumDate.getTime());
    const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(totalDays / 7);
    const days = totalDays % 7;
    const trimester = weeks < 13 ? 1 : weeks < 27 ? 2 : 3;
    return { weeks, days, trimester };
  };

  const stats = useMemo(() => {
    const pregnant = allPeople.filter((p: Person) => p.isPregnant);
    const hypertensive = allPeople.filter((p: Person) => p.hasHypertension);
    const diabetic = allPeople.filter((p: Person) => p.hasDiabetes);
    const children = allPeople.filter((p: Person) => calculateAge(p.birthDate) < 12);
    const childrenUnder2 = allPeople.filter((p: Person) => calculateAge(p.birthDate) < 2);
    const elderly = allPeople.filter((p: Person) => calculateAge(p.birthDate) >= 60);
    const _disabled = allPeople.filter((p: Person) => p.isDisabled);

    const [year, month] = selectedMonth.split('-').map(Number);
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59);

    const monthVisits = visits.filter(v => {
      const visitDate = new Date(v.status === VisitStatus.COMPLETED && v.completedDate ? v.completedDate : v.scheduledDate);
      return visitDate >= monthStart && visitDate <= monthEnd;
    });

    const completedVisits = monthVisits.filter(v => v.status === VisitStatus.COMPLETED);
    const visitedFamilyIds = new Set(completedVisits.map(v => v.familyId));

    return {
      totalPeople: allPeople.length,
      totalFamilies: families.length,
      pregnant: pregnant.length,
      hypertensive: hypertensive.length,
      diabetic: diabetic.length,
      children: children.length,
      childrenUnder2: childrenUnder2.length,
      elderly: elderly.length,
      disabled: _disabled.length,
      monthVisits: monthVisits.length,
      completedVisits: completedVisits.length,
      visitCoverage: families.length > 0 ? (visitedFamilyIds.size / families.length * 100) : 0,
      avgVisitsPerDay: completedVisits.length / 22,
    };
  }, [allPeople, families, visits, selectedMonth]);

  const priorityGroups = useMemo(() => {
    return {
      pregnant: allPeople.filter((p: Person) => p.isPregnant).map((p: Person): PersonWithDetails => {
        const family = families.find((f: Family) => f.id === p.familyId);
        const lastVisit = visits
          .filter(v => v.familyId === p.familyId && v.status === VisitStatus.COMPLETED)
          .sort((a, b) => new Date(b.completedDate!).getTime() - new Date(a.completedDate!).getTime())[0];

        const gestationalAge = p.lastMenstrualPeriod ? calculateGestationalAge(p.lastMenstrualPeriod) : null;
        const daysSinceLastVisit = lastVisit
          ? Math.floor((Date.now() - new Date(lastVisit.completedDate!).getTime()) / (1000 * 60 * 60 * 24))
          : null;

        return { person: p, family, lastVisit, gestationalAge, daysSinceLastVisit };
      }),

      hypertensive: allPeople.filter((p: Person) => p.hasHypertension).map((p: Person): PersonWithDetails => {
        const family = families.find((f: Family) => f.id === p.familyId);
        const lastVisit = visits
          .filter(v => v.familyId === p.familyId && v.status === VisitStatus.COMPLETED)
          .sort((a, b) => new Date(b.completedDate!).getTime() - new Date(a.completedDate!).getTime())[0];

        const daysSinceLastVisit = lastVisit
          ? Math.floor((Date.now() - new Date(lastVisit.completedDate!).getTime()) / (1000 * 60 * 60 * 24))
          : null;

        return { person: p, family, lastVisit, daysSinceLastVisit };
      }),

      diabetic: allPeople.filter((p: Person) => p.hasDiabetes).map((p: Person): PersonWithDetails => {
        const family = families.find((f: Family) => f.id === p.familyId);
        const lastVisit = visits
          .filter(v => v.familyId === p.familyId && v.status === VisitStatus.COMPLETED)
          .sort((a, b) => new Date(b.completedDate!).getTime() - new Date(a.completedDate!).getTime())[0];

        const daysSinceLastVisit = lastVisit
          ? Math.floor((Date.now() - new Date(lastVisit.completedDate!).getTime()) / (1000 * 60 * 60 * 24))
          : null;

        return { person: p, family, lastVisit, daysSinceLastVisit };
      }),

      children: allPeople.filter((p: Person) => calculateAge(p.birthDate) < 12).map((p: Person): PersonWithDetails => {
        const family = families.find((f: Family) => f.id === p.familyId);
        const age = calculateAge(p.birthDate);
        const lastVisit = visits
          .filter(v => v.familyId === p.familyId && v.status === VisitStatus.COMPLETED)
          .sort((a, b) => new Date(b.completedDate!).getTime() - new Date(a.completedDate!).getTime())[0];

        return { person: p, family, age, lastVisit, daysSinceLastVisit: null };
      }),

      elderly: allPeople.filter((p: Person) => calculateAge(p.birthDate) >= 60).map((p: Person): PersonWithDetails => {
        const family = families.find((f: Family) => f.id === p.familyId);
        const age = calculateAge(p.birthDate);
        const lastVisit = visits
          .filter(v => v.familyId === p.familyId && v.status === VisitStatus.COMPLETED)
          .sort((a, b) => new Date(b.completedDate!).getTime() - new Date(a.completedDate!).getTime())[0];

        return { person: p, family, age, lastVisit, daysSinceLastVisit: null };
      }),
    };
  }, [allPeople, families, visits]);

  const handleExport = () => {
    const reportData = {
      periodo: new Date(selectedMonth + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      agente: user?.name,
      geradoEm: new Date().toLocaleString('pt-BR'),
      fonte: 'Supabase (nuvem)',
      estatisticas: {
        populacaoTotal: stats.totalPeople,
        totalFamilias: stats.totalFamilies,
        visitasRealizadas: stats.completedVisits,
        coberturaFamiliar: `${stats.visitCoverage.toFixed(1)}%`,
        mediaVisitasDia: stats.avgVisitsPerDay.toFixed(1),
      },
      gruposPrioritarios: {
        gestantes: {
          total: stats.pregnant,
          primeiroTrimestre: priorityGroups.pregnant.filter((p: PersonWithDetails) => p.gestationalAge?.trimester === 1).length,
          segundoTrimestre: priorityGroups.pregnant.filter((p: PersonWithDetails) => p.gestationalAge?.trimester === 2).length,
          terceiroTrimestre: priorityGroups.pregnant.filter((p: PersonWithDetails) => p.gestationalAge?.trimester === 3).length,
          semVisitaHa30Dias: priorityGroups.pregnant.filter((p: PersonWithDetails) => !p.daysSinceLastVisit || p.daysSinceLastVisit > 30).length,
        },
        hipertensos: {
          total: stats.hypertensive,
          semAcompanhamento60Dias: priorityGroups.hypertensive.filter((p: PersonWithDetails) => !p.daysSinceLastVisit || p.daysSinceLastVisit > 60).length,
        },
        diabeticos: {
          total: stats.diabetic,
          semAcompanhamento60Dias: priorityGroups.diabetic.filter((p: PersonWithDetails) => !p.daysSinceLastVisit || p.daysSinceLastVisit > 60).length,
        },
        criancas: stats.children,
        criancasMenor2Anos: stats.childrenUnder2,
        idosos: stats.elderly,
      },
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-acs-${selectedMonth}.json`;
    link.click();
    URL.revokeObjectURL(url);

    alert('✅ Relatório exportado com sucesso!');
  };

  const StatCard = ({
    icon: Icon,
    label,
    value,
    color,
    percentage,
    subtext,
  }: {
    icon: any;
    label: string;
    value: number | string;
    color: string;
    percentage?: number;
    subtext?: string;
  }) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 bg-${color}-100 rounded-xl`}>
          <Icon size={24} className={`text-${color}-600`} />
        </div>
        {percentage !== undefined && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            percentage >= 80 ? 'bg-green-100 text-green-700' :
            percentage >= 50 ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {percentage.toFixed(0)}%
          </span>
        )}
      </div>
      <h3 className="text-3xl font-bold text-slate-800 mb-1">{value}</h3>
      <p className="text-sm text-slate-600 font-medium">{label}</p>
      {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
    </div>
  );

  const TabButton = ({ value, label, icon: Icon, count }: {
    value: ReportTab;
    label: string;
    icon: any;
    count: number;
  }) => {
    const active = activeTab === value;
    return (
      <button
        onClick={() => setActiveTab(value)}
        className={`flex items-center space-x-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
          active
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
        }`}
      >
        <Icon size={18} />
        <span>{label}</span>
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
          active ? 'bg-white/20' : 'bg-slate-100 text-slate-700'
        }`}>
          {count}
        </span>
      </button>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Relatórios e Indicadores</h1>
          <p className="text-slate-600">Carregando dados da nuvem...</p>
        </div>
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Buscando dados do Supabase...</p>
            <p className="text-gray-400 text-sm mt-1">Famílias, pessoas e visitas</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Relatórios e Indicadores</h1>
          <p className="text-slate-600 flex items-center gap-2">
            <Cloud size={16} className="text-blue-500" />
            Dados da nuvem — Acompanhamento de grupos prioritários e indicadores do e-SUS
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-semibold flex items-center space-x-2 transition-all"
          >
            <RefreshCw size={18} />
            <span>Atualizar</span>
          </button>
          <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl border border-slate-200">
            <Calendar size={18} className="text-slate-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              max={new Date().toISOString().slice(0, 7)}
              className="outline-none text-sm font-medium text-slate-700"
            />
          </div>
          <button
            onClick={handleExport}
            className="bg-purple-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-purple-700 flex items-center space-x-2 shadow-sm"
          >
            <Download size={18} />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={Users} label="População Total" value={stats.totalPeople} color="blue" subtext="Pessoas cadastradas" />
        <StatCard icon={Home} label="Famílias" value={stats.totalFamilies} color="green" subtext="Domicílios" />
        <StatCard icon={Baby} label="Gestantes" value={stats.pregnant} color="pink" subtext="Acompanhamento pré-natal" />
        <StatCard icon={Heart} label="Hipertensos" value={stats.hypertensive} color="red" subtext="Controle pressão arterial" />
        <StatCard icon={Activity} label="Diabéticos" value={stats.diabetic} color="blue" subtext="Controle glicêmico" />
        <StatCard icon={User} label="Idosos (60+)" value={stats.elderly} color="purple" subtext="Cuidado integral" />
      </div>

      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-3 rounded-xl">
              <TrendingUp size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Produtividade do Mês</h2>
              <p className="text-blue-100">
                {new Date(selectedMonth + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <p className="text-blue-100 text-sm mb-2">Visitas Realizadas</p>
            <p className="text-4xl font-bold">{stats.completedVisits}</p>
            <p className="text-blue-200 text-sm mt-1">de {stats.monthVisits} agendadas</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <p className="text-blue-100 text-sm mb-2">Cobertura Familiar</p>
            <p className="text-4xl font-bold">{stats.visitCoverage.toFixed(0)}%</p>
            <div className="w-full bg-white/20 rounded-full h-2 mt-2">
              <div className="bg-white h-2 rounded-full transition-all" style={{ width: `${Math.min(stats.visitCoverage, 100)}%` }} />
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <p className="text-blue-100 text-sm mb-2">Média Diária</p>
            <p className="text-4xl font-bold">{stats.avgVisitsPerDay.toFixed(1)}</p>
            <p className="text-blue-200 text-sm mt-1">visitas/dia útil</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <p className="text-blue-100 text-sm mb-2">Meta Previne Brasil</p>
            <p className="text-4xl font-bold">{stats.childrenUnder2}</p>
            <p className="text-blue-200 text-sm mt-1">crianças &lt; 2 anos</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap gap-3">
        <div className="flex items-center space-x-2 text-slate-500 text-sm mr-2">
          <Filter size={16} />
          <span>Grupos:</span>
        </div>
        <TabButton value="OVERVIEW" label="Visão Geral" icon={PieChart} count={stats.totalPeople} />
        <TabButton value="PREGNANT" label="Gestantes" icon={Baby} count={stats.pregnant} />
        <TabButton value="HYPERTENSIVE" label="Hipertensos" icon={Heart} count={stats.hypertensive} />
        <TabButton value="DIABETIC" label="Diabéticos" icon={Activity} count={stats.diabetic} />
        <TabButton value="CHILDREN" label="Crianças" icon={Baby} count={stats.children} />
        <TabButton value="ELDERLY" label="Idosos" icon={User} count={stats.elderly} />
      </div>

      {activeTab === 'OVERVIEW' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <div className="bg-pink-100 p-2 rounded-lg mr-3"><Baby size={20} className="text-pink-600" /></div>
              Gestantes por Trimestre
            </h3>
            {priorityGroups.pregnant.length === 0 ? (
              <p className="text-slate-500 text-center py-8">Nenhuma gestante cadastrada</p>
            ) : (
              <div className="space-y-3">
                {[1, 2, 3].map(trimester => {
                  const count = priorityGroups.pregnant.filter((p: PersonWithDetails) => p.gestationalAge?.trimester === trimester).length;
                  return (
                    <div key={trimester} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="text-sm font-medium text-slate-700">{trimester}º Trimestre</span>
                      <span className="text-lg font-bold text-slate-800">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <div className="bg-red-100 p-2 rounded-lg mr-3"><AlertCircle size={20} className="text-red-600" /></div>
              Alertas Prioritários
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                <span className="text-sm font-medium text-red-800">Gestantes sem visita (30+ dias)</span>
                <span className="text-lg font-bold text-red-600">
                  {priorityGroups.pregnant.filter((p: PersonWithDetails) => !p.daysSinceLastVisit || p.daysSinceLastVisit > 30).length}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <span className="text-sm font-medium text-orange-800">Hipertensos sem acompanhamento</span>
                <span className="text-lg font-bold text-orange-600">
                  {priorityGroups.hypertensive.filter((p: PersonWithDetails) => !p.daysSinceLastVisit || p.daysSinceLastVisit > 60).length}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <span className="text-sm font-medium text-yellow-800">Diabéticos sem acompanhamento</span>
                <span className="text-lg font-bold text-yellow-600">
                  {priorityGroups.diabetic.filter((p: PersonWithDetails) => !p.daysSinceLastVisit || p.daysSinceLastVisit > 60).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'PREGNANT' && (
        <div className="space-y-4">
          {priorityGroups.pregnant.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border-2 border-dashed border-slate-300 text-center">
              <Baby size={48} className="mx-auto text-slate-400 mb-4" />
              <h3 className="text-xl font-bold text-slate-800 mb-2">Nenhuma gestante cadastrada</h3>
              <p className="text-slate-600">As gestantes cadastradas aparecerão aqui</p>
            </div>
          ) : (
            priorityGroups.pregnant.map(({ person, family, gestationalAge, daysSinceLastVisit }: PersonWithDetails) => (
              <div key={person.id} className="bg-white p-6 rounded-xl border-2 border-pink-200 hover:shadow-md transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="bg-pink-100 p-3 rounded-lg"><Baby size={24} className="text-pink-600" /></div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-slate-800 mb-1">{person.name}</h3>
                      <div className="space-y-1 text-sm text-slate-600 mb-3">
                        <div className="flex items-center space-x-2"><MapPin size={14} /><span>Família {family?.familyNumber} - {family?.address.street}, {family?.address.number}</span></div>
                        {person.phone && (<div className="flex items-center space-x-2"><Phone size={14} /><span>{person.phone}</span></div>)}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {gestationalAge && (<span className="text-xs bg-pink-100 text-pink-700 px-3 py-1 rounded-full font-medium">IG: {gestationalAge.weeks}s {gestationalAge.days}d • {gestationalAge.trimester}º Trimestre</span>)}
                        {person.pregnancyDueDate && (<span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">DPP: {new Date(person.pregnancyDueDate).toLocaleDateString('pt-BR')}</span>)}
                        {daysSinceLastVisit !== null ? (
                          <span className={`text-xs px-3 py-1 rounded-full font-medium ${daysSinceLastVisit > 30 ? 'bg-red-100 text-red-700' : daysSinceLastVisit > 15 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                            {daysSinceLastVisit > 30 ? '⚠️ ' : ''}Última visita: há {daysSinceLastVisit} dias
                          </span>
                        ) : (
                          <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-medium">⚠️ Sem visitas registradas</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'HYPERTENSIVE' && (
        <div className="space-y-4">
          {priorityGroups.hypertensive.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border-2 border-dashed border-slate-300 text-center">
              <Heart size={48} className="mx-auto text-slate-400 mb-4" />
              <h3 className="text-xl font-bold text-slate-800 mb-2">Nenhum hipertenso cadastrado</h3>
              <p className="text-slate-600">Os hipertensos cadastrados aparecerão aqui</p>
            </div>
          ) : (
            priorityGroups.hypertensive.map(({ person, family, daysSinceLastVisit }: PersonWithDetails) => (
              <div key={person.id} className="bg-white p-6 rounded-xl border-2 border-red-200 hover:shadow-md transition-all">
                <div className="flex items-start space-x-4">
                  <div className="bg-red-100 p-3 rounded-lg"><Heart size={24} className="text-red-600" /></div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-slate-800 mb-1">{person.name}</h3>
                    <div className="space-y-1 text-sm text-slate-600 mb-3">
                      <div className="flex items-center space-x-2"><MapPin size={14} /><span>Família {family?.familyNumber} - {family?.address.street}, {family?.address.number}</span></div>
                      <p className="text-xs text-slate-500">Idade: {calculateAge(person.birthDate)} anos</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {person.hasDiabetes && (<span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">Também diabético</span>)}
                      {person.medications && person.medications.length > 0 && (<span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">Medicações: {person.medications.join(', ')}</span>)}
                      {daysSinceLastVisit !== null ? (
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${daysSinceLastVisit > 60 ? 'bg-red-100 text-red-700' : daysSinceLastVisit > 30 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                          {daysSinceLastVisit > 60 ? '⚠️ ' : ''}Última visita: há {daysSinceLastVisit} dias
                        </span>
                      ) : (
                        <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-medium">⚠️ Sem visitas registradas</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'DIABETIC' && (
        <div className="space-y-4">
          {priorityGroups.diabetic.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border-2 border-dashed border-slate-300 text-center">
              <Activity size={48} className="mx-auto text-slate-400 mb-4" />
              <h3 className="text-xl font-bold text-slate-800 mb-2">Nenhum diabético cadastrado</h3>
              <p className="text-slate-600">Os diabéticos cadastrados aparecerão aqui</p>
            </div>
          ) : (
            priorityGroups.diabetic.map(({ person, family, daysSinceLastVisit }: PersonWithDetails) => (
              <div key={person.id} className="bg-white p-6 rounded-xl border-2 border-blue-200 hover:shadow-md transition-all">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 p-3 rounded-lg"><Activity size={24} className="text-blue-600" /></div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-slate-800 mb-1">{person.name}</h3>
                    <div className="space-y-1 text-sm text-slate-600 mb-3">
                      <div className="flex items-center space-x-2"><MapPin size={14} /><span>Família {family?.familyNumber} - {family?.address.street}, {family?.address.number}</span></div>
                      <p className="text-xs text-slate-500">Idade: {calculateAge(person.birthDate)} anos</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {person.hasHypertension && (<span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-medium">Também hipertenso</span>)}
                      {person.medications && person.medications.length > 0 && (<span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">Medicações: {person.medications.join(', ')}</span>)}
                      {daysSinceLastVisit !== null ? (
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${daysSinceLastVisit > 60 ? 'bg-red-100 text-red-700' : daysSinceLastVisit > 30 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                          {daysSinceLastVisit > 60 ? '⚠️ ' : ''}Última visita: há {daysSinceLastVisit} dias
                        </span>
                      ) : (
                        <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-medium">⚠️ Sem visitas registradas</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'CHILDREN' && (
        <div className="space-y-4">
          {priorityGroups.children.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border-2 border-dashed border-slate-300 text-center">
              <Baby size={48} className="mx-auto text-slate-400 mb-4" />
              <h3 className="text-xl font-bold text-slate-800 mb-2">Nenhuma criança cadastrada</h3>
              <p className="text-slate-600">As crianças cadastradas aparecerão aqui</p>
            </div>
          ) : (
            priorityGroups.children.map(({ person, family, age }: PersonWithDetails) => (
              <div key={person.id} className="bg-white p-6 rounded-xl border-2 border-green-200 hover:shadow-md transition-all">
                <div className="flex items-start space-x-4">
                  <div className="bg-green-100 p-3 rounded-lg"><Baby size={24} className="text-green-600" /></div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-slate-800 mb-1">{person.name}</h3>
                    <div className="space-y-1 text-sm text-slate-600 mb-3">
                      <div className="flex items-center space-x-2"><MapPin size={14} /><span>Família {family?.familyNumber} - {family?.address.street}, {family?.address.number}</span></div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${(age !== undefined && age < 2) ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {age !== undefined && age < 1 ? `${age} ano (Previne Brasil)` : age !== undefined && age < 2 ? `${age} ano(s) (Previne Brasil)` : `${age} anos`}
                      </span>
                      <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-medium">Nasc: {new Date(person.birthDate).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'ELDERLY' && (
        <div className="space-y-4">
          {priorityGroups.elderly.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border-2 border-dashed border-slate-300 text-center">
              <User size={48} className="mx-auto text-slate-400 mb-4" />
              <h3 className="text-xl font-bold text-slate-800 mb-2">Nenhum idoso cadastrado</h3>
              <p className="text-slate-600">Os idosos cadastrados aparecerão aqui</p>
            </div>
          ) : (
            priorityGroups.elderly.map(({ person, family, age }: PersonWithDetails) => (
              <div key={person.id} className="bg-white p-6 rounded-xl border-2 border-purple-200 hover:shadow-md transition-all">
                <div className="flex items-start space-x-4">
                  <div className="bg-purple-100 p-3 rounded-lg"><User size={24} className="text-purple-600" /></div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-slate-800 mb-1">{person.name}</h3>
                    <div className="space-y-1 text-sm text-slate-600 mb-3">
                      <div className="flex items-center space-x-2"><MapPin size={14} /><span>Família {family?.familyNumber} - {family?.address.street}, {family?.address.number}</span></div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">{age} anos</span>
                      {person.hasHypertension && (<span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-medium">Hipertenso</span>)}
                      {person.hasDiabetes && (<span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">Diabético</span>)}
                      {person.isDisabled && (<span className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium">PcD</span>)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
