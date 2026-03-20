import type { VercelRequest, VercelResponse } from '@vercel/node';

async function supabaseUpdate(
  supabaseUrl: string,
  serviceRoleKey: string,
  userId: string,
  data: Record<string, unknown>
): Promise<boolean> {
  const url = `${supabaseUrl}/rest/v1/users?id=eq.${userId}`;
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(data),
  });
  return response.ok;
}

async function supabaseFindByEmail(
  supabaseUrl: string,
  serviceRoleKey: string,
  email: string
): Promise<{ id: string } | null> {
  const url = `${supabaseUrl}/rest/v1/users?email=eq.${encodeURIComponent(email.toLowerCase().trim())}&select=id&limit=1`;
  const response = await fetch(url, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  });
  if (!response.ok) return null;
  const data = await response.json();
  return data.length > 0 ? data[0] : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
  const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://api.asaas.com/v3';
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const ASAAS_WEBHOOK_TOKEN = process.env.ASAAS_WEBHOOK_TOKEN;

  if (!ASAAS_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Webhook Asaas: Variáveis de ambiente ausentes');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Verificar token do webhook (se configurado)
  if (ASAAS_WEBHOOK_TOKEN) {
    const token = req.headers['asaas-access-token'] || req.query?.token;
    if (token !== ASAAS_WEBHOOK_TOKEN) {
      console.error('❌ Webhook Asaas: Token inválido');
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const event = req.body;
  const eventType = event?.event;
  const payment = event?.payment;

  console.log(`📩 Webhook Asaas recebido: ${eventType} (Payment: ${payment?.id})`);

  if (!payment) {
    return res.status(200).json({ received: true, message: 'No payment data' });
  }

  try {
    switch (eventType) {
      // ============================================
      // PAGAMENTO CONFIRMADO
      // ============================================
      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED': {
        console.log(`💰 Pagamento confirmado: ${payment.id} - R$${payment.value}`);

        let plan = 'monthly';
        let userId = '';

        // Extrair dados do externalReference
        try {
          const ref = JSON.parse(payment.externalReference || '{}');
          plan = ref.plan || 'monthly';
          userId = ref.userId || '';
        } catch {
          // externalReference não é JSON
        }

        const daysToAdd = plan === 'yearly' ? 365 : 30;
        const newExpiration = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000).toISOString();

        // Tentar atualizar por userId
        let updated = false;
        if (userId) {
          updated = await supabaseUpdate(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, userId, {
            subscription_expires_at: newExpiration,
            status: 'ACTIVE',
            updated_at: new Date().toISOString(),
          });
          if (updated) {
            console.log(`✅ Assinatura ativada para userId ${userId} até ${newExpiration}`);
          }
        }

        // Fallback: buscar por email do cliente Asaas
        if (!updated && payment.customer) {
          const customerRes = await fetch(`${ASAAS_API_URL}/customers/${payment.customer}`, {
            headers: { 'access_token': ASAAS_API_KEY },
          });
          if (customerRes.ok) {
            const customer = await customerRes.json();
            if (customer.email) {
              const foundUser = await supabaseFindByEmail(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, customer.email);
              if (foundUser) {
                updated = await supabaseUpdate(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, foundUser.id, {
                  subscription_expires_at: newExpiration,
                  status: 'ACTIVE',
                  updated_at: new Date().toISOString(),
                });
                if (updated) {
                  console.log(`✅ Assinatura ativada por email ${customer.email}`);
                }
              }
            }
          }
        }

        if (!updated) {
          console.error(`❌ Webhook: Não conseguiu ativar assinatura para payment ${payment.id}`);
        }

        break;
      }

      // ============================================
      // PAGAMENTO VENCIDO / FALHOU
      // ============================================
      case 'PAYMENT_OVERDUE': {
        console.log(`⚠️ Pagamento vencido: ${payment.id}`);
        break;
      }

      // ============================================
      // PAGAMENTO ESTORNADO / CANCELADO
      // ============================================
      case 'PAYMENT_REFUNDED':
      case 'PAYMENT_DELETED': {
        console.log(`🚫 Pagamento cancelado/estornado: ${payment.id}`);

        let userId = '';
        try {
          const ref = JSON.parse(payment.externalReference || '{}');
          userId = ref.userId || '';
        } catch {
          // ignore
        }

        if (userId) {
          await supabaseUpdate(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, userId, {
            subscription_expires_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          console.log(`✅ Assinatura expirada para userId ${userId}`);
        }

        break;
      }

      default:
        console.log(`ℹ️ Evento Asaas não tratado: ${eventType}`);
    }
  } catch (processingError) {
    console.error('❌ Webhook Asaas: Erro ao processar:', processingError);
    return res.status(200).json({ received: true, error: 'Processing error' });
  }

  return res.status(200).json({ received: true });
}
