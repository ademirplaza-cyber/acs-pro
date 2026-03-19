import React, { useState } from 'react';
import {
  BookOpen,
  LayoutDashboard,
  Users,
  ClipboardList,
  PieChart,
  Bell,
  UserCircle,
  CreditCard,
  FileDown,
  WifiOff,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Home,
  CheckCircle2,
  AlertCircle,
  MessageSquare
} from 'lucide-react';

interface TutorialSection {
  id: string;
  icon: React.ReactNode;
  title: string;
  color: string;
  steps: {
    title: string;
    description: string;
  }[];
}

const tutorialSections: TutorialSection[] = [
  {
    id: 'primeiros-passos',
    icon: <Home size={22} />,
    title: 'Primeiros Passos',
    color: 'blue',
    steps: [
      {
        title: 'Criando sua conta',
        description: 'Acesse acstop.com.br e clique em "Criar Conta". Preencha seu nome, e-mail e senha. Após o cadastro, você terá 30 dias grátis para testar todas as funcionalidades do app.',
      },
      {
        title: 'Fazendo login',
        description: 'Na tela de login, digite seu e-mail e senha cadastrados. Se esquecer a senha, clique em "Esqueci minha senha" e um código de 6 dígitos será enviado para seu e-mail.',
      },
      {
        title: 'Aceitando os termos de uso',
        description: 'No primeiro acesso, será exibido o termo de uso do ACS Top. Role até o final do texto e clique em "Aceitar e Continuar" para começar a usar o sistema.',
      },
      {
        title: 'Navegando pelo app',
        description: 'No computador, use o menu lateral esquerdo. No celular, use a barra inferior com os ícones: Início, Visitas, Famílias, Relatórios e Mais (menu completo).',
      },
    ],
  },
  {
    id: 'dashboard',
    icon: <LayoutDashboard size={22} />,
    title: 'Dashboard (Início)',
    color: 'indigo',
    steps: [
      {
        title: 'Visão geral',
        description: 'O Dashboard é a tela principal do app. Ele mostra um resumo completo da sua área: total de famílias, pessoas cadastradas, visitas realizadas e pendentes.',
      },
      {
        title: 'Estatísticas de saúde',
        description: 'Veja rapidamente quantas gestantes, hipertensos, diabéticos, idosos, crianças, acamados e pessoas com deficiência estão na sua micro-área.',
      },
      {
        title: 'Notificações recentes',
        description: 'No canto superior direito (ícone do sino), você vê as notificações mais recentes. O número vermelho indica quantas não foram lidas.',
      },
    ],
  },
  {
    id: 'familias',
    icon: <Users size={22} />,
    title: 'Famílias & Pacientes',
    color: 'purple',
    steps: [
      {
        title: 'Cadastrar nova família',
        description: 'Clique em "Nova Família" e preencha: número da família, endereço completo (rua, número, bairro, cidade, CEP), tipo de moradia, saneamento básico, água encanada, energia elétrica e renda familiar.',
      },
      {
        title: 'Cadastrar membros da família',
        description: 'Dentro da família, clique em "Nova Pessoa". Preencha: nome, data de nascimento, sexo, CPF, CNS (Cartão SUS), telefone, ocupação e parentesco com o responsável.',
      },
      {
        title: 'Condições de saúde',
        description: 'Para cada pessoa, marque as condições: hipertensão, diabetes, usa insulina, gestante/puérpera, deficiência, acamado, dificuldade de locomoção, fumante, alcoólatra, usuário de drogas. Informe também doenças crônicas e medicamentos em uso.',
      },
      {
        title: 'Gestantes',
        description: 'Ao marcar "Gestante", informe a DUM (Data da Última Menstruação). O app calcula automaticamente a Idade Gestacional. Se for gestação de alto risco, marque a opção correspondente. Para puérperas (pós-parto), selecione a opção "Puérpera".',
      },
      {
        title: 'Bolsa Família / NIS',
        description: 'Marque se a pessoa recebe Bolsa Família e informe o número do NIS. Essa informação fica visível no card da pessoa e nos relatórios.',
      },
      {
        title: 'Editar e excluir',
        description: 'No computador, passe o mouse sobre o card da pessoa para ver os botões de editar (lápis azul) e excluir (lixeira vermelha). No celular, os botões ficam sempre visíveis.',
      },
      {
        title: 'Buscar famílias',
        description: 'Use a barra de busca no topo da lista de famílias. Você pode buscar por número da família, nome da rua, bairro ou qualquer dado do endereço.',
      },
    ],
  },
  {
    id: 'visitas',
    icon: <ClipboardList size={22} />,
    title: 'Visitas Domiciliares',
    color: 'green',
    steps: [
      {
        title: 'Agendar visita',
        description: 'Clique em "Nova Visita", selecione a família, defina a data e a prioridade (baixa, média, alta ou urgente). Adicione observações se necessário.',
      },
      {
        title: 'Registrar visita realizada',
        description: 'Ao concluir uma visita, clique nela e marque como "Concluída". Registre: pessoas atendidas, orientações dadas, problemas de saúde identificados, encaminhamentos necessários.',
      },
      {
        title: 'Aferição de pressão e glicemia',
        description: 'Durante a visita, você pode registrar a pressão arterial (sistólica/diastólica) e a glicemia de cada pessoa atendida. Esses dados ficam no histórico da visita.',
      },
      {
        title: 'Prioridades',
        description: 'As visitas são organizadas por prioridade: Urgente (vermelho), Alta (laranja), Média (amarelo) e Baixa (azul). Visitas atrasadas aparecem destacadas.',
      },
      {
        title: 'Localização GPS',
        description: 'O app pode registrar a localização GPS da visita automaticamente, comprovando que você esteve no endereço.',
      },
    ],
  },
  {
    id: 'relatorios',
    icon: <PieChart size={22} />,
    title: 'Relatórios e Grupos',
    color: 'amber',
    steps: [
      {
        title: 'Aba Visão Geral',
        description: 'Mostra estatísticas completas da sua micro-área: total de famílias, pessoas, gestantes, hipertensos, diabéticos, idosos, crianças e mais. Útil para reuniões de equipe.',
      },
      {
        title: 'Aba Busca',
        description: 'Busque pacientes por condição de saúde: gestantes, hipertensos, diabéticos, idosos, crianças, acamados, fumantes, etc. Filtre por nome ou múltiplas condições ao mesmo tempo.',
      },
      {
        title: 'Aba Famílias',
        description: 'Visualize famílias com três filtros: Todas, Por Rua (selecione uma rua específica) e Por Micro-área (selecione um bairro). Cada card mostra número da família, endereço, membros e badges de condições.',
      },
      {
        title: 'Exportar PDF',
        description: 'Em cada aba, clique em "Exportar PDF" para gerar um relatório completo em PDF. O arquivo é baixado automaticamente no seu dispositivo, pronto para imprimir ou enviar.',
      },
    ],
  },
  {
    id: 'pdf',
    icon: <FileDown size={22} />,
    title: 'Exportação de PDF',
    color: 'emerald',
    steps: [
      {
        title: 'PDF da ficha familiar',
        description: 'Dentro de uma família, clique em "Exportar PDF". O PDF inclui: dados da família, endereço, infraestrutura, resumo estatístico e ficha completa de cada membro com todas as condições de saúde.',
      },
      {
        title: 'PDF de relatórios',
        description: 'Na página de Relatórios, cada aba tem seu botão "Exportar PDF". O relatório inclui cabeçalho com seus dados, resumo geral e tabelas detalhadas.',
      },
      {
        title: 'Onde ficam os PDFs',
        description: 'Os PDFs são baixados automaticamente para a pasta de downloads do seu celular ou computador. O nome do arquivo inclui a data para fácil identificação.',
      },
    ],
  },
  {
    id: 'notificacoes',
    icon: <Bell size={22} />,
    title: 'Notificações',
    color: 'orange',
    steps: [
      {
        title: 'Tipos de notificação',
        description: 'O app gera alertas automáticos para: famílias sem visita há mais de 30 dias, gestantes sem acompanhamento há mais de 15 dias, hipertensos e diabéticos sem visita há mais de 30 dias.',
      },
      {
        title: 'Período de carência',
        description: 'Para evitar alertas falsos, o sistema só gera notificações após um período de carência: 30 dias para famílias e condições crônicas, 15 dias para gestantes.',
      },
      {
        title: 'Filtrar notificações',
        description: 'Na página de Notificações, use os filtros: Todas, Não Lidas, Urgentes, Visitas, Saúde e Sistema. Use a barra de busca para encontrar notificações específicas.',
      },
      {
        title: 'Ver detalhes',
        description: 'Clique em uma notificação para ir direto à família ou visita relacionada. O ícone de link ao lado da data indica que a notificação tem uma ação vinculada.',
      },
      {
        title: 'Notificações push',
        description: 'Em "Meu Perfil", ative as notificações push para receber alertas mesmo com o app fechado. Funciona no Chrome, Edge e Firefox.',
      },
    ],
  },
  {
    id: 'reuniao',
    icon: <MessageSquare size={22} />,
    title: 'Reunião',
    color: 'violet',
    steps: [
      {
        title: 'Registrar pautas',
        description: 'Use a página de Reunião para anotar assuntos que precisam ser discutidos com a equipe. Clique em "Nova Pauta" e preencha o título e as observações.',
      },
      {
        title: 'Gerenciar status',
        description: 'Cada pauta pode ter o status "Pendente" ou "Resolvido". Após discutir na reunião, marque como resolvido para manter o controle.',
      },
    ],
  },
  {
    id: 'perfil',
    icon: <UserCircle size={22} />,
    title: 'Meu Perfil',
    color: 'cyan',
    steps: [
      {
        title: 'Dados pessoais',
        description: 'Edite seu nome, telefone e CPF. Essas informações aparecem nos PDFs exportados.',
      },
      {
        title: 'Dados profissionais',
        description: 'Preencha: CNS (Cartão Nacional de Saúde), micro-área de atuação, equipe de saúde e nome da UBS (Unidade Básica de Saúde). Essas informações aparecem nos cabeçalhos dos relatórios.',
      },
      {
        title: 'Endereço',
        description: 'Informe seu endereço e cidade/estado para completar seu cadastro profissional.',
      },
      {
        title: 'Notificações push',
        description: 'Ative o toggle de "Notificações Push" para receber alertas no celular mesmo quando o app estiver fechado. Use o botão "Enviar notificação de teste" para verificar se está funcionando.',
      },
    ],
  },
  {
    id: 'assinatura',
    icon: <CreditCard size={22} />,
    title: 'Assinatura e Pagamento',
    color: 'rose',
    steps: [
      {
        title: 'Período gratuito',
        description: 'Ao criar sua conta, você recebe 30 dias grátis para usar todas as funcionalidades do app. Nenhum cartão é necessário durante o período de teste.',
      },
      {
        title: 'Planos disponíveis',
        description: 'Após os 30 dias, escolha entre: Plano Mensal (R$ 29,90/mês) ou Plano Anual (R$ 299,90/ano — economia de R$ 59,00). O pagamento é feito com cartão de crédito via Stripe (ambiente seguro).',
      },
      {
        title: 'Renovação automática',
        description: 'A assinatura é renovada automaticamente. Você receberá um aviso quando faltar 7 dias para o vencimento. Se o pagamento falhar, o acesso é bloqueado até a regularização.',
      },
      {
        title: 'Dias restantes',
        description: 'No menu lateral, abaixo do logo, você vê quantos dias restam na sua assinatura. O indicador muda de cor: verde (mais de 7 dias), laranja (7 dias ou menos), vermelho (expirado).',
      },
    ],
  },
  {
    id: 'offline',
    icon: <WifiOff size={22} />,
    title: 'Modo Offline',
    color: 'slate',
    steps: [
      {
        title: 'Funcionamento sem internet',
        description: 'O ACS Top é um PWA (Progressive Web App) e funciona mesmo sem conexão com a internet. As páginas carregadas anteriormente ficam disponíveis offline.',
      },
      {
        title: 'Sincronização',
        description: 'Quando você recuperar a conexão, os dados são sincronizados automaticamente com a nuvem. Um banner cinza aparece na parte superior quando você está offline.',
      },
      {
        title: 'Instalar no celular',
        description: 'Para instalar o app no celular: abra acstop.com.br no Chrome, toque nos 3 pontinhos (menu) e selecione "Adicionar à tela inicial" ou "Instalar aplicativo". O app ficará como um ícone na sua tela.',
      },
    ],
  },
  {
    id: 'dicas',
    icon: <CheckCircle2 size={22} />,
    title: 'Dicas Importantes',
    color: 'teal',
    steps: [
      {
        title: 'Cadastre o responsável primeiro',
        description: 'Ao adicionar membros, cadastre primeiro o responsável pela família e marque a opção "Responsável pela família". Os demais membros devem ter o parentesco preenchido.',
      },
      {
        title: 'Mantenha os dados atualizados',
        description: 'Sempre que visitar uma família, verifique se os dados cadastrais estão corretos: novo membro, mudança de endereço, nova condição de saúde, etc.',
      },
      {
        title: 'Use os relatórios nas reuniões',
        description: 'Exporte os PDFs de relatórios antes das reuniões de equipe. Os dados consolidados facilitam a apresentação e discussão dos indicadores da micro-área.',
      },
      {
        title: 'Registre as visitas no mesmo dia',
        description: 'Para manter os dados precisos, registre a visita no app assim que concluí-la. Isso evita esquecimentos e mantém os indicadores atualizados.',
      },
      {
        title: 'Atenção às notificações urgentes',
        description: 'Notificações vermelhas (urgentes) indicam famílias ou pacientes que precisam de atenção imediata. Priorize essas visitas na sua rotina.',
      },
    ],
  },
];

const colorMap: Record<string, { bg: string; text: string; border: string; light: string }> = {
  blue: { bg: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-200', light: 'bg-blue-50' },
  indigo: { bg: 'bg-indigo-600', text: 'text-indigo-600', border: 'border-indigo-200', light: 'bg-indigo-50' },
  purple: { bg: 'bg-purple-600', text: 'text-purple-600', border: 'border-purple-200', light: 'bg-purple-50' },
  green: { bg: 'bg-green-600', text: 'text-green-600', border: 'border-green-200', light: 'bg-green-50' },
  amber: { bg: 'bg-amber-600', text: 'text-amber-600', border: 'border-amber-200', light: 'bg-amber-50' },
  emerald: { bg: 'bg-emerald-600', text: 'text-emerald-600', border: 'border-emerald-200', light: 'bg-emerald-50' },
  orange: { bg: 'bg-orange-600', text: 'text-orange-600', border: 'border-orange-200', light: 'bg-orange-50' },
  violet: { bg: 'bg-violet-600', text: 'text-violet-600', border: 'border-violet-200', light: 'bg-violet-50' },
  cyan: { bg: 'bg-cyan-600', text: 'text-cyan-600', border: 'border-cyan-200', light: 'bg-cyan-50' },
  rose: { bg: 'bg-rose-600', text: 'text-rose-600', border: 'border-rose-200', light: 'bg-rose-50' },
  slate: { bg: 'bg-slate-600', text: 'text-slate-600', border: 'border-slate-200', light: 'bg-slate-50' },
  teal: { bg: 'bg-teal-600', text: 'text-teal-600', border: 'border-teal-200', light: 'bg-teal-50' },
};

export const Tutorial = () => {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['primeiros-passos']));

  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setOpenSections(new Set(tutorialSections.map((s) => s.id)));
  };

  const collapseAll = () => {
    setOpenSections(new Set());
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
            <BookOpen size={28} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Tutorial do ACS Top</h1>
            <p className="text-slate-500 text-sm">Guia completo de utilização do sistema</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Expandir tudo
          </button>
          <button
            onClick={collapseAll}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Recolher tudo
          </button>
        </div>
      </div>

      {/* Índice rápido */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="font-bold text-slate-700 mb-3 flex items-center">
          <HelpCircle size={18} className="mr-2 text-blue-600" />
          Índice Rápido
        </h2>
        <div className="flex flex-wrap gap-2">
          {tutorialSections.map((section) => {
            const colors = colorMap[section.color];
            return (
              <button
                key={section.id}
                onClick={() => {
                  if (!openSections.has(section.id)) toggleSection(section.id);
                  document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${colors.border} ${colors.text} ${colors.light} hover:opacity-80`}
              >
                {section.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Seções */}
      {tutorialSections.map((section) => {
        const colors = colorMap[section.color];
        const isOpen = openSections.has(section.id);

        return (
          <div
            key={section.id}
            id={section.id}
            className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${isOpen ? colors.border : 'border-slate-200'}`}
          >
            <button
              onClick={() => toggleSection(section.id)}
              className={`w-full flex items-center justify-between p-5 text-left transition-colors ${isOpen ? colors.light : 'hover:bg-slate-50'}`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-xl ${colors.bg} text-white flex items-center justify-center shadow-md`}>
                  {section.icon}
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 text-lg">{section.title}</h2>
                  <p className="text-xs text-slate-500">{section.steps.length} {section.steps.length === 1 ? 'passo' : 'passos'}</p>
                </div>
              </div>
              {isOpen ? (
                <ChevronUp size={20} className="text-slate-400 flex-shrink-0" />
              ) : (
                <ChevronDown size={20} className="text-slate-400 flex-shrink-0" />
              )}
            </button>

            {isOpen && (
              <div className="px-5 pb-5 space-y-3">
                {section.steps.map((step, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className={`w-7 h-7 rounded-lg ${colors.bg} text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5`}>
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 text-sm">{step.title}</h3>
                      <p className="text-slate-600 text-sm mt-1 leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Footer */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-2xl text-white text-center shadow-lg">
        <AlertCircle size={28} className="mx-auto mb-3 opacity-80" />
        <h3 className="font-bold text-lg mb-2">Ainda tem dúvidas?</h3>
        <p className="text-blue-100 text-sm max-w-lg mx-auto">
          Entre em contato com o suporte pelo e-mail <strong>suporte@acstop.com.br</strong> ou pelo WhatsApp disponível na página inicial do site.
        </p>
      </div>
    </div>
  );
};

export default Tutorial;
