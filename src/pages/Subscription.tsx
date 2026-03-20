import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  CreditCard,
  Check,
  Crown,
  Star,
  Shield,
  Zap,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Sparkles
} from 'lucide-react';

export default function Subscription() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'verifying' | 'success' | 'error' | 'cancelled'>('idle');
  const [message, setMessage] = useState('');
  const [cpf, setCpf] = useState('');

  const formatCPF = (value: string) => {
    const nums = value.replace(/\D/g, '').slice(0, 11);
    return nums
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  useEffect(() => {
    const hash = window.location.hash;
    const hashParts = hash.split('?');
    const params = new URLSearchParams(hashParts[1] || '');

    const status = params.get('status');
    const sessionId = params.get('session_id');
    const paymentId = params.get('payment_id');

    if (status === 'success' && (sessionId || paymentId)) {
      setPaymentStatus('verifying');
      handleVerifyPayment(paymentId || sessionId || '');
    } else if (status === 'cancelled') {
      setPaymentStatus('cancelled');
      setMessage('Pagamento cancelado. Você pode tentar novamente quando quiser.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerifyPayment = async (paymentOrSessionId: string) => {
    try {
      const response = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: paymentOrSessionId, sessionId: paymentOrSessionId }),
      });
      const data = await response.json();

      if (data.success && data.paid) {
        const now = new Date();
        const daysToAdd = data.plan === 'yearly' ? 365 : 30;
        const newExpiration = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

        if (user?.id) {
          try {
            await api.saveUser({
              ...user,
              subscriptionExpiresAt: newExpiration.toISOString(),
            });
          } catch (saveError) {
            console.error('Erro ao salvar assinatura:', saveError);
          }
        }

        setPaymentStatus('success');
        setMessage('Pagamento confirmado! Sua assinatura está ativa.');
        window.location.hash = '#/subscription';
      } else if (data.success && !data.paid) {
        setPaymentStatus('idle');
        setMessage('Pagamento pendente. Assim que for confirmado, sua assinatura será ativada automaticamente.');
      } else {
        setPaymentStatus('error');
        setMessage('Não foi possível confirmar o pagamento. Tente novamente ou entre em contato.');
      }
    } catch (error) {
      console.error('Erro ao verificar pagamento:', error);
      setPaymentStatus('error');
      setMessage('Erro ao verificar pagamento. Tente novamente.');
    }
  };

  const handleSubscribe = async () => {
    if (!user) return;
    setIsLoading(true);

    if (cpf.replace(/\D/g, '').length !== 11) {
      setMessage('Informe um CPF válido para prosseguir.');
      setPaymentStatus('error');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          userId: user.id,
          userEmail: user.email,
          userName: user.name,
          cpfCnpj: cpf.replace(/\D/g, ''),
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setMessage('Erro ao iniciar pagamento. Tente novamente.');
        setPaymentStatus('error');
      }
    } catch (error) {
      console.error('Erro ao criar checkout:', error);
      setMessage('Erro ao conectar com o serviço de pagamento.');
      setPaymentStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysRemaining = () => {
    if (!user) return 0;
    const createdAt = new Date(user.createdAt || Date.now());
    const expiresAt = user.subscriptionExpiresAt
      ? new Date(user.subscriptionExpiresAt)
      : new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
    const now = new Date();
    return Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  };

  const daysRemaining = getDaysRemaining();
  const isExpired = daysRemaining <= 0;
  const isTrialing = !user?.subscriptionExpiresAt || daysRemaining <= 30;

  if (paymentStatus === 'verifying') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Verificando pagamento...</h2>
          <p className="text-gray-500">Aguarde enquanto confirmamos sua assinatura.</p>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'success') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Pagamento Confirmado!</h2>
          <p className="text-gray-600 mb-8">{message}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Ir para o Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Voltar ao Dashboard</span>
        </button>

        <div className="flex items-center gap-3 mb-2">
          <Crown className="w-8 h-8 text-amber-500" />
          <h1 className="text-2xl font-bold text-gray-800">Minha Assinatura</h1>
        </div>
        <p className="text-gray-500">Gerencie seu plano e pagamento</p>
      </div>

      {/* Status atual */}
      <div className={`rounded-2xl p-6 mb-8 ${
        isExpired
          ? 'bg-red-50 border border-red-200'
          : isTrialing
          ? 'bg-blue-50 border border-blue-200'
          : 'bg-green-50 border border-green-200'
      }`}>
        <div className="flex items-center gap-3 mb-2">
          {isExpired ? (
            <XCircle className="w-6 h-6 text-red-600" />
          ) : (
            <CheckCircle className="w-6 h-6 text-green-600" />
          )}
          <h3 className="text-lg font-semibold text-gray-800">
            {isExpired
              ? 'Assinatura Expirada'
              : isTrialing
              ? 'Período de Teste'
              : 'Assinatura Ativa'}
          </h3>
        </div>
        <p className={`text-sm ${isExpired ? 'text-red-700' : 'text-gray-600'}`}>
          {isExpired
            ? 'Sua assinatura expirou. Assine um plano para continuar usando o ACS Top.'
            : `Você tem ${daysRemaining} dia${daysRemaining !== 1 ? 's' : ''} restante${daysRemaining !== 1 ? 's' : ''}.`}
        </p>
      </div>

      {/* Mensagens de erro/cancelamento */}
      {(paymentStatus === 'error' || paymentStatus === 'cancelled') && (
        <div className={`rounded-xl p-4 mb-6 flex items-center gap-3 ${
          paymentStatus === 'error' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
        }`}>
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{message}</p>
        </div>
      )}

      {/* Toggle mensal/anual */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <span className={`text-sm font-medium ${selectedPlan === 'monthly' ? 'text-blue-700' : 'text-gray-500'}`}>
          Mensal
        </span>
        <button
          onClick={() => setSelectedPlan(selectedPlan === 'monthly' ? 'yearly' : 'monthly')}
          className={`relative w-14 h-7 rounded-full transition-colors ${
            selectedPlan === 'yearly' ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        >
          <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
            selectedPlan === 'yearly' ? 'translate-x-7' : 'translate-x-0.5'
          }`} />
        </button>
        <span className={`text-sm font-medium ${selectedPlan === 'yearly' ? 'text-blue-700' : 'text-gray-500'}`}>
          Anual
        </span>
        {selectedPlan === 'yearly' && (
          <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Economia de R$59,00
          </span>
        )}
      </div>

      {/* Cards de planos */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Plano Mensal */}
        <div
          onClick={() => setSelectedPlan('monthly')}
          className={`rounded-2xl p-6 cursor-pointer transition-all border-2 ${
            selectedPlan === 'monthly'
              ? 'border-blue-500 bg-white shadow-lg shadow-blue-100'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">Plano Mensal</h3>
            <Zap className={`w-6 h-6 ${selectedPlan === 'monthly' ? 'text-blue-500' : 'text-gray-400'}`} />
          </div>

          <div className="mb-4">
            <span className="text-sm text-gray-400 line-through">R$ 34,90</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-gray-800">R$ 29,90</span>
              <span className="text-gray-500">/mês</span>
            </div>
          </div>

          <ul className="space-y-3">
            {['Acesso completo', 'Cadastro ilimitado de famílias', 'Visitas ilimitadas', 'Relatórios completos', 'Notificações inteligentes', 'Modo offline'].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Plano Anual */}
        <div
          onClick={() => setSelectedPlan('yearly')}
          className={`rounded-2xl p-6 cursor-pointer transition-all border-2 relative ${
            selectedPlan === 'yearly'
              ? 'border-blue-500 bg-white shadow-lg shadow-blue-100'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
              <Star className="w-3 h-3" />
              MELHOR OFERTA
            </span>
          </div>

          <div className="flex items-center justify-between mb-4 mt-2">
            <h3 className="text-lg font-bold text-gray-800">Plano Anual</h3>
            <Crown className={`w-6 h-6 ${selectedPlan === 'yearly' ? 'text-amber-500' : 'text-gray-400'}`} />
          </div>

          <div className="mb-4">
            <span className="text-sm text-gray-400 line-through">R$ 349,90</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-gray-800">R$ 299,90</span>
              <span className="text-gray-500">/ano</span>
            </div>
            <p className="text-xs text-green-600 font-medium mt-1">Equivale a R$ 24,99/mês</p>
          </div>

          <ul className="space-y-3">
            {['Tudo do plano mensal', 'Economia de R$ 59,00/ano', 'Prioridade no suporte', 'Atualizações antecipadas', 'Backup automático', 'Oferta por tempo limitado'].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Campo CPF */}
      <div className="max-w-md mx-auto mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
          CPF (necessário para o pagamento)
        </label>
        <input
          type="text"
          value={cpf}
          onChange={(e) => setCpf(formatCPF(e.target.value))}
          placeholder="000.000.000-00"
          maxLength={14}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-center text-lg tracking-wider focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Botão assinar */}
      <div className="text-center mb-8">
        <button
          onClick={handleSubscribe}
          disabled={isLoading}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 mx-auto"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              Assinar Agora — {selectedPlan === 'monthly' ? 'R$ 29,90/mês' : 'R$ 299,90/ano'}
            </>
          )}
        </button>
      </div>

      {/* Garantia */}
      <div className="bg-gray-50 rounded-2xl p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-green-600" />
          <h4 className="font-semibold text-gray-800">Garantia de 7 dias</h4>
        </div>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Se não ficar satisfeito, devolvemos 100% do seu dinheiro em até 7 dias após a assinatura. Sem perguntas.
        </p>
      </div>
    </div>
  );
}
