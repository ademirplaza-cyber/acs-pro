import React from 'react';
import { CreditCard } from 'lucide-react';

interface SubscriptionWarningProps {
  daysRemaining: number;
  isOffline: boolean;
}

export const SubscriptionWarning: React.FC<SubscriptionWarningProps> = ({ 
  daysRemaining, 
  isOffline 
}) => {
  if (daysRemaining > 7) return null;

  const urgencyLevel = daysRemaining <= 3 ? 'critical' : 'warning';
  const bgColor = urgencyLevel === 'critical' ? 'bg-red-50 border-red-500' : 'bg-yellow-50 border-yellow-500';
  const textColor = urgencyLevel === 'critical' ? 'text-red-800' : 'text-yellow-800';
  const buttonColor = urgencyLevel === 'critical' ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700';
  
  return (
    <div className={`${bgColor} border-l-4 p-4 mb-4 rounded-r-lg`}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center">
          <CreditCard size={24} className={urgencyLevel === 'critical' ? 'text-red-600' : 'text-yellow-600'} />
          <div className="ml-3">
            <p className={`text-sm font-medium ${textColor}`}>
              {daysRemaining === 0 
                ? 'Sua assinatura vence hoje!' 
                : `Sua assinatura vence em ${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'}`
              }
            </p>
            <p className={`text-sm ${textColor.replace('800', '700')} mt-1`}>
              {isOffline ? 'Conecte-se à internet para renovar' : 'Renove agora para não perder acesso'}
            </p>
          </div>
        </div>
        <button 
          onClick={() => window.open('https://wa.me/5511999999999?text=Preciso renovar minha assinatura', '_blank')}
          disabled={isOffline}
          className={`${buttonColor} text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50`}
        >
          {isOffline ? 'Sem Internet' : 'Renovar'}
        </button>
      </div>
    </div>
  );
};
