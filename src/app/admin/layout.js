'use client';
import AdminSidebar from "@/components/AdminSidebar";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import CircleSpinner from "@/components/CircleSpinner";
import { FaBars, FaTimes } from "react-icons/fa";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthPage = pathname.includes("/signin") || pathname.includes("/signup");

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!isAuthPage && !token) {
      setAuthorized(false);
      setChecking(false);
      setTimeout(() => window.location.replace("/admin/signin"), 0);
      return;
    }
    setAuthorized(true);
    setChecking(false);
  }, [pathname, isAuthPage]);

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

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-green-100 via-white to-blue-100">
      {/* Desktop Sidebar */}
      {!isAuthPage && (
        <div className="hidden md:block h-screen sticky top-0 z-30">
          <AdminSidebar />
        </div>
      )}

      {/* Mobile Menu Button */}
      {!isAuthPage && (
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden fixed top-4 left-4 z-50 bg-blue-600 text-white p-3 rounded-xl shadow-lg hover:bg-blue-700 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
        </button>
      )}

      {/* Mobile Sidebar Overlay */}
      {!isAuthPage && mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      {!isAuthPage && (
        <div
          className={`md:hidden fixed top-0 left-0 h-full z-40 transform transition-transform duration-300 ease-in-out ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <AdminSidebar />
        </div>
      )}

      <main className="flex-1 p-4 md:p-8 overflow-x-hidden overflow-y-auto h-screen pt-20 md:pt-8">{children}</main>
    </div>
  );
}
