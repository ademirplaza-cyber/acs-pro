import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { pushNotificationService } from '../services/pushNotificationService';
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
  AlertCircle,
  Bell,
  BellOff,
  BellRing,
  Loader2
} from 'lucide-react';

export const Profile = () => {
  const { user, refreshUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const [pushSupported, setPushSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');

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

  useEffect(() => {
    const checkPush = async () => {
      const supported = pushNotificationService.isSupported();
      setPushSupported(supported);
      if (supported) {
        const permission = await pushNotificationService.getPermissionStatus();
        setPushPermission(permission);
        const subscribed = await pushNotificationService.isSubscribed();
        setPushEnabled(subscribed && permission === 'granted');
      }
    };
    checkPush();
  }, []);

  useEffect(() => {
    if (pushSupported && user) {
      registerPushSW();
    }
  }, [pushSupported, user]);

  const registerPushSW = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        const hasPushSW = registrations.some(r => r.active?.scriptURL.includes('push-sw.js'));
        if (!hasPushSW) {
          await navigator.serviceWorker.register('/push-sw.js', { scope: '/' });
          console.log('✅ Push Service Worker registrado');
        }
      }
    } catch (error) {
      console.error('❌ Erro ao registrar Push SW:', error);
    }
  };

  const handleTogglePush = async () => {
    if (!user) return;
    setPushLoading(true);

    try {
      if (pushEnabled) {
        await pushNotificationService.unsubscribe();
        setPushEnabled(false);
      } else {
        const success = await pushNotificationService.subscribe(user.id);
        if (success) {
          setPushEnabled(true);
          setPushPermission('granted');
        } else {
          const perm = await pushNotificationService.getPermissionStatus();
          setPushPermission(perm);
          if (perm === 'denied') {
            alert('⚠️ Notificações bloqueadas pelo navegador. Vá nas configurações do navegador e permita notificações para este site.');
          }
        }
      }
    } catch (error) {
      console.error('❌ Erro ao alternar push:', error);
    } finally {
      setPushLoading(false);
    }
  };

  const handleTestPush = async () => {
    if (!user) return;
    try {
      const response = await fetch('/api/send-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          title: '🔔 Teste ACS Top',
          body: 'Se você está vendo esta notificação, o push está funcionando!',
          url: '/profile',
          tag: 'test-push',
          priority: 'MEDIUM',
        }),
      });
      const data = await response.json();
      if (data.sent > 0) {
        alert('✅ Notificação de teste enviada! Verifique seu celular/navegador.');
      } else {
        alert('⚠️ Nenhuma subscription encontrada. Tente desativar e ativar novamente.');
      }
    } catch (error) {
      console.error('❌ Erro ao enviar teste:', error);
      alert('❌ Erro ao enviar notificação de teste.');
    }
  };

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

      {/* Seção Push Notifications */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="font-bold text-slate-800 mb-4 flex items-center">
          <span className="bg-orange-100 text-orange-600 w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm">
            <Bell size={16} />
          </span>
          Notificações Push
        </h2>

        {!pushSupported ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center space-x-3">
            <BellOff size={20} className="text-slate-400 flex-shrink-0" />
            <div>
              <p className="text-slate-600 font-medium text-sm">Não suportado neste navegador</p>
              <p className="text-slate-400 text-xs mt-1">Use Chrome, Edge ou Firefox para receber notificações push.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center space-x-3">
                {pushEnabled ? (
                  <BellRing size={22} className="text-green-600" />
                ) : (
                  <BellOff size={22} className="text-slate-400" />
                )}
                <div>
                  <p className="font-medium text-slate-800 text-sm">
                    {pushEnabled ? 'Notificações ativadas' : 'Notificações desativadas'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {pushEnabled
                      ? 'Você receberá alertas mesmo com o app fechado.'
                      : 'Ative para receber alertas de visitas, gestantes e mais.'}
                  </p>
                  {pushPermission === 'denied' && (
                    <p className="text-xs text-red-500 mt-1 font-medium">
                      Bloqueado pelo navegador. Altere nas configurações do site.
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={handleTogglePush}
                disabled={pushLoading || pushPermission === 'denied'}
                className={`relative w-14 h-7 rounded-full transition-colors duration-200 flex-shrink-0 ${
                  pushEnabled ? 'bg-green-500' : 'bg-slate-300'
                } ${pushLoading || pushPermission === 'denied' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {pushLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 size={16} className="animate-spin text-white" />
                  </div>
                ) : (
                  <div
                    className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 ${
                      pushEnabled ? 'translate-x-7' : 'translate-x-0.5'
                    }`}
                  />
                )}
              </button>
            </div>

            {pushEnabled && (
              <button
                onClick={handleTestPush}
                className="w-full px-4 py-3 bg-orange-50 border border-orange-200 text-orange-700 font-medium rounded-xl hover:bg-orange-100 transition-colors text-sm flex items-center justify-center space-x-2"
              >
                <BellRing size={16} />
                <span>Enviar notificação de teste</span>
              </button>
            )}
          </div>
        )}
      </div>

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
