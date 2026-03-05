import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Users,
  ClipboardList,
  Heart,
  Cloud,
  Shield,
  Smartphone,
  BarChart3,
  MapPin,
  Bell,
  Check,
  ArrowRight,
  Star,
  Zap,
  Lock,
  ChevronDown,
  ChevronUp,
  MessageCircle,
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const whatsappNumber = '5511986373147';

  const whatsappLink = (plano: string) =>
    `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
      `Olá! Tenho interesse no plano ${plano} do ACS Pro. Pode me dar mais informações?`
    )}`;

  const features = [
    {
      icon: Users,
      title: 'Gestão de Famílias',
      desc: 'Cadastre e acompanhe todas as famílias da sua microárea com dados completos de moradia, saneamento e renda.',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: ClipboardList,
      title: 'Visitas Domiciliares',
      desc: 'Agende, registre e finalize visitas com localização GPS ou manual. Controle total da sua rotina.',
      color: 'from-green-500 to-green-600',
    },
    {
      icon: Heart,
      title: 'Monitoramento de Saúde',
      desc: 'Acompanhe gestantes, hipertensos, diabéticos, crianças e idosos com alertas automáticos.',
      color: 'from-red-500 to-rose-600',
    },
    {
      icon: BarChart3,
      title: 'Relatórios e Indicadores',
      desc: 'Relatórios completos do e-SUS com indicadores de cobertura, produtividade e grupos prioritários.',
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: Bell,
      title: 'Notificações Inteligentes',
      desc: 'Alertas automáticos de visitas atrasadas, gestantes sem acompanhamento e assinaturas expirando.',
      color: 'from-orange-500 to-orange-600',
    },
    {
      icon: Cloud,
      title: 'Dados na Nuvem',
      desc: 'Seus dados seguros e acessíveis de qualquer dispositivo. Sincronização automática em tempo real.',
      color: 'from-cyan-500 to-cyan-600',
    },
    {
      icon: Smartphone,
      title: 'Funciona no Celular',
      desc: 'Instale como app no celular. Funciona como aplicativo nativo, sem precisar da Play Store.',
      color: 'from-indigo-500 to-indigo-600',
    },
    {
      icon: MapPin,
      title: 'Localização GPS',
      desc: 'Registre a localização das visitas automaticamente ou digite o endereço manualmente.',
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      icon: Shield,
      title: 'Segurança Total',
      desc: 'Dados criptografados, controle de acesso por perfil, recuperação de senha e backup automático.',
      color: 'from-slate-500 to-slate-600',
    },
  ];

  const faqs = [
    {
      q: 'Preciso instalar algum programa?',
      a: 'Não! O ACS Pro funciona direto no navegador do celular ou computador. Você também pode instalar como app no celular sem precisar da Play Store.',
    },
    {
      q: 'Meus dados ficam salvos onde?',
      a: 'Todos os dados ficam armazenados com segurança na nuvem (Supabase), com criptografia e backup automático. Você acessa de qualquer dispositivo.',
    },
    {
      q: 'Funciona sem internet?',
      a: 'O sistema tem modo offline com período de graça de 2 dias. Você pode continuar trabalhando e os dados sincronizam quando voltar a conexão.',
    },
    {
      q: 'Posso cancelar a qualquer momento?',
      a: 'Sim! Não existe fidelidade. Você pode cancelar quando quiser, sem taxas ou multas.',
    },
    {
      q: 'Como faço para começar?',
      a: 'Clique em "Teste Grátis", crie sua conta e comece a usar imediatamente. São 7 dias gratuitos para você conhecer todas as funcionalidades.',
    },
    {
      q: 'O sistema gera relatórios do e-SUS?',
      a: 'Sim! O ACS Pro gera relatórios completos com indicadores de cobertura, produtividade, grupos prioritários (gestantes, hipertensos, diabéticos, crianças e idosos).',
    },
  ];

  return (
    <div className="min-h-screen bg-white">

      {/* ============================================ */}
      {/* NAVBAR */}
      {/* ============================================ */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-b border-gray-100 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 rounded-xl p-1.5">
              <Activity size={22} className="text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-gray-900">ACS Pro</span>
              <span className="hidden sm:inline text-xs text-gray-400 ml-2">Saúde Integrada</span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Entrar
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-sm hover:shadow-md hover:from-blue-700 hover:to-blue-800 transition-all active:scale-[0.98]"
            >
              Teste Grátis
            </button>
          </div>
        </div>
      </nav>

      {/* ============================================ */}
      {/* HERO */}
      {/* ============================================ */}
      <section className="relative pt-24 sm:pt-32 pb-16 sm:pb-24 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/5"
              style={{
                width: `${100 + i * 60}px`,
                height: `${100 + i * 60}px`,
                left: `${10 + i * 10}%`,
                top: `${5 + i * 10}%`,
                animation: `float ${10 + i * 2}s ease-in-out infinite`,
                animationDelay: `${i}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-blue-200 text-sm font-medium mb-6">
              <Zap size={16} className="text-yellow-300" />
              Novo: Notificações inteligentes e modo offline
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
              A ferramenta completa para o{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300">
                Agente Comunitário de Saúde
              </span>
            </h1>

            <p className="text-base sm:text-lg text-blue-200/70 mb-10 max-w-2xl mx-auto leading-relaxed">
              Gerencie famílias, agende visitas, monitore grupos de risco e gere relatórios do e-SUS — 
              tudo em um só lugar, direto do seu celular ou computador.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/login')}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-700 font-bold rounded-xl shadow-xl hover:shadow-2xl hover:bg-gray-50 active:scale-[0.98] transition-all text-base"
              >
                Começar Grátis — 7 dias
                <ArrowRight size={20} />
              </button>
              <a
                href={whatsappLink('ACS Pro')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-8 py-4 bg-green-500 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl hover:bg-green-600 active:scale-[0.98] transition-all text-base"
              >
                <MessageCircle size={20} />
                Falar no WhatsApp
              </a>
            </div>

            {/* Social proof */}
            <div className="mt-10 flex items-center justify-center gap-6 text-blue-200/50 text-sm">
              <div className="flex items-center gap-1">
                <Check size={16} className="text-green-400" />
                <span>Sem cartão de crédito</span>
              </div>
              <div className="flex items-center gap-1">
                <Check size={16} className="text-green-400" />
                <span>Cancele quando quiser</span>
              </div>
              <div className="hidden sm:flex items-center gap-1">
                <Check size={16} className="text-green-400" />
                <span>Suporte via WhatsApp</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FUNCIONALIDADES */}
      {/* ============================================ */}
      <section className="py-16 sm:py-24 bg-gray-50" id="funcionalidades">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-4">
              Tudo que o ACS precisa, em um só app
            </h2>
            <p className="text-gray-500 text-base sm:text-lg max-w-2xl mx-auto">
              Desenvolvido especialmente para a rotina do Agente Comunitário de Saúde, 
              com foco em praticidade e agilidade.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 group"
              >
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.color} shadow-lg mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon size={24} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* PLANOS */}
      {/* ============================================ */}
      <section className="py-16 sm:py-24 bg-white" id="planos">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-4">
              Planos simples e acessíveis
            </h2>
            <p className="text-gray-500 text-base sm:text-lg max-w-xl mx-auto">
              Comece grátis e escolha o plano ideal para sua necessidade.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            
            {/* Plano Gratuito */}
            <div className="bg-white rounded-3xl border-2 border-gray-200 p-8 relative hover:border-gray-300 hover:shadow-lg transition-all">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900">Teste Gratuito</h3>
                <p className="text-gray-400 text-sm mt-1">Conheça o sistema sem compromisso</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-extrabold text-gray-900">R$ 0</span>
                <span className="text-gray-400 text-sm ml-1">por 7 dias</span>
              </div>

              <ul className="space-y-3 mb-8">
                {[
                  'Todas as funcionalidades',
                  '1 agente de saúde',
                  'Famílias ilimitadas',
                  'Visitas e relatórios',
                  'Dados na nuvem',
                  'Suporte via WhatsApp',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check size={18} className="text-green-500 shrink-0 mt-0.5" />
                    <span className="text-gray-600 text-sm">{item}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => navigate('/login')}
                className="w-full py-3.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all active:scale-[0.98]"
              >
                Começar Grátis
              </button>
            </div>

            {/* Plano Básico */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 relative shadow-xl shadow-blue-200 hover:shadow-2xl transition-all">
              {/* Badge popular */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <div className="flex items-center gap-1 px-4 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full shadow-lg">
                  <Star size={12} fill="currentColor" />
                  MAIS POPULAR
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-bold text-white">Básico</h3>
                <p className="text-blue-200/70 text-sm mt-1">Para o agente de saúde profissional</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-extrabold text-white">R$ 29,90</span>
                <span className="text-blue-200/70 text-sm ml-1">/mês</span>
              </div>

              <ul className="space-y-3 mb-8">
                {[
                  'Todas as funcionalidades',
                  '1 agente de saúde',
                  'Famílias ilimitadas',
                  'Visitas e relatórios completos',
                  'Notificações inteligentes',
                  'Dados na nuvem com backup',
                  'Modo offline (2 dias)',
                  'Suporte prioritário WhatsApp',
                  'Atualizações gratuitas',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check size={18} className="text-green-300 shrink-0 mt-0.5" />
                    <span className="text-blue-100 text-sm">{item}</span>
                  </li>
                ))}
              </ul>

              <a
                href={whatsappLink('Básico - R$ 29,90/mês')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 bg-white text-blue-700 font-bold rounded-xl shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <MessageCircle size={18} />
                Assinar pelo WhatsApp
              </a>

              <p className="text-blue-200/40 text-[11px] text-center mt-3">
                Cancele quando quiser • Sem fidelidade
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* COMO FUNCIONA */}
      {/* ============================================ */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-4">
              Comece a usar em 3 passos
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Crie sua conta',
                desc: 'Registre-se com nome, email e senha. Leva menos de 1 minuto.',
                icon: Lock,
              },
              {
                step: '2',
                title: 'Configure sua área',
                desc: 'Cadastre as famílias da sua microárea e os membros de cada família.',
                icon: Users,
              },
              {
                step: '3',
                title: 'Comece a trabalhar',
                desc: 'Agende visitas, registre atendimentos e acompanhe seus indicadores.',
                icon: ClipboardList,
              },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200 mb-4">
                  <item.icon size={24} />
                </div>
                <div className="bg-blue-100 text-blue-700 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center mx-auto -mt-2 mb-3 relative z-10 border-2 border-white">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FAQ */}
      {/* ============================================ */}
      <section className="py-16 sm:py-24 bg-white" id="faq">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-4">
              Perguntas Frequentes
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className="text-sm sm:text-base font-semibold text-gray-900 pr-4">{faq.q}</span>
                  {openFaq === i ? (
                    <ChevronUp size={20} className="text-gray-400 shrink-0" />
                  ) : (
                    <ChevronDown size={20} className="text-gray-400 shrink-0" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-gray-500 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* CTA FINAL */}
      {/* ============================================ */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-blue-600 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/5"
              style={{
                width: `${100 + i * 50}px`,
                height: `${100 + i * 50}px`,
                right: `${i * 15}%`,
                top: `${i * 20}%`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4">
            Pronto para modernizar seu trabalho?
          </h2>
          <p className="text-blue-100/70 text-base sm:text-lg mb-8 max-w-xl mx-auto">
            Junte-se aos agentes de saúde que já estão usando o ACS Pro para otimizar sua rotina e melhorar o atendimento.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/login')}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-700 font-bold rounded-xl shadow-xl hover:shadow-2xl hover:bg-gray-50 active:scale-[0.98] transition-all text-base"
            >
              Começar Grátis — 7 dias
              <ArrowRight size={20} />
            </button>
            <a
              href={whatsappLink('ACS Pro')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-8 py-4 bg-green-500 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl hover:bg-green-600 active:scale-[0.98] transition-all text-base"
            >
              <MessageCircle size={20} />
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FOOTER */}
      {/* ============================================ */}
      <footer className="py-8 bg-slate-900 text-center">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Activity size={20} className="text-blue-400" />
            <span className="text-white font-bold">ACS Pro</span>
            <span className="text-slate-500 text-sm">— Saúde Integrada</span>
          </div>
          <p className="text-slate-500 text-xs mb-2">
            Sistema de Gestão para Agentes Comunitários de Saúde
          </p>
          <p className="text-slate-600 text-xs">
            &copy; {new Date().getFullYear()} ACS Pro — Todos os direitos reservados
          </p>
          <div className="mt-4 flex items-center justify-center gap-4">
            <a
              href={whatsappLink('Suporte')}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-green-400 text-xs flex items-center gap-1 transition-colors"
            >
              <MessageCircle size={14} />
              Suporte WhatsApp
            </a>
          </div>
        </div>
      </footer>

      {/* Animação */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
