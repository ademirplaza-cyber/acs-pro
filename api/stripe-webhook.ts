import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

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
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Webhook: Variáveis de ambiente ausentes');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  let event: any;

  try {
    const rawBody = await getRawBody(req);
    const signature = req.headers['stripe-signature'] as string;

    // Se tiver webhook secret configurado, verificar assinatura
    if (STRIPE_WEBHOOK_SECRET && signature) {
      // Verificação manual do HMAC (sem depender da lib stripe)
      const crypto = await import('crypto');
      const timestamp = signature.split(',').find(s => s.startsWith('t='))?.split('=')[1];
      const v1Signature = signature.split(',').find(s => s.startsWith('v1='))?.split('=')[1];

      if (!timestamp || !v1Signature) {
        console.error('❌ Webhook: Assinatura inválida - campos ausentes');
        return res.status(400).json({ error: 'Invalid signature format' });
      }

      const payload = `${timestamp}.${rawBody.toString('utf8')}`;
      const expectedSignature = crypto
        .createHmac('sha256', STRIPE_WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');

      if (expectedSignature !== v1Signature) {
        console.error('❌ Webhook: Assinatura HMAC não confere');
        return res.status(400).json({ error: 'Invalid signature' });
      }

      // Verificar tolerância de tempo (5 minutos)
      const timestampAge = Math.floor(Date.now() / 1000) - parseInt(timestamp);
      if (timestampAge > 300) {
        console.error('❌ Webhook: Timestamp muito antigo:', timestampAge, 'segundos');
        return res.status(400).json({ error: 'Timestamp too old' });
      }

      event = JSON.parse(rawBody.toString('utf8'));
    } else {
      // Sem webhook secret — aceitar mas logar aviso
      console.warn('⚠️ Webhook: STRIPE_WEBHOOK_SECRET não configurado, aceitando sem verificação de assinatura');
      event = JSON.parse(rawBody.toString('utf8'));
    }
  } catch (parseError) {
    console.error('❌ Webhook: Erro ao processar payload:', parseError);
    return res.status(400).json({ error: 'Invalid payload' });
  }

  console.log(`📩 Webhook recebido: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      // ============================================
      // CHECKOUT CONCLUÍDO COM SUCESSO
      // ============================================
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('💳 Checkout completed:', session.id);

        const userId = session.client_reference_id || session.metadata?.userId;
        const plan = session.metadata?.plan || 'monthly';
        const customerEmail = session.customer_email;

        if (!userId && !customerEmail) {
          console.error('❌ Webhook: Sem userId nem email no checkout');
          break;
        }

        // Determinar dias a adicionar
        const daysToAdd = plan === 'yearly' ? 365 : 30;
        const newExpiration = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000).toISOString();

        // Tentar atualizar por userId primeiro
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

        // Fallback: buscar por email
        if (!updated && customerEmail) {
          const foundUser = await supabaseFindByEmail(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, customerEmail);
          if (foundUser) {
            updated = await supabaseUpdate(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, foundUser.id, {
              subscription_expires_at: newExpiration,
              status: 'ACTIVE',
              updated_at: new Date().toISOString(),
            });
            if (updated) {
              console.log(`✅ Assinatura ativada por email ${customerEmail} (id: ${foundUser.id})`);
            }
          } else {
            console.error(`❌ Webhook: Usuário não encontrado por email: ${customerEmail}`);
          }
        }

        break;
      }

      // ============================================
      // PAGAMENTO DE FATURA (RENOVAÇÃO AUTOMÁTICA)
      // ============================================
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        console.log('💰 Invoice paid:', invoice.id);

        // Ignorar a primeira fatura (já tratada pelo checkout.session.completed)
        if (invoice.billing_reason === 'subscription_create') {
          console.log('ℹ️ Primeira fatura — já tratada pelo checkout');
          break;
        }

        const customerEmail = invoice.customer_email;
        if (!customerEmail) {
          console.error('❌ Webhook: Sem email na fatura');
          break;
        }

        // Buscar período da subscription
        let daysToAdd = 30; // padrão mensal
        if (invoice.lines?.data?.[0]?.price?.id === process.env.STRIPE_PRICE_YEARLY) {
          daysToAdd = 365;
        }

        const newExpiration = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000).toISOString();

        const foundUser = await supabaseFindByEmail(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, customerEmail);
        if (foundUser) {
          const updated = await supabaseUpdate(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, foundUser.id, {
            subscription_expires_at: newExpiration,
            status: 'ACTIVE',
            updated_at: new Date().toISOString(),
          });
          if (updated) {
            console.log(`✅ Renovação automática: ${customerEmail} até ${newExpiration}`);
          }
        } else {
          console.error(`❌ Webhook: Usuário não encontrado para renovação: ${customerEmail}`);
        }

        break;
      }

      // ============================================
      // PAGAMENTO FALHOU
      // ============================================
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log('❌ Invoice failed:', invoice.id);

        const customerEmail = invoice.customer_email;
        if (customerEmail) {
          const foundUser = await supabaseFindByEmail(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, customerEmail);
          if (foundUser) {
            console.log(`⚠️ Pagamento falhou para: ${customerEmail} (id: ${foundUser.id})`);
            // Não bloqueia imediatamente — o Stripe tenta novamente
          }
        }

        break;
      }

      // ============================================
      // ASSINATURA CANCELADA
      // ============================================
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        console.log('🚫 Subscription cancelled:', subscription.id);

        // Buscar email do customer
        const customerId = subscription.customer;
        const customerResponse = await fetch(`https://api.stripe.com/v1/customers/${customerId}`, {
          headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
        });

        if (customerResponse.ok) {
          const customer = await customerResponse.json();
          const email = customer.email;

          if (email) {
            const foundUser = await supabaseFindByEmail(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, email);
            if (foundUser) {
              // Expirar imediatamente
              await supabaseUpdate(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, foundUser.id, {
                subscription_expires_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
              console.log(`✅ Assinatura expirada para: ${email}`);
            }
          }
        }

        break;
      }

      default:
        console.log(`ℹ️ Evento não tratado: ${event.type}`);
    }
  } catch (processingError) {
    console.error('❌ Webhook: Erro ao processar evento:', processingError);
    // Retornar 200 mesmo com erro para o Stripe não reenviar infinitamente
    return res.status(200).json({ received: true, error: 'Processing error' });
  }

  return res.status(200).json({ received: true });
}
