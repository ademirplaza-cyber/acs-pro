import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { paymentId, sessionId } = req.body;
  const id = paymentId || sessionId;

  if (!id) {
    return res.status(400).json({ error: 'paymentId é obrigatório' });
  }

  const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
  const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://api.asaas.com/v3';

  if (!ASAAS_API_KEY) {
    return res.status(500).json({ error: 'Configuração do Asaas ausente' });
  }

  try {
    const response = await fetch(`${ASAAS_API_URL}/payments/${id}`, {
      headers: { 'access_token': ASAAS_API_KEY },
    });

    const payment = await response.json();

    if (!response.ok) {
      console.error('Erro ao consultar pagamento Asaas:', payment);
      return res.status(500).json({ error: 'Erro ao verificar pagamento' });
    }

    const isPaid = ['CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH'].includes(payment.status);

    let plan = 'monthly';
    let userId = '';

    try {
      const ref = JSON.parse(payment.externalReference || '{}');
      plan = ref.plan || 'monthly';
      userId = ref.userId || '';
    } catch {
      // externalReference não é JSON válido
    }

    return res.status(200).json({
      success: true,
      paid: isPaid,
      status: payment.status,
      plan: plan,
      userId: userId,
      value: payment.value,
      billingType: payment.billingType,
    });

  } catch (error) {
    console.error('Erro ao verificar pagamento:', error);
    return res.status(500).json({ error: 'Erro interno' });
  }
}
