import { createClient } from '@supabase/supabase-js';

// Buscar credenciais do arquivo .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validação crítica - sem isso o sistema não funciona
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('🚨 ERRO CRÍTICO: Credenciais do Supabase não encontradas!');
  console.error('📁 Verifique se o arquivo .env.local existe na RAIZ do projeto');
  console.error('🔑 Verifique se as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão corretas');
  throw new Error('❌ Configuração do Supabase incompleta. Verifique o arquivo .env.local');
}

// Criar cliente Supabase com configurações otimizadas
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,        // Mantém usuário logado
    autoRefreshToken: true,      // Renova token automaticamente
    detectSessionInUrl: false    // Evita conflitos com React Router
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-my-custom-header': 'acs-pro-app'
    }
  }
});

// Helpers úteis para o sistema
export const isOnline = (): boolean => navigator.onLine;

// Sistema de retry inteligente para operações críticas
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  context: string = 'operação'
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Verificar conectividade antes de tentar
      if (!isOnline()) {
        throw new Error(`Sem conexão - ${context} será tentada quando voltar online`);
      }

      console.log(`🔄 Tentativa ${attempt}/${maxRetries} - ${context}`);
      const result = await operation();
      
      if (attempt > 1) {
        console.log(`✅ ${context} bem-sucedida na tentativa ${attempt}`);
      }
      
      return result;
    } catch (error) {
      lastError = error;
      console.warn(`❌ Tentativa ${attempt} falhou - ${context}:`, error);
      
      if (attempt < maxRetries) {
        // Aguarda progressivamente: 1s, 2s, 3s...
        const waitTime = 1000 * attempt;
        console.log(`⏳ Aguardando ${waitTime}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  console.error(`🚫 Todas as tentativas falharam para ${context}`);
  throw lastError;
};

// Logger estruturado para debug e monitoramento
export const logSupabaseOperation = (operation: string, success: boolean, error?: any) => {
  const timestamp = new Date().toISOString();
    
  if (success) {
    console.log(`✅ [${timestamp}] ${operation} - Sucesso`);
  } else {
    console.error(`❌ [${timestamp}] ${operation} - Falha:`, error);
  }
  
  // Em produção, você pode enviar para serviço de monitoramento
  // Sentry.addBreadcrumb({ message: operation, level: success ? 'info' : 'error' });
};

// Verificar status da conexão com Supabase
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('users').select('count').limit(1);
    if (error) throw error;
    
    console.log('✅ Conexão com Supabase funcionando perfeitamente');
    return true;
  } catch (error) {
    console.error('❌ Falha na conexão com Supabase:', error);
    return false;
  }
};
