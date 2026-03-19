import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, code, userName } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'Email e código são obrigatórios' });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY não configurada');
    return res.status(500).json({ error: 'Configuração de email ausente' });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ACS Top <onboarding@resend.dev>',
        to: [email],
        subject: 'Código de Recuperação de Senha - ACS Top',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🏥 ACS Top</h1>
              <p style="color: #bfdbfe; margin: 8px 0 0 0; font-size: 14px;">Saúde Integrada</p>
            </div>
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-radius: 0 0 16px 16px;">
              <h2 style="color: #1e293b; margin-top: 0;">Recuperação de Senha</h2>
              <p style="color: #475569; font-size: 16px;">
                Olá${userName ? `, ${userName}` : ''}! Você solicitou a redefinição da sua senha.
              </p>
              <p style="color: #475569; font-size: 16px;">Use o código abaixo para redefinir sua senha:</p>
              <div style="background: #f1f5f9; border: 2px dashed #2563eb; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
                <span style="font-size: 36px; font-weight: bold; color: #2563eb; letter-spacing: 8px;">${code}</span>
              </div>
              <p style="color: #64748b; font-size: 14px;">
                ⏰ Este código expira em <strong>15 minutos</strong>.
              </p>
              <p style="color: #64748b; font-size: 14px;">
                Se você não solicitou esta redefinição, ignore este email. Sua senha permanecerá inalterada.
              </p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
              <p style="color: #94a3b8; font-size: 12px; text-align: center;">
                ACS Top - Sistema de Gestão para Agentes Comunitários de Saúde<br/>
                Este é um email automático, não responda.
              </p>
            </div>
          </div>
        `,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Erro Resend:', data);
      return res.status(500).json({ error: 'Erro ao enviar email', details: data });
    }

    console.log('✅ Email enviado com sucesso para:', email);
    return res.status(200).json({ success: true, messageId: data.id });

  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    return res.status(500).json({ error: 'Erro interno ao enviar email' });
  }
}
