const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}


export const pushNotificationService = {
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  },

  async getPermissionStatus(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  },

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  async subscribe(userId: string): Promise<boolean> {
    try {
      if (!this.isSupported()) {
        console.log('📱 Push notifications não suportadas neste navegador');
        return false;
      }

      const permission = await this.requestPermission();
      if (!permission) {
        console.log('🔕 Permissão de notificação negada');
        return false;
      }

      const registration = await navigator.serviceWorker.ready;

      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        if (!VAPID_PUBLIC_KEY) {
          console.error('❌ VITE_VAPID_PUBLIC_KEY não configurada');
          return false;
        }
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      const response = await fetch('/api/push-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          subscription: subscription.toJSON(),
        }),
      });

      if (!response.ok) {
        console.error('❌ Erro ao salvar subscription no servidor');
        return false;
      }

      console.log('✅ Push notification ativada com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao ativar push notification:', error);
      return false;
    }
  },

  async unsubscribe(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        console.log('🔕 Push notification desativada');
      }
      return true;
    } catch (error) {
      console.error('❌ Erro ao desativar push:', error);
      return false;
    }
  },

  async isSubscribed(): Promise<boolean> {
    try {
      if (!this.isSupported()) return false;
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return !!subscription;
    } catch {
      return false;
    }
  },
};
