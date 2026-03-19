import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const VAPID_PUBLIC_KEY = process.env.VITE_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { userId, title, body, url, tag, priority, notificationId } = req.body;

    if (!userId || !title) {
      return res.status(400).json({ error: 'userId and title are required' });
    }

    const subResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/push_subscriptions?user_id=eq.${userId}`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      }
    );

    const subscriptions = await subResponse.json();

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(200).json({ success: true, sent: 0, message: 'No subscriptions found' });
    }

    const webpush = require('web-push');
    webpush.setVapidDetails('mailto:ademirplaza@gmail.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

    const payload = JSON.stringify({
      title: title || 'ACS Top',
      body: body || '',
      url: url || '/',
      tag: tag || 'acs-top',
      priority: priority || 'MEDIUM',
      notificationId: notificationId || null,
    });

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      try {
        const pushSubscription = JSON.parse(sub.subscription);
        await webpush.sendNotification(pushSubscription, payload);
        sent++;
      } catch (err: any) {
        failed++;
        if (err.statusCode === 410 || err.statusCode === 404) {
          await fetch(
            `${SUPABASE_URL}/rest/v1/push_subscriptions?id=eq.${sub.id}`,
            {
              method: 'DELETE',
              headers: {
                apikey: SUPABASE_SERVICE_KEY,
                Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
              },
            }
          );
        }
      }
    }

    return res.status(200).json({ success: true, sent, failed });
  } catch (error: any) {
    console.error('❌ Erro send-push:', error);
    return res.status(500).json({ error: error.message });
  }
}
