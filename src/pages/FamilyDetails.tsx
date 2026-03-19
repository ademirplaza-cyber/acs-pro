import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Family, Person } from '../types';
import { FileDown } from 'lucide-react';
import { exportFamilyPDF } from '../utils/exportFamilyPDF';
import { 
  User, 
  Users, 
  ArrowLeft, 
  Plus, 
  Edit2, 
  Trash2, 
  Baby, 
  Heart, 
  Activity, 
  Save,
  X,
  Phone,
  AlertCircle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

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

const calculateGestationalAge = (dum: string): string => {
  const dumDate = new Date(dum);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - dumDate.getTime());
  const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
  const diffDays = Math.floor((diffTime % (1000 * 60 * 60 * 24 * 7)) / (1000 * 60 * 60 * 24));
  return `${diffWeeks}s ${diffDays}d`;
};

export const FamilyDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [family, setFamily] = useState<Family | null>(null);
  const [isFamilyLoading, setIsFamilyLoading] = useState(true);
  const [people, setPeople] = useState<Person[]>([]);
  const [isPeopleLoading, setIsPeopleLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    cns: '',
    birthDate: '',
    gender: 'M' as 'M' | 'F' | 'OTHER',
    phone: '',
    occupation: '',
    isHeadOfFamily: false,
    hasHypertension: false,
    hasDiabetes: false,
    isPregnant: false,
    isPuerperium: false,
    pregnancyDueDate: '',
    lastMenstrualPeriod: '',
    isDisabled: false,
    chronicDiseases: '',
    medications: '',
    isBedridden: false,
    hasMobilityDifficulty: false,
    usesInsulin: false,
    isSmoker: false,
    isWorking: false,
    receivesBolsaFamilia: false,
    nisNumber: '',
    isHighRiskPregnancy: false,
    rareDiseases: '',
    relationshipToHead: '',
    isAlcoholic: false,
    isDrugUser: false,
    healthObservations: '',
    otherConditions: '',
  });

  useEffect(() => {
    const loadFamily = async () => {
      if (!user || !id) { setIsFamilyLoading(false); return; }
      try {
        setIsFamilyLoading(true);
        const families = await api.getFamilies(user.id);
        const found = families.find(f => f.id === id);
        setFamily(found || null);
      } catch (error) {
        console.error('❌ Erro ao buscar família:', error);
        setFamily(null);
      } finally {
        setIsFamilyLoading(false);
      }
    };
    loadFamily();
  }, [user, id]);

  const loadPeople = async () => {
    if (!id) return;
    try {
      setIsPeopleLoading(true);
      const data = await api.getPeople(id);
      setPeople(data);
    } catch (error) {
      console.error('❌ Erro ao carregar membros:', error);
      setPeople([]);
    } finally {
      setIsPeopleLoading(false);
    }
  };

  useEffect(() => { if (id) loadPeople(); }, [id]);

  const stats = useMemo(() => ({
    total: people.length,
    children: people.filter(p => calculateAge(p.birthDate) < 12).length,
    elderly: people.filter(p => calculateAge(p.birthDate) >= 60).length,
    pregnant: people.filter(p => p.isPregnant && !(p as any).isPuerperium).length,
    puerperium: people.filter(p => p.isPregnant && (p as any).isPuerperium).length,
    hypertensive: people.filter(p => p.hasHypertension).length,
    diabetic: people.filter(p => p.hasDiabetes).length,
    disabled: people.filter(p => p.isDisabled).length,
    bedridden: people.filter(p => p.isBedridden).length,
    insulin: people.filter(p => p.usesInsulin).length,
    smoker: people.filter(p => p.isSmoker).length,
    alcoholic: people.filter(p => p.isAlcoholic).length,
    drugUser: people.filter(p => p.isDrugUser).length,
  }), [people]);

  const resetForm = () => {
    setFormData({
      name: '', cpf: '', cns: '', birthDate: '', gender: 'M', phone: '', occupation: '',
      isHeadOfFamily: false, hasHypertension: false, hasDiabetes: false, isPregnant: false,
      isPuerperium: false, pregnancyDueDate: '', lastMenstrualPeriod: '', isDisabled: false,
      chronicDiseases: '', medications: '', isBedridden: false, hasMobilityDifficulty: false,
      usesInsulin: false, isSmoker: false, isWorking: false, receivesBolsaFamilia: false,
      nisNumber: '', isHighRiskPregnancy: false, rareDiseases: '', relationshipToHead: '',
      isAlcoholic: false, isDrugUser: false, healthObservations: '', otherConditions: '',
    });
  };

  const handleSavePerson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!family) return;
    if (!formData.name || !formData.birthDate) { alert('⚠️ Nome e data de nascimento são obrigatórios'); return; }
    if (formData.isPregnant && formData.gender !== 'F') { alert('⚠️ Apenas pessoas do sexo feminino podem ser marcadas como gestantes'); return; }
    if (formData.isPregnant && !formData.isPuerperium && !formData.lastMenstrualPeriod) { alert('⚠️ Para gestantes, informe a Data da Última Menstruação (DUM)'); return; }

    try {
      setIsSaving(true);
      const newPerson: Person = {
        id: editingPerson ? editingPerson.id : crypto.randomUUID(),
        familyId: family.id,
        name: formData.name,
        cpf: formData.cpf || undefined,
        cns: formData.cns || undefined,
        birthDate: formData.birthDate,
        gender: formData.gender,
        phone: formData.phone || undefined,
        occupation: formData.occupation || undefined,
        isHeadOfFamily: formData.isHeadOfFamily,
        hasHypertension: formData.hasHypertension,
        hasDiabetes: formData.hasDiabetes,
        isPregnant: formData.isPregnant,
        isPuerperium: formData.isPregnant ? formData.isPuerperium : false,
        pregnancyDueDate: formData.isPregnant ? (formData.pregnancyDueDate || undefined) : undefined,
        lastMenstrualPeriod: formData.isPregnant ? (formData.lastMenstrualPeriod || undefined) : undefined,
        isDisabled: formData.isDisabled,
        chronicDiseases: formData.chronicDiseases ? formData.chronicDiseases.split('\n').filter(d => d.trim()) : undefined,
        medications: formData.medications ? formData.medications.split('\n').filter(m => m.trim()) : undefined,
        isBedridden: formData.isBedridden,
        hasMobilityDifficulty: formData.hasMobilityDifficulty,
        usesInsulin: formData.usesInsulin,
        isSmoker: formData.isSmoker,
        isWorking: formData.isWorking,
        receivesBolsaFamilia: formData.receivesBolsaFamilia,
        nisNumber: formData.receivesBolsaFamilia ? (formData.nisNumber || undefined) : undefined,
        isHighRiskPregnancy: formData.isPregnant ? formData.isHighRiskPregnancy : false,
        rareDiseases: formData.rareDiseases || '',
        relationshipToHead: formData.relationshipToHead || '',
        isAlcoholic: formData.isAlcoholic,
        isDrugUser: formData.isDrugUser,
        healthObservations: formData.healthObservations || '',
        otherConditions: formData.otherConditions || '',
        createdAt: editingPerson ? editingPerson.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (newPerson.isHeadOfFamily) await api.updateHeadOfFamily(family.id, newPerson.id);
      await api.savePerson(newPerson);
      await loadPeople();
      resetForm();
      setIsFormOpen(false);
      setEditingPerson(null);
      alert(editingPerson ? '✅ Pessoa atualizada na nuvem!' : '✅ Pessoa cadastrada na nuvem!');
    } catch (error) {
      console.error('❌ Erro ao salvar pessoa:', error);
      alert('❌ Erro ao salvar pessoa. Verifique sua conexão e tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (person: Person) => {
    setEditingPerson(person);
    setFormData({
      name: person.name, cpf: person.cpf || '', cns: person.cns || '',
      birthDate: person.birthDate, gender: person.gender, phone: person.phone || '',
      occupation: person.occupation || '', isHeadOfFamily: person.isHeadOfFamily,
      hasHypertension: person.hasHypertension, hasDiabetes: person.hasDiabetes,
      isPregnant: person.isPregnant, isPuerperium: (person as any).isPuerperium ?? false,
      pregnancyDueDate: person.pregnancyDueDate || '', lastMenstrualPeriod: person.lastMenstrualPeriod || '',
      isDisabled: person.isDisabled, chronicDiseases: person.chronicDiseases?.join('\n') || '',
      medications: person.medications?.join('\n') || '', isBedridden: person.isBedridden,
      hasMobilityDifficulty: person.hasMobilityDifficulty, usesInsulin: person.usesInsulin,
      isSmoker: person.isSmoker, isWorking: person.isWorking,
      receivesBolsaFamilia: person.receivesBolsaFamilia, nisNumber: person.nisNumber || '',
      isHighRiskPregnancy: person.isHighRiskPregnancy, rareDiseases: person.rareDiseases || '',
      relationshipToHead: person.relationshipToHead || '', isAlcoholic: person.isAlcoholic ?? false,
      isDrugUser: person.isDrugUser ?? false, healthObservations: person.healthObservations || '',
      otherConditions: (person as any).otherConditions || '',
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (personId: string) => {
    if (!confirm('❓ Tem certeza que deseja remover esta pessoa do banco de dados?')) return;
    try {
      await api.deletePerson(personId);
      await loadPeople();
      alert('✅ Pessoa excluída do banco de dados!');
    } catch (error) {
      console.error('❌ Erro ao excluir pessoa:', error);
      alert('❌ Erro ao excluir pessoa. Tente novamente.');
    }
  };

  if (isFamilyLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando dados da família...</p>
        </div>
      </div>
    );
  }

  if (!family) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={40} className="text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Família não encontrada</h2>
        <p className="text-slate-500 mb-4">Essa família pode ter sido excluída ou não existe no banco de dados.</p>
        <button onClick={() => navigate('/families')} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors">
          Voltar para Famílias
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-4 mb-4">
          <button onClick={() => navigate('/families')} className="p-3 hover:bg-slate-200 rounded-full transition-colors flex-shrink-0">
            <ArrowLeft size={24} className="text-slate-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 truncate">Família {family.familyNumber}</h1>
            <p className="text-slate-600 text-sm md:text-base truncate">
              {family.address.street}, {family.address.number} - {family.address.neighborhood}
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">☁️ Nuvem</span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => exportFamilyPDF(family, people, user?.name || 'Agente')}
            disabled={isPeopleLoading}
            className="bg-green-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-green-700 flex items-center space-x-2 shadow-lg disabled:opacity-50"
          >
            <FileDown size={18} />
            <span>Exportar PDF</span>
          </button>
          <button onClick={loadPeople} className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 flex items-center space-x-2">
            <RefreshCw size={18} /><span>Atualizar</span>
          </button>
          <button onClick={() => { resetForm(); setFormData(prev => ({...prev, isHeadOfFamily: people.length === 0})); setIsFormOpen(true); }}
            className="bg-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-purple-700 flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all">
            <Plus size={20} /><span>Nova Pessoa</span>
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-3">
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-center">
          <Users size={18} className="text-slate-600 mx-auto mb-1" />
          <span className="text-xl font-bold text-slate-800 block">{stats.total}</span>
          <p className="text-[10px] text-slate-600 font-medium">Total</p>
        </div>
        <div className="bg-white p-3 rounded-xl border border-green-200 shadow-sm text-center">
          <Baby size={18} className="text-green-600 mx-auto mb-1" />
          <span className="text-xl font-bold text-slate-800 block">{stats.children}</span>
          <p className="text-[10px] text-slate-600 font-medium">Crianças</p>
        </div>
        <div className="bg-white p-3 rounded-xl border border-purple-200 shadow-sm text-center">
          <User size={18} className="text-purple-600 mx-auto mb-1" />
          <span className="text-xl font-bold text-slate-800 block">{stats.elderly}</span>
          <p className="text-[10px] text-slate-600 font-medium">Idosos</p>
        </div>
        <div className="bg-white p-3 rounded-xl border border-pink-200 shadow-sm text-center">
          <Baby size={18} className="text-pink-600 mx-auto mb-1" />
          <span className="text-xl font-bold text-slate-800 block">{stats.pregnant}</span>
          <p className="text-[10px] text-slate-600 font-medium">Gestantes</p>
        </div>
        <div className="bg-white p-3 rounded-xl border border-fuchsia-200 shadow-sm text-center">
          <span className="text-lg block mb-1">🤱</span>
          <span className="text-xl font-bold text-slate-800 block">{stats.puerperium}</span>
          <p className="text-[10px] text-slate-600 font-medium">Puérperas</p>
        </div>
        <div className="bg-white p-3 rounded-xl border border-red-200 shadow-sm text-center">
          <Heart size={18} className="text-red-600 mx-auto mb-1" />
          <span className="text-xl font-bold text-slate-800 block">{stats.hypertensive}</span>
          <p className="text-[10px] text-slate-600 font-medium">Hipertensos</p>
        </div>
        <div className="bg-white p-3 rounded-xl border border-blue-200 shadow-sm text-center">
          <Activity size={18} className="text-blue-600 mx-auto mb-1" />
          <span className="text-xl font-bold text-slate-800 block">{stats.diabetic}</span>
          <p className="text-[10px] text-slate-600 font-medium">Diabéticos</p>
        </div>
        <div className="bg-white p-3 rounded-xl border border-orange-200 shadow-sm text-center">
          <User size={18} className="text-orange-600 mx-auto mb-1" />
          <span className="text-xl font-bold text-slate-800 block">{stats.disabled}</span>
          <p className="text-[10px] text-slate-600 font-medium">PcD</p>
        </div>
        <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-sm text-center">
          <span className="text-lg block mb-1">🛏️</span>
          <span className="text-xl font-bold text-slate-800 block">{stats.bedridden}</span>
          <p className="text-[10px] text-slate-600 font-medium">Acamados</p>
        </div>
        <div className="bg-white p-3 rounded-xl border border-cyan-200 shadow-sm text-center">
          <span className="text-lg block mb-1">💉</span>
          <span className="text-xl font-bold text-slate-800 block">{stats.insulin}</span>
          <p className="text-[10px] text-slate-600 font-medium">Insulina</p>
        </div>
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm text-center">
          <span className="text-lg block mb-1">🚬</span>
          <span className="text-xl font-bold text-slate-800 block">{stats.smoker}</span>
          <p className="text-[10px] text-slate-600 font-medium">Fumantes</p>
        </div>
        <div className="bg-white p-3 rounded-xl border border-rose-200 shadow-sm text-center">
          <span className="text-lg block mb-1">🍺</span>
          <span className="text-xl font-bold text-slate-800 block">{stats.alcoholic}</span>
          <p className="text-[10px] text-slate-600 font-medium">Alcoólatras</p>
        </div>
      </div>

      {/* Lista de Membros */}
      {isPeopleLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
            <p className="text-slate-500 text-sm">Carregando membros...</p>
          </div>
        </div>
      ) : people.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border-2 border-dashed border-slate-300 text-center">
          <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={40} className="text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Nenhum membro cadastrado</h3>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">Comece cadastrando os membros desta família. Os dados serão salvos na nuvem com segurança.</p>
          <button onClick={() => { resetForm(); setFormData(prev => ({...prev, isHeadOfFamily: true})); setIsFormOpen(true); }}
            className="bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 inline-flex items-center space-x-2">
            <Plus size={20} /><span>Cadastrar Primeiro Membro</span>
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {people.map(person => {
            const age = calculateAge(person.birthDate);
            const isPuerperium = (person as any).isPuerperium;
            const otherCond = (person as any).otherConditions;
            return (
              <div key={person.id} className="bg-white p-6 rounded-xl border-2 border-slate-200 hover:border-purple-300 hover:shadow-md transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl ${person.gender === 'F' ? 'bg-pink-500' : 'bg-blue-500'}`}>
                      {person.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-800 flex items-center">
                        {person.name}
                        {person.isHeadOfFamily && (
                          <span className="ml-2 bg-yellow-100 text-yellow-700 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wide">Responsável</span>
                        )}
                      </h3>
                      <p className="text-sm text-slate-500">{age} anos • {person.gender === 'F' ? 'Feminino' : person.gender === 'M' ? 'Masculino' : 'Outro'}</p>
                    </div>
                  </div>
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(person)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar"><Edit2 size={18} /></button>
                    <button onClick={() => handleDelete(person.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir"><Trash2 size={18} /></button>
                  </div>
                </div>

                {(person.phone || person.occupation) && (
                  <div className="space-y-1 mb-4 text-sm text-slate-600">
                    {person.phone && (<div className="flex items-center space-x-2"><Phone size={14} /><span>{person.phone}</span></div>)}
                    {person.occupation && (<div className="flex items-center space-x-2"><User size={14} /><span>{person.occupation}</span></div>)}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {person.isPregnant && !isPuerperium && (
                    <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full font-medium flex items-center">
                      <Baby size={12} className="mr-1" />Gestante
                      {person.lastMenstrualPeriod && (<span className="ml-1">• IG {calculateGestationalAge(person.lastMenstrualPeriod)}</span>)}
                    </span>
                  )}
                  {person.isPregnant && isPuerperium && (
                    <span className="text-xs bg-fuchsia-100 text-fuchsia-700 px-2 py-1 rounded-full font-medium flex items-center">🤱 Puérpera</span>
                  )}
                  {person.isHighRiskPregnancy && person.isPregnant && !isPuerperium && (
                    <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded-full font-medium">⚠️ Alto Risco</span>
                  )}
                  {person.hasHypertension && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium flex items-center"><Heart size={12} className="mr-1" />Hipertensão</span>
                  )}
                  {person.hasDiabetes && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium flex items-center"><Activity size={12} className="mr-1" />Diabetes</span>
                  )}
                  {person.usesInsulin && (<span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-1 rounded-full font-medium">💉 Insulina</span>)}
                  {person.isBedridden && (<span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">🛏️ Acamado</span>)}
                  {person.hasMobilityDifficulty && (<span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">🦽 Dif. Locomoção</span>)}
                  {person.isSmoker && (<span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-medium">🚬 Fumante</span>)}
                  {person.isDisabled && (<span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">♿ Deficiência</span>)}
                  {person.receivesBolsaFamilia && (<span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">💰 Bolsa Família</span>)}
                  {person.isWorking && (<span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">💼 Trabalha</span>)}
                  {age < 12 && (<span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">👶 Criança</span>)}
                  {age >= 60 && (<span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">👴 Idoso</span>)}
                  {person.medications && person.medications.length > 0 && (
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full font-medium">💊 {person.medications.length} medicamentos</span>
                  )}
                  {person.isAlcoholic && (<span className="text-xs bg-rose-100 text-rose-700 px-2 py-1 rounded-full font-medium">🍺 Alcoólatra</span>)}
                  {person.isDrugUser && (<span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">⚠️ Usuário de Drogas</span>)}
                  {person.relationshipToHead && (
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full font-medium">👨‍👩‍👧 {person.relationshipToHead}</span>
                  )}
                  {otherCond && otherCond.trim() !== '' && (
                    <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full font-medium">📋 {otherCond}</span>
                  )}
                  {!person.hasHypertension && !person.hasDiabetes && !person.isPregnant && !person.isDisabled && !person.isBedridden && !person.usesInsulin && !person.isSmoker && !person.isAlcoholic && !person.isDrugUser && !(otherCond && otherCond.trim() !== '') && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium flex items-center"><CheckCircle2 size={12} className="mr-1" />Sem condições especiais</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE CADASTRO */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-white rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 p-3 rounded-xl">
                    <User size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{editingPerson ? 'Editar Pessoa' : 'Nova Pessoa'}</h2>
                    <p className="text-purple-100">Família {family.familyNumber} • ☁️ Salva na nuvem</p>
                  </div>
                </div>
                <button onClick={() => { setIsFormOpen(false); setEditingPerson(null); resetForm(); }} className="p-2 hover:bg-white/20 rounded-xl transition-colors" disabled={isSaving}>
                  <X size={24} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSavePerson} className="p-6 space-y-6">

              {/* SEÇÃO 1 - Dados Pessoais */}
              <div className="bg-slate-50 p-4 rounded-xl">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                  <span className="bg-purple-100 text-purple-600 w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm">1</span>
                  Dados Pessoais
                </h3>
                <div className="space-y-4">

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Parentesco com o Responsável</label>
                    <select
                      value={formData.relationshipToHead}
                      onChange={(e) => setFormData({...formData, relationshipToHead: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none bg-white"
                      disabled={isSaving}
                    >
                      <option value="">Selecione o parentesco</option>
                      <option value="Responsável">Responsável</option>
                      <option value="Cônjuge/Companheiro(a)">Cônjuge/Companheiro(a)</option>
                      <option value="Filho(a)">Filho(a)</option>
                      <option value="Enteado(a)">Enteado(a)</option>
                      <option value="Neto(a)">Neto(a)</option>
                      <option value="Pai/Mãe">Pai/Mãe</option>
                      <option value="Sogro(a)">Sogro(a)</option>
                      <option value="Irmão/Irmã">Irmão/Irmã</option>
                      <option value="Genro/Nora">Genro/Nora</option>
                      <option value="Avô/Avó">Avô/Avó</option>
                      <option value="Tio(a)">Tio(a)</option>
                      <option value="Primo(a)">Primo(a)</option>
                      <option value="Sobrinho(a)">Sobrinho(a)</option>
                      <option value="Outro parente">Outro parente</option>
                      <option value="Não parente">Não parente</option>
                    </select>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Nome Completo *</label>
                      <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none"
                        placeholder="Nome completo da pessoa" disabled={isSaving} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Data de Nascimento *</label>
                      <input type="date" required value={formData.birthDate} onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                        max={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none" disabled={isSaving} />
                      {formData.birthDate && (<p className="text-xs text-slate-500 mt-1">Idade: {calculateAge(formData.birthDate)} anos</p>)}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Sexo *</label>
                      <select required value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value as any})}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none bg-white" disabled={isSaving}>
                        <option value="M">Masculino</option>
                        <option value="F">Feminino</option>
                        <option value="OTHER">Outro</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">CPF</label>
                      <input type="text" value={formData.cpf} onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none"
                        placeholder="000.000.000-00" disabled={isSaving} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">CNS (Cartão SUS)</label>
                      <input type="text" value={formData.cns} onChange={(e) => setFormData({...formData, cns: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none"
                        placeholder="000 0000 0000 0000" disabled={isSaving} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Telefone</label>
                      <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none"
                        placeholder="(00) 00000-0000" disabled={isSaving} />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Ocupação</label>
                      <input type="text" value={formData.occupation} onChange={(e) => setFormData({...formData, occupation: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none"
                        placeholder="Ex: Estudante, Autônomo, Aposentado" disabled={isSaving} />
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center space-x-3 p-4 bg-white border-2 border-slate-200 rounded-lg cursor-pointer hover:border-purple-500 transition-colors w-full">
                        <input type="checkbox" checked={formData.isHeadOfFamily} onChange={(e) => setFormData({...formData, isHeadOfFamily: e.target.checked})}
                          className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500" disabled={isSaving} />
                        <span className="text-sm font-medium text-slate-700">👤 Responsável pela família</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* SEÇÃO 2 - Condições de Saúde */}
              <div className="bg-slate-50 p-4 rounded-xl">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                  <span className="bg-purple-100 text-purple-600 w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm">2</span>
                  Condições de Saúde
                </h3>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <label className="flex items-center space-x-3 p-4 bg-white border-2 border-slate-200 rounded-lg cursor-pointer hover:border-red-500 transition-colors">
                      <input type="checkbox" checked={formData.hasHypertension} onChange={(e) => setFormData({...formData, hasHypertension: e.target.checked})} className="w-5 h-5 text-red-600 rounded" disabled={isSaving} />
                      <span className="text-sm font-medium text-slate-700">❤️ Hipertensão</span>
                    </label>
                    <label className="flex items-center space-x-3 p-4 bg-white border-2 border-slate-200 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                      <input type="checkbox" checked={formData.hasDiabetes} onChange={(e) => setFormData({...formData, hasDiabetes: e.target.checked})} className="w-5 h-5 text-blue-600 rounded" disabled={isSaving} />
                      <span className="text-sm font-medium text-slate-700">🩸 Diabetes</span>
                    </label>
                    <label className="flex items-center space-x-3 p-4 bg-white border-2 border-slate-200 rounded-lg cursor-pointer hover:border-cyan-500 transition-colors">
                      <input type="checkbox" checked={formData.usesInsulin} onChange={(e) => setFormData({...formData, usesInsulin: e.target.checked})} className="w-5 h-5 text-cyan-600 rounded" disabled={isSaving} />
                      <span className="text-sm font-medium text-slate-700">💉 Usa Insulina</span>
                    </label>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <label className="flex items-center space-x-3 p-4 bg-white border-2 border-slate-200 rounded-lg cursor-pointer hover:border-orange-500 transition-colors">
                      <input type="checkbox" checked={formData.isDisabled} onChange={(e) => setFormData({...formData, isDisabled: e.target.checked})} className="w-5 h-5 text-orange-600 rounded" disabled={isSaving} />
                      <span className="text-sm font-medium text-slate-700">♿ Deficiência</span>
                    </label>
                    <label className="flex items-center space-x-3 p-4 bg-white border-2 border-slate-200 rounded-lg cursor-pointer hover:border-amber-500 transition-colors">
                      <input type="checkbox" checked={formData.isBedridden} onChange={(e) => setFormData({...formData, isBedridden: e.target.checked})} className="w-5 h-5 text-amber-600 rounded" disabled={isSaving} />
                      <span className="text-sm font-medium text-slate-700">🛏️ Acamado</span>
                    </label>
                    <label className="flex items-center space-x-3 p-4 bg-white border-2 border-slate-200 rounded-lg cursor-pointer hover:border-yellow-500 transition-colors">
                      <input type="checkbox" checked={formData.hasMobilityDifficulty} onChange={(e) => setFormData({...formData, hasMobilityDifficulty: e.target.checked})} className="w-5 h-5 text-yellow-600 rounded" disabled={isSaving} />
                      <span className="text-sm font-medium text-slate-700">🦽 Dificuldade de Locomoção</span>
                    </label>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <label className="flex items-center space-x-3 p-4 bg-white border-2 border-slate-200 rounded-lg cursor-pointer hover:border-gray-500 transition-colors">
                      <input type="checkbox" checked={formData.isSmoker} onChange={(e) => setFormData({...formData, isSmoker: e.target.checked})} className="w-5 h-5 text-gray-600 rounded" disabled={isSaving} />
                      <span className="text-sm font-medium text-slate-700">🚬 Fumante</span>
                    </label>
                    <label className="flex items-center space-x-3 p-4 bg-white border-2 border-slate-200 rounded-lg cursor-pointer hover:border-indigo-500 transition-colors">
                      <input type="checkbox" checked={formData.isWorking} onChange={(e) => setFormData({...formData, isWorking: e.target.checked})} className="w-5 h-5 text-indigo-600 rounded" disabled={isSaving} />
                      <span className="text-sm font-medium text-slate-700">💼 Trabalha</span>
                    </label>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <label className="flex items-center space-x-3 p-4 bg-white border-2 border-rose-200 rounded-lg cursor-pointer hover:border-rose-500 transition-colors">
                      <input type="checkbox" checked={formData.isAlcoholic} onChange={(e) => setFormData({...formData, isAlcoholic: e.target.checked})} className="w-5 h-5 text-rose-600 rounded" disabled={isSaving} />
                      <span className="text-sm font-medium text-slate-700">🍺 Alcoólatra</span>
                    </label>
                    <label className="flex items-center space-x-3 p-4 bg-white border-2 border-red-200 rounded-lg cursor-pointer hover:border-red-500 transition-colors">
                      <input type="checkbox" checked={formData.isDrugUser} onChange={(e) => setFormData({...formData, isDrugUser: e.target.checked})} className="w-5 h-5 text-red-600 rounded" disabled={isSaving} />
                      <span className="text-sm font-medium text-slate-700">⚠️ Usuário de Drogas</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">📋 Outras Condições</label>
                    <input type="text" value={formData.otherConditions} onChange={(e) => setFormData({...formData, otherConditions: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none"
                      placeholder="Ex: Epilepsia, Transtorno bipolar, Anemia falciforme..."
                      disabled={isSaving} />
                    <p className="text-xs text-slate-500 mt-1">Informe condições que não estão nas opções acima</p>
                  </div>

                  {formData.gender === 'F' && (
                    <div className="bg-pink-50 border-2 border-pink-200 rounded-xl p-4">
                      <label className="flex items-center space-x-3 cursor-pointer mb-4">
                        <input type="checkbox" checked={formData.isPregnant}
                          onChange={(e) => setFormData({...formData, isPregnant: e.target.checked, isPuerperium: false})}
                          className="w-5 h-5 text-pink-600 rounded" disabled={isSaving} />
                        <span className="text-sm font-medium text-slate-700">🤰 Gestante / Puérpera</span>
                      </label>

                      {formData.isPregnant && (
                        <div className="space-y-4">
                          <div className="flex rounded-lg overflow-hidden border-2 border-pink-300">
                            <button type="button" onClick={() => setFormData({...formData, isPuerperium: false})}
                              className={`flex-1 py-3 px-4 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                                !formData.isPuerperium ? 'bg-pink-500 text-white' : 'bg-white text-pink-600 hover:bg-pink-50'
                              }`} disabled={isSaving}>
                              🤰 Gestante
                            </button>
                            <button type="button" onClick={() => setFormData({...formData, isPuerperium: true})}
                              className={`flex-1 py-3 px-4 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                                formData.isPuerperium ? 'bg-fuchsia-500 text-white' : 'bg-white text-fuchsia-600 hover:bg-fuchsia-50'
                              }`} disabled={isSaving}>
                              🤱 Puérpera
                            </button>
                          </div>

                          {formData.isPuerperium && (
                            <div className="bg-fuchsia-50 border border-fuchsia-200 rounded-lg p-3">
                              <p className="text-sm text-fuchsia-700 font-medium">🤱 Paciente em período de puerpério (pós-parto). Os campos de DUM e DPP ficam opcionais.</p>
                            </div>
                          )}

                          {!formData.isPuerperium && (
                            <>
                              <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-semibold text-slate-700 mb-2">Data da Última Menstruação (DUM) *</label>
                                  <input type="date" required={formData.isPregnant && !formData.isPuerperium}
                                    value={formData.lastMenstrualPeriod} onChange={(e) => setFormData({...formData, lastMenstrualPeriod: e.target.value})}
                                    max={new Date().toISOString().split('T')[0]}
                                    className="w-full px-4 py-3 border-2 border-pink-200 rounded-lg focus:border-pink-500 focus:ring-4 focus:ring-pink-100 outline-none" disabled={isSaving} />
                                  {formData.lastMenstrualPeriod && (
                                    <p className="text-xs text-pink-700 mt-1 font-medium">IG: {calculateGestationalAge(formData.lastMenstrualPeriod)}</p>
                                  )}
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-slate-700 mb-2">Data Provável do Parto (DPP)</label>
                                  <input type="date" value={formData.pregnancyDueDate} onChange={(e) => setFormData({...formData, pregnancyDueDate: e.target.value})}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full px-4 py-3 border-2 border-pink-200 rounded-lg focus:border-pink-500 focus:ring-4 focus:ring-pink-100 outline-none" disabled={isSaving} />
                                </div>
                              </div>
                              <label className="flex items-center space-x-3 p-4 bg-red-50 border-2 border-red-200 rounded-lg cursor-pointer hover:border-red-400 transition-colors">
                                <input type="checkbox" checked={formData.isHighRiskPregnancy} onChange={(e) => setFormData({...formData, isHighRiskPregnancy: e.target.checked})}
                                  className="w-5 h-5 text-red-600 rounded" disabled={isSaving} />
                                <span className="text-sm font-medium text-red-700">⚠️ Gestação de Alto Risco</span>
                              </label>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                    <label className="flex items-center space-x-3 cursor-pointer mb-4">
                      <input type="checkbox" checked={formData.receivesBolsaFamilia} onChange={(e) => setFormData({...formData, receivesBolsaFamilia: e.target.checked})}
                        className="w-5 h-5 text-green-600 rounded" disabled={isSaving} />
                      <span className="text-sm font-medium text-slate-700">💰 Recebe Bolsa Família</span>
                    </label>
                    {formData.receivesBolsaFamilia && (
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Número do NIS</label>
                        <input type="text" value={formData.nisNumber} onChange={(e) => setFormData({...formData, nisNumber: e.target.value})}
                          className="w-full px-4 py-3 border-2 border-green-200 rounded-lg focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none"
                          placeholder="Número do NIS" disabled={isSaving} />
                      </div>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Doenças Crônicas</label>
                      <textarea value={formData.chronicDiseases} onChange={(e) => setFormData({...formData, chronicDiseases: e.target.value})}
                        rows={3} className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none resize-none"
                        placeholder={"Uma por linha:\nAsma\nArtrite"} disabled={isSaving} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Medicamentos em Uso</label>
                      <textarea value={formData.medications} onChange={(e) => setFormData({...formData, medications: e.target.value})}
                        rows={3} className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none resize-none"
                        placeholder={"Um por linha:\nLosartana 50mg\nMetformina 850mg"} disabled={isSaving} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Doenças Raras</label>
                    <input type="text" value={formData.rareDiseases} onChange={(e) => setFormData({...formData, rareDiseases: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none"
                      placeholder="Ex: Fibrose cística, Doença de Gaucher" disabled={isSaving} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">📝 Observações de Saúde</label>
                <textarea value={formData.healthObservations} onChange={(e) => setFormData({...formData, healthObservations: e.target.value})}
                  rows={4} className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none resize-none"
                  placeholder="Anotações gerais sobre a saúde do paciente, informações relevantes, lembretes, etc." disabled={isSaving} />
                <p className="text-xs text-slate-500 mt-1">Use este campo para registrar qualquer informação adicional sobre a saúde do paciente</p>
              </div>

              <div className="flex space-x-4 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => { setIsFormOpen(false); setEditingPerson(null); resetForm(); }}
                  className="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors" disabled={isSaving}>
                  Cancelar
                </button>
                <button type="submit" disabled={isSaving}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSaving ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      <span>Salvando na nuvem...</span>
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      <span>{editingPerson ? 'Atualizar' : 'Cadastrar'} Pessoa</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
