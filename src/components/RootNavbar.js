"use client";
import Navbar from "@/components/Navbar";
import { usePathname } from "next/navigation";

import MiniCartToast from "@/components/MiniCartToast";
import UserPushInit from "@/components/UserPushInit";

export default function RootNavbar() {
  const pathname = usePathname();
  // Hide navbar for admin and internal producer dashboard routes only
  // Keep it visible for public pages like /producers and /producer-profile/[id]
  const hideNavbar = pathname.startsWith('/admin') || pathname === '/producer' || pathname.startsWith('/producer/');
  if (hideNavbar) return null;
  return (
    <>
      <Navbar />
      <MiniCartToast />
      {/* Register customer push notifications */}
      <UserPushInit />
    </>
  );
}
