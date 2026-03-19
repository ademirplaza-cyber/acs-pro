import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { api } from '../services/api';
import Layout from './Layout';
import { FileText, X, CheckCircle2, Shield } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

// ============================================
// MODAL DE TERMOS OBRIGATÓRIOS
// ============================================
const MandatoryTermsModal: React.FC<{
  onAccept: () => void;
  isLoading: boolean;
}> = ({ onAccept, isLoading }) => {
  const [scrolledToEnd, setScrolledToEnd] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 30) {
      setScrolledToEnd(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
          <div className="bg-blue-100 rounded-xl p-2.5">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">Termos e Condições de Uso</h2>
            <p className="text-sm text-gray-500">Leitura obrigatória para continuar</p>
          </div>
        </div>

        {/* Conteúdo dos Termos */}
        <div
          className="flex-1 overflow-y-auto p-6 text-sm text-gray-700 space-y-4"
          onScroll={handleScroll}
        >
          <p className="font-semibold text-gray-900">ACS Top — Termos e Condições de Uso</p>
          <p className="text-xs text-gray-500">Última atualização: Março de 2026</p>

          <p>Ao utilizar o sistema ACS Top ("Aplicativo"), você ("Usuário" ou "Agente Comunitário de Saúde") concorda com os seguintes termos e condições:</p>

          <p className="font-semibold text-gray-900 mt-4">1. Aceitação dos Termos</p>
          <p>Ao criar uma conta e utilizar o Aplicativo, o Usuário declara ter lido, compreendido e aceito integralmente estes Termos e Condições. Caso não concorde com qualquer disposição, não utilize o sistema.</p>

          <p className="font-semibold text-gray-900 mt-4">2. Descrição do Serviço</p>
          <p>O ACS Top é uma plataforma de gestão para Agentes Comunitários de Saúde que permite o cadastro de famílias, membros, agendamento e registro de visitas domiciliares, monitoramento de indicadores de saúde e geração de relatórios.</p>

          <p className="font-semibold text-gray-900 mt-4">3. Proteção de Dados e LGPD</p>
          <p>O Usuário reconhece que os dados inseridos no sistema incluem informações sensíveis de saúde protegidas pela Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD). O Usuário se compromete a:</p>
          <p>a) Utilizar os dados exclusivamente para fins profissionais relacionados à sua função de Agente Comunitário de Saúde;</p>
          <p>b) Não compartilhar, copiar, distribuir ou divulgar dados de pacientes a terceiros não autorizados;</p>
          <p>c) Manter sigilo absoluto sobre todas as informações de saúde acessadas através do sistema;</p>
          <p>d) Não utilizar os dados para fins comerciais, publicitários ou qualquer finalidade diversa da assistência à saúde;</p>
          <p>e) Comunicar imediatamente qualquer incidente de segurança ou acesso não autorizado.</p>

          <p className="font-semibold text-gray-900 mt-4">4. Responsabilidades do Usuário</p>
          <p>O Usuário é inteiramente responsável por: manter a confidencialidade de suas credenciais de acesso (email e senha); todas as atividades realizadas em sua conta; a veracidade e precisão dos dados inseridos no sistema; utilizar o sistema em conformidade com a legislação vigente e normas do SUS; não permitir que terceiros utilizem sua conta.</p>

          <p className="font-semibold text-gray-900 mt-4">5. Responsabilidade sobre Dados dos Pacientes</p>
          <p><strong>O Agente Comunitário de Saúde é o único responsável pelos dados de seus pacientes cadastrados no sistema.</strong> O ACS Top fornece a ferramenta tecnológica, mas não se responsabiliza pelo conteúdo inserido, pela veracidade das informações ou pelo uso indevido dos dados por parte do Usuário. Qualquer violação de sigilo ou uso inadequado das informações de saúde é de responsabilidade exclusiva do Agente.</p>

          <p className="font-semibold text-gray-900 mt-4">6. Segurança e Isolamento de Dados</p>
          <p>Cada Agente possui acesso exclusivo aos seus próprios dados. Nenhum agente pode visualizar, editar ou excluir dados de outro agente. O administrador do sistema tem acesso apenas às informações de gestão dos agentes, sem acesso aos dados dos pacientes.</p>

          <p className="font-semibold text-gray-900 mt-4">7. Assinatura e Pagamento</p>
          <p>O Aplicativo oferece um período de avaliação gratuita de 30 dias. Após esse período, o Usuário deverá contratar um plano de assinatura (mensal ou anual) para continuar utilizando o serviço. O não pagamento resultará na suspensão do acesso, sem perda dos dados armazenados, pelo período de até 90 dias.</p>

          <p className="font-semibold text-gray-900 mt-4">8. Disponibilidade e Suporte</p>
          <p>O ACS Top se compromete a manter o sistema disponível, porém não garante operação ininterrupta. Manutenções programadas serão comunicadas com antecedência. O suporte técnico está disponível via WhatsApp.</p>

          <p className="font-semibold text-gray-900 mt-4">9. Propriedade Intelectual</p>
          <p>Todo o conteúdo, design, código-fonte e funcionalidades do ACS Top são de propriedade exclusiva dos desenvolvedores. É proibida a reprodução, cópia ou engenharia reversa do sistema.</p>

          <p className="font-semibold text-gray-900 mt-4">10. Rescisão</p>
          <p>O Usuário pode encerrar sua conta a qualquer momento. O ACS Top se reserva o direito de suspender ou encerrar contas que violem estes termos, sem aviso prévio.</p>

          <p className="font-semibold text-gray-900 mt-4">11. Alterações nos Termos</p>
          <p>Estes termos podem ser atualizados periodicamente. O uso continuado do sistema após alterações constitui aceitação dos novos termos.</p>

          <p className="font-semibold text-gray-900 mt-4">12. Foro</p>
          <p>Fica eleito o foro da comarca do domicílio do desenvolvedor para dirimir quaisquer questões oriundas destes Termos.</p>

          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-amber-800 text-xs font-semibold">
              ⚠️ Ao clicar em "Aceitar e Continuar", você declara que leu, compreendeu e concorda com todos os termos acima, incluindo a sua responsabilidade exclusiva sobre os dados dos pacientes cadastrados.
            </p>
          </div>

          <p className="mt-4 text-xs text-gray-400 text-center">ACS Top — Saúde Integrada © {new Date().getFullYear()}</p>
        </div>

        {/* Footer com botão */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          {!scrolledToEnd && (
            <p className="text-xs text-center text-gray-400 mb-3">
              ↓ Role até o final para habilitar o botão de aceitar
            </p>
          )}
          <button
            onClick={onAccept}
            disabled={!scrolledToEnd || isLoading}
            className={`w-full py-3.5 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 ${
              scrolledToEnd && !isLoading
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-200 active:scale-[0.98]'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Aceitar e Continuar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// PROTECTED ROUTE
// ============================================
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth();
  const location = useLocation();
  const [acceptingTerms, setAcceptingTerms] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // ---- VERIFICAÇÃO DE TERMOS ----
  const needsTermsAcceptance = !user.acceptedTermsAt;

  const handleAcceptTerms = async () => {
    setAcceptingTerms(true);
    try {
      const now = new Date().toISOString();
      await api.saveUser({ ...user, acceptedTermsAt: now });
      await refreshUser();
    } catch (error) {
      console.error('Erro ao aceitar termos:', error);
    } finally {
      setAcceptingTerms(false);
    }
  };

  if (needsTermsAcceptance) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 flex items-center justify-center">
        <MandatoryTermsModal onAccept={handleAcceptTerms} isLoading={acceptingTerms} />
      </div>
    );
  }

  // ---- VERIFICAÇÃO DE ASSINATURA ----
  if (user.role !== UserRole.ADMIN && location.pathname !== '/subscription') {
    const createdAt = new Date(user.createdAt || Date.now());
    const expiresAt = user.subscriptionExpiresAt
      ? new Date(user.subscriptionExpiresAt)
      : new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);

    const now = new Date();
    if (now > expiresAt) {
      return <Navigate to="/subscription" replace />;
    }
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Layout>
      {children}
    </Layout>
  );
};
