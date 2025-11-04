"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from 'next-intl';
import {
  FaBoxOpen,
  FaClipboardList,
  FaMoneyCheckAlt,
  FaUserCircle,
  FaChartBar,
  FaFileUpload,
  FaTruck,
  FaStar,
  FaLeaf,
  FaWarehouse,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaExclamationTriangle,
  FaCheckCircle
} from "react-icons/fa";
import { getProducerProfile, getProducerAnalytics, updateProducerLocation } from "@/lib/api/producers";
import { fetchCategoriesAPI } from "@/lib/api/categories";
import Image from "next/image";
import UpdateProfileProducerModal from "@/components/UpdateProfileProducerModal";
import { toast } from "react-toastify";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

export default function ProducerDashboard() {
  const t = useTranslations();
  const [profile, setProfile] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allCategories, setAllCategories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [capturingLocation, setCapturingLocation] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [p, a, cats] = await Promise.all([
          getProducerProfile(),
          getProducerAnalytics(),
          fetchCategoriesAPI(),
        ]);
        setProfile(p);
        setAnalytics(a);
        setAllCategories(cats || []);
      } catch {
        // non-blocking
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const series = useMemo(() => {
    if (!analytics?.series) return [];
    return analytics.series.slice(-10).map(p => ({
      day: formatDayLabel(p.day),
      orders: p.orders,
      revenue: Number(p.revenue || 0),
    }));
  }, [analytics]);

  const ratings = useMemo(() => {
    const buckets = analytics?.reviews?.distribution || [];
    return [1,2,3,4,5].map(r => {
      const f = buckets.find(b => Number(b.rating) === r);
      return { rating: r, count: f ? Number(f.count) : 0 };
    });
  }, [analytics]);

  function formatDayLabel(d) {
    try { const dt = new Date(d); return `${dt.getMonth()+1}/${dt.getDate()}`; } catch { return String(d); }
  }

  const handleCaptureLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setCapturingLocation(true);
    const startTime = Date.now();
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        try {
          await updateProducerLocation(lat, lon);
          toast.success("Farm location captured successfully!");
          
          // Refresh profile to show updated coordinates
          const updatedProfile = await getProducerProfile();
          setProfile(updatedProfile);
        } catch (error) {
          toast.error(error.message || "Failed to save location");
        } finally {
          setCapturingLocation(false);
        }
      },
      (error) => {
        const elapsed = Date.now() - startTime;
        setCapturingLocation(false);
        
        if (elapsed < 500) {
          console.log("Ignoring quick error, likely permission prompt");
          return;
        }
        
        if (error.code === 1) {
          toast.error("Location access denied. Please enable location permissions.");
        } else if (error.code === 2) {
          toast.error("Unable to determine your location. Please try again.");
        } else if (error.code === 3) {
          toast.error("Location request timed out. Please try again.");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Loading skeleton
  if (loading) {
    return (
      
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-2xl p-6 h-32"></div>
              <div className="lg:col-span-2 grid grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 h-32"></div>
                ))}
              </div>
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
            <pattern id="leaves" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M20,50 C30,30 70,30 80,50 C70,70 30,70 20,50 Z" fill="currentColor" opacity="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#leaves)" className="text-green-600"/>
        </svg>
      </div>

      <div className="max-w-7xl mx-auto relative">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <FaLeaf className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
                {t('producer.dashboard.welcome')}{profile?.businessName ? `, ${profile.businessName}` : ''}
                </h1>
                <p className="text-gray-600 mt-1 flex items-center justify-center lg:justify-start gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  {t('producer.dashboard.subtitle')}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-3 justify-center lg:justify-end">
            <button 
              onClick={() => setModalOpen(true)} 
              className="px-6 py-3 rounded-xl border-2 border-green-200 bg-white hover:bg-green-50 text-green-700 font-medium transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
            >
              <FaUserCircle />
              {t('producer.dashboard.updateProfile')}
            </button>
            <Link 
              href="/producer/analytics" 
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium hover:shadow-lg transition-all duration-200 flex items-center gap-2"
            >
              <FaChartBar />
              {t('producer.dashboard.fullAnalytics')}
            </Link>
          </div>
        </div>

        {/* Profile Summary + KPIs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-50 to-emerald-50 rounded-full -mr-6 -mt-6"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-4 border-green-100 shadow-md">
                {profile?.businessLogo ? (
                  <Image src={`${profile.businessLogo}`} alt="Logo" fill sizes="80px" className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                    <FaWarehouse className="text-green-600 text-2xl" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-gray-800 text-lg truncate">{profile?.businessName || t('producer.dashboard.profileCard.defaultBusinessName')}</div>
                <div className="text-sm text-gray-500 truncate flex items-center gap-1 mt-1">
                  <FaEnvelope className="text-green-600" />
                  {profile?.email}
                </div>
                {profile?.Categories && profile.Categories.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {profile.Categories.slice(0,3).map(c => (
                      <span key={c.id} className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 font-medium">
                        {c.name}
                      </span>
                    ))}
                    {profile.Categories.length > 3 && (
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-50 text-gray-600 border">+{profile.Categories.length - 3}</span>
                    )}
                  </div>
                )}
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
                  <div className="text-sm font-medium text-white/90">{t('producer.dashboard.kpis.totalOrders.title')}</div>
                </div>
                <div className="text-3xl font-bold">{analytics?.totals?.totalOrders || 0}</div>
                <div className="text-xs text-white/70 mt-1">{t('producer.dashboard.kpis.totalOrders.subtitle')}</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-4 -mt-4"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <FaMoneyCheckAlt className="text-white/80" />
                  <div className="text-sm font-medium text-white/90">{t('producer.dashboard.kpis.grossRevenue.title')}</div>
                </div>
                <div className="text-3xl font-bold">₹{Number(analytics?.totals?.totalRevenue||0).toFixed(0)}</div>
                <div className="text-xs text-white/70 mt-1">{t('producer.dashboard.kpis.grossRevenue.subtitle')}</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-4 -mt-4"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <FaStar className="text-white/80" />
                  <div className="text-sm font-medium text-white/90">{t('producer.dashboard.kpis.avgRating.title')}</div>
                </div>
                <div className="text-3xl font-bold">{Number(analytics?.reviews?.averageRating||0).toFixed(1)}</div>
                <div className="text-xs text-white/70 mt-1">{t('producer.dashboard.kpis.avgRating.subtitle', { count: analytics?.reviews?.totalReviews||0 })}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Orders & Revenue Chart */}
          <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <FaChartBar className="text-green-600" />
                {t('producer.dashboard.charts.ordersRevenue.title')}
              </h3>
              <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">{t('producer.dashboard.charts.rangeLast10')}</span>
            </div>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" stroke="#666" fontSize={12} />
                  <YAxis yAxisId="left" orientation="left" stroke="#666" fontSize={12} />
                  <YAxis yAxisId="right" orientation="right" stroke="#666" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Line 
                    yAxisId="left" 
                    type="monotone" 
                    dataKey="orders" 
                    name={t('producer.dashboard.charts.ordersLabel')} 
                    stroke="#3b82f6" 
                    strokeWidth={3} 
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#1d4ed8' }}
                  />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="revenue" 
                    name={t('producer.dashboard.charts.revenueLabel')} 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#047857' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <FaStar className="text-amber-500" />
                {t('producer.dashboard.ratings.title')}
              </h3>
              <span className="text-xs text-gray-500 bg-amber-50 px-2 py-1 rounded-full">
                {t('producer.dashboard.ratings.avgPrefix')} {Number(analytics?.reviews?.averageRating||0).toFixed(1)}★
              </span>
            </div>
            <div className="w-full h-64">
              <ResponsiveContainer>
                <BarChart data={ratings}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="rating" tickFormatter={(v)=>`${v}★`} stroke="#666" fontSize={12} />
                  <YAxis allowDecimals={false} stroke="#666" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#f59e0b" 
                    radius={[4, 4, 0, 0]}
                    className="hover:opacity-80 transition-opacity"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Business Details Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Business Information */}
          <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
              <FaWarehouse className="text-green-600" />
              {t('producer.dashboard.businessInfo.title')}
            </h3>
            <div className="space-y-4">
              {profile?.phoneNumber && (
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <FaPhone className="text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">{t('producer.dashboard.businessInfo.phone')}</div>
                    <div className="font-medium text-gray-800">{profile.phoneNumber}</div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FaEnvelope className="text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">{t('producer.dashboard.businessInfo.email')}</div>
                  <div className="font-medium text-gray-800">{profile?.email}</div>
                </div>
              </div>

              {profile?.description && (
                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="text-sm text-gray-500 mb-1">{t('producer.dashboard.businessInfo.description')}</div>
                  <div className="text-gray-700 leading-relaxed">{profile.description}</div>
                </div>
              )}

              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">{t('producer.dashboard.businessInfo.categories')}</div>
                <div className="flex flex-wrap gap-2">
                  {(profile?.Categories || []).map(catRel => {
                    const cat = allCategories.find(c => c.id === catRel.id);
                    if (!cat) return (
                      <span key={catRel.id} className="px-3 py-2 rounded-xl border text-sm bg-gray-50 text-gray-700">
                        {catRel.name || `#${catRel.id}`}
                      </span>
                    );
                    return (
                      <div key={cat.id} className="flex items-center gap-2 border border-green-200 rounded-xl px-3 py-2 text-sm shadow-sm bg-gradient-to-r from-green-50 to-emerald-50">
                        {cat.photo && <Image src={cat.photo} alt={cat.name} width={20} height={20} className="w-5 h-5 rounded" />}
                        <span className="font-medium text-green-800">{cat.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
              <FaMapMarkerAlt className="text-red-500" />
              {t('producer.dashboard.address.title')}
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <FaWarehouse className="text-green-600 text-sm" />
                  </div>
                  <div className="font-medium text-green-800">{t('producer.dashboard.address.businessAddress')}</div>
                </div>
                <div className="text-gray-700 text-sm leading-relaxed pl-10">
                  {[profile?.businessAddressLine1, profile?.businessAddressLine2, profile?.businessCity, profile?.businessState, profile?.businessPostalCode, profile?.businessCountry].filter(Boolean).join(', ') || t('producer.dashboard.address.notSpecified')}
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FaUserCircle className="text-blue-600 text-sm" />
                  </div>
                  <div className="font-medium text-blue-800">{t('producer.dashboard.address.permanentAddress')}</div>
                </div>
                <div className="text-gray-700 text-sm leading-relaxed pl-10">
                  {[profile?.addressLine1, profile?.addressLine2, profile?.city, profile?.state, profile?.postalCode, profile?.country].filter(Boolean).join(', ') || t('producer.dashboard.address.notSpecified')}
                </div>
              </div>

              {/* Farm Location Coordinates */}
              {profile?.latitude && profile?.longitude ? (
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-300">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <FaMapMarkerAlt className="text-green-600 text-sm" />
                    </div>
                    <div className="font-medium text-green-800">Farm Location</div>
                    <span className="ml-auto px-2 py-0.5 bg-green-600 text-white text-xs font-bold rounded-full">✓</span>
                  </div>
                  <div className="pl-10 space-y-1">
                    <div className="text-xs text-green-700">
                      <span className="font-semibold">Lat:</span> <span className="font-mono bg-white px-2 py-0.5 rounded">{profile.latitude.toFixed(6)}</span>
                    </div>
                    <div className="text-xs text-green-700">
                      <span className="font-semibold">Lng:</span> <span className="font-mono bg-white px-2 py-0.5 rounded">{profile.longitude.toFixed(6)}</span>
                    </div>
                  <p className="flex items-center text-xs text-green-600 mt-1 gap-1">
                    <FaMapMarkerAlt className="text-green-600 text-sm" />
                    Visible to nearby buyers
                  </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border-2 border-amber-300">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                      <FaExclamationTriangle className="text-amber-600 text-sm" />
                    </div>
                    <div className="font-medium text-amber-800">Farm Location</div>
                    <span className="ml-auto px-2 py-0.5 bg-amber-600 text-white text-xs font-bold rounded-full animate-pulse">!</span>
                  </div>
                  <div className="pl-10">
                    <p className="text-xs text-amber-900 mb-2">
                      <strong>Not captured yet.</strong> Add your farm location to get discovered by local buyers!
                    </p>
                    <button
                      onClick={handleCaptureLocation}
                      disabled={capturingLocation}
                      className="inline-flex items-center gap-1 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:cursor-wait"
                    >
                      {capturingLocation ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Capturing...
                        </>
                      ) : (
                        <>
                          <FaMapMarkerAlt />
                          Capture Now
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions Footer */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg border border-green-100 p-6">
          <h3 className="font-bold text-gray-800 mb-4 text-lg">{t('producer.dashboard.quickActions.title')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/producer/products" className="p-4 bg-green-50 rounded-xl border border-green-200 hover:bg-green-100 transition-colors group text-center">
              <FaBoxOpen className="text-green-600 text-2xl mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <div className="font-medium text-green-800">{t('producer.dashboard.quickActions.products.title')}</div>
              <div className="text-xs text-green-600">{t('producer.dashboard.quickActions.products.subtitle')}</div>
            </Link>
            <Link href="/producer/orders" className="p-4 bg-blue-50 rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors group text-center">
              <FaClipboardList className="text-blue-600 text-2xl mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <div className="font-medium text-blue-800">{t('producer.dashboard.quickActions.orders.title')}</div>
              <div className="text-xs text-blue-600">{t('producer.dashboard.quickActions.orders.subtitle')}</div>
            </Link>
            <Link href="/producer/analytics" className="p-4 bg-purple-50 rounded-xl border border-purple-200 hover:bg-purple-100 transition-colors group text-center">
              <FaChartBar className="text-purple-600 text-2xl mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <div className="font-medium text-purple-800">{t('producer.dashboard.quickActions.analytics.title')}</div>
              <div className="text-xs text-purple-600">{t('producer.dashboard.quickActions.analytics.subtitle')}</div>
            </Link>
            <button 
              onClick={() => setModalOpen(true)}
              className="p-4 bg-amber-50 rounded-xl border border-amber-200 hover:bg-amber-100 transition-colors group text-center"
            >
              <FaUserCircle className="text-amber-600 text-2xl mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <div className="font-medium text-amber-800">{t('producer.dashboard.quickActions.profile.title')}</div>
              <div className="text-xs text-amber-600">{t('producer.dashboard.quickActions.profile.subtitle')}</div>
            </button>
          </div>
        </div>
      </div>

      {/* Update Profile Modal */}
      {modalOpen && (
        <UpdateProfileProducerModal
          initialData={JSON.parse(JSON.stringify(profile))}
          token={''}
          onClose={() => setModalOpen(false)}
          onProfileUpdated={(updated) => setProfile(updated)}
        />
      )}
    </div>
  );
}