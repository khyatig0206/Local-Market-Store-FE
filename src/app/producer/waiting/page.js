"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getKycStatusForProducer } from "@/lib/api/producers";
import { GiFarmer, GiScrollUnfurled } from "react-icons/gi";
import { FaCheck, FaSync, FaExclamationTriangle } from "react-icons/fa";
import { useTranslations } from "next-intl";

export default function WaitingForApproval() {
  const t = useTranslations();
  const router = useRouter();
  const [status, setStatus] = useState("pending");
  const [checking, setChecking] = useState(true);
  const [lastChecked, setLastChecked] = useState(new Date());
  const timerRef = useRef(null);
  const isCheckingRef = useRef(false);
  const [localeUI, setLocaleUI] = useState('en');
  const REFRESH_MS = 60000; // 60s, avoid overly frequent checks

  // Read current locale for the dropdown on mount
  function readCookie(name) {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  }
  useEffect(() => {
    let l = 'en';
    try { l = readCookie('locale') || localStorage.getItem('locale') || 'en'; } catch {}
    if (!['en','hi','or'].includes(l)) l = 'en';
    setLocaleUI(l);
  }, []);
 
  const handleStatus = (newStatus) => {
    setStatus(newStatus);
    try {
      localStorage.setItem("kycStatus", newStatus);
      window.dispatchEvent(new Event("kycStatusUpdate"));
    } catch {}

    if (newStatus === "approved") {
      router.replace("/producer");
    }
  };

  const checkNow = async () => {
    // Avoid checks when tab is hidden or a check is already in progress
    if (typeof document !== 'undefined' && document.hidden) return;
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;
    setChecking(true);

    try {
      const cached = localStorage.getItem("kycStatus");
      if (cached === "approved") {
        handleStatus("approved");
        return;
      }
    } catch {}

    try {
      const res = await getKycStatusForProducer();
      const s = res?.status || "pending";
      handleStatus(s);
      setLastChecked(new Date());
    } catch (e) {
      console.error("Failed to check status:", e);
    } finally {
      setChecking(false);
      isCheckingRef.current = false;
    }
  };

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.replace("/producer/signin");
        return;
      }
    } catch {}

    checkNow();
    
    timerRef.current = setInterval(() => checkNow(), REFRESH_MS);
    
    const focusHandler = () => checkNow();
    const onlineHandler = () => checkNow();
    const kycEventHandler = () => checkNow();

    window.addEventListener("focus", focusHandler);
    window.addEventListener("online", onlineHandler);
    window.addEventListener("kycStatusUpdate", kycEventHandler);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      window.removeEventListener("focus", focusHandler);
      window.removeEventListener("online", onlineHandler);
      window.removeEventListener("kycStatusUpdate", kycEventHandler);
    };
  }, [router]);

  const getStatusIcon = () => {
    switch (status) {
      case "approved":
        return <FaCheck className="w-8 h-8 text-green-500" />;
      case "rejected":
        return <FaExclamationTriangle className="w-8 h-8 text-red-500" />;
      default:
        return <GiScrollUnfurled className="w-8 h-8 text-amber-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "approved":
        return "text-green-600";
      case "rejected":
        return "text-red-600";
      default:
        return "text-amber-600";
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case "approved":
        return t('producerAuth.waiting.status.approved');
      case "rejected":
        return t('producerAuth.waiting.status.rejected');
      default:
        return t('producerAuth.waiting.status.pending');
    }
  };

  return (
    <div className="h-full flex items-center justify-center">
      {/* Language selector */}
      <div className="fixed top-2 right-2 z-50">
        <select
          aria-label="Language"
          className="border border-green-600 text-green-700 rounded px-2 py-1 text-xs bg-white"
          value={localeUI}
          onChange={(e) => {
          const l = e.target.value;
          setLocaleUI(l);
          try { document.cookie = `locale=${l}; path=/; max-age=31536000`; } catch {}
          try { localStorage.setItem('locale', l); } catch {}
          try { window.dispatchEvent(new Event('localeChange')); } catch {}
          }}
        >
          <option value="en">EN</option>
          <option value="hi">हिं</option>
          <option value="or">ଓଡ଼ିଆ</option>
        </select>
      </div>

      {/* Background SVG Patterns */}
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="farm-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M20,50 C30,30 70,30 80,50 C70,70 30,70 20,50 Z" fill="none" stroke="currentColor" strokeWidth="2"/>
              <circle cx="50" cy="50" r="5" fill="currentColor"/>
            </pattern>
            <pattern id="leaf-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M20,5 C25,5 30,10 30,15 C30,25 20,35 20,35 C20,35 10,25 10,15 C10,10 15,5 20,5 Z" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#farm-pattern)" className="text-green-200"/>
          <rect width="100%" height="100%" fill="url(#leaf-pattern)" className="text-amber-200"/>
        </svg>
      </div>

      <div className="max-w-md w-full mx-auto relative h-full flex flex-col justify-center">
        {/* Header */}
        <div className="text-center mb-6 flex-shrink-0">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="bg-green-600 p-3 rounded-full text-white shadow-lg">
              <GiFarmer className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-green-800">{t('producerAuth.waiting.headerTitle')}</h1>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-green-100 p-8 text-center">
          {/* Status Icon */}
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-green-50 border border-green-200">
              {getStatusIcon()}
            </div>
          </div>

          {/* Status Message */}
          <h2 className={`text-lg font-semibold mb-2 ${getStatusColor()}`}>
            {getStatusMessage()}
          </h2>

          {/* Description */}
          <p className="text-green-700 text-sm mb-6 leading-relaxed">
            {status === "rejected" 
              ? t('producerAuth.waiting.descriptions.rejected')
              : t('producerAuth.waiting.descriptions.pending')
            }
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            {status === "rejected" && (
              <Link
                href="/producer/kyc"
                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all transform hover:scale-105 shadow text-sm"
              >
                <FaExclamationTriangle className="w-4 h-4" />
                {t('producerAuth.waiting.buttons.updateDocuments')}
              </Link>
            )}

            <button
              onClick={checkNow}
              disabled={checking}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all transform hover:scale-105 disabled:scale-100 shadow text-sm"
            >
              {checking ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {t('producerAuth.waiting.buttons.checking')}
                </>
              ) : (
                <>
                  <FaSync className="w-4 h-4" />
                  {t('producerAuth.waiting.buttons.checkStatus')}
                </>
              )}
            </button>
          </div>

          {/* Last Checked Time */}
          <div className="mt-6 p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-xs text-green-600 mb-1">
              {t('producerAuth.waiting.lastChecked')}
            </p>
            <p className="text-xs text-green-700 font-medium">
              {lastChecked.toLocaleTimeString()} • {t('producerAuth.waiting.autoRefresh')}
            </p>
          </div>

          {/* Info Note */}
          <div className="mt-4 text-xs text-green-600">
            <p>{t('producerAuth.waiting.footerNote')}</p>
          </div>
        </div>

        {/* Support Link */}
        <div className="text-center mt-4 flex-shrink-0">
          <Link 
            href="/support" 
            className="text-green-600 hover:text-green-800 text-xs transition-colors"
          >
            {t('producerAuth.waiting.links.needHelp')}
          </Link>
        </div>
      </div>
    </div>
  );
}