import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Home, ArrowLeft, Search, MapPin } from 'lucide-react';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Partículas de fundo */}
      <div className="absolute inset-0">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/5"
            style={{
              width: `${Math.random() * 120 + 40}px`,
              height: `${Math.random() * 120 + 40}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${Math.random() * 10 + 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center max-w-lg mx-auto">
        
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 border border-white/20">
            <Activity size={24} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white">ACS Pro</span>
        </div>

        {/* Número 404 animado */}
        <div className="relative mb-8">
          <h1 className="text-[120px] sm:text-[160px] font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white/20 to-white/5 leading-none select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-2xl">
              <MapPin size={40} className="text-blue-300" />
            </div>
          </div>
        </div>

        {/* Mensagem */}
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
          Página não encontrada
        </h2>
        <p className="text-blue-200/60 text-sm sm:text-base mb-8 max-w-sm mx-auto leading-relaxed">
          Parece que o agente de saúde se perdeu no caminho! 
          A página que você procura não existe ou foi movida.
        </p>

        {/* Botões */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-xl hover:from-blue-700 hover:to-blue-800 active:scale-[0.98] transition-all"
          >
            <Home size={20} />
            Ir para o Dashboard
          </button>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white/10 backdrop-blur-sm text-white font-medium rounded-xl border border-white/20 hover:bg-white/20 active:scale-[0.98] transition-all"
          >
            <ArrowLeft size={20} />
            Voltar
          </button>
        </div>

        {/* Dica */}
        <div className="mt-10 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 max-w-sm mx-auto">
          <div className="flex items-start gap-3">
            <Search size={18} className="text-blue-300 shrink-0 mt-0.5" />
            <div className="text-left">
              <p className="text-white/70 text-xs font-medium mb-1">Dica:</p>
              <p className="text-white/40 text-xs leading-relaxed">
                Use o menu lateral para navegar entre Dashboard, Visitas, Famílias e Relatórios.
              </p>
            </div>
          </div>
        </div>

        {/* Versão */}
        <p className="mt-10 text-blue-300/20 text-[10px] font-medium tracking-widest uppercase">
          ACS Pro v2.0
        </p>
      </div>

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

export default NotFound;
