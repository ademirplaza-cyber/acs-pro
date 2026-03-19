import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { plan, userId, userEmail, userName } = req.body;
  if (!plan || !userId || !userEmail) {
    return res.status(400).json({ error: 'Dados obrigatórios: plan, userId, userEmail' });
  }

  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  const PRICE_MONTHLY = process.env.STRIPE_PRICE_MONTHLY;
  const PRICE_YEARLY = process.env.STRIPE_PRICE_YEARLY;

  if (!STRIPE_SECRET_KEY || !PRICE_MONTHLY || !PRICE_YEARLY) {
    return res.status(500).json({ error: 'Configuração do Stripe ausente' });
  }

  const priceId = plan === 'yearly' ? PRICE_YEARLY : PRICE_MONTHLY;
  const origin = req.headers.origin || req.headers.referer || 'https://acstop.com.br';
  const baseUrl = origin.replace(/\/$/, '');

  try {
    const params = new URLSearchParams();
    params.append('mode', 'subscription');
    params.append('payment_method_types[0]', 'card');
    params.append('line_items[0][price]', priceId);
    params.append('line_items[0][quantity]', '1');
    params.append('success_url', `${baseUrl}/#/subscription?status=success&session_id={CHECKOUT_SESSION_ID}`);
    params.append('cancel_url', `${baseUrl}/#/subscription?status=cancelled`);
    params.append('customer_email', userEmail);
    params.append('client_reference_id', userId);
    params.append('metadata[userId]', userId);
    params.append('metadata[userName]', userName || '');
    params.append('metadata[plan]', plan);

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const session = await response.json();
    if (!response.ok) {
      console.error('Erro Stripe:', session);
      return res.status(500).json({ error: 'Erro ao criar sessão de pagamento', details: session });
    }
    return res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Erro ao criar checkout:', error);
    return res.status(500).json({ error: 'Erro interno' });
  }
}
