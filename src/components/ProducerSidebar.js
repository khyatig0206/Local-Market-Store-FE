'use client';
import Link from "next/link";
import {
  FaBoxOpen,
  FaClipboardList,
  FaMoneyCheckAlt,
  FaUserCircle,
  FaChartBar,
  FaFileUpload,
  FaSignOutAlt,
  FaBalanceScale,
} from "react-icons/fa";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from 'next/image';

export default function ProducerSidebar() {
  const [producer, setProducer] = useState({ businessName: "", businessLogo: "" });
  const router = useRouter();
  const [localeUI, setLocaleUI] = useState('en');
  useEffect(() => { try { setLocaleUI(localStorage.getItem('locale') || 'en'); } catch {} }, []);

  useEffect(() => {
  const updateProducer = () => {
    const name = localStorage.getItem("businessName") || "";
    const logo = localStorage.getItem("businessLogo") || "";
    setProducer({ businessName: name, businessLogo: logo });
  };

  // Initial load
  updateProducer();

  // Listen to custom storage change
  window.addEventListener("localStorageUpdate", updateProducer);

  return () => {
    window.removeEventListener("localStorageUpdate", updateProducer);
  };
}, []);


  useEffect(() => {
    const routes = [
      "/producer/profile",
      "/producer/kyc",
      "/producer/products",
      "/producer/orders",
      "/producer/payouts",
      "/producer/analytics",
      "/producer/disputes",
    ];
    routes.forEach((r) => router.prefetch(r));
  }, [router]);

  const handleLogout = async () => {
    try {
      const { getFcmToken } = await import('@/lib/firebase');
      const { unregisterProducerPushToken } = await import('@/lib/api/push');
      const token = await getFcmToken();
      if (token) {
        try { await unregisterProducerPushToken(token); } catch {}
      }
    } catch {}
    localStorage.clear(); // or selectively remove: removeItem('token') etc.
    router.push("/producer/signin");
  };

  return (
    <aside className="w-56 bg-white shadow-lg border-r p-6 hidden md:flex flex-col h-screen">
      <div>
        <div className="flex items-center gap-3 mb-2">
          {producer.businessLogo ? (
            <div className="relative h-12 w-12 rounded-full overflow-hidden border">
              <Image
                src={producer.businessLogo}
                alt="Logo"
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
          ) : (
            <FaUserCircle className="text-3xl text-green-700" />
          )}
          <div>
            <div className="text-lg font-bold text-green-700">
              {producer.businessName || "Producer"}
            </div>
            <div className="text-sm text-gray-500">Dashboard</div>
          </div>
        </div>
        <div className="flex-1" />
        {/* Language selector */}
      <div className="mb-6">
        <select
          aria-label="Language"
          className="w-full border border-green-600 text-green-700 rounded px-2 py-1 text-xs bg-white"
          value={localeUI}
          onChange={(e) => {
            const l = e.target.value;
            setLocaleUI(l);
            try { document.cookie = `locale=${l}; path=/; max-age=31536000`; } catch {}
            try { localStorage.setItem('locale', l); } catch {}
            window.location.reload();
          }}
        >
          <option value="en">EN</option>
          <option value="hi">हिं</option>
          <option value="or">ଓଡ଼ିଆ</option>
        </select>
      </div>

        <nav className="flex flex-col gap-4 text-gray-700">
          <Link href="/producer" prefetch className="flex items-center gap-2 hover:text-green-700">
            <FaUserCircle /> Business Profile
          </Link>
          <Link href="/producer/kyc" prefetch className="flex items-center gap-2 hover:text-green-700">
            <FaFileUpload /> KYC & Documents
          </Link>
          <Link href="/producer/products" prefetch className="flex items-center gap-2 hover:text-green-700">
            <FaBoxOpen /> Product Listings
          </Link>
          <Link href="/producer/orders" prefetch className="flex items-center gap-2 hover:text-green-700">
            <FaClipboardList /> Orders
          </Link>
          <Link href="/producer/payouts" prefetch className="flex items-center gap-2 hover:text-green-700">
            <FaMoneyCheckAlt /> Payouts
          </Link>
          <Link href="/producer/analytics" prefetch className="flex items-center gap-2 hover:text-green-700">
            <FaChartBar /> Sales Analytics
          </Link>
          <Link href="/producer/disputes" prefetch className="flex items-center gap-2 hover:text-green-700">
            <FaBalanceScale /> Disputes
          </Link>
        </nav>
      </div>

      
      <div className="flex-1" />


      <button
        onClick={handleLogout}
        className="mb-2 flex items-center gap-2 text-red-600 hover:text-red-800 text-sm"
      >
        <FaSignOutAlt /> Logout
      </button>
    </aside>
  );
}
