// FE/src/app/producer/layout.js
'use client';
import ProducerSidebar from "@/components/ProducerSidebar";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CircleSpinner from "@/components/CircleSpinner";
import { getKycStatusForProducer } from "@/lib/api/producers";
import { registerProducerPushToken } from "@/lib/api/push";
import { toast } from "react-toastify";
import { FaBars, FaTimes } from "react-icons/fa";

export default function ProducerLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthPage = pathname.includes("/signin") || pathname.includes("/signup");
  const isWaitingPage = pathname.includes("/waiting");
  const isKycPage = pathname.includes("/kyc");
  const isProfilePage = pathname.includes("/profile");
  const allowedWhenPending = isWaitingPage || isKycPage || isProfilePage;
  const [kycStatus, setKycStatus] = useState(null);

useEffect(() => {
  // Verify token and gate by KYC
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token && !isAuthPage) {
    setAuthorized(false);
    setChecking(false);
    // Redirect after a tick so loader can render without flashing dashboard
    setTimeout(() => router.replace("/producer/signin"), 0);
    return;
  }

  setAuthorized(true);

  if (isAuthPage) {
    setChecking(false);
    return;
  }

  const decide = (status) => {
    setKycStatus(status);
    try {
      localStorage.setItem("kycStatus", status);
      window.dispatchEvent(new Event("kycStatusUpdate"));
    } catch {}

    if (status !== "approved") {
      if (!allowedWhenPending) {
        router.replace("/producer/waiting");
      }
    } else if (isWaitingPage) {
      router.replace("/producer");
    }
  };

  const cached = typeof window !== "undefined" ? localStorage.getItem("kycStatus") : null;
  if (cached) {
    setKycStatus(cached);
    decide(cached);
    setChecking(false);
    return;
  }

  setChecking(true);
  (async () => {
    try {
      const res = await getKycStatusForProducer();
      decide(res?.status || "pending");
    } catch (e) {
      // On error, do not block; let the page render
    } finally {
      setChecking(false);
    }
  })();
}, [pathname, isAuthPage, allowedWhenPending, isWaitingPage, router]);

useEffect(() => {
  const handler = () => {
    const s = typeof window !== "undefined" ? localStorage.getItem("kycStatus") : null;
    if (!s) return;
    setKycStatus(s);
    if (s !== "approved" && !allowedWhenPending) {
      router.replace("/producer/waiting");
    } else if (s === "approved" && isWaitingPage) {
      router.replace("/producer");
    }
  };
  window.addEventListener("kycStatusUpdate", handler);
  return () => window.removeEventListener("kycStatusUpdate", handler);
}, [allowedWhenPending, isWaitingPage, router]);

// Lock page scroll when on waiting page to prevent any body scroll
useEffect(() => {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  const body = document.body;
  if (isWaitingPage) {
    try {
      root.style.overflow = 'hidden';
      body.style.overflow = 'hidden';
      body.style.height = '100svh';
    } catch {}
  } else {
    try {
      root.style.overflow = '';
      body.style.overflow = '';
      body.style.height = '';
    } catch {}
  }
  return () => {
    try {
      root.style.overflow = '';
      body.style.overflow = '';
      body.style.height = '';
    } catch {}
  };
}, [isWaitingPage]);

// Register Firebase Messaging token and foreground toast handler
async function registerPush() {
try {
  if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
  try { await Notification.requestPermission(); } catch {}
}
const { getFcmToken, onForegroundMessage } = await import('@/lib/firebase');
const token = await getFcmToken();
if (!token) return;
await registerProducerPushToken(token);
onForegroundMessage?.((payload) => {
try {
  const title = payload?.notification?.title || 'Notification';
const body = payload?.notification?.body || payload?.data?.body || '';
toast.info(`${title}${body ? ' — ' + body : ''}`);
} catch {
  console.log('FCM message:', payload);
}
});
} catch {}
}

// Register Firebase Messaging token once producer is authorized
useEffect(() => {
if (isAuthPage) return;
registerPush();
}, [isAuthPage]);

// Re-register token when KYC status updates (e.g., after approval/rejection)
useEffect(() => {
 const onKyc = () => { (async () => { try { await registerPush(); } catch {} })(); };
  window.addEventListener('kycStatusUpdate', onKyc);
  return () => window.removeEventListener('kycStatusUpdate', onKyc);
}, []);

// Close mobile menu when route changes
useEffect(() => {
  setMobileMenuOpen(false);
}, [pathname]);

// Prevent body scroll when mobile menu is open
useEffect(() => {
  if (mobileMenuOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
  return () => {
    document.body.style.overflow = '';
  };
}, [mobileMenuOpen]);

 if (!isAuthPage && (checking || !authorized)) {
  return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 via-white to-blue-100">
        <CircleSpinner size={56} color="border-green-700" />
      </div>
    );
  }

  // Prevent flashing protected content when KYC is not approved yet
  if (!isAuthPage && !allowedWhenPending && kycStatus !== "approved") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 via-white to-blue-100">
        <CircleSpinner size={56} color="border-green-700" />
      </div>
    );
  }

  return (
    <div className={isWaitingPage ? "fixed inset-0 z-40 flex bg-gradient-to-br from-green-100 via-white to-blue-100" : "h-screen flex overflow-hidden bg-gradient-to-br from-green-100 via-white to-blue-100"}>
      {/* Desktop Sidebar */}
      {!isAuthPage && !isWaitingPage && (
        <div className="hidden md:block md:w-56 h-screen sticky top-0 z-30">
          <ProducerSidebar />
        </div>
      )}

      {/* Mobile Menu Button */}
      {!isAuthPage && !isWaitingPage && (
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden fixed top-4 left-4 z-50 bg-green-600 text-white p-3 rounded-xl shadow-lg hover:bg-green-700 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
        </button>
      )}

      {/* Mobile Sidebar Overlay */}
      {!isAuthPage && !isWaitingPage && mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      {!isAuthPage && !isWaitingPage && (
        <div
          className={`md:hidden fixed top-0 left-0 h-full z-40 transform transition-transform duration-300 ease-in-out ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <ProducerSidebar />
        </div>
      )}

      <main className={`flex-1 ${isWaitingPage ? 'p-0 overflow-hidden h-full' : 'p-4 md:p-8 overflow-x-hidden overflow-y-auto h-screen pt-20 md:pt-8'}`}>{children}</main>
    </div>
  );
}
