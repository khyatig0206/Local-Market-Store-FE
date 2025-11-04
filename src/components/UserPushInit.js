"use client";
import { useEffect } from 'react';
import { registerUserPushToken } from '@/lib/api/pushUser';
import { toast } from 'react-toastify';

export default function UserPushInit() {
  useEffect(() => {
    const run = async () => {
      try {
        const hasUser = typeof window !== 'undefined' && !!localStorage.getItem('userToken');
        if (!hasUser) return;
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
          try { await Notification.requestPermission(); } catch {}
        }
        const { getFcmToken, onForegroundMessage } = await import('@/lib/firebase');
        const token = await getFcmToken();
        if (!token) return;
        await registerUserPushToken(token);
        onForegroundMessage?.((payload) => {
          try {
            const title = payload?.notification?.title || 'Notification';
            const body = payload?.notification?.body || payload?.data?.body || '';
            toast.info(`${title}${body ? ' — ' + body : ''}`);
          } catch {}
        });
      } catch {}
    };
    run();

    const onAuth = () => run();
    const onStorage = (e) => { if (e.key === 'userToken' && e.newValue) run(); };
    window.addEventListener('authUpdate', onAuth);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('authUpdate', onAuth);
      window.removeEventListener('storage', onStorage);
    };
  }, []);
  return null;
}
