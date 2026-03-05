import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import {
  Activity,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Cloud,
  Wifi,
  WifiOff,
  KeyRound,
  ArrowLeft,
  Mail,
  Lock,
  RefreshCw,
  Heart,
  Users,
  ClipboardList,
  Shield,
} from 'lucide-react';

// ============================================
// TELA DE LOGIN PROFISSIONAL
// Visual moderno para comercialização
// ============================================

type ScreenMode = 'LOGIN' | 'REGISTER' | 'FORGOT_EMAIL' | 'FORGOT_CODE' | 'FORGOT_NEWPASS';

export const Login: React.FC = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [screenMode, setScreenMode] = useState<ScreenMode>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ============================================
  // HANDLERS (mesma lógica)
  // ============================================

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      if (!email.trim() || !password.trim()) {
        setError('Preencha email e senha.');
        setIsLoading(false);
        return;
      }
      const result = await login(email.trim(), password);
      if (result) {
        navigate('/');
      } else {
        setError('Email ou senha incorretos. Verifique seus dados.');
      }
    } catch (err) {
      setError('Erro de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      if (!name.trim() || !email.trim() || !password.trim()) {
        setError('Preencha todos os campos.');
        setIsLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres.');
        setIsLoading(false);
        return;
      }
      if (!isOnline) {
        setError('Você precisa estar conectado à internet para se registrar.');
        setIsLoading(false);
        return;
      }
      const result = await register(name.trim(), email.trim(), password);
      if (result) {
        setSuccess('Conta criada com sucesso! Aguarde a aprovação do administrador.');
        setScreenMode('LOGIN');
        setName('');
        setEmail('');
        setPassword('');
      } else {
        setError('Este email já está cadastrado. Tente fazer login ou use outro email.');
      }
    } catch (err) {
      setError('Erro de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      if (!resetEmail.trim()) {
        setError('Digite seu email cadastrado.');
        setIsLoading(false);
        return;
      }
      if (!isOnline) {
        setError('Você precisa estar conectado à internet.');
        setIsLoading(false);
        return;
      }
      const result = await api.requestPasswordReset(resetEmail.trim());
      if (result.success && result.code) {
        setGeneratedCode(result.code);
        setSuccess(`Código de recuperação gerado!`);
        setScreenMode('FORGOT_CODE');
      } else {
        setError(result.error || 'Erro ao gerar código. Tente novamente.');
      }
    } catch (err) {
      setError('Erro de conexão. Verifique sua internet.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      if (!resetCode.trim()) {
        setError('Digite o código de 6 dígitos.');
        setIsLoading(false);
        return;
      }
      const result = await api.verifyResetCode(resetEmail.trim(), resetCode.trim());
      if (result.success) {
        setSuccess('Código verificado! Agora crie sua nova senha.');
        setScreenMode('FORGOT_NEWPASS');
      } else {
        setError(result.error || 'Código inválido ou expirado.');
      }
    } catch (err) {
      setError('Erro de conexão. Verifique sua internet.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      if (!newPassword.trim() || !confirmPassword.trim()) {
        setError('Preencha a nova senha e a confirmação.');
        setIsLoading(false);
        return;
      }
      if (newPassword.length < 6) {
        setError('A nova senha deve ter pelo menos 6 caracteres.');
        setIsLoading(false);
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('As senhas não coincidem.');
        setIsLoading(false);
        return;
      }
      const result = await api.completePasswordReset(resetEmail.trim(), resetCode.trim(), newPassword);
      if (result.success) {
        setSuccess('Senha redefinida com sucesso! Faça login com sua nova senha.');
        setScreenMode('LOGIN');
        setEmail(resetEmail);
        setPassword('');
        setResetEmail('');
        setResetCode('');
        setGeneratedCode('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(result.error || 'Erro ao redefinir senha.');
      }
    } catch (err) {
      setError('Erro de conexão. Verifique sua internet.');
    } finally {
      setIsLoading(false);
    }
  };

  const goBackToLogin = () => {
    setScreenMode('LOGIN');
    setError('');
    setSuccess('');
    setResetEmail('');
    setResetCode('');
    setGeneratedCode('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const fillAdminCredentials = () => {
    setEmail('admin@acspro.com');
    setPassword('admin123456');
    setError('');
    setSuccess('');
  };

  // ============================================
  // COMPONENTES DE UI
  // ============================================

  const MessageBox = () => (
    <>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 animate-shake">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-start gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
          <span className="text-green-700 text-sm">{success}</span>
        </div>
      )}
    </>
  );

  const InputField = ({
    label, type = 'text', value, onChange, placeholder, icon: Icon, disabled = false,
    rightElement,
  }: {
    label: string; type?: string; value: string; onChange: (v: string) => void;
    placeholder: string; icon?: any; disabled?: boolean; rightElement?: React.ReactNode;
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1.5">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full ${Icon ? 'pl-11' : 'pl-4'} ${rightElement ? 'pr-12' : 'pr-4'} py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition-all text-gray-800 placeholder-gray-400`}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  );

  const SubmitButton = ({
    onClick, loading, label, loadingLabel, icon: Icon, color = 'blue',
  }: {
    onClick?: () => void; loading: boolean; label: string; loadingLabel: string;
    icon: any; color?: string;
  }) => {
    const colors: Record<string, string> = {
      blue: 'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-blue-200',
      green: 'from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-green-200',
      orange: 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-orange-200',
    };
    return (
      <button
        type="submit"
        onClick={onClick}
        disabled={loading}
        className={`w-full py-3.5 px-4 rounded-xl text-white font-semibold transition-all bg-gradient-to-r ${colors[color]} shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-lg`}
      >
        <span className="flex items-center justify-center gap-2">
          {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Icon className="w-5 h-5" />}
          {loading ? loadingLabel : label}
        </span>
      </button>
    );
  };

  // ============================================
  // FEATURES DO LADO ESQUERDO (desktop)
  // ============================================
  const features = [
    { icon: Users, title: 'Gestão de Famílias', desc: 'Cadastre e acompanhe todas as famílias da sua microárea' },
    { icon: ClipboardList, title: 'Visitas Domiciliares', desc: 'Agende, registre e acompanhe todas as visitas com GPS' },
    { icon: Heart, title: 'Monitoramento de Saúde', desc: 'Acompanhe gestantes, hipertensos, diabéticos e grupos de risco' },
    { icon: Cloud, title: 'Dados na Nuvem', desc: 'Seus dados seguros e acessíveis de qualquer dispositivo' },
  ];

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex">

      {/* ============================================ */}
      {/* LADO ESQUERDO — Branding (só desktop) */}
      {/* ============================================ */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden">
        {/* Fundo com padrão */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-indigo-800/40" />
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/5"
              style={{
                width: `${150 + i * 80}px`,
                height: `${150 + i * 80}px`,
                left: `${10 + i * 12}%`,
                top: `${5 + i * 15}%`,
                animation: `float ${10 + i * 3}s ease-in-out infinite`,
                animationDelay: `${i * 2}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/20">
              <Activity size={36} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">ACS Pro</h1>
              <p className="text-blue-200/70 text-sm font-medium">Saúde Integrada</p>
            </div>
          </div>

          {/* Título */}
          <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
            A ferramenta completa para o
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300"> Agente de Saúde</span>
          </h2>
          <p className="text-blue-200/60 text-lg mb-10 max-w-lg">
            Gerencie famílias, visitas e indicadores de saúde de forma simples e eficiente, direto do seu celular ou computador.
          </p>

          {/* Features */}
          <div className="space-y-5">
            {features.map((feature, i) => (
              <div key={i} className="flex items-start gap-4 group">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 border border-white/10 group-hover:bg-white/20 group-hover:border-white/20 transition-all shrink-0">
                  <feature.icon size={22} className="text-blue-300" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">{feature.title}</h3>
                  <p className="text-blue-200/50 text-sm mt-0.5">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Rodapé do lado esquerdo */}
          <div className="mt-16 pt-8 border-t border-white/10">
            <p className="text-blue-300/30 text-xs">
              &copy; {new Date().getFullYear()} ACS Pro — Todos os direitos reservados
            </p>
            <p className="text-blue-300/20 text-xs mt-1">
              Versão 2.0 • Dados seguros na nuvem
            </p>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* LADO DIREITO — Formulários */}
      {/* ============================================ */}
      <div className="w-full lg:w-1/2 xl:w-[45%] flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">

          {/* Logo mobile */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/20">
                <Activity size={32} className="text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-2xl font-bold text-white">ACS Pro</h1>
                <p className="text-blue-200/60 text-xs font-medium">Saúde Integrada</p>
              </div>
            </div>
            <p className="text-blue-200/40 text-sm">
              Sistema de Gestão para Agentes Comunitários de Saúde
            </p>
          </div>

          {/* Card principal */}
          <div className="bg-white rounded-3xl shadow-2xl shadow-black/20 overflow-hidden">
            
            {/* Header do card */}
            <div className="px-8 pt-8 pb-4">
              {/* Indicador de conexão */}
              <div className="flex justify-center mb-6">
                <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium ${
                  isOnline
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {isOnline ? (
                    <>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      <Wifi className="w-3.5 h-3.5" />
                      Conectado à nuvem
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3.5 h-3.5" />
                      Sem conexão
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="px-8 pb-8">

              {/* ============================================ */}
              {/* TELA: LOGIN */}
              {/* ============================================ */}
              {screenMode === 'LOGIN' && (
                <>
                  <div className="flex mb-6 bg-gray-100 rounded-xl p-1">
                    <button
                      onClick={() => { setScreenMode('LOGIN'); setError(''); setSuccess(''); }}
                      className="flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all bg-white text-blue-600 shadow-sm"
                    >
                      <LogIn className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                      Entrar
                    </button>
                    <button
                      onClick={() => { setScreenMode('REGISTER'); setError(''); setSuccess(''); }}
                      className="flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all text-gray-400 hover:text-gray-600"
                    >
                      <UserPlus className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                      Registrar
                    </button>
                  </div>

                  <MessageBox />

                  <form onSubmit={handleLogin} className="space-y-4">
                    <InputField
                      label="Email"
                      type="email"
                      value={email}
                      onChange={setEmail}
                      placeholder="seu@email.com"
                      icon={Mail}
                      disabled={isLoading}
                    />

                    <InputField
                      label="Senha"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={setPassword}
                      placeholder="Sua senha"
                      icon={Lock}
                      disabled={isLoading}
                      rightElement={
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      }
                    />

                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setScreenMode('FORGOT_EMAIL');
                          setError('');
                          setSuccess('');
                          setResetEmail(email || '');
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
                      >
                        Esqueci minha senha
                      </button>
                    </div>

                    <SubmitButton
                      loading={isLoading}
                      label="Entrar"
                      loadingLabel="Entrando..."
                      icon={LogIn}
                      color="blue"
                    />
                  </form>

                  <div className="mt-6 pt-5 border-t border-gray-100">
                    <p className="text-[11px] text-gray-300 text-center mb-2 uppercase tracking-wider font-medium">Acesso rápido</p>
                    <button
                      onClick={fillAdminCredentials}
                      className="w-full py-2.5 px-4 bg-gray-50 hover:bg-gray-100 text-gray-500 text-sm rounded-xl transition-all flex items-center justify-center gap-2 border border-gray-200"
                      disabled={isLoading}
                    >
                      <Shield className="w-4 h-4" />
                      Preencher credenciais do Admin
                    </button>
                  </div>
                </>
              )}

              {/* ============================================ */}
              {/* TELA: REGISTRO */}
              {/* ============================================ */}
              {screenMode === 'REGISTER' && (
                <>
                  <div className="flex mb-6 bg-gray-100 rounded-xl p-1">
                    <button
                      onClick={() => { setScreenMode('LOGIN'); setError(''); setSuccess(''); }}
                      className="flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all text-gray-400 hover:text-gray-600"
                    >
                      <LogIn className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                      Entrar
                    </button>
                    <button
                      onClick={() => { setScreenMode('REGISTER'); setError(''); setSuccess(''); }}
                      className="flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all bg-white text-blue-600 shadow-sm"
                    >
                      <UserPlus className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                      Registrar
                    </button>
                  </div>

                  <MessageBox />

                  <form onSubmit={handleRegister} className="space-y-4">
                    <InputField
                      label="Nome completo"
                      value={name}
                      onChange={setName}
                      placeholder="Seu nome completo"
                      icon={Users}
                      disabled={isLoading}
                    />
                    <InputField
                      label="Email"
                      type="email"
                      value={email}
                      onChange={setEmail}
                      placeholder="seu@email.com"
                      icon={Mail}
                      disabled={isLoading}
                    />
                    <InputField
                      label="Senha"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={setPassword}
                      placeholder="Mínimo 6 caracteres"
                      icon={Lock}
                      disabled={isLoading}
                      rightElement={
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      }
                    />

                    <SubmitButton
                      loading={isLoading}
                      label="Criar conta"
                      loadingLabel="Registrando..."
                      icon={UserPlus}
                      color="blue"
                    />
                  </form>

                  <div className="mt-5 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-xs text-blue-800 font-semibold mb-2">Como funciona o registro:</p>
                    <div className="space-y-1.5">
                      {[
                        'Crie sua conta com nome, email e senha',
                        'Sua conta ficará com status "Pendente"',
                        'O administrador irá aprovar seu acesso',
                        'Após aprovação, você poderá usar o sistema',
                      ].map((step, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="bg-blue-200 text-blue-800 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span className="text-xs text-blue-700">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* ============================================ */}
              {/* TELA: ESQUECI SENHA — STEP 1: EMAIL */}
              {/* ============================================ */}
              {screenMode === 'FORGOT_EMAIL' && (
                <>
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl mb-4 shadow-sm">
                      <KeyRound className="w-8 h-8 text-orange-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Recuperar Senha</h2>
                    <p className="text-gray-400 text-sm mt-1">
                      Digite o email cadastrado para receber o código
                    </p>
                  </div>

                  <MessageBox />

                  <form onSubmit={handleRequestCode} className="space-y-4">
                    <InputField
                      label="Email cadastrado"
                      type="email"
                      value={resetEmail}
                      onChange={setResetEmail}
                      placeholder="seu@email.com"
                      icon={Mail}
                      disabled={isLoading}
                    />

                    <SubmitButton
                      loading={isLoading}
                      label="Enviar código de recuperação"
                      loadingLabel="Gerando código..."
                      icon={Mail}
                      color="orange"
                    />

                    <button
                      type="button"
                      onClick={goBackToLogin}
                      className="w-full py-2.5 px-4 text-gray-500 text-sm font-medium hover:text-gray-700 flex items-center justify-center gap-2 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Voltar para o login
                    </button>
                  </form>
                </>
              )}

              {/* ============================================ */}
              {/* TELA: ESQUECI SENHA — STEP 2: CÓDIGO */}
              {/* ============================================ */}
              {screenMode === 'FORGOT_CODE' && (
                <>
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl mb-4 shadow-sm">
                      <Lock className="w-8 h-8 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Digite o Código</h2>
                    <p className="text-gray-400 text-sm mt-1">
                      Código de 6 dígitos enviado para <strong className="text-gray-600">{resetEmail}</strong>
                    </p>
                  </div>

                  {generatedCode && (
                    <div className="mb-4 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl text-center">
                      <p className="text-[10px] text-amber-600 mb-1 font-semibold uppercase tracking-wider">Código (modo desenvolvimento)</p>
                      <p className="text-3xl font-bold text-amber-800 tracking-[0.3em] font-mono">{generatedCode}</p>
                      <p className="text-[10px] text-amber-500 mt-2">Válido por 15 minutos</p>
                    </div>
                  )}

                  <MessageBox />

                  <form onSubmit={handleVerifyCode} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1.5">Código de 6 dígitos</label>
                      <input
                        type="text"
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        maxLength={6}
                        className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition-all text-center text-3xl tracking-[0.4em] font-bold font-mono text-gray-800"
                        disabled={isLoading}
                      />
                    </div>

                    <SubmitButton
                      loading={isLoading}
                      label="Verificar código"
                      loadingLabel="Verificando..."
                      icon={CheckCircle2}
                      color="blue"
                    />

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setScreenMode('FORGOT_EMAIL');
                          setError('');
                          setSuccess('');
                          setResetCode('');
                          setGeneratedCode('');
                        }}
                        className="flex-1 py-2.5 px-3 text-gray-500 text-xs font-medium hover:text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center justify-center gap-1 transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Reenviar
                      </button>
                      <button
                        type="button"
                        onClick={goBackToLogin}
                        className="flex-1 py-2.5 px-3 text-gray-500 text-xs font-medium hover:text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center justify-center gap-1 transition-colors"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Voltar ao login
                      </button>
                    </div>
                  </form>
                </>
              )}

              {/* ============================================ */}
              {/* TELA: ESQUECI SENHA — STEP 3: NOVA SENHA */}
              {/* ============================================ */}
              {screenMode === 'FORGOT_NEWPASS' && (
                <>
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl mb-4 shadow-sm">
                      <Lock className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Nova Senha</h2>
                    <p className="text-gray-400 text-sm mt-1">
                      Crie uma nova senha para <strong className="text-gray-600">{resetEmail}</strong>
                    </p>
                  </div>

                  <MessageBox />

                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <InputField
                      label="Nova senha"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={setNewPassword}
                      placeholder="Mínimo 6 caracteres"
                      icon={Lock}
                      disabled={isLoading}
                      rightElement={
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      }
                    />

                    <div>
                      <InputField
                        label="Confirmar nova senha"
                        type={showNewPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                        placeholder="Digite novamente"
                        icon={Lock}
                        disabled={isLoading}
                      />
                      {confirmPassword && newPassword !== confirmPassword && (
                        <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          As senhas não coincidem
                        </p>
                      )}
                      {confirmPassword && newPassword === confirmPassword && newPassword.length >= 6 && (
                        <p className="text-xs text-green-500 mt-1.5 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Senhas coincidem
                        </p>
                      )}
                    </div>

                    <SubmitButton
                      loading={isLoading}
                      label="Redefinir Senha"
                      loadingLabel="Redefinindo..."
                      icon={Lock}
                      color="green"
                    />

                    <button
                      type="button"
                      onClick={goBackToLogin}
                      className="w-full py-2.5 px-4 text-gray-500 text-sm font-medium hover:text-gray-700 flex items-center justify-center gap-2 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Voltar para o login
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>

          {/* Rodapé mobile */}
          <div className="lg:hidden text-center mt-6">
            <p className="text-blue-300/30 text-xs">
              &copy; {new Date().getFullYear()} ACS Pro — Todos os direitos reservados
            </p>
          </div>
        </div>
      </div>

      {/* Animação CSS */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
};
