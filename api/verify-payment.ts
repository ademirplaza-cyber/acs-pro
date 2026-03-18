import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ error: 'sessionId obrigatório' });

  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_SECRET_KEY) return res.status(500).json({ error: 'Configuração do Stripe ausente' });

  try {
    const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
    });

    const session = await response.json();
    if (!response.ok) {
      console.error('Erro Stripe:', session);
      return res.status(500).json({ error: 'Erro ao verificar pagamento' });
    }

    if (session.payment_status === 'paid') {
      const plan = session.metadata?.plan || 'monthly';
      const daysToAdd = plan === 'yearly' ? 365 : 30;
      return res.status(200).json({
        success: true,
        paid: true,
        userId: session.client_reference_id || session.metadata?.userId,
        plan,
        daysToAdd,
        customerEmail: session.customer_email,
        subscriptionId: session.subscription,
      });
    }

    return res.status(200).json({ success: true, paid: false, status: session.payment_status });
  } catch (error) {
    console.error('Erro ao verificar pagamento:', error);
    return res.status(500).json({ error: 'Erro interno' });
  }
}
