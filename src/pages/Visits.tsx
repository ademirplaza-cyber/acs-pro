import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Visit, VisitStatus, PriorityLevel, Family } from '../types';
import {
  ClipboardList,
  Plus,
  Calendar,
  MapPin,
  Save,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Navigation,
  Filter,
  Search,
  Home,
  User,
  RefreshCw,
  Edit3
} from 'lucide-react';

type FilterTab = 'TODAY' | 'PENDING' | 'OVERDUE' | 'COMPLETED' | 'ALL';
type LocationMode = 'GPS' | 'MANUAL' | null;

// ===== Helper de data FORA do componente =====
const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

export const Visits = () => {
  const { user } = useAuth();

  // ===== TODOS OS HOOKS PRIMEIRO =====
  const [visits, setVisits] = useState<Visit[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>('TODAY');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCompletingVisit, setIsCompletingVisit] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    familyId: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: '09:00',
    priority: PriorityLevel.MEDIUM,
    observations: '',
  });

  const [completionData, setCompletionData] = useState({
    observations: '',
    orientationsGiven: '',
    healthIssuesIdentified: '',
    referralsNeeded: '',
  });

  const [location, setLocation] = useState<{ latitude?: number; longitude?: number }>({});
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [locationMode, setLocationMode] = useState<LocationMode>(null);
  const [manualAddress, setManualAddress] = useState('');
  const [gpsError, setGpsError] = useState('');

  const today = startOfDay(new Date());

  // ===== Carregar dados do Supabase =====
  const loadData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      console.log('🔄 Carregando visitas e famílias do Supabase...');

      const [visitsData, familiesData] = await Promise.all([
        api.getVisits(user.id),
        api.getFamilies(user.id),
      ]);

      setVisits(visitsData);
      setFamilies(familiesData);
      console.log('✅ Dados carregados:', visitsData.length, 'visitas,', familiesData.length, 'famílias');
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // ===== Filtrar e organizar visitas =====
  const filteredVisits = useMemo(() => {
    let filtered = visits.filter(v => {
      const vDate = startOfDay(new Date(v.scheduledDate));

      switch (activeTab) {
        case 'TODAY':
          return v.status === VisitStatus.PENDING && vDate.getTime() === today.getTime();
        case 'PENDING':
          return v.status === VisitStatus.PENDING;
        case 'OVERDUE':
          return v.status === VisitStatus.PENDING && vDate.getTime() < today.getTime();
        case 'COMPLETED':
          return v.status === VisitStatus.COMPLETED;
        case 'ALL':
        default:
          return true;
      }
    });

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(v => {
        const family = families.find(f => f.id === v.familyId);
        return (
          family?.familyNumber.toLowerCase().includes(term) ||
          family?.address.street.toLowerCase().includes(term) ||
          family?.address.neighborhood.toLowerCase().includes(term) ||
          v.observations?.toLowerCase().includes(term)
        );
      });
    }

    return filtered.sort(
      (a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
    );
  }, [visits, activeTab, searchTerm, families, today]);

  // ===== Estatísticas =====
  const stats = useMemo(() => {
    const pending = visits.filter(v => v.status === VisitStatus.PENDING);
    const overdue = pending.filter(v => startOfDay(new Date(v.scheduledDate)) < today);
    const todayVisits = pending.filter(
      v => startOfDay(new Date(v.scheduledDate)).getTime() === today.getTime()
    );
    const completed = visits.filter(v => v.status === VisitStatus.COMPLETED);
    const completedThisMonth = completed.filter(v => {
      const completedDate = new Date(v.completedDate || '');
      return (
        completedDate.getMonth() === today.getMonth() &&
        completedDate.getFullYear() === today.getFullYear()
      );
    });

    return {
      total: visits.length,
      pending: pending.length,
      overdue: overdue.length,
      today: todayVisits.length,
      completed: completed.length,
      completedThisMonth: completedThisMonth.length,
    };
  }, [visits, today]);

  // ===== FUNÇÕES =====

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Seu dispositivo não suporta GPS. Use a localização manual.');
      setLocationMode('MANUAL');
      return;
    }

    setIsCapturingLocation(true);
    setGpsError('');

    navigator.geolocation.getCurrentPosition(
      position => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setIsCapturingLocation(false);
        setLocationMode('GPS');
        setGpsError('');
        console.log(`📍 GPS capturado: ${position.coords.latitude}, ${position.coords.longitude}`);
      },
      error => {
        setIsCapturingLocation(false);
        console.error('Erro GPS:', error);

        let errorMsg = '';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Permissão de localização negada. Use a opção manual abaixo.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Localização indisponível. Use a opção manual abaixo.';
            break;
          case error.TIMEOUT:
            errorMsg = 'Tempo esgotado ao buscar GPS. Use a opção manual abaixo.';
            break;
          default:
            errorMsg = 'Erro ao capturar GPS. Use a opção manual abaixo.';
        }

        setGpsError(errorMsg);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  };

  const handleUseManualLocation = () => {
    setLocationMode('MANUAL');
    setGpsError('');
  };

  const handleUseFamilyAddress = (visitId: string) => {
    const visit = visits.find(v => v.id === visitId);
    if (!visit) return;

    const family = families.find(f => f.id === visit.familyId);
    if (!family) return;

    // Se a família tem coordenadas cadastradas, usar elas
    if (family.address.latitude && family.address.longitude) {
      setLocation({
        latitude: family.address.latitude,
        longitude: family.address.longitude,
      });
      setLocationMode('MANUAL');
      setManualAddress(
        `${family.address.street}, ${family.address.number} - ${family.address.neighborhood}, ${family.address.city}`
      );
      console.log('📍 Usando coordenadas da família:', family.address.latitude, family.address.longitude);
    } else {
      // Sem coordenadas — preencher apenas o endereço texto
      setLocationMode('MANUAL');
      setManualAddress(
        `${family.address.street}, ${family.address.number} - ${family.address.neighborhood}, ${family.address.city}`
      );
      // Usar coordenadas genéricas (0,0) marcadas como manual
      setLocation({ latitude: 0, longitude: 0 });
      console.log('📍 Usando endereço da família (sem coordenadas GPS)');
    }
  };

  const isLocationReady = (): boolean => {
    if (locationMode === 'GPS' && location.latitude && location.latitude !== 0) return true;
    if (locationMode === 'MANUAL' && manualAddress.trim().length > 5) return true;
    return false;
  };

  const handleScheduleVisit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !formData.familyId) {
      alert('⚠️ Selecione uma família');
      return;
    }

    try {
      setIsSaving(true);

      const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}:00`);

      const newVisit: Visit = {
        id: crypto.randomUUID(),
        familyId: formData.familyId,
        agentId: user.id,
        scheduledDate: scheduledDateTime.toISOString(),
        status: VisitStatus.PENDING,
        priority: formData.priority,
        observations: formData.observations || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        needsSync: false,
      };

      await api.saveVisit(newVisit);
      await loadData();

      setFormData({
        familyId: '',
        scheduledDate: new Date().toISOString().split('T')[0],
        scheduledTime: '09:00',
        priority: PriorityLevel.MEDIUM,
        observations: '',
      });
      setIsFormOpen(false);

      alert('✅ Visita agendada na nuvem com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao agendar visita:', error);
      alert('❌ Erro ao agendar visita. Verifique sua conexão.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompleteVisit = async (visitId: string) => {
    if (!isLocationReady()) {
      alert('⚠️ Informe a localização (GPS ou manual) antes de finalizar a visita.');
      return;
    }

    const visit = visits.find(v => v.id === visitId);
    if (!visit) return;

    try {
      setIsSaving(true);

      // Montar observação com endereço manual se aplicável
      let finalObservations = completionData.observations || visit.observations || '';
      if (locationMode === 'MANUAL' && manualAddress) {
        finalObservations = `[Localização manual: ${manualAddress}]\n${finalObservations}`;
      }

      const updatedVisit: Visit = {
        ...visit,
        status: VisitStatus.COMPLETED,
        completedDate: new Date().toISOString(),
        latitude: location.latitude || undefined,
        longitude: location.longitude || undefined,
        observations: finalObservations,
        orientationsGiven: completionData.orientationsGiven
          ? completionData.orientationsGiven.split('\n').filter(o => o.trim())
          : undefined,
        healthIssuesIdentified: completionData.healthIssuesIdentified
          ? completionData.healthIssuesIdentified.split('\n').filter(h => h.trim())
          : undefined,
        referralsNeeded: completionData.referralsNeeded
          ? completionData.referralsNeeded.split('\n').filter(r => r.trim())
          : undefined,
        updatedAt: new Date().toISOString(),
      };

      await api.saveVisit(updatedVisit);
      await loadData();

      setIsCompletingVisit(null);
      setCompletionData({
        observations: '',
        orientationsGiven: '',
        healthIssuesIdentified: '',
        referralsNeeded: '',
      });
      setLocation({});
      setLocationMode(null);
      setManualAddress('');
      setGpsError('');

      alert('✅ Visita finalizada e salva na nuvem!');
    } catch (error) {
      console.error('❌ Erro ao finalizar visita:', error);
      alert('❌ Erro ao finalizar visita. Verifique sua conexão.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelVisit = async (visitId: string) => {
    if (!confirm('❓ Tem certeza que deseja cancelar esta visita?')) return;

    const visit = visits.find(v => v.id === visitId);
    if (!visit) return;

    try {
      const updatedVisit: Visit = {
        ...visit,
        status: VisitStatus.CANCELLED,
        updatedAt: new Date().toISOString(),
      };

      await api.saveVisit(updatedVisit);
      await loadData();

      alert('✅ Visita cancelada');
    } catch (error) {
      console.error('❌ Erro ao cancelar visita:', error);
      alert('❌ Erro ao cancelar visita. Tente novamente.');
    }
  };

  const getPriorityColor = (priority: PriorityLevel) => {
    const colors: Record<string, string> = {
      [PriorityLevel.LOW]: 'bg-slate-100 text-slate-700',
      [PriorityLevel.MEDIUM]: 'bg-blue-100 text-blue-700',
      [PriorityLevel.HIGH]: 'bg-orange-100 text-orange-700',
      [PriorityLevel.URGENT]: 'bg-red-100 text-red-700',
    };
    return colors[priority] || 'bg-slate-100 text-slate-700';
  };

  const getPriorityLabel = (priority: PriorityLevel) => {
    const labels: Record<string, string> = {
      [PriorityLevel.LOW]: 'Baixa',
      [PriorityLevel.MEDIUM]: 'Média',
      [PriorityLevel.HIGH]: 'Alta',
      [PriorityLevel.URGENT]: 'Urgente',
    };
    return labels[priority] || 'Média';
  };

  const TabButton = ({
    value,
    label,
    count,
    icon: Icon,
  }: {
    value: FilterTab;
    label: string;
    count: number;
    icon: any;
  }) => {
    const active = activeTab === value;
    return (
      <button
        onClick={() => setActiveTab(value)}
        className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all ${
          active
            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
            : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
        }`}
      >
        <Icon size={16} />
        <span>{label}</span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            active ? 'bg-white/20' : 'bg-slate-100 text-slate-700'
          }`}
        >
          {count}
        </span>
      </button>
    );
  };

  // ===== RETURNS CONDICIONAIS =====

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando visitas do banco de dados...</p>
        </div>
      </div>
    );
  }

  // ===== FORMULÁRIO DE CONCLUSÃO =====
  if (isCompletingVisit) {
    const visit = visits.find(v => v.id === isCompletingVisit);
    const family = families.find(f => f.id === visit?.familyId);

    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-3 rounded-xl">
                <CheckCircle2 size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Finalizar Visita</h1>
                <p className="text-green-100">
                  Família {family?.familyNumber} - {family?.address.street}, {family?.address.number} • ☁️
                  Salva na nuvem
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsCompletingVisit(null);
                setLocation({});
                setLocationMode(null);
                setManualAddress('');
                setGpsError('');
              }}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              disabled={isSaving}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          {/* ============================================ */}
          {/* SEÇÃO DE LOCALIZAÇÃO — GPS ou Manual */}
          {/* ============================================ */}
          <div
            className={`p-4 rounded-xl border-2 ${
              isLocationReady()
                ? 'bg-green-50 border-green-200'
                : 'bg-orange-50 border-orange-200'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <Navigation
                  size={24}
                  className={isLocationReady() ? 'text-green-600' : 'text-orange-600'}
                />
                <div>
                  <p className="font-semibold text-slate-800">Localização da Visita</p>
                  {isLocationReady() ? (
                    <p className="text-sm text-green-600">
                      ✓{' '}
                      {locationMode === 'GPS'
                        ? `GPS capturado: ${location.latitude?.toFixed(6)}, ${location.longitude?.toFixed(6)}`
                        : `Endereço manual: ${manualAddress}`}
                    </p>
                  ) : (
                    <p className="text-sm text-orange-600">
                      Escolha uma das opções abaixo para registrar a localização
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Erro do GPS */}
            {gpsError && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-red-700 text-sm">{gpsError}</span>
              </div>
            )}

            {/* Botões de opção */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Opção 1: GPS Automático */}
              <button
                type="button"
                onClick={captureLocation}
                disabled={isCapturingLocation || isSaving}
                className={`p-3 rounded-lg font-semibold flex flex-col items-center gap-2 text-sm transition-all border-2 ${
                  locationMode === 'GPS'
                    ? 'bg-green-100 border-green-400 text-green-800'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50'
                } disabled:opacity-50`}
              >
                {isCapturingLocation ? (
                  <>
                    <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full" />
                    <span>Capturando...</span>
                  </>
                ) : (
                  <>
                    <Navigation size={24} />
                    <span>GPS Automático</span>
                    <span className="text-xs text-slate-500 font-normal">Usar localização do dispositivo</span>
                  </>
                )}
              </button>

              {/* Opção 2: Usar endereço da família */}
              <button
                type="button"
                onClick={() => handleUseFamilyAddress(isCompletingVisit)}
                disabled={isSaving}
                className={`p-3 rounded-lg font-semibold flex flex-col items-center gap-2 text-sm transition-all border-2 ${
                  locationMode === 'MANUAL' && manualAddress.includes(family?.address.street || '___')
                    ? 'bg-green-100 border-green-400 text-green-800'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50'
                } disabled:opacity-50`}
              >
                <Home size={24} />
                <span>Endereço da Família</span>
                <span className="text-xs text-slate-500 font-normal">Usar endereço cadastrado</span>
              </button>

              {/* Opção 3: Digitar manualmente */}
              <button
                type="button"
                onClick={handleUseManualLocation}
                disabled={isSaving}
                className={`p-3 rounded-lg font-semibold flex flex-col items-center gap-2 text-sm transition-all border-2 ${
                  locationMode === 'MANUAL' && !manualAddress.includes(family?.address.street || '___')
                    ? 'bg-green-100 border-green-400 text-green-800'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50'
                } disabled:opacity-50`}
              >
                <Edit3 size={24} />
                <span>Digitar Endereço</span>
                <span className="text-xs text-slate-500 font-normal">Informar localização manualmente</span>
              </button>
            </div>

            {/* Campo de endereço manual */}
            {locationMode === 'MANUAL' && (
              <div className="mt-4">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Endereço / Localização da Visita *
                </label>
                <input
                  type="text"
                  value={manualAddress}
                  onChange={e => {
                    setManualAddress(e.target.value);
                    if (!location.latitude) {
                      setLocation({ latitude: 0, longitude: 0 });
                    }
                  }}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none"
                  placeholder="Ex: Rua das Flores, 123 - Centro, São Paulo"
                  disabled={isSaving}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Informe o endereço onde a visita foi realizada (mínimo 6 caracteres)
                </p>
              </div>
            )}
          </div>

          {/* Observações Gerais */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Observações da Visita
            </label>
            <textarea
              value={completionData.observations}
              onChange={e => setCompletionData({ ...completionData, observations: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none resize-none"
              placeholder="Como foi a visita? Estado geral da família, condições encontradas..."
              disabled={isSaving}
            />
          </div>

          {/* Orientações Fornecidas */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Orientações Fornecidas
            </label>
            <textarea
              value={completionData.orientationsGiven}
              onChange={e =>
                setCompletionData({ ...completionData, orientationsGiven: e.target.value })
              }
              rows={4}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none resize-none"
              placeholder={
                'Liste as orientações fornecidas (uma por linha):\n- Importância do pré-natal\n- Vacinação em dia\n- Alimentação saudável\n- Cuidados com hipertensão'
              }
              disabled={isSaving}
            />
            <p className="text-xs text-slate-500 mt-1">Escreva cada orientação em uma linha separada</p>
          </div>

          {/* Problemas Identificados */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Problemas de Saúde Identificados
            </label>
            <textarea
              value={completionData.healthIssuesIdentified}
              onChange={e =>
                setCompletionData({ ...completionData, healthIssuesIdentified: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none resize-none"
              placeholder={
                'Problemas identificados (uma por linha):\n- Hipertensão não controlada\n- Criança com tosse há 3 dias\n- Falta de medicamentos'
              }
              disabled={isSaving}
            />
          </div>

          {/* Encaminhamentos */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Encaminhamentos Necessários
            </label>
            <textarea
              value={completionData.referralsNeeded}
              onChange={e =>
                setCompletionData({ ...completionData, referralsNeeded: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none resize-none"
              placeholder={
                'Encaminhamentos necessários (uma por linha):\n- Consulta com médico da família\n- Exames laboratoriais\n- Especialista em cardiologia'
              }
              disabled={isSaving}
            />
          </div>

          {/* Botões */}
          <div className="flex space-x-4 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                setIsCompletingVisit(null);
                setLocation({});
                setLocationMode(null);
                setManualAddress('');
                setGpsError('');
              }}
              className="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => handleCompleteVisit(isCompletingVisit)}
              disabled={!isLocationReady() || isSaving}
              className="flex-1 px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Salvando na nuvem...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={20} />
                  <span>Finalizar Visita</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== FORMULÁRIO DE AGENDAMENTO =====
  if (isFormOpen) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-3 rounded-xl">
                <Calendar size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Agendar Nova Visita</h1>
                <p className="text-blue-100">☁️ Será salva no banco de dados na nuvem</p>
              </div>
            </div>
            <button
              onClick={() => setIsFormOpen(false)}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              disabled={isSaving}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {families.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={40} className="text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Nenhuma família cadastrada</h3>
            <p className="text-slate-600 mb-6">
              Você precisa cadastrar pelo menos uma família antes de agendar visitas.
            </p>
            <button
              onClick={() => {
                setIsFormOpen(false);
                window.location.hash = '/families';
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 inline-flex items-center space-x-2"
            >
              <User size={20} />
              <span>Ir para Cadastro de Famílias</span>
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleScheduleVisit}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6"
          >
            {/* Seleção de Família */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Família *</label>
              <select
                required
                value={formData.familyId}
                onChange={e => setFormData({ ...formData, familyId: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none bg-white"
                disabled={isSaving}
              >
                <option value="">Selecione uma família</option>
                {families.map(family => (
                  <option key={family.id} value={family.id}>
                    Família {family.familyNumber} - {family.address.street}, {family.address.number}
                  </option>
                ))}
              </select>
            </div>

            {/* Data, Hora e Prioridade */}
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Data da Visita *
                </label>
                <input
                  type="date"
                  required
                  value={formData.scheduledDate}
                  onChange={e => setFormData({ ...formData, scheduledDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none"
                  disabled={isSaving}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Horário *</label>
                <input
                  type="time"
                  required
                  value={formData.scheduledTime}
                  onChange={e => setFormData({ ...formData, scheduledTime: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none"
                  disabled={isSaving}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Prioridade</label>
                <select
                  value={formData.priority}
                  onChange={e =>
                    setFormData({ ...formData, priority: e.target.value as PriorityLevel })
                  }
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none bg-white"
                  disabled={isSaving}
                >
                  <option value={PriorityLevel.LOW}>Baixa</option>
                  <option value={PriorityLevel.MEDIUM}>Média</option>
                  <option value={PriorityLevel.HIGH}>Alta</option>
                  <option value={PriorityLevel.URGENT}>Urgente</option>
                </select>
              </div>
            </div>

            {/* Observações */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Motivo / Observações
              </label>
              <textarea
                value={formData.observations}
                onChange={e => setFormData({ ...formData, observations: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none resize-none"
                placeholder="Ex: Acompanhamento de gestante, verificar vacinação infantil, controle de hipertensão..."
                disabled={isSaving}
              />
            </div>

            {/* Botões */}
            <div className="flex space-x-4 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                disabled={isSaving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    <span>Agendando na nuvem...</span>
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    <span>Agendar Visita</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  // ===== LISTA PRINCIPAL =====
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Visitas Domiciliares</h1>
          <p className="text-slate-600">
            {stats.total} {stats.total === 1 ? 'visita registrada' : 'visitas registradas'} •{' '}
            {stats.pending} pendentes
            <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              ☁️ Dados na nuvem
            </span>
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
            className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 flex items-center space-x-2"
          >
            <RefreshCw size={18} />
            <span>Atualizar</span>
          </button>
          <button
            onClick={() => setIsFormOpen(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all"
          >
            <Plus size={20} />
            <span>Agendar Visita</span>
          </button>
        </div>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-2">
            <div className="bg-green-100 p-2 rounded-lg">
              <Calendar size={20} className="text-green-600" />
            </div>
            <span className="text-2xl font-bold text-slate-800">{stats.today}</span>
          </div>
          <p className="text-sm text-slate-600 font-medium">Hoje</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-2">
            <div className="bg-red-100 p-2 rounded-lg">
              <AlertCircle size={20} className="text-red-600" />
            </div>
            <span className="text-2xl font-bold text-slate-800">{stats.overdue}</span>
          </div>
          <p className="text-sm text-slate-600 font-medium">Atrasadas</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-2">
            <div className="bg-orange-100 p-2 rounded-lg">
              <Clock size={20} className="text-orange-600" />
            </div>
            <span className="text-2xl font-bold text-slate-800">{stats.pending}</span>
          </div>
          <p className="text-sm text-slate-600 font-medium">Pendentes</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-2">
            <div className="bg-blue-100 p-2 rounded-lg">
              <CheckCircle2 size={20} className="text-blue-600" />
            </div>
            <span className="text-2xl font-bold text-slate-800">{stats.completedThisMonth}</span>
          </div>
          <p className="text-sm text-slate-600 font-medium">Mês atual</p>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="space-y-4">
        <div className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-2 text-slate-500 text-sm mr-2">
            <Filter size={16} />
            <span>Filtrar:</span>
          </div>
          <TabButton value="TODAY" label="Hoje" count={stats.today} icon={Calendar} />
          <TabButton value="PENDING" label="Pendentes" count={stats.pending} icon={Clock} />
          <TabButton value="OVERDUE" label="Atrasadas" count={stats.overdue} icon={AlertCircle} />
          <TabButton
            value="COMPLETED"
            label="Realizadas"
            count={stats.completed}
            icon={CheckCircle2}
          />
          <TabButton value="ALL" label="Todas" count={stats.total} icon={ClipboardList} />
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="relative">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por família, rua, bairro ou observações..."
              className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Lista de Visitas */}
      {filteredVisits.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border-2 border-dashed border-slate-300 text-center">
          <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <ClipboardList size={40} className="text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            {searchTerm
              ? 'Nenhuma visita encontrada'
              : activeTab === 'TODAY'
              ? 'Nenhuma visita para hoje'
              : activeTab === 'OVERDUE'
              ? 'Nenhuma visita atrasada'
              : activeTab === 'COMPLETED'
              ? 'Nenhuma visita realizada'
              : 'Nenhuma visita registrada'}
          </h3>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            {searchTerm
              ? 'Tente buscar por outros termos ou limpe o filtro'
              : activeTab === 'TODAY'
              ? 'Você está em dia com a agenda de hoje!'
              : activeTab === 'COMPLETED'
              ? 'As visitas realizadas aparecerão aqui'
              : 'Comece agendando sua primeira visita domiciliar'}
          </p>
          {!searchTerm && activeTab !== 'COMPLETED' && (
            <button
              onClick={() => setIsFormOpen(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 inline-flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>Agendar Visita</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredVisits.map(visit => {
            const family = families.find(f => f.id === visit.familyId);
            const visitDate = new Date(visit.scheduledDate);
            const isOverdue = visitDate < new Date() && visit.status === VisitStatus.PENDING;
            const isToday = visitDate.toDateString() === new Date().toDateString();

            return (
              <div
                key={visit.id}
                className={`bg-white p-6 rounded-xl border-2 hover:shadow-md transition-all ${
                  visit.status === VisitStatus.COMPLETED
                    ? 'border-green-200'
                    : isOverdue
                    ? 'border-red-300'
                    : isToday
                    ? 'border-green-300'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div
                      className={`p-3 rounded-lg ${
                        visit.status === VisitStatus.COMPLETED
                          ? 'bg-green-100'
                          : isOverdue
                          ? 'bg-red-100'
                          : isToday
                          ? 'bg-green-100'
                          : 'bg-blue-100'
                      }`}
                    >
                      {visit.status === VisitStatus.COMPLETED ? (
                        <CheckCircle2 size={24} className="text-green-600" />
                      ) : (
                        <Home
                          size={24}
                          className={
                            isOverdue
                              ? 'text-red-600'
                              : isToday
                              ? 'text-green-600'
                              : 'text-blue-600'
                          }
                        />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2 flex-wrap gap-1">
                        <h3 className="font-bold text-lg text-slate-800">
                          Família {family?.familyNumber || 'Não encontrada'}
                        </h3>
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-full ${getPriorityColor(
                            visit.priority
                          )}`}
                        >
                          {getPriorityLabel(visit.priority)}
                        </span>
                        {visit.status === VisitStatus.COMPLETED && (
                          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700">
                            ✓ Realizada
                          </span>
                        )}
                        {visit.status === VisitStatus.CANCELLED && (
                          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                            ✗ Cancelada
                          </span>
                        )}
                        {isOverdue && (
                          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-100 text-red-700">
                            ⚠️ Atrasada
                          </span>
                        )}
                        {isToday && visit.status === VisitStatus.PENDING && (
                          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700">
                            Hoje
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 text-sm text-slate-600 mb-3">
                        <div className="flex items-center space-x-2">
                          <MapPin size={16} />
                          <span>
                            {family
                              ? `${family.address.street}, ${family.address.number} - ${family.address.neighborhood}`
                              : 'Endereço não disponível'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar size={16} />
                          <span>
                            {visit.status === VisitStatus.COMPLETED ? 'Realizada' : 'Agendada'} para{' '}
                            {visitDate.toLocaleDateString('pt-BR', {
                              weekday: 'long',
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>

                      {visit.observations && (
                        <p className="text-sm text-slate-600 italic mb-3">"{visit.observations}"</p>
                      )}

                      {visit.status === VisitStatus.COMPLETED && (
                        <div className="mt-4 pt-4 border-t border-slate-200">
                          <div className="grid md:grid-cols-2 gap-4 text-sm">
                            {visit.orientationsGiven && visit.orientationsGiven.length > 0 && (
                              <div>
                                <p className="font-semibold text-slate-800 mb-2">
                                  Orientações Fornecidas:
                                </p>
                                <ul className="list-disc list-inside space-y-1 text-slate-600">
                                  {visit.orientationsGiven.slice(0, 3).map((o, i) => (
                                    <li key={i}>{o}</li>
                                  ))}
                                  {visit.orientationsGiven.length > 3 && (
                                    <li className="text-blue-600">
                                      + {visit.orientationsGiven.length - 3} outras...
                                    </li>
                                  )}
                                </ul>
                              </div>
                            )}

                            {visit.healthIssuesIdentified &&
                              visit.healthIssuesIdentified.length > 0 && (
                                <div>
                                  <p className="font-semibold text-slate-800 mb-2">
                                    Problemas Identificados:
                                  </p>
                                  <ul className="list-disc list-inside space-y-1 text-slate-600">
                                    {visit.healthIssuesIdentified.slice(0, 2).map((h, i) => (
                                      <li key={i}>{h}</li>
                                    ))}
                                    {visit.healthIssuesIdentified.length > 2 && (
                                      <li className="text-orange-600">
                                        + {visit.healthIssuesIdentified.length - 2} outros...
                                      </li>
                                    )}
                                  </ul>
                                </div>
                              )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ações */}
                  {visit.status === VisitStatus.PENDING && (
                    <div className="flex flex-col space-y-2 ml-4">
                      <button
                        onClick={() => {
                          setIsCompletingVisit(visit.id);
                          setLocationMode(null);
                          setLocation({});
                          setManualAddress('');
                          setGpsError('');
                          captureLocation();
                        }}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 flex items-center space-x-2 text-sm shadow-sm"
                      >
                        <CheckCircle2 size={16} />
                        <span>Finalizar</span>
                      </button>
                      <button
                        onClick={() => handleCancelVisit(visit.id)}
                        className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-100 flex items-center space-x-2 text-sm border border-red-200"
                      >
                        <XCircle size={16} />
                        <span>Cancelar</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
