import React from 'react';
import { CreditCard } from 'lucide-react';

interface SubscriptionExpiredProps {
  expirationDate: Date;
  onRefresh: () => void;
  isOffline: boolean;
}

export const SubscriptionExpired: React.FC<SubscriptionExpiredProps> = ({ 
  expirationDate, 
  onRefresh, 
  isOffline 
}) => {
  const daysExpired = Math.floor((Date.now() - expirationDate.getTime()) / (1000 * 60 * 60 * 24));
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {isOffline && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6">
            <p className="text-yellow-800 text-sm">
              📶 Você está offline. Se já pagou, conecte-se à internet e clique em "Atualizar"
            </p>
          </div>
        )}

        <div className="text-center mb-8">
          <div className="bg-gradient-to-br from-red-100 to-orange-100 p-8 rounded-full inline-block mb-6 shadow-lg">
            <CreditCard size={64} className="text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-3">Assinatura Expirada</h1>
          <p className="text-slate-600 text-lg">
            Seu acesso expirou há <span className="font-bold text-red-600">{daysExpired} dias</span>
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Data de vencimento: {expirationDate.toLocaleDateString('pt-BR', { 
              day: '2-digit', 
              month: 'long', 
              year: 'numeric' 
            })}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-800">Plano Mensal</h3>
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                Flexível
              </span>
            </div>
            <div className="mb-4">
              <span className="text-4xl font-bold text-slate-800">R$ 19,90</span>
              <span className="text-slate-500">/mês</span>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start text-slate-600">
                <span className="text-green-500 mr-2">✓</span>
                <span>Até 200 famílias cadastradas</span>
              </li>
              <li className="flex items-start text-slate-600">
                <span className="text-green-500 mr-2">✓</span>
                <span>Visitas ilimitadas</span>
              </li>
              <li className="flex items-start text-slate-600">
                <span className="text-green-500 mr-2">✓</span>
                <span>Funciona 100% offline</span>
              </li>
            </ul>
            <button 
              onClick={() => window.open('https://wa.me/5511999999999?text=Quero renovar o plano mensal por R$ 19,90', '_blank')}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Renovar Mensal
            </button>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-6 rounded-2xl shadow-xl text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Plano Anual</h3>
              <span className="bg-yellow-400 text-purple-900 px-3 py-1 rounded-full text-sm font-semibold">
                Economize 20%
              </span>
            </div>
            <div className="mb-4">
              <span className="text-4xl font-bold">R$ 191,04</span>
              <span className="text-purple-200">/ano</span>
              <p className="text-sm text-purple-200 mt-1">
                Equivale a R$ 15,92/mês
              </p>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start">
                <span className="text-yellow-400 mr-2">✓</span>
                <span>Famílias ilimitadas</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-400 mr-2">✓</span>
                <span>Relatórios avançados</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-400 mr-2">✓</span>
                <span>Suporte prioritário</span>
              </li>
            </ul>
            <button 
              onClick={() => window.open('https://wa.me/5511999999999?text=Quero renovar o plano anual por R$ 191,04', '_blank')}
              className="w-full bg-white text-purple-600 font-bold py-3 rounded-xl hover:bg-purple-50 transition-colors"
            >
              Renovar Anual
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
          <h4 className="font-bold text-slate-800 mb-3 flex items-center">
            <span className="bg-blue-100 p-2 rounded-lg mr-3">💳</span>
            Formas de Pagamento
          </h4>
          <p className="text-slate-600 text-sm mb-4">
            PIX (liberação imediata), cartão de crédito ou boleto bancário.
          </p>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => window.open('https://wa.me/5511999999999?text=Preciso renovar minha assinatura', '_blank')}
              className="flex-1 bg-green-500 text-white font-semibold py-3 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center"
            >
              <span className="mr-2">💬</span>
              WhatsApp
            </button>
            <button 
              onClick={onRefresh}
              disabled={isOffline}
              className="flex-1 bg-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-lg hover:bg-slate-300 transition-colors disabled:opacity-50"
            >
              {isOffline ? 'Sem Internet' : 'Já Paguei? Atualizar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
