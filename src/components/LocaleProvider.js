"use client";
import {NextIntlClientProvider} from "next-intl";
import {useEffect, useMemo, useState} from "react";
import enMessages from "@/i18n/messages/en.json";

function readCookie(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export default function LocaleProvider({children}) {
  const [locale, setLocale] = useState('en');
  const [messages, setMessages] = useState(enMessages);

  useEffect(() => {
    // Determine locale from cookie or localStorage
    let l = 'en';
    try { l = readCookie('locale') || localStorage.getItem('locale') || 'en'; } catch {}
    if (!['en','hi','or'].includes(l)) l = 'en';
    setLocale(l);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const mod = await import(`@/i18n/messages/${locale}.json`);
        setMessages(mod.default || mod);
      } catch {
        const mod = await import('@/i18n/messages/en.json');
        setMessages(mod.default || mod);
      }
    }
    load();
  }, [locale]);

  useEffect(() => {
    // Keep <html lang> in sync
    try { document.documentElement.lang = locale; } catch {}
  }, [locale]);

  // React to locale changes triggered within the app (no full reload)
  useEffect(() => {
    function syncLocale() {
      let l = 'en';
      try { l = readCookie('locale') || localStorage.getItem('locale') || 'en'; } catch {}
      if (!['en','hi','or'].includes(l)) l = 'en';
      setLocale(l);
    }
    window.addEventListener('localeChange', syncLocale);
    return () => window.removeEventListener('localeChange', syncLocale);
  }, []);

  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone={Intl.DateTimeFormat().resolvedOptions().timeZone}>
      {children}
    </NextIntlClientProvider>
  );
}