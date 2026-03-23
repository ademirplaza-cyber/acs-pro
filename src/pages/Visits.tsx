import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Visit, VisitStatus, PriorityLevel, Family } from '../types';
import { usePageTracking } from '../hooks/usePageTracking';
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
  Filter,
  Search,
  Home,
  User,
  RefreshCw,
  Edit2,
  WifiOff,
  Cloud
} from 'lucide-react';

type FilterTab = 'TODAY' | 'PENDING' | 'OVERDUE' | 'COMPLETED' | 'ALL';

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

// ============================================
// FILA OFFLINE — visitas pendentes de sync
// ============================================
const OFFLINE_VISITS_KEY = 'offline_visits_queue';

function getOfflineQueue(): Visit[] {
  try {
    const raw = localStorage.getItem(OFFLINE_VISITS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function addToOfflineQueue(visit: Visit) {
  const queue = getOfflineQueue();
  const index = queue.findIndex(v => v.id === visit.id);
  if (index >= 0) queue[index] = visit;
  else queue.push(visit);
  localStorage.setItem(OFFLINE_VISITS_KEY, JSON.stringify(queue));
}

function removeFromOfflineQueue(visitId: string) {
  const queue = getOfflineQueue().filter(v => v.id !== visitId);
  localStorage.setItem(OFFLINE_VISITS_KEY, JSON.stringify(queue));
}

export const Visits = () => {
  const { user } = useAuth();
  usePageTracking('VISITS', 'VIEW_VISITS');

  const [visits, setVisits] = useState<Visit[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>('TODAY');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
  const [isCompletingVisit, setIsCompletingVisit] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [pendingSync, setPendingSync] = useState(0);

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
    agentNotes: '',
  });

  const today = startOfDay(new Date());

  // Monitor de conectividade
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      syncOfflineVisits();
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Atualizar contador de pendentes
  useEffect(() => {
    setPendingSync(getOfflineQueue().length);
  }, [visits]);

  // Sincronizar visitas offline quando voltar a conexão
  const syncOfflineVisits = async () => {
    const queue = getOfflineQueue();
    if (queue.length === 0) return;

    console.log(`🔄 Sincronizando ${queue.length} visita(s) offline...`);
    let synced = 0;

    for (const visit of queue) {
      try {
        await api.saveVisit(visit);
        removeFromOfflineQueue(visit.id);
        synced++;
      } catch (error) {
        console.error(`❌ Erro ao sincronizar visita ${visit.id}:`, error);
      }
    }

    if (synced > 0) {
      console.log(`✅ ${synced} visita(s) sincronizada(s)`);
      await loadData();
      setPendingSync(getOfflineQueue().length);
      alert(`✅ ${synced} visita(s) sincronizada(s) com a nuvem!`);
    }
  };

  const loadData = async () => {
    if (!user) return;
    try {
      setIsLoading(true);

      if (navigator.onLine) {
        const [visitsData, familiesData] = await Promise.all([
          api.getVisits(user.id),
          api.getFamilies(user.id),
        ]);
        setVisits(visitsData);
        setFamilies(familiesData);
        // Cache para uso offline
        localStorage.setItem(`visits_cache_${user.id}`, JSON.stringify(visitsData));
        localStorage.setItem(`families_cache_${user.id}`, JSON.stringify(familiesData));
      } else {
        // Carregar do cache
        const cachedVisits = localStorage.getItem(`visits_cache_${user.id}`);
        const cachedFamilies = localStorage.getItem(`families_cache_${user.id}`);
        if (cachedVisits) setVisits(JSON.parse(cachedVisits));
        if (cachedFamilies) setFamilies(JSON.parse(cachedFamilies));
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      // Fallback para cache
      const cachedVisits = localStorage.getItem(`visits_cache_${user.id}`);
      const cachedFamilies = localStorage.getItem(`families_cache_${user.id}`);
      if (cachedVisits) setVisits(JSON.parse(cachedVisits));
      if (cachedFamilies) setFamilies(JSON.parse(cachedFamilies));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [user]);

  const filteredVisits = useMemo(() => {
    let filtered = visits.filter(v => {
      const vDate = startOfDay(new Date(v.scheduledDate));
      switch (activeTab) {
        case 'TODAY': return v.status === VisitStatus.PENDING && vDate.getTime() === today.getTime();
        case 'PENDING': return v.status === VisitStatus.PENDING;
        case 'OVERDUE': return v.status === VisitStatus.PENDING && vDate.getTime() < today.getTime();
        case 'COMPLETED': return v.status === VisitStatus.COMPLETED;
        case 'ALL': default: return true;
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
    return filtered.sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
  }, [visits, activeTab, searchTerm, families, today]);

  const stats = useMemo(() => {
    const pending = visits.filter(v => v.status === VisitStatus.PENDING);
    const overdue = pending.filter(v => startOfDay(new Date(v.scheduledDate)) < today);
    const todayVisits = pending.filter(v => startOfDay(new Date(v.scheduledDate)).getTime() === today.getTime());
    const completed = visits.filter(v => v.status === VisitStatus.COMPLETED);
    const completedThisMonth = completed.filter(v => {
      const d = new Date(v.completedDate || '');
      return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    });
    return { total: visits.length, pending: pending.length, overdue: overdue.length, today: todayVisits.length, completed: completed.length, completedThisMonth: completedThisMonth.length };
  }, [visits, today]);

  const resetFormAndClose = () => {
    setFormData({ familyId: '', scheduledDate: new Date().toISOString().split('T')[0], scheduledTime: '09:00', priority: PriorityLevel.MEDIUM, observations: '' });
    setEditingVisit(null);
    setIsFormOpen(false);
  };

  const handleEditVisit = (visit: Visit) => {
    const scheduledDate = new Date(visit.scheduledDate);
    setEditingVisit(visit);
    setFormData({
      familyId: visit.familyId,
      scheduledDate: scheduledDate.toISOString().split('T')[0],
      scheduledTime: scheduledDate.toTimeString().slice(0, 5),
      priority: visit.priority,
      observations: visit.observations || '',
    });
    setIsFormOpen(true);
  };

  // ============================================
  // AGENDAR / EDITAR — funciona offline
  // ============================================
  const handleScheduleVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.familyId) { alert('⚠️ Selecione uma família'); return; }
    try {
      setIsSaving(true);
      const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}:00`);
      const visitToSave: Visit = {
        id: editingVisit ? editingVisit.id : crypto.randomUUID(),
        familyId: formData.familyId,
        agentId: user.id,
        scheduledDate: scheduledDateTime.toISOString(),
        status: editingVisit ? editingVisit.status : VisitStatus.PENDING,
        priority: formData.priority,
        observations: formData.observations || undefined,
        createdAt: editingVisit ? editingVisit.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        needsSync: false,
      };

      if (navigator.onLine) {
        await api.saveVisit(visitToSave);
        await loadData();
        alert(editingVisit ? '✅ Visita atualizada!' : '✅ Visita agendada na nuvem!');
      } else {
        // Salvar offline
        addToOfflineQueue(visitToSave);
        // Atualizar lista local
        if (editingVisit) {
          setVisits(prev => prev.map(v => v.id === visitToSave.id ? visitToSave : v));
        } else {
          setVisits(prev => [...prev, visitToSave]);
        }
        // Atualizar cache
        const updated = editingVisit
          ? visits.map(v => v.id === visitToSave.id ? visitToSave : v)
          : [...visits, visitToSave];
        localStorage.setItem(`visits_cache_${user.id}`, JSON.stringify(updated));
        setPendingSync(getOfflineQueue().length);
        alert(editingVisit ? '✅ Visita atualizada localmente! Será sincronizada quando houver internet.' : '✅ Visita agendada localmente! Será sincronizada quando houver internet.');
      }

      resetFormAndClose();
    } catch (error) {
      console.error('❌ Erro ao salvar visita:', error);
      alert('❌ Erro ao salvar visita. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================
  // FINALIZAR VISITA — funciona offline, sem GPS obrigatório
  // ============================================
  const handleCompleteVisit = async (visitId: string) => {
    const visit = visits.find(v => v.id === visitId);
    if (!visit) return;
    try {
      setIsSaving(true);
      let finalObservations = completionData.observations || visit.observations || '';
      if (completionData.agentNotes) {
        finalObservations = `${finalObservations}\n\n[Informações do Agente: ${completionData.agentNotes}]`;
      }

      const updatedVisit: Visit = {
        ...visit,
        status: VisitStatus.COMPLETED,
        completedDate: new Date().toISOString(),
        observations: finalObservations,
        orientationsGiven: completionData.orientationsGiven ? completionData.orientationsGiven.split('\n').filter(o => o.trim()) : undefined,
        healthIssuesIdentified: completionData.healthIssuesIdentified ? completionData.healthIssuesIdentified.split('\n').filter(h => h.trim()) : undefined,
        referralsNeeded: completionData.referralsNeeded ? completionData.referralsNeeded.split('\n').filter(r => r.trim()) : undefined,
        updatedAt: new Date().toISOString(),
      };

      if (navigator.onLine) {
        await api.saveVisit(updatedVisit);
        await loadData();
        alert('✅ Visita finalizada e salva na nuvem!');
      } else {
        // Salvar offline
        addToOfflineQueue(updatedVisit);
        setVisits(prev => prev.map(v => v.id === updatedVisit.id ? updatedVisit : v));
        const updated = visits.map(v => v.id === updatedVisit.id ? updatedVisit : v);
        localStorage.setItem(`visits_cache_${user!.id}`, JSON.stringify(updated));
        setPendingSync(getOfflineQueue().length);
        alert('✅ Visita finalizada localmente! Será sincronizada quando houver internet.');
      }

      setIsCompletingVisit(null);
      setCompletionData({ observations: '', orientationsGiven: '', healthIssuesIdentified: '', referralsNeeded: '', agentNotes: '' });
    } catch (error) {
      console.error('❌ Erro ao finalizar visita:', error);
      alert('❌ Erro ao finalizar visita. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelVisit = async (visitId: string) => {
    if (!confirm('❓ Tem certeza que deseja cancelar esta visita?')) return;
    const visit = visits.find(v => v.id === visitId);
    if (!visit) return;
    try {
      const updatedVisit: Visit = { ...visit, status: VisitStatus.CANCELLED, updatedAt: new Date().toISOString() };

      if (navigator.onLine) {
        await api.saveVisit(updatedVisit);
        await loadData();
      } else {
        addToOfflineQueue(updatedVisit);
        setVisits(prev => prev.map(v => v.id === updatedVisit.id ? updatedVisit : v));
        setPendingSync(getOfflineQueue().length);
      }
      alert('✅ Visita cancelada');
    } catch (error) {
      console.error('❌ Erro ao cancelar visita:', error);
      alert('❌ Erro ao cancelar visita. Tente novamente.');
    }
  };

  const getPriorityColor = (priority: PriorityLevel) => {
    const colors: Record<string, string> = { [PriorityLevel.LOW]: 'bg-slate-100 text-slate-700', [PriorityLevel.MEDIUM]: 'bg-blue-100 text-blue-700', [PriorityLevel.HIGH]: 'bg-orange-100 text-orange-700', [PriorityLevel.URGENT]: 'bg-red-100 text-red-700' };
    return colors[priority] || 'bg-slate-100 text-slate-700';
  };

  const getPriorityLabel = (priority: PriorityLevel) => {
    const labels: Record<string, string> = { [PriorityLevel.LOW]: 'Baixa', [PriorityLevel.MEDIUM]: 'Média', [PriorityLevel.HIGH]: 'Alta', [PriorityLevel.URGENT]: 'Urgente' };
    return labels[priority] || 'Média';
  };

  const TabButton = ({ value, label, count, icon: Icon }: { value: FilterTab; label: string; count: number; icon: any }) => {
    const active = activeTab === value;
    return (
      <button onClick={() => setActiveTab(value)}
        className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all ${active ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}>
        <Icon size={16} /><span>{label}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-slate-100 text-slate-700'}`}>{count}</span>
      </button>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando visitas...</p>
        </div>
      </div>
    );
  }

  // ===== FORMULÁRIO DE CONCLUSÃO (SEM GPS OBRIGATÓRIO) =====
  if (isCompletingVisit) {
    const visit = visits.find(v => v.id === isCompletingVisit);
    const family = families.find(f => f.id === visit?.familyId);
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-3 rounded-xl"><CheckCircle2 size={28} /></div>
              <div>
                <h1 className="text-2xl font-bold">Finalizar Visita</h1>
                <p className="text-green-100">
                  Família {family?.familyNumber} - {family?.address.street}, {family?.address.number}
                  {isOffline ? ' • 📱 Modo offline' : ' • ☁️ Salva na nuvem'}
                </p>
              </div>
            </div>
            <button onClick={() => { setIsCompletingVisit(null); }}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors" disabled={isSaving}><X size={24} /></button>
          </div>
        </div>

        {isOffline && (
          <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 mb-6 flex items-center space-x-3">
            <WifiOff size={24} className="text-orange-600" />
            <div>
              <p className="font-semibold text-orange-800">Você está offline</p>
              <p className="text-sm text-orange-700">A visita será salva localmente e sincronizada quando houver internet.</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Observações da Visita</label>
            <textarea value={completionData.observations} onChange={e => setCompletionData({ ...completionData, observations: e.target.value })}
              rows={3} className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none resize-none"
              placeholder="Como foi a visita? Estado geral da família, condições encontradas..." disabled={isSaving} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Orientações Fornecidas</label>
            <textarea value={completionData.orientationsGiven} onChange={e => setCompletionData({ ...completionData, orientationsGiven: e.target.value })}
              rows={4} className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none resize-none"
              placeholder={"Liste as orientações fornecidas (uma por linha):\n- Importância do pré-natal\n- Vacinação em dia"} disabled={isSaving} />
            <p className="text-xs text-slate-500 mt-1">Escreva cada orientação em uma linha separada</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Problemas de Saúde Identificados</label>
            <textarea value={completionData.healthIssuesIdentified} onChange={e => setCompletionData({ ...completionData, healthIssuesIdentified: e.target.value })}
              rows={3} className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none resize-none"
              placeholder={"Problemas identificados (uma por linha):\n- Hipertensão não controlada\n- Criança com tosse há 3 dias"} disabled={isSaving} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Encaminhamentos Necessários</label>
            <textarea value={completionData.referralsNeeded} onChange={e => setCompletionData({ ...completionData, referralsNeeded: e.target.value })}
              rows={3} className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none resize-none"
              placeholder={"Encaminhamentos necessários (uma por linha):\n- Consulta com médico da família\n- Exames laboratoriais"} disabled={isSaving} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">📝 Informações / Anotações do Agente</label>
            <textarea value={completionData.agentNotes} onChange={e => setCompletionData({ ...completionData, agentNotes: e.target.value })}
              rows={4} className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none resize-none"
              placeholder={"Espaço livre para anotações do agente:\n- Informações relevantes sobre a família\n- Lembretes para próxima visita"} disabled={isSaving} />
            <p className="text-xs text-slate-500 mt-1">Use este campo para registrar qualquer informação adicional</p>
          </div>

          <div className="flex space-x-4 pt-4 border-t border-slate-200">
            <button type="button" onClick={() => { setIsCompletingVisit(null); }}
              className="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors" disabled={isSaving}>Cancelar</button>
            <button type="button" onClick={() => handleCompleteVisit(isCompletingVisit)} disabled={isSaving}
              className="flex-1 px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
              {isSaving ? (<><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /><span>Salvando...</span></>) : (<><CheckCircle2 size={20} /><span>Finalizar Visita</span></>)}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== FORMULÁRIO DE AGENDAMENTO / EDIÇÃO =====
  if (isFormOpen) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className={`bg-gradient-to-r ${editingVisit ? 'from-orange-500 to-orange-600' : 'from-blue-600 to-blue-700'} rounded-2xl p-6 mb-6 text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-3 rounded-xl">
                {editingVisit ? <Edit2 size={28} /> : <Calendar size={28} />}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{editingVisit ? 'Editar Visita' : 'Agendar Nova Visita'}</h1>
                <p className={editingVisit ? 'text-orange-100' : 'text-blue-100'}>
                  {isOffline ? '📱 Será salva localmente até ter internet' : '☁️ Será salva na nuvem'}
                </p>
              </div>
            </div>
            <button onClick={resetFormAndClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors" disabled={isSaving}>
              <X size={24} />
            </button>
          </div>
        </div>

        {isOffline && (
          <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 mb-6 flex items-center space-x-3">
            <WifiOff size={24} className="text-orange-600" />
            <div>
              <p className="font-semibold text-orange-800">Você está offline</p>
              <p className="text-sm text-orange-700">A visita será salva localmente e sincronizada automaticamente.</p>
            </div>
          </div>
        )}

        {families.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={40} className="text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Nenhuma família cadastrada</h3>
            <p className="text-slate-600 mb-6">Você precisa cadastrar pelo menos uma família antes de agendar visitas.</p>
            <button onClick={() => { resetFormAndClose(); window.location.hash = '/families'; }}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 inline-flex items-center space-x-2">
              <User size={20} /><span>Ir para Cadastro de Famílias</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleScheduleVisit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Família *</label>
              <select required value={formData.familyId} onChange={e => setFormData({ ...formData, familyId: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none bg-white" disabled={isSaving}>
                <option value="">Selecione uma família</option>
                {families.map(family => (
                  <option key={family.id} value={family.id}>Família {family.familyNumber} - {family.address.street}, {family.address.number}</option>
                ))}
              </select>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Data da Visita *</label>
                <input type="date" required value={formData.scheduledDate} onChange={e => setFormData({ ...formData, scheduledDate: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none" disabled={isSaving} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Horário *</label>
                <input type="time" required value={formData.scheduledTime} onChange={e => setFormData({ ...formData, scheduledTime: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none" disabled={isSaving} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Prioridade</label>
                <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value as PriorityLevel })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none bg-white" disabled={isSaving}>
                  <option value={PriorityLevel.LOW}>Baixa</option>
                  <option value={PriorityLevel.MEDIUM}>Média</option>
                  <option value={PriorityLevel.HIGH}>Alta</option>
                  <option value={PriorityLevel.URGENT}>Urgente</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Motivo / Observações</label>
              <textarea value={formData.observations} onChange={e => setFormData({ ...formData, observations: e.target.value })}
                rows={3} className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none resize-none"
                placeholder="Ex: Acompanhamento de gestante, verificar vacinação infantil, controle de hipertensão..." disabled={isSaving} />
            </div>

            <div className="flex space-x-4 pt-4 border-t border-slate-200">
              <button type="button" onClick={resetFormAndClose}
                className="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors" disabled={isSaving}>
                Cancelar
              </button>
              <button type="submit" disabled={isSaving}
                className={`flex-1 px-6 py-3 ${editingVisit ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'} text-white font-semibold rounded-xl transition-colors flex items-center justify-center space-x-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}>
                {isSaving ? (
                  <><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /><span>{editingVisit ? 'Atualizando...' : 'Agendando...'}</span></>
                ) : (
                  <><Save size={20} /><span>{editingVisit ? 'Atualizar Visita' : 'Agendar Visita'}</span></>
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Visitas Domiciliares</h1>
          <p className="text-slate-600">
            {stats.total} {stats.total === 1 ? 'visita registrada' : 'visitas registradas'} • {stats.pending} pendentes
            {isOffline ? (
              <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">📱 Offline</span>
            ) : (
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">☁️ Nuvem</span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {pendingSync > 0 && (
            <button onClick={syncOfflineVisits} disabled={isOffline}
              className="bg-orange-50 text-orange-700 px-4 py-2 rounded-xl border border-orange-200 font-semibold hover:bg-orange-100 flex items-center space-x-2 text-sm disabled:opacity-50">
              <Cloud size={18} /><span>{pendingSync} pendente(s)</span>
            </button>
          )}
          <button onClick={loadData} className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 flex items-center space-x-2">
            <RefreshCw size={18} /><span>Atualizar</span>
          </button>
          <button onClick={() => { resetFormAndClose(); setIsFormOpen(true); }}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all">
            <Plus size={20} /><span>Agendar Visita</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-2"><div className="bg-green-100 p-2 rounded-lg"><Calendar size={20} className="text-green-600" /></div><span className="text-2xl font-bold text-slate-800">{stats.today}</span></div>
          <p className="text-sm text-slate-600 font-medium">Hoje</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-2"><div className="bg-red-100 p-2 rounded-lg"><AlertCircle size={20} className="text-red-600" /></div><span className="text-2xl font-bold text-slate-800">{stats.overdue}</span></div>
          <p className="text-sm text-slate-600 font-medium">Atrasadas</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-2"><div className="bg-orange-100 p-2 rounded-lg"><Clock size={20} className="text-orange-600" /></div><span className="text-2xl font-bold text-slate-800">{stats.pending}</span></div>
          <p className="text-sm text-slate-600 font-medium">Pendentes</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-2"><div className="bg-blue-100 p-2 rounded-lg"><CheckCircle2 size={20} className="text-blue-600" /></div><span className="text-2xl font-bold text-slate-800">{stats.completedThisMonth}</span></div>
          <p className="text-sm text-slate-600 font-medium">Mês atual</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-2 text-slate-500 text-sm mr-2"><Filter size={16} /><span>Filtrar:</span></div>
          <TabButton value="TODAY" label="Hoje" count={stats.today} icon={Calendar} />
          <TabButton value="PENDING" label="Pendentes" count={stats.pending} icon={Clock} />
          <TabButton value="OVERDUE" label="Atrasadas" count={stats.overdue} icon={AlertCircle} />
          <TabButton value="COMPLETED" label="Realizadas" count={stats.completed} icon={CheckCircle2} />
          <TabButton value="ALL" label="Todas" count={stats.total} icon={ClipboardList} />
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="relative">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por família, rua, bairro ou observações..."
              className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none" />
          </div>
        </div>
      </div>

      {filteredVisits.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border-2 border-dashed border-slate-300 text-center">
          <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"><ClipboardList size={40} className="text-slate-400" /></div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            {searchTerm ? 'Nenhuma visita encontrada' : activeTab === 'TODAY' ? 'Nenhuma visita para hoje' : activeTab === 'OVERDUE' ? 'Nenhuma visita atrasada' : activeTab === 'COMPLETED' ? 'Nenhuma visita realizada' : 'Nenhuma visita registrada'}
          </h3>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            {searchTerm ? 'Tente buscar por outros termos ou limpe o filtro' : activeTab === 'TODAY' ? 'Você está em dia com a agenda de hoje!' : activeTab === 'COMPLETED' ? 'As visitas realizadas aparecerão aqui' : 'Comece agendando sua primeira visita domiciliar'}
          </p>
          {!searchTerm && activeTab !== 'COMPLETED' && (
            <button onClick={() => { resetFormAndClose(); setIsFormOpen(true); }}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 inline-flex items-center space-x-2">
              <Plus size={20} /><span>Agendar Visita</span>
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
              <div key={visit.id}
                className={`bg-white p-6 rounded-xl border-2 hover:shadow-md transition-all ${
                  visit.status === VisitStatus.COMPLETED ? 'border-green-200' : isOverdue ? 'border-red-300' : isToday ? 'border-green-300' : 'border-slate-200'
                }`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className={`p-3 rounded-lg ${visit.status === VisitStatus.COMPLETED ? 'bg-green-100' : isOverdue ? 'bg-red-100' : isToday ? 'bg-green-100' : 'bg-blue-100'}`}>
                      {visit.status === VisitStatus.COMPLETED ? <CheckCircle2 size={24} className="text-green-600" /> : <Home size={24} className={isOverdue ? 'text-red-600' : isToday ? 'text-green-600' : 'text-blue-600'} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2 flex-wrap gap-1">
                        <h3 className="font-bold text-lg text-slate-800">Família {family?.familyNumber || 'Não encontrada'}</h3>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getPriorityColor(visit.priority)}`}>{getPriorityLabel(visit.priority)}</span>
                        {visit.status === VisitStatus.COMPLETED && (<span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700">✓ Realizada</span>)}
                        {visit.status === VisitStatus.CANCELLED && (<span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-700">✗ Cancelada</span>)}
                        {isOverdue && (<span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-100 text-red-700">⚠️ Atrasada</span>)}
                        {isToday && visit.status === VisitStatus.PENDING && (<span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700">Hoje</span>)}
                      </div>
                      <div className="space-y-1 text-sm text-slate-600 mb-3">
                        <div className="flex items-center space-x-2"><MapPin size={16} /><span>{family ? `${family.address.street}, ${family.address.number} - ${family.address.neighborhood}` : 'Endereço não disponível'}</span></div>
                        <div className="flex items-center space-x-2"><Calendar size={16} /><span>{visit.status === VisitStatus.COMPLETED ? 'Realizada' : 'Agendada'} para {visitDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div>
                      </div>
                      {visit.observations && (<p className="text-sm text-slate-600 italic mb-3">"{visit.observations}"</p>)}

                      {visit.status === VisitStatus.COMPLETED && (
                        <div className="mt-4 pt-4 border-t border-slate-200">
                          <div className="grid md:grid-cols-2 gap-4 text-sm">
                            {visit.orientationsGiven && visit.orientationsGiven.length > 0 && (
                              <div>
                                <p className="font-semibold text-slate-800 mb-2">Orientações Fornecidas:</p>
                                <ul className="list-disc list-inside space-y-1 text-slate-600">
                                  {visit.orientationsGiven.slice(0, 3).map((o, i) => (<li key={i}>{o}</li>))}
                                  {visit.orientationsGiven.length > 3 && (<li className="text-blue-600">+ {visit.orientationsGiven.length - 3} outras...</li>)}
                                </ul>
                              </div>
                            )}
                            {visit.healthIssuesIdentified && visit.healthIssuesIdentified.length > 0 && (
                              <div>
                                <p className="font-semibold text-slate-800 mb-2">Problemas Identificados:</p>
                                <ul className="list-disc list-inside space-y-1 text-slate-600">
                                  {visit.healthIssuesIdentified.slice(0, 2).map((h, i) => (<li key={i}>{h}</li>))}
                                  {visit.healthIssuesIdentified.length > 2 && (<li className="text-orange-600">+ {visit.healthIssuesIdentified.length - 2} outros...</li>)}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {visit.status === VisitStatus.PENDING && (
                    <div className="flex flex-col space-y-2 ml-4">
                      <button onClick={() => handleEditVisit(visit)}
                        className="bg-orange-50 text-orange-600 px-4 py-2 rounded-lg font-semibold hover:bg-orange-100 flex items-center space-x-2 text-sm border border-orange-200">
                        <Edit2 size={16} /><span>Editar</span>
                      </button>
                      <button onClick={() => { setIsCompletingVisit(visit.id); }}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 flex items-center space-x-2 text-sm shadow-sm">
                        <CheckCircle2 size={16} /><span>Finalizar</span>
                      </button>
                      <button onClick={() => handleCancelVisit(visit.id)}
                        className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-100 flex items-center space-x-2 text-sm border border-red-200">
                        <XCircle size={16} /><span>Cancelar</span>
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
