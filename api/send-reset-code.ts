import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email é obrigatório' });

  const SUPABASE_URL = process.env.SUPABASE_URL!;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const RESEND_KEY = process.env.RESEND_API_KEY!;

  if (!SUPABASE_URL || !SUPABASE_KEY || !RESEND_KEY) {
    console.error('Variáveis de ambiente faltando');
    return res.status(500).json({ error: 'Configuração do servidor incompleta' });
  }

  const cleanEmail = email.toLowerCase().trim();

  try {
    // 1. Verificar se o email existe
    const userCheck = await fetch(
      `${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(cleanEmail)}&select=id,name,email`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    const users = await userCheck.json();

    if (!users || users.length === 0) {
      // Não revelamos se o email existe (segurança)
      return res.status(200).json({ message: 'Se o email estiver cadastrado, você receberá o código.' });
    }

    const userName = users[0].name || 'Agente';

    // 2. Gerar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // 3. Invalidar códigos anteriores
    await fetch(
      `${SUPABASE_URL}/rest/v1/password_reset_codes?email=eq.${encodeURIComponent(cleanEmail)}&used=eq.false`,
      {
        method: 'PATCH',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({ used: true }),
      }
    );

    // 4. Salvar novo código no banco
    const saveCode = await fetch(`${SUPABASE_URL}/rest/v1/password_reset_codes`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        email: cleanEmail,
        code,
        expires_at: expiresAt,
        used: false,
      }),
    });

    if (!saveCode.ok) {
      console.error('Erro ao salvar código:', await saveCode.text());
      return res.status(500).json({ error: 'Erro ao gerar código' });
    }

    // 5. Enviar email via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ACS Top <onboarding@resend.dev>',
        to: [cleanEmail],
        subject: 'Código de Recuperação de Senha - ACS Top',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
            <div style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:30px;border-radius:16px 16px 0 0;text-align:center;">
              <h1 style="color:white;margin:0;font-size:24px;">🏥 ACS Top</h1>
              <p style="color:#bfdbfe;margin:8px 0 0;font-size:14px;">Saúde Integrada</p>
            </div>
            <div style="background:#fff;padding:30px;border:1px solid #e2e8f0;border-radius:0 0 16px 16px;">
              <h2 style="color:#1e293b;margin-top:0;">Recuperação de Senha</h2>
              <p style="color:#475569;font-size:16px;">Olá, <strong>${userName}</strong>! Você solicitou a redefinição da sua senha.</p>
              <p style="color:#475569;font-size:16px;">Use o código abaixo:</p>
              <div style="background:#f1f5f9;border:2px dashed #2563eb;border-radius:12px;padding:20px;text-align:center;margin:24px 0;">
                <span style="font-size:36px;font-weight:bold;color:#2563eb;letter-spacing:8px;">${code}</span>
              </div>
              <p style="color:#64748b;font-size:14px;">⏰ Este código expira em <strong>15 minutos</strong>.</p>
              <p style="color:#64748b;font-size:14px;">Se você não solicitou, ignore este email.</p>
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
              <p style="color:#94a3b8;font-size:12px;text-align:center;">ACS Top — Sistema para Agentes Comunitários de Saúde<br/>Email automático, não responda.</p>
            </div>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errData = await emailResponse.json();
      console.error('Resend error:', errData);
      return res.status(500).json({ error: 'Erro ao enviar email' });
    }

    console.log('✅ Código enviado para:', cleanEmail);
    return res.status(200).json({ message: 'Se o email estiver cadastrado, você receberá o código.' });

  } catch (error) {
    console.error('send-reset-code error:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
