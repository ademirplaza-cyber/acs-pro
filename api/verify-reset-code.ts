import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: 'Email e código são obrigatórios' });

  const SUPABASE_URL = process.env.SUPABASE_URL!;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const cleanEmail = email.toLowerCase().trim();

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/password_reset_codes?email=eq.${encodeURIComponent(cleanEmail)}&code=eq.${code}&used=eq.false&select=id,expires_at&order=created_at.desc&limit=1`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    const codes = await response.json();

    if (!codes || codes.length === 0) {
      return res.status(400).json({ error: 'Código inválido ou já utilizado' });
    }

    if (new Date(codes[0].expires_at) < new Date()) {
      return res.status(400).json({ error: 'Código expirado. Solicite um novo.' });
    }

    return res.status(200).json({ valid: true, codeId: codes[0].id });

  } catch (error) {
    console.error('verify-reset-code error:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
