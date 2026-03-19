import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
  minDuration?: number;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish, minDuration = 2800 }) => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'logo' | 'text' | 'loading' | 'done'>('logo');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('text'), 400);
    const t2 = setTimeout(() => setPhase('loading'), 800);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        const increment = prev < 30 ? 8 : prev < 60 ? 5 : prev < 85 ? 3 : 2;
        return Math.min(prev + increment, 100);
      });
    }, 50);

    const t3 = setTimeout(() => {
      setProgress(100);
      setPhase('done');
    }, minDuration - 400);

    const t4 = setTimeout(() => {
      onFinish();
    }, minDuration);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearInterval(progressInterval);
    };
  }, [onFinish, minDuration]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 overflow-hidden">
      
      {/* Partículas de fundo animadas */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/5"
            style={{
              width: `${Math.random() * 100 + 20}px`,
              height: `${Math.random() * 100 + 20}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${Math.random() * 10 + 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Círculos decorativos */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="w-[500px] h-[500px] rounded-full border border-white/5 absolute -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        <div className="w-[350px] h-[350px] rounded-full border border-white/10 absolute -translate-x-1/2 -translate-y-1/2" 
             style={{ animation: 'spin 20s linear infinite' }} />
        <div className="w-[200px] h-[200px] rounded-full border border-white/5 absolute -translate-x-1/2 -translate-y-1/2"
             style={{ animation: 'spin 15s linear infinite reverse' }} />
      </div>

      {/* Conteúdo central */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        
        {/* Logo / Ícone */}
        <div className={`transition-all duration-700 ease-out ${
          phase === 'logo' ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
        }`}>
          <div className="relative">
            {/* Glow */}
            <div className="absolute inset-0 blur-2xl bg-white/20 rounded-full scale-150" />
            
            {/* Ícone principal — Logo ACS Top */}
            <div className="relative bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20 shadow-2xl">
              <Activity size={64} className="text-white" strokeWidth={2.5} />
            </div>

            {/* Pulso animado */}
            <div className={`absolute inset-0 rounded-3xl border-2 border-white/30 ${
              phase !== 'done' ? 'animate-ping' : ''
            }`} style={{ animationDuration: '2s' }} />
          </div>
        </div>

        {/* Título */}
        <div className={`mt-8 transition-all duration-700 ease-out ${
          ['text', 'loading', 'done'].includes(phase) 
            ? 'translate-y-0 opacity-100' 
            : 'translate-y-8 opacity-0'
        }`}>
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
            ACS <span className="text-blue-200">Top</span>
          </h1>
          <p className="text-blue-200/80 text-sm sm:text-base mt-2 font-medium tracking-wide">
            Saúde da Família
          </p>
        </div>

        {/* Subtítulo */}
        <div className={`mt-4 transition-all duration-700 delay-200 ease-out ${
          ['loading', 'done'].includes(phase) 
            ? 'translate-y-0 opacity-100' 
            : 'translate-y-8 opacity-0'
        }`}>
          <p className="text-blue-100/60 text-xs sm:text-sm max-w-xs">
            Sistema de Acompanhamento de Agentes Comunitários de Saúde
          </p>
        </div>

        {/* Barra de progresso */}
        <div className={`mt-10 w-64 sm:w-80 transition-all duration-500 ease-out ${
          ['loading', 'done'].includes(phase) 
            ? 'translate-y-0 opacity-100' 
            : 'translate-y-4 opacity-0'
        }`}>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
            <div
              className="h-full rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.4) 100%)',
                boxShadow: '0 0 20px rgba(255,255,255,0.3)',
              }}
            />
          </div>

          <div className="flex items-center justify-between mt-3">
            <p className="text-blue-200/50 text-[11px] font-medium">
              {progress < 30
                ? 'Inicializando...'
                : progress < 60
                ? 'Conectando ao servidor...'
                : progress < 85
                ? 'Carregando dados...'
                : progress < 100
                ? 'Quase pronto...'
                : 'Pronto!'}
            </p>
            <p className="text-blue-200/40 text-[11px] tabular-nums">{progress}%</p>
          </div>
        </div>

        {/* Versão */}
        <div className={`mt-12 transition-all duration-500 delay-300 ${
          ['loading', 'done'].includes(phase) ? 'opacity-100' : 'opacity-0'
        }`}>
          <p className="text-blue-300/30 text-[10px] font-medium tracking-widest uppercase">
            Versão 2.0 • Powered by Supabase
          </p>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-20px) rotate(5deg); }
          50% { transform: translateY(-10px) rotate(-3deg); }
          75% { transform: translateY(-25px) rotate(3deg); }
        }
        @keyframes spin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
