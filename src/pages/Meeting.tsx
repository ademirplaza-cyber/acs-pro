import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { MeetingTopic } from '../types';
import { usePageTracking } from '../hooks/usePageTracking';
import {
  RefreshCw,
  Plus,
  Trash2,
  Save,
  MessageSquare,
  Edit2,
} from 'lucide-react';

export const Meeting = () => {
  const { user } = useAuth();
  usePageTracking('MEETING', 'VIEW_MEETING');
  const [isLoading, setIsLoading] = useState(true);
  const [meetingTopics, setMeetingTopics] = useState<MeetingTopic[]>([]);
  const [meetingForm, setMeetingForm] = useState({ title: '', observations: '' });
  const [isSavingTopic, setIsSavingTopic] = useState(false);
  const [editingTopic, setEditingTopic] = useState<MeetingTopic | null>(null);

  const loadTopics = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const topics = await api.getMeetingTopics(user.id);
      setMeetingTopics(topics);
    } catch (e) {
      console.error('Erro ao carregar assuntos:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadTopics(); }, [user]);

  const handleSaveTopic = async () => {
    if (!user || !meetingForm.title.trim()) {
      alert('⚠️ Informe o título do assunto');
      return;
    }
    try {
      setIsSavingTopic(true);
      const topic: MeetingTopic = {
        id: editingTopic ? editingTopic.id : crypto.randomUUID(),
        agentId: user.id,
        title: meetingForm.title.trim(),
        observations: meetingForm.observations.trim(),
        status: editingTopic ? editingTopic.status : 'PENDING',
        createdAt: editingTopic ? editingTopic.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await api.saveMeetingTopic(topic);
      await loadTopics();
      setMeetingForm({ title: '', observations: '' });
      setEditingTopic(null);
      alert(editingTopic ? '✅ Assunto atualizado!' : '✅ Assunto adicionado!');
    } catch (err) {
      console.error('Erro ao salvar assunto:', err);
      alert('❌ Erro ao salvar assunto. Tente novamente.');
    } finally {
      setIsSavingTopic(false);
    }
  };

  const handleToggleTopicStatus = async (topic: MeetingTopic) => {
    try {
      const newStatus = topic.status === 'PENDING' ? 'RESOLVED' : 'PENDING';
      await api.updateMeetingTopicStatus(topic.id, newStatus);
      await loadTopics();
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      alert('❌ Erro ao atualizar. Tente novamente.');
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!confirm('❓ Tem certeza que deseja excluir este assunto?')) return;
    try {
      await api.deleteMeetingTopic(topicId);
      await loadTopics();
      alert('✅ Assunto excluído!');
    } catch (err) {
      console.error('Erro ao excluir assunto:', err);
      alert('❌ Erro ao excluir. Tente novamente.');
    }
  };

  const handleEditTopic = (topic: MeetingTopic) => {
    setEditingTopic(topic);
    setMeetingForm({ title: topic.title, observations: topic.observations });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Carregando assuntos...</p>
        </div>
      </div>
    );
  }

  const pendingCount = meetingTopics.filter(t => t.status === 'PENDING').length;
  const resolvedCount = meetingTopics.filter(t => t.status === 'RESOLVED').length;

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare size={24} className="text-blue-600" />
          <h1 className="text-xl font-bold text-slate-800">Assuntos para Reunião</h1>
        </div>
        <button onClick={loadTopics} className="p-2 rounded-lg bg-slate-100 active:bg-slate-200 transition-colors">
          <RefreshCw size={16} className="text-slate-600" />
        </button>
      </div>

      {/* Formulário de novo assunto */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare size={18} className="text-blue-600" />
          <h3 className="text-sm font-bold text-slate-800">
            {editingTopic ? 'Editar Assunto' : 'Novo Assunto para Reunião'}
          </h3>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Título *</label>
          <input
            type="text"
            value={meetingForm.title}
            onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
            placeholder="Ex: Discutir caso da família 023, Solicitar materiais..."
            className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
            disabled={isSavingTopic}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Observações</label>
          <textarea
            value={meetingForm.observations}
            onChange={(e) => setMeetingForm({ ...meetingForm, observations: e.target.value })}
            placeholder="Detalhes adicionais, contexto, informações relevantes..."
            rows={3}
            className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none"
            disabled={isSavingTopic}
          />
        </div>

        <div className="flex gap-2">
          {editingTopic && (
            <button
              onClick={() => { setEditingTopic(null); setMeetingForm({ title: '', observations: '' }); }}
              className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50"
              disabled={isSavingTopic}
            >
              Cancelar
            </button>
          )}
          <button
            onClick={handleSaveTopic}
            disabled={!meetingForm.title.trim() || isSavingTopic}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSavingTopic ? (
              <>
                <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                {editingTopic ? <Save size={14} /> : <Plus size={14} />}
                <span>{editingTopic ? 'Atualizar' : 'Adicionar'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Contadores */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-orange-800">Pendentes</span>
          <span className="text-lg font-bold text-orange-600">{pendingCount}</span>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-green-800">Resolvidos</span>
          <span className="text-lg font-bold text-green-600">{resolvedCount}</span>
        </div>
      </div>

      {/* Lista de assuntos */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
          <p className="text-sm font-bold text-slate-700">
            {meetingTopics.length} {meetingTopics.length === 1 ? 'assunto' : 'assuntos'}
          </p>
        </div>

        {meetingTopics.length === 0 ? (
          <div className="py-12 text-center">
            <MessageSquare size={32} className="mx-auto text-slate-200 mb-2" />
            <p className="text-sm text-slate-400">Nenhum assunto registrado</p>
            <p className="text-xs text-slate-300 mt-1">Adicione assuntos para discutir na reunião</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {meetingTopics.map(topic => (
              <div
                key={topic.id}
                className={`px-4 py-3 transition-colors ${
                  topic.status === 'RESOLVED' ? 'bg-green-50/50 opacity-70' : 'bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggleTopicStatus(topic)}
                    className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      topic.status === 'RESOLVED'
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-slate-300 hover:border-orange-400'
                    }`}
                    title={topic.status === 'RESOLVED' ? 'Marcar como pendente' : 'Marcar como resolvido'}
                  >
                    {topic.status === 'RESOLVED' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${
                      topic.status === 'RESOLVED' ? 'text-slate-500 line-through' : 'text-slate-800'
                    }`}>
                      {topic.title}
                    </p>
                    {topic.observations && (
                      <p className="text-xs text-slate-500 mt-1 whitespace-pre-line">{topic.observations}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        topic.status === 'RESOLVED'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {topic.status === 'RESOLVED' ? '✓ Resolvido' : '● Pendente'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(topic.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleEditTopic(topic)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteTopic(topic.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
