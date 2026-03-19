import React, { useState, useEffect } from 'react';
import { X, Download, Share, PlusSquare, ArrowDown, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [platform, setPlatform] = useState<'android' | 'ios' | 'other'>('other');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('acs_install_dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const daysSince = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) return;
    }

    const installed = localStorage.getItem('acs_app_installed');
    if (installed) return;

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      localStorage.setItem('acs_app_installed', 'true');
      setIsInstalled(true);
      return;
    }

    const ua = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const isAndroid = /android/.test(ua);
    const isMobile = isIOS || isAndroid;

    if (!isMobile) return;

    if (isIOS) {
      setPlatform('ios');
      setTimeout(() => setShowBanner(true), 3000);
    } else if (isAndroid) {
      setPlatform('android');
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setPlatform('android');
      setTimeout(() => setShowBanner(true), 3000);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowBanner(false);
      localStorage.setItem('acs_app_installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        localStorage.setItem('acs_app_installed', 'true');
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      setShowGuide(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowGuide(false);
    localStorage.setItem('acs_install_dismissed', new Date().toISOString());
  };

  const handleNeverShow = () => {
    setShowBanner(false);
    setShowGuide(false);
    localStorage.setItem('acs_app_installed', 'true');
  };

  if (isInstalled || !showBanner) return null;

  return (
    <>
      {/* Banner principal */}
      {!showGuide && (
        <div className="fixed bottom-20 md:bottom-4 left-3 right-3 z-40 animate-slide-up">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-2xl p-4 text-white">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Smartphone size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-base">Instale o ACS Top</h3>
                  <p className="text-blue-100 text-xs mt-0.5">
                    Acesse mais rápido direto da tela inicial
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleInstallClick}
                className="flex-1 bg-white text-blue-600 font-bold py-2.5 rounded-xl text-sm flex items-center justify-center space-x-2 hover:bg-blue-50 transition-colors"
              >
                <Download size={16} />
                <span>{deferredPrompt ? 'Instalar Agora' : 'Como Instalar'}</span>
              </button>
              <button
                onClick={handleNeverShow}
                className="px-3 py-2.5 bg-white/10 rounded-xl text-xs font-medium hover:bg-white/20 transition-colors"
              >
                Não mostrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guia passo a passo */}
      {showGuide && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between rounded-t-3xl z-10">
              <h2 className="font-bold text-lg text-slate-800 flex items-center space-x-2">
                <Smartphone size={20} className="text-blue-600" />
                <span>Instalar o ACS Top</span>
              </h2>
              <button
                onClick={handleDismiss}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="p-5">
              {platform === 'ios' ? (
                <div className="space-y-5">
                  <p className="text-slate-600 text-sm">
                    Siga estes passos para instalar o ACS Top no seu iPhone:
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                        1
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 text-sm">Abra no Safari</h3>
                        <p className="text-slate-500 text-xs mt-1">
                          Certifique-se de que está usando o navegador <strong>Safari</strong> (não Chrome ou outro). Acesse <strong>acstop.com.br</strong>.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                        2
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 text-sm">Toque no botão Compartilhar</h3>
                        <p className="text-slate-500 text-xs mt-1">
                          Na barra inferior do Safari, toque no ícone de compartilhar:
                        </p>
                        <div className="mt-2 bg-slate-100 rounded-xl p-3 flex items-center justify-center">
                          <Share size={28} className="text-blue-600" />
                          <span className="ml-2 text-sm text-slate-600 font-medium">Compartilhar</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                        3
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 text-sm">Toque em "Adicionar à Tela de Início"</h3>
                        <p className="text-slate-500 text-xs mt-1">
                          Role as opções para baixo e toque em:
                        </p>
                        <div className="mt-2 bg-slate-100 rounded-xl p-3 flex items-center">
                          <PlusSquare size={22} className="text-blue-600 flex-shrink-0" />
                          <span className="ml-2 text-sm text-slate-600 font-medium">Adicionar à Tela de Início</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                        4
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 text-sm">Confirme tocando em "Adicionar"</h3>
                        <p className="text-slate-500 text-xs mt-1">
                          O ícone do ACS Top aparecerá na sua tela inicial como um app nativo.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <p className="text-slate-600 text-sm">
                    Siga estes passos para instalar o ACS Top no seu Android:
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                        1
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 text-sm">Abra no Chrome</h3>
                        <p className="text-slate-500 text-xs mt-1">
                          Acesse <strong>acstop.com.br</strong> pelo navegador <strong>Google Chrome</strong>.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                        2
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 text-sm">Toque nos 3 pontinhos</h3>
                        <p className="text-slate-500 text-xs mt-1">
                          No canto superior direito do Chrome, toque no menu (três pontos verticais):
                        </p>
                        <div className="mt-2 bg-slate-100 rounded-xl p-3 flex items-center justify-center">
                          <div className="flex flex-col items-center space-y-1">
                            <div className="w-1 h-1 bg-slate-600 rounded-full"></div>
                            <div className="w-1 h-1 bg-slate-600 rounded-full"></div>
                            <div className="w-1 h-1 bg-slate-600 rounded-full"></div>
                          </div>
                          <span className="ml-3 text-sm text-slate-600 font-medium">Menu do Chrome</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                        3
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 text-sm">Toque em "Instalar aplicativo"</h3>
                        <p className="text-slate-500 text-xs mt-1">
                          No menu que abrir, procure a opção:
                        </p>
                        <div className="mt-2 bg-slate-100 rounded-xl p-3 flex items-center">
                          <ArrowDown size={22} className="text-blue-600 flex-shrink-0" />
                          <span className="ml-2 text-sm text-slate-600 font-medium">Instalar aplicativo</span>
                        </div>
                        <p className="text-slate-400 text-xs mt-2">
                          Se não aparecer "Instalar aplicativo", procure "Adicionar à tela inicial".
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                        4
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 text-sm">Confirme a instalação</h3>
                        <p className="text-slate-500 text-xs mt-1">
                          Toque em "Instalar" na janela de confirmação. O ícone do ACS Top aparecerá na sua tela inicial.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Benefícios */}
              <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4">
                <h3 className="font-bold text-green-800 text-sm mb-2">Vantagens de instalar:</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-green-700 text-xs">Acesso rápido pela tela inicial</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-green-700 text-xs">Funciona offline (sem internet)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-green-700 text-xs">Tela cheia sem barra do navegador</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-green-700 text-xs">Notificações push no celular</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleDismiss}
                className="w-full mt-4 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors text-sm"
              >
                Entendi!
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.4s ease-out;
        }
      `}</style>
    </>
  );
};

export default InstallBanner;
