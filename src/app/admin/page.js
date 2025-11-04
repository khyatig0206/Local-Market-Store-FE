"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { fetchAdminDashboard } from "@/lib/api/admin";
import {
  FaShieldAlt,
  FaChartBar,
  FaClipboardList,
  FaUserCheck,
  FaExclamationTriangle,
  FaUsers,
  FaBoxOpen,
  FaLeaf
} from "react-icons/fa";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchAdminDashboard();
        if (mounted) setStats(data);
      } catch (e) {
        if (mounted) setStats({ totalOrders: 0, pendingVerifications: 0, disputes: 0, chart: [] });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const chartData = useMemo(() => {
    return stats?.chart || [];
  }, [stats]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto relative">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 h-40"></div>
              <div className="lg:col-span-2 grid grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 h-40"></div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 h-96"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="admin-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M50,10 L90,90 L10,90 Z" fill="currentColor" opacity="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#admin-pattern)" className="text-blue-600"/>
        </svg>
      </div>

      <div className="max-w-7xl mx-auto relative">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <FaShieldAlt className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
                  Admin Dashboard
                </h1>
                <p className="text-gray-600 mt-1 flex items-center justify-center lg:justify-start gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                  Platform Overview & Management
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-3 justify-center lg:justify-end">
            <Link 
              href="/admin/user-verification" 
              className="px-6 py-3 rounded-xl border-2 border-blue-200 bg-white hover:bg-blue-50 text-blue-700 font-medium transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
            >
              <FaUserCheck />
              Verifications
            </Link>
            <Link 
              href="/admin/disputes" 
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:shadow-lg transition-all duration-200 flex items-center gap-2"
            >
              <FaExclamationTriangle />
              Disputes
            </Link>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Stats Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full -mr-6 -mt-6"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FaShieldAlt className="text-blue-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-600">Admin Control</div>
                  <div className="text-xs text-gray-500">System Status</div>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Platform</span>
                  <span className="font-semibold text-green-600 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Last Updated</span>
                  <span className="font-medium text-gray-800">Just now</span>
                </div>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-4 -mt-4"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <FaClipboardList className="text-white/80" />
                  <div className="text-sm font-medium text-white/90">Total Orders</div>
                </div>
                <div className="text-3xl font-bold">{stats?.totalOrders || 0}</div>
                <div className="text-xs text-white/70 mt-1">All time</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-500 to-amber-500 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-4 -mt-4"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <FaUserCheck className="text-white/80" />
                  <div className="text-sm font-medium text-white/90">Pending KYC</div>
                </div>
                <div className="text-3xl font-bold">{stats?.pendingVerifications || 0}</div>
                <div className="text-xs text-white/70 mt-1">Awaiting review</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-pink-600 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-4 -mt-4"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <FaExclamationTriangle className="text-white/80" />
                  <div className="text-sm font-medium text-white/90">Disputes</div>
                </div>
                <div className="text-3xl font-bold">{stats?.disputes || 0}</div>
                <div className="text-xs text-white/70 mt-1">Open cases</div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          {/* Orders by Category Chart */}
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <FaChartBar className="text-blue-600" />
                Orders by Category
              </h3>
              <span className="text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">Last 30 days</span>
            </div>
            <div className="w-full h-80">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#666" 
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="#666" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Bar 
                      dataKey="orders" 
                      name="Orders"
                      fill="#3b82f6" 
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <FaBoxOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No order data available</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions Footer */}
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
          <h3 className="font-bold text-gray-800 mb-4 text-lg">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link 
              href="/admin/producers" 
              className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <FaLeaf className="text-white" />
              </div>
              <div>
                <div className="font-semibold text-gray-800">Producers</div>
                <div className="text-xs text-gray-600">Manage sellers</div>
              </div>
            </Link>

            <Link 
              href="/admin/user-verification" 
              className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <FaUserCheck className="text-white" />
              </div>
              <div>
                <div className="font-semibold text-gray-800">Verifications</div>
                <div className="text-xs text-gray-600">Review KYC</div>
              </div>
            </Link>

            <Link 
              href="/admin/orders" 
              className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <FaClipboardList className="text-white" />
              </div>
              <div>
                <div className="font-semibold text-gray-800">Orders</div>
                <div className="text-xs text-gray-600">View all orders</div>
              </div>
            </Link>

            <Link 
              href="/admin/disputes" 
              className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <FaExclamationTriangle className="text-white" />
              </div>
              <div>
                <div className="font-semibold text-gray-800">Disputes</div>
                <div className="text-xs text-gray-600">Resolve issues</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
