import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: 'Email, código e nova senha são obrigatórios' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL!;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const cleanEmail = email.toLowerCase().trim();

  try {
    // 1. Verificar código
    const codeCheck = await fetch(
      `${SUPABASE_URL}/rest/v1/password_reset_codes?email=eq.${encodeURIComponent(cleanEmail)}&code=eq.${code}&used=eq.false&select=id,expires_at&order=created_at.desc&limit=1`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    const codes = await codeCheck.json();

    if (!codes || codes.length === 0) {
      return res.status(400).json({ error: 'Código inválido ou já utilizado' });
    }
    if (new Date(codes[0].expires_at) < new Date()) {
      return res.status(400).json({ error: 'Código expirado' });
    }

    // 2. Atualizar senha
    const updateUser = await fetch(
      `${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(cleanEmail)}`,
      {
        method: 'PATCH',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({ password: newPassword }),
      }
    );

    if (!updateUser.ok) {
      console.error('Erro ao atualizar senha:', await updateUser.text());
      return res.status(500).json({ error: 'Erro ao atualizar senha' });
    }

    // 3. Marcar código como usado
    await fetch(
      `${SUPABASE_URL}/rest/v1/password_reset_codes?id=eq.${codes[0].id}`,
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

    console.log('✅ Senha alterada para:', cleanEmail);
    return res.status(200).json({ message: 'Senha alterada com sucesso!' });

  } catch (error) {
    console.error('reset-password error:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
