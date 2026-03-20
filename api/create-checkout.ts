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

    const searchRes = await fetch(`${ASAAS_API_URL}/customers?email=${encodeURIComponent(userEmail)}`, {
      headers: { 'access_token': ASAAS_API_KEY },
    });
    const searchData = await searchRes.json();

    if (searchData.data && searchData.data.length > 0) {
      customerId = searchData.data[0].id;

      // Atualizar CPF se o cliente existente não tiver
      if (cpfCnpj && !searchData.data[0].cpfCnpj) {
        await fetch(`${ASAAS_API_URL}/customers/${customerId}`, {
          method: 'PUT',
          headers: {
            'access_token': ASAAS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ cpfCnpj }),
        });
      }
    } else {
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

    // 2. Criar assinatura recorrente
    const isYearly = plan === 'yearly';
    const value = isYearly ? 299.90 : 29.90;
    const cycle = isYearly ? 'YEARLY' : 'MONTHLY';
    const description = isYearly
      ? 'ACS Top - Plano Anual (Recorrente)'
      : 'ACS Top - Plano Mensal (Recorrente)';

    // Próximo dia útil como data de início
    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + 1);
    const nextDueDateStr = nextDueDate.toISOString().split('T')[0];

    const subscriptionRes = await fetch(`${ASAAS_API_URL}/subscriptions`, {
      method: 'POST',
      headers: {
        'access_token': ASAAS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer: customerId,
        billingType: 'UNDEFINED',
        value: value,
        nextDueDate: nextDueDateStr,
        cycle: cycle,
        description: description,
        externalReference: JSON.stringify({ userId, plan }),
        callback: {
          successUrl: `${baseUrl}/#/subscription?status=success`,
          autoRedirect: true,
        },
      }),
    });

    const subscriptionData = await subscriptionRes.json();

    if (!subscriptionRes.ok) {
      console.error('Erro ao criar assinatura Asaas:', subscriptionData);

      // Fallback: criar pagamento avulso se assinatura falhar
      const chargeRes = await fetch(`${ASAAS_API_URL}/payments`, {
        method: 'POST',
        headers: {
          'access_token': ASAAS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer: customerId,
          billingType: 'UNDEFINED',
          value: value,
          dueDate: nextDueDateStr,
          description: description.replace('(Recorrente)', ''),
          externalReference: JSON.stringify({ userId, plan }),
          callback: {
            successUrl: `${baseUrl}/#/subscription?status=success`,
            autoRedirect: true,
          },
        }),
      });

      const chargeData = await chargeRes.json();

      if (!chargeRes.ok) {
        console.error('Erro ao criar cobrança Asaas:', chargeData);
        return res.status(500).json({ error: 'Erro ao criar cobrança', details: chargeData });
      }

      const paymentUrl = chargeData.invoiceUrl;
      if (!paymentUrl) {
        return res.status(500).json({ error: 'URL de pagamento não disponível' });
      }

      return res.status(200).json({ url: paymentUrl, paymentId: chargeData.id });
    }

    // 3. Buscar a primeira cobrança da assinatura para pegar o invoiceUrl
    // Aguardar um momento para o Asaas gerar a primeira cobrança
    await new Promise(resolve => setTimeout(resolve, 1500));

    const paymentsRes = await fetch(
      `${ASAAS_API_URL}/subscriptions/${subscriptionData.id}/payments?limit=1`,
      { headers: { 'access_token': ASAAS_API_KEY } }
    );
    const paymentsData = await paymentsRes.json();

    let paymentUrl = '';

    if (paymentsData.data && paymentsData.data.length > 0) {
      paymentUrl = paymentsData.data[0].invoiceUrl;
    }

    // Se não encontrou a URL da cobrança, usar link direto da assinatura
    if (!paymentUrl) {
      // Tentar buscar novamente
      await new Promise(resolve => setTimeout(resolve, 1500));
      const retry = await fetch(
        `${ASAAS_API_URL}/subscriptions/${subscriptionData.id}/payments?limit=1`,
        { headers: { 'access_token': ASAAS_API_KEY } }
      );
      const retryData = await retry.json();

      if (retryData.data && retryData.data.length > 0) {
        paymentUrl = retryData.data[0].invoiceUrl;
      }
    }

    if (!paymentUrl) {
      console.error('Asaas não retornou invoiceUrl para assinatura:', subscriptionData.id);
      return res.status(500).json({ error: 'URL de pagamento não disponível' });
    }

    return res.status(200).json({
      url: paymentUrl,
      subscriptionId: subscriptionData.id,
    });

  } catch (error) {
    console.error('Erro ao criar checkout Asaas:', error);
    return res.status(500).json({ error: 'Erro interno' });
  }
}
