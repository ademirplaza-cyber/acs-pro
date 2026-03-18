import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Family, Address } from '../types';
import { 
  Users, 
  Plus, 
  Search, 
  MapPin, 
  Home, 
  Save, 
  X, 
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  WifiOff,
  Edit2
} from 'lucide-react';

export const Families = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [families, setFamilies] = useState<Family[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFamily, setEditingFamily] = useState<Family | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Estado do formulário
  const [formData, setFormData] = useState({
    familyNumber: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '',
    hasBasicSanitation: true,
    hasRunningWater: true,
    hasElectricity: true,
    dwellingType: 'HOUSE' as 'HOUSE' | 'APARTMENT' | 'SHACK' | 'OTHER',
    householdIncome: 0,
    notes: ''
  });

  const [location, setLocation] = useState<{ latitude?: number; longitude?: number }>({});
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);

  // Monitor de conectividade
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      loadFamilies();
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Carregar famílias
  const loadFamilies = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      if (navigator.onLine && !isOffline) {
        const data = await api.getFamilies(user.id);
        setFamilies(data);
        localStorage.setItem(`families_cache_${user.id}`, JSON.stringify(data));
        console.log('✅ Famílias carregadas do Supabase:', data.length);
      } else {
        const cached = localStorage.getItem(`families_cache_${user.id}`);
        if (cached) {
          setFamilies(JSON.parse(cached));
          console.log('📱 Famílias carregadas do cache offline');
        } else {
          setFamilies([]);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar famílias:', error);
      const cached = localStorage.getItem(`families_cache_${user.id}`);
      if (cached) {
        setFamilies(JSON.parse(cached));
        console.log('📱 Usando cache devido a erro de rede');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFamilies();
  }, [user]);

  // Filtrar famílias
  const filteredFamilies = useMemo(() => {
    if (!searchTerm) return families;
    const term = searchTerm.toLowerCase();
    return families.filter(f => 
      f.familyNumber.toLowerCase().includes(term) ||
      f.address.street.toLowerCase().includes(term) ||
      f.address.neighborhood.toLowerCase().includes(term) ||
      f.address.number.includes(term)
    );
  }, [families, searchTerm]);

  const captureLocation = () => {
    if (!navigator.geolocation) {
      alert('Seu dispositivo não suporta GPS');
      return;
    }

    setIsCapturingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setIsCapturingLocation(false);
        alert(`📍 GPS capturado!\nLatitude: ${position.coords.latitude.toFixed(6)}\nLongitude: ${position.coords.longitude.toFixed(6)}`);
      },
      () => {
        setIsCapturingLocation(false);
        alert('Erro ao capturar GPS. Verifique as permissões.');
      }
    );
  };

  const resetForm = () => {
    setFormData({
      familyNumber: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '',
      hasBasicSanitation: true,
      hasRunningWater: true,
      hasElectricity: true,
      dwellingType: 'HOUSE',
      householdIncome: 0,
      notes: ''
    });
    setLocation({});
    setEditingFamily(null);
  };

  const handleEditFamily = (family: Family) => {
    setEditingFamily(family);
    setFormData({
      familyNumber: family.familyNumber,
      street: family.address.street,
      number: family.address.number,
      complement: family.address.complement || '',
      neighborhood: family.address.neighborhood,
      city: family.address.city || 'São Paulo',
      state: family.address.state || 'SP',
      zipCode: family.address.zipCode || '',
      hasBasicSanitation: family.hasBasicSanitation ?? true,
      hasRunningWater: family.hasRunningWater ?? true,
      hasElectricity: family.hasElectricity ?? true,
      dwellingType: family.dwellingType || 'HOUSE',
      householdIncome: family.householdIncome || 0,
      notes: family.notes || ''
    });
    setLocation({
      latitude: family.address.latitude,
      longitude: family.address.longitude
    });
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    if (!formData.familyNumber || !formData.street || !formData.number) {
      alert('Preencha os campos obrigatórios: Número da Família, Rua e Número');
      return;
    }

    if (!navigator.onLine) {
      alert('⚠️ Você precisa estar conectado à internet para salvar no banco de dados');
      return;
    }

    try {
      setIsSaving(true);

      const address: Address = {
        street: formData.street,
        number: formData.number,
        complement: formData.complement,
        neighborhood: formData.neighborhood,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        latitude: location.latitude,
        longitude: location.longitude
      };

      const familyToSave: Family = {
        id: editingFamily ? editingFamily.id : crypto.randomUUID(),
        familyNumber: formData.familyNumber,
        address,
        agentId: editingFamily ? editingFamily.agentId : user.id,
        registeredAt: editingFamily ? editingFamily.registeredAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        hasBasicSanitation: formData.hasBasicSanitation,
        hasRunningWater: formData.hasRunningWater,
        hasElectricity: formData.hasElectricity,
        dwellingType: formData.dwellingType,
        householdIncome: formData.householdIncome || undefined,
        notes: formData.notes || undefined
      };

      await api.saveFamily(familyToSave);
      await loadFamilies();
      
      resetForm();
      setIsFormOpen(false);
      
      alert(editingFamily ? '✅ Família atualizada no banco de dados!' : '✅ Família salva no banco de dados na nuvem!');

    } catch (error) {
      console.error('Erro ao salvar família:', error);
      alert('❌ Erro ao salvar família. Verifique sua conexão e tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (familyId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta família do banco de dados?')) return;
    
    if (!navigator.onLine) {
      alert('⚠️ Você precisa estar conectado à internet para excluir do banco de dados');
      return;
    }

    try {
      await api.deleteFamily(familyId);
      await loadFamilies();
      alert('✅ Família excluída do banco de dados!');
    } catch (error) {
      console.error('Erro ao excluir família:', error);
      alert('❌ Erro ao excluir família. Tente novamente.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando famílias do banco de dados...</p>
        </div>
      </div>
    );
  }

  // RENDERIZAÇÃO DO FORMULÁRIO
  if (isFormOpen) {
    return (
      <div className="max-w-4xl mx-auto">
        {/* Header do Formulário */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-3 rounded-xl">
                <Home size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{editingFamily ? 'Editar Família' : 'Nova Família'}</h1>
                <p className="text-blue-100">
                  {isOffline ? '⚠️ Offline - Conecte-se para salvar' : '☁️ Será salva no banco de dados na nuvem'}
                </p>
              </div>
            </div>
            <button
              onClick={() => { setIsFormOpen(false); resetForm(); }}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {isOffline && (
          <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 mb-6 flex items-center space-x-3">
            <WifiOff size={24} className="text-orange-600" />
            <div>
              <p className="font-semibold text-orange-800">Você está offline</p>
              <p className="text-sm text-orange-700">Conecte-se à internet para salvar famílias no banco de dados</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          
          {/* Identificação */}
          <div className="bg-slate-50 p-4 rounded-xl">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center">
              <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm">1</span>
              Identificação da Família
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Número da Família *
                </label>
                <input
                  type="text"
                  required
                  value={formData.familyNumber}
                  onChange={(e) => setFormData({...formData, familyNumber: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none"
                  placeholder="Ex: 001, 002, 003..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Renda Familiar (R$)
                </label>
                <input
                  type="number"
                  value={formData.householdIncome}
                  onChange={(e) => setFormData({...formData, householdIncome: parseFloat(e.target.value) || 0})}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="bg-slate-50 p-4 rounded-xl">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center">
              <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm">2</span>
              Endereço Completo
            </h3>
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Logradouro (Rua/Avenida) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.street}
                    onChange={(e) => setFormData({...formData, street: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none"
                    placeholder="Nome da rua ou avenida"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Número *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.number}
                    onChange={(e) => setFormData({...formData, number: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none"
                    placeholder="123"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Complemento
                  </label>
                  <input
                    type="text"
                    value={formData.complement}
                    onChange={(e) => setFormData({...formData, complement: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none"
                    placeholder="Apto, Bloco, Casa..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Bairro
                  </label>
                  <input
                    type="text"
                    value={formData.neighborhood}
                    onChange={(e) => setFormData({...formData, neighborhood: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none"
                    placeholder="Nome do bairro"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    CEP
                  </label>
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none"
                    placeholder="00000-000"
                  />
                </div>
              </div>

              {/* GPS */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <MapPin size={24} className="text-blue-600" />
                    <div>
                      <p className="font-semibold text-slate-800">Localização GPS</p>
                      {location.latitude ? (
                        <p className="text-sm text-green-600">
                          ✓ Capturada: {location.latitude.toFixed(6)}, {location.longitude?.toFixed(6)}
                        </p>
                      ) : (
                        <p className="text-sm text-slate-600">Clique para capturar a localização exata</p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={captureLocation}
                    disabled={isCapturingLocation}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                  >
                    {isCapturingLocation ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                        <span>Capturando...</span>
                      </>
                    ) : (
                      <>
                        <MapPin size={16} />
                        <span>Capturar GPS</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Condições de Moradia */}
          <div className="bg-slate-50 p-4 rounded-xl">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center">
              <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm">3</span>
              Condições de Moradia
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Tipo de Domicílio
                </label>
                <select
                  value={formData.dwellingType}
                  onChange={(e) => setFormData({...formData, dwellingType: e.target.value as any})}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none bg-white"
                >
                  <option value="HOUSE">Casa</option>
                  <option value="APARTMENT">Apartamento</option>
                  <option value="SHACK">Barraco/Favela</option>
                  <option value="OTHER">Outro</option>
                </select>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <label className="flex items-center space-x-3 p-4 bg-white border-2 border-slate-200 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.hasBasicSanitation}
                    onChange={(e) => setFormData({...formData, hasBasicSanitation: e.target.checked})}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-slate-700">Saneamento Básico</span>
                </label>

                <label className="flex items-center space-x-3 p-4 bg-white border-2 border-slate-200 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.hasRunningWater}
                    onChange={(e) => setFormData({...formData, hasRunningWater: e.target.checked})}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-slate-700">Água Encanada</span>
                </label>

                <label className="flex items-center space-x-3 p-4 bg-white border-2 border-slate-200 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.hasElectricity}
                    onChange={(e) => setFormData({...formData, hasElectricity: e.target.checked})}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-slate-700">Energia Elétrica</span>
                </label>
              </div>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Observações Gerais
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none resize-none"
              placeholder="Informações adicionais sobre a família, condições especiais, etc."
            />
          </div>

          {/* Botões */}
          <div className="flex space-x-4 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => { setIsFormOpen(false); resetForm(); }}
              className="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || isOffline}
              className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Salvando na nuvem...</span>
                </>
              ) : (
                <>
                  <Save size={20} />
                  <span>{editingFamily ? 'Atualizar Família' : 'Salvar Família'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // RENDERIZAÇÃO DA LISTA
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Famílias Cadastradas</h1>
          <p className="text-slate-600">
            {families.length} {families.length === 1 ? 'família' : 'famílias'} no banco de dados na nuvem
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {isOffline && (
            <div className="flex items-center text-orange-600 text-sm bg-orange-50 border border-orange-200 rounded-xl px-3 py-2">
              <WifiOff size={16} className="mr-2" />
              Offline (cache local)
            </div>
          )}
          <button
            onClick={loadFamilies}
            disabled={isOffline}
            className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw size={18} />
            <span>Atualizar</span>
          </button>
          <button
            onClick={() => { resetForm(); setIsFormOpen(true); }}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all"
          >
            <Plus size={20} />
            <span>Nova Família</span>
          </button>
        </div>
      </div>

      {/* Busca */}
      <div className="bg-white p-4 rounded-xl border-2 border-slate-200 shadow-sm">
        <div className="relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por número da família, rua, bairro ou número da casa..."
            className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none"
          />
        </div>
      </div>

      {/* Lista de Famílias */}
      {filteredFamilies.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border-2 border-dashed border-slate-300 text-center">
          <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={40} className="text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            {searchTerm ? 'Nenhuma família encontrada' : 'Nenhuma família cadastrada ainda'}
          </h3>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            {searchTerm 
              ? 'Tente buscar por outros termos como número da família ou nome da rua' 
              : 'Comece cadastrando a primeira família da sua microárea. O cadastro será salvo no banco de dados na nuvem.'
            }
          </p>
          {!searchTerm && (
            <button
              onClick={() => { resetForm(); setIsFormOpen(true); }}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 inline-flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>Cadastrar Primeira Família</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredFamilies.map(family => {
            const allPeople = JSON.parse(localStorage.getItem('acs_people') || '[]');
            const familyMembers = allPeople.filter((p: any) => p.familyId === family.id);
            const memberCount = familyMembers.length;
            
            return (
              <div key={family.id} className="bg-white p-6 rounded-xl border-2 border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group flex flex-col">
                {/* Cabeçalho do Card */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-3 rounded-lg group-hover:scale-110 transition-transform">
                      <Home size={24} className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-800">Família {family.familyNumber}</h3>
                      <p className="text-sm text-slate-500">
                        Salva na nuvem em {new Date(family.registeredAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleEditFamily(family)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar família"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(family.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir família"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Endereço */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-start space-x-2">
                    <MapPin size={16} className="text-slate-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {family.address.street}, {family.address.number}
                        {family.address.complement && ` - ${family.address.complement}`}
                      </p>
                      <p className="text-sm text-slate-600">
                        {family.address.neighborhood} - {family.address.city}/{family.address.state}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tags de Condições */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {family.hasBasicSanitation ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium flex items-center">
                      <CheckCircle2 size={12} className="mr-1" />
                      Saneamento
                    </span>
                  ) : (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium flex items-center">
                      <AlertTriangle size={12} className="mr-1" />
                      Sem saneamento
                    </span>
                  )}
                  
                  {family.hasRunningWater ? (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium flex items-center">
                      <CheckCircle2 size={12} className="mr-1" />
                      Água
                    </span>
                  ) : (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium flex items-center">
                      <AlertTriangle size={12} className="mr-1" />
                      Sem água
                    </span>
                  )}

                  {family.hasElectricity ? (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium flex items-center">
                      <CheckCircle2 size={12} className="mr-1" />
                      Energia
                    </span>
                  ) : (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium flex items-center">
                      <AlertTriangle size={12} className="mr-1" />
                      Sem energia
                    </span>
                  )}

                  {family.address.latitude && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                      📍 GPS
                    </span>
                  )}
                </div>

                {/* BOTÃO VER MEMBROS */}
                <div className="mt-auto pt-4 border-t border-slate-200">
                  <button
                    onClick={() => navigate(`/families/${family.id}`)}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 shadow-sm"
                  >
                    <Users size={18} />
                    <span>Ver Membros da Família</span>
                    {memberCount > 0 && (
                      <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
                        {memberCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
