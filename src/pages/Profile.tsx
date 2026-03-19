import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  User,
  Save,
  MapPin,
  Phone,
  CreditCard,
  Building2,
  Users,
  Hash,
  FileText,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const Profile = () => {
  const { user, refreshUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    cpf: '',
    cns: '',
    microarea: '',
    equipe: '',
    healthUnit: '',
    address: '',
    cityState: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        cpf: user.cpf || '',
        cns: user.cns || '',
        microarea: user.microarea || '',
        equipe: user.equipe || '',
        healthUnit: user.healthUnit || '',
        address: user.address || '',
        cityState: user.cityState || '',
      });
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!formData.name.trim()) {
      alert('⚠️ O nome é obrigatório.');
      return;
    }

    try {
      setIsSaving(true);
      setSaveStatus('idle');

      await api.saveUser({
        ...user,
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        cpf: formData.cpf.trim() || undefined,
        cns: formData.cns.trim() || undefined,
        microarea: formData.microarea.trim() || undefined,
        equipe: formData.equipe.trim() || undefined,
        healthUnit: formData.healthUnit.trim() || undefined,
        address: formData.address.trim() || undefined,
        cityState: formData.cityState.trim() || undefined,
      });

      if (refreshUser) await refreshUser();
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('❌ Erro ao salvar perfil:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Meu Perfil</h1>
          <p className="text-slate-500 text-sm">{user.email} • {user.role === 'ADMIN' ? 'Administrador' : 'Agente de Saúde'}</p>
        </div>
      </div>

      {/* Status de salvamento */}
      {saveStatus === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center space-x-3">
          <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" />
          <p className="text-green-700 font-medium text-sm">Perfil atualizado com sucesso!</p>
        </div>
      )}
      {saveStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3">
          <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
          <p className="text-red-700 font-medium text-sm">Erro ao salvar. Verifique sua conexão e tente novamente.</p>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Seção 1 — Dados Pessoais */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center">
            <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm">
              <User size={16} />
            </span>
            Dados Pessoais
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Nome Completo *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none"
                placeholder="Seu nome completo"
                disabled={isSaving}
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <Phone size={14} className="inline mr-1" />Telefone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none"
                  placeholder="(00) 00000-0000"
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <CreditCard size={14} className="inline mr-1" />CPF
                </label>
                <input
                  type="text"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none"
                  placeholder="000.000.000-00"
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Seção 2 — Dados Profissionais */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center">
            <span className="bg-purple-100 text-purple-600 w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm">
              <FileText size={16} />
            </span>
            Dados Profissionais
          </h2>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <Hash size={14} className="inline mr-1" />CNS (Cartão Nacional de Saúde)
                </label>
                <input
                  type="text"
                  value={formData.cns}
                  onChange={(e) => setFormData({ ...formData, cns: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none"
                  placeholder="000 0000 0000 0000"
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <MapPin size={14} className="inline mr-1" />Micro-área
                </label>
                <input
                  type="text"
                  value={formData.microarea}
                  onChange={(e) => setFormData({ ...formData, microarea: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none"
                  placeholder="Ex: 01, 02, 03..."
                  disabled={isSaving}
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <Users size={14} className="inline mr-1" />Equipe
                </label>
                <input
                  type="text"
                  value={formData.equipe}
                  onChange={(e) => setFormData({ ...formData, equipe: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none"
                  placeholder="Ex: ESF 01, Equipe Azul..."
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <Building2 size={14} className="inline mr-1" />Unidade de Saúde (UBS)
                </label>
                <input
                  type="text"
                  value={formData.healthUnit}
                  onChange={(e) => setFormData({ ...formData, healthUnit: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none"
                  placeholder="Nome da UBS"
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Seção 3 — Endereço */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center">
            <span className="bg-green-100 text-green-600 w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm">
              <MapPin size={16} />
            </span>
            Endereço
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Endereço Completo</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none"
                placeholder="Rua, número, bairro"
                disabled={isSaving}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Cidade / Estado</label>
              <input
                type="text"
                value={formData.cityState}
                onChange={(e) => setFormData({ ...formData, cityState: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none"
                placeholder="Ex: São Paulo - SP"
                disabled={isSaving}
              />
            </div>
          </div>
        </div>

        {/* Botão Salvar */}
        <button
          type="submit"
          disabled={isSaving}
          className="w-full px-6 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              <span>Salvando...</span>
            </>
          ) : (
            <>
              <Save size={20} />
              <span>Salvar Perfil</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default Profile;
