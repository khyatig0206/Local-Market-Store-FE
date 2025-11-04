// FE/src/lib/firebase.js
import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, isSupported, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyBLxUNdNPg4sENRIKZXraJunPoA7pNYi9Q",
  authDomain: "polished-shore-428815-t0.firebaseapp.com",
  projectId: "polished-shore-428815-t0",
  storageBucket: "polished-shore-428815-t0.firebasestorage.app",
  messagingSenderId: "533458619932",
  appId: "1:533458619932:web:4b1af38f2ccf49636a99d9",
  measurementId: "G-0M0LJZKRCB",
};

export function getFirebaseApp() {
  if (!getApps().length) {
    initializeApp(firebaseConfig);
  }
  return getApps()[0];
}

export async function initMessaging() {
  const supported = await isSupported().catch(() => false);
  if (!supported) return null;
  const app = getFirebaseApp();
  try {
    const messaging = getMessaging(app);
    return messaging;
  } catch (e) {
    return null;
  }
}

async function ensureSWRegistration() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    // Use root scope to match messaging expectations
    const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    return reg;
  } catch {
    try {
      // Fallback: get existing registration
      return await navigator.serviceWorker.getRegistration();
    } catch {
      return null;
    }
  }
}

export async function getFcmToken() {
  const messaging = await initMessaging();
  if (!messaging) return null;
  try {
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) return null;
    const reg = await ensureSWRegistration();
    const token = await getToken(messaging, reg ? { vapidKey, serviceWorkerRegistration: reg } : { vapidKey });
    return token || null;
  } catch (e) {
    return null;
  }
}

export function onForegroundMessage(cb) {
  initMessaging().then((messaging) => {
    if (!messaging) return;
    onMessage(messaging, (payload) => {
      try { cb(payload); } catch {}
    });
  });
}
