'use client';
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FaUserShield,
  FaClipboardCheck,
  FaBalanceScale,
  FaMoneyBillWave,
  FaTruckMoving,
  FaFolderOpen,
  FaSignOutAlt,
  FaUserCircle
} from "react-icons/fa";

export default function AdminSidebar() {
  const [adminName, setAdminName] = useState("Admin");
  const router = useRouter();

  useEffect(() => {
    const name = localStorage.getItem("adminName") || "Admin";
    setAdminName(name);
  }, []);

  useEffect(() => {
    const routes = [
      "/admin/user-verification",
      "/admin/manage-categories",
      "/admin/order-monitoring",
      "/admin/disputes",
      // Do not prefetch missing pages to avoid 404 noise
      // "/admin/fee-management",
      // "/admin/delivery-dashboard",
    ];
    routes.forEach((r) => router.prefetch(r));
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/admin/signin");
  };

  return (
    <aside className="w-64 h-screen bg-white shadow-lg border-r p-6 flex flex-col justify-between overflow-y-auto">
      <div>
        <div
          className="flex items-center gap-3 mb-8 cursor-pointer group"
          onClick={() => router.push('/admin')}
          tabIndex={0}
          role="button"
          aria-label="Go to Admin Home"
        >
          <FaUserCircle className="text-3xl text-blue-700 group-hover:text-blue-800 transition" />
          <div>
            <div className="text-lg font-bold text-blue-700 group-hover:text-blue-800 transition">
              {adminName}
            </div>
            <div className="text-sm text-gray-500 group-hover:text-blue-700 transition">Admin Dashboard</div>
          </div>
        </div>

        <nav className="flex flex-col gap-4 text-gray-700">
          <Link href="/admin/user-verification" prefetch className="flex items-center gap-2 hover:text-blue-700 transition-colors">
            <FaUserShield /> User Verification
          </Link>
          <Link href="/admin/manage-categories" prefetch className="flex items-center gap-2 hover:text-blue-700 transition-colors">
            <FaFolderOpen /> Manage Categories
          </Link>
          <Link href="/admin/order-monitoring" prefetch className="flex items-center gap-2 hover:text-blue-700 transition-colors">
            <FaClipboardCheck /> Order Monitoring
          </Link>
          <Link href="/admin/disputes" prefetch className="flex items-center gap-2 hover:text-blue-700 transition-colors">
            <FaBalanceScale /> Dispute Resolution
          </Link>
          <Link href="/admin/fee-management" prefetch={false} className="flex items-center gap-2 hover:text-blue-700 transition-colors">
            <FaMoneyBillWave /> Fee Management
          </Link>
          <Link href="/admin/delivery-dashboard" prefetch={false} className="flex items-center gap-2 hover:text-blue-700 transition-colors">
            <FaTruckMoving /> Delivery Dashboard
          </Link>
          
        </nav>
      </div>

      <button
        onClick={handleLogout}
        className="mt-8 flex items-center gap-2 text-red-600 hover:text-red-800 text-sm transition-colors"
      >
        <FaSignOutAlt /> Logout
      </button>
    </aside>
  );
}
