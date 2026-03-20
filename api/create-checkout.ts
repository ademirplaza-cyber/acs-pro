import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { plan, userId, userEmail, userName, cpfCnpj } = req.body;
  if (!plan || !userId || !userEmail) {
    return res.status(400).json({ error: 'Dados obrigatórios: plan, userId, userEmail' });
  }

  const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
  const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://api.asaas.com/v3';

  if (!ASAAS_API_KEY) {
    return res.status(500).json({ error: 'Configuração do Asaas ausente' });
  }

  const origin = req.headers.origin || req.headers.referer || 'https://acstop.com.br';
  const baseUrl = origin.replace(/\/$/, '');

  try {
    // 1. Criar ou buscar cliente no Asaas
    let customerId = '';

    // Buscar cliente existente por email
    const searchRes = await fetch(`${ASAAS_API_URL}/customers?email=${encodeURIComponent(userEmail)}`, {
      headers: { 'access_token': ASAAS_API_KEY },
    });
    const searchData = await searchRes.json();

    if (searchData.data && searchData.data.length > 0) {
      customerId = searchData.data[0].id;
    } else {
      // Criar novo cliente
      const customerBody: Record<string, string> = {
        name: userName || userEmail.split('@')[0],
        email: userEmail,
        externalReference: userId,
      };

      if (cpfCnpj) {
        customerBody.cpfCnpj = cpfCnpj;
      }

      const createRes = await fetch(`${ASAAS_API_URL}/customers`, {
        method: 'POST',
        headers: {
          'access_token': ASAAS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerBody),
      });
      const createData = await createRes.json();

      if (!createRes.ok) {
        console.error('Erro ao criar cliente Asaas:', createData);
        return res.status(500).json({ error: 'Erro ao criar cliente', details: createData });
      }
      customerId = createData.id;
    }

    // 2. Criar cobrança
    const isYearly = plan === 'yearly';
    const value = isYearly ? 299.90 : 29.90;
    const description = isYearly
      ? 'ACS Top - Plano Anual'
      : 'ACS Top - Plano Mensal';

    // Data de vencimento: hoje + 1 dia
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1);
    const dueDateStr = dueDate.toISOString().split('T')[0]; // YYYY-MM-DD

    const chargeRes = await fetch(`${ASAAS_API_URL}/payments`, {
      method: 'POST',
      headers: {
        'access_token': ASAAS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer: customerId,
        billingType: 'UNDEFINED', // Permite cartão, boleto e PIX
        value: value,
        dueDate: dueDateStr,
        description: description,
        externalReference: JSON.stringify({ userId, plan }),
        callback: {
          successUrl: `${baseUrl}/#/subscription?status=success&payment_id={id}`,
          autoRedirect: true,
        },
      }),
    });

    const chargeData = await chargeRes.json();

    if (!chargeRes.ok) {
      console.error('Erro ao criar cobrança Asaas:', chargeData);
      return res.status(500).json({ error: 'Erro ao criar cobrança', details: chargeData });
    }

    // 3. Retornar URL de pagamento
    const paymentUrl = chargeData.invoiceUrl;

    if (!paymentUrl) {
      console.error('Asaas não retornou invoiceUrl:', chargeData);
      return res.status(500).json({ error: 'URL de pagamento não disponível' });
    }

    return res.status(200).json({
      url: paymentUrl,
      paymentId: chargeData.id,
    });

  } catch (error) {
    console.error('Erro ao criar checkout Asaas:', error);
    return res.status(500).json({ error: 'Erro interno' });
  }
}
