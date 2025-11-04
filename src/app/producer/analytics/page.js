'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { getProducerAnalytics } from '@/lib/api/producers';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { 
  FaChartLine, 
  FaShoppingBag, 
  FaRupeeSign, 
  FaStar, 
  FaUsers, 
  FaBox, 
  FaArrowLeft,
  FaCalendarAlt,
  FaWallet,
  FaChartBar,
  FaRegSmile,
  FaRegChartBar
} from 'react-icons/fa';

const COLORS = ['#16a34a', '#22c55e', '#86efac', '#4ade80', '#a7f3d0'];

// SVG Pattern Component
const GridPattern = () => (
  <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="grid-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1" fill="currentColor" opacity="0.1" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grid-pattern)" />
  </svg>
);

function formatDayLabel(d) {
  try {
    const dt = new Date(d);
    return `${dt.getMonth()+1}/${dt.getDate()}`;
  } catch {
    return String(d);
  }
}

export default function ProducerAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeChart, setActiveChart] = useState('orders');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await getProducerAnalytics();
        setData(res);
      } catch (e) {
        toast.error(e?.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const series = useMemo(() => {
    if (!data?.series) return [];
    return data.series.map(p => ({
      day: formatDayLabel(p.day),
      orders: p.orders,
      revenue: Number(p.revenue || 0),
    }));
  }, [data]);

  const ratingDistribution = useMemo(() => {
    const buckets = data?.reviews?.distribution || [];
    const byRating = [1,2,3,4,5].map(r => {
      const found = buckets.find(b => Number(b.rating) === r);
      return { rating: r, count: found ? Number(found.count) : 0, name: `${r} Star` };
    });
    return byRating;
  }, [data]);

  const paymentSeries = useMemo(() => {
    return (data?.payments?.creditsByDay || []).map(p => ({
      day: formatDayLabel(p.day),
      credits: Number(p.amount || 0),
    }));
  }, [data]);

  // Calculate additional stats for cards
  const stats = useMemo(() => {
    const totals = data?.totals || {};
    const reviews = data?.reviews || {};
    
    return {
      totalOrders: totals.totalOrders || 0,
      totalItems: totals.totalItemsSold || 0,
      totalRevenue: Number(totals.totalRevenue || 0),
      avgOrderValue: Number(totals.avgOrderValue || 0),
      avgRating: Number(reviews.averageRating || 0),
      totalReviews: reviews.totalReviews || 0,
      totalCustomers: totals.uniqueCustomers || 0
    };
  }, [data]);

  return (
    

      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                <FaChartLine className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Sales Analytics</h1>
                <p className="text-gray-600 mt-1">Track your sales performance and customer feedback</p>
              </div>
            </div>
            
            <Link 
              href="/producer" 
              className="flex items-center gap-2 px-6 py-3 bg-white border border-green-200 text-green-700 rounded-xl hover:bg-green-50 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <FaArrowLeft className="text-sm" />
              Back to Dashboard
            </Link>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Orders</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalOrders}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FaShoppingBag className="text-blue-600 text-xl" />
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-2">All time orders</div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Items Sold</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalItems}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <FaBox className="text-green-600 text-xl" />
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-2">Total products sold</div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Revenue</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">₹{stats.totalRevenue.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <FaRupeeSign className="text-emerald-600 text-xl" />
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-2">Gross earnings</div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Avg Rating</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{stats.avgRating.toFixed(1)}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <FaStar className="text-yellow-600 text-xl" />
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-2">{stats.totalReviews} reviews</div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 text-center shadow-lg border border-gray-100/50">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="text-gray-600 font-medium">Loading your farm analytics...</div>
            <div className="text-gray-400 text-sm mt-2">Gathering your sales data and insights</div>
          </div>
        ) : !data ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 text-center shadow-lg border border-gray-100/50">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaChartLine className="text-gray-400 text-3xl" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No analytics data yet</h3>
            <p className="text-gray-500 mb-6">Your analytics will appear here once you start receiving orders</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Orders & Revenue Chart */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100/50 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FaChartBar className="text-green-600 text-lg" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">Sales Performance</h2>
                      <p className="text-sm text-gray-600">Last 30 days overview</p>
                    </div>
                  </div>
                  
                  <div className="flex bg-gray-100 rounded-xl p-1">
                    <button
                      onClick={() => setActiveChart('orders')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeChart === 'orders' 
                          ? 'bg-white text-green-700 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      Orders & Revenue
                    </button>
                    <button
                      onClick={() => setActiveChart('credits')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeChart === 'credits' 
                          ? 'bg-white text-green-700 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      Wallet Credits
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="w-full h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    {activeChart === 'orders' ? (
                      <LineChart data={series} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="day" 
                          tick={{ fill: '#6b7280', fontSize: 12 }}
                          tickLine={false}
                        />
                        <YAxis 
                          yAxisId="left" 
                          orientation="left" 
                          tick={{ fill: '#6b7280', fontSize: 12 }}
                          tickLine={false}
                        />
                        <YAxis 
                          yAxisId="right" 
                          orientation="right" 
                          tick={{ fill: '#6b7280', fontSize: 12 }}
                          tickLine={false}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                          }}
                        />
                        <Legend />
                        <Line 
                          yAxisId="left" 
                          type="monotone" 
                          dataKey="orders" 
                          name="Orders" 
                          stroke="#3b82f6" 
                          strokeWidth={3} 
                          dot={false}
                          activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: 'white' }}
                        />
                        <Line 
                          yAxisId="right" 
                          type="monotone" 
                          dataKey="revenue" 
                          name="Revenue (₹)" 
                          stroke="#16a34a" 
                          strokeWidth={3} 
                          dot={false}
                          activeDot={{ r: 6, stroke: '#16a34a', strokeWidth: 2, fill: 'white' }}
                        />
                      </LineChart>
                    ) : (
                      <LineChart data={paymentSeries} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="day" 
                          tick={{ fill: '#6b7280', fontSize: 12 }}
                          tickLine={false}
                        />
                        <YAxis 
                          tick={{ fill: '#6b7280', fontSize: 12 }}
                          tickLine={false}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                          }}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="credits" 
                          name="Credits (₹)" 
                          stroke="#10b981" 
                          strokeWidth={3} 
                          dot={false}
                          activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: 'white' }}
                        />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Ratings and Reviews Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Rating Distribution */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100/50 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <FaStar className="text-yellow-600 text-lg" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">Customer Ratings</h2>
                      <p className="text-sm text-gray-600">How customers rate your products</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="w-full h-72">
                    <ResponsiveContainer>
                      <BarChart data={ratingDistribution}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="rating" 
                          tickFormatter={(v) => `${v}★`}
                          tick={{ fill: '#6b7280', fontSize: 12 }}
                          tickLine={false}
                        />
                        <YAxis 
                          allowDecimals={false}
                          tick={{ fill: '#6b7280', fontSize: 12 }}
                          tickLine={false}
                        />
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
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center justify-between mt-4 p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                    <div className="flex items-center gap-2">
                      <FaRegSmile className="text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">Average Rating</span>
                    </div>
                    <div className="text-lg font-bold text-yellow-700">
                      {stats.avgRating.toFixed(1)}/5.0
                    </div>
                    <div className="text-sm text-yellow-600">
                      ({stats.totalReviews} reviews)
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Reviews */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100/50 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FaUsers className="text-blue-600 text-lg" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">Recent Reviews</h2>
                      <p className="text-sm text-gray-600">Latest customer feedback</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4 max-h-72 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    {(data?.reviews?.recent || []).length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <FaRegChartBar className="text-3xl mx-auto mb-2 text-gray-400" />
                        <p>No reviews yet</p>
                        <p className="text-sm">Customer reviews will appear here</p>
                      </div>
                    ) : (
                      data.reviews.recent.map((r, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-xl p-4 hover:border-green-300 transition-colors bg-white/50">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-green-600 text-sm font-bold">
                                  {(r.User?.username || 'A')[0].toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-gray-800">{r.User?.username || 'Anonymous Customer'}</div>
                                <div className="text-xs text-gray-500">
                                  {new Date(r.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-yellow-500">
                              {'★'.repeat(r.rating)}
                              {'☆'.repeat(5 - r.rating)}
                            </div>
                          </div>
                          
                          {r.Product?.title && (
                            <div className="text-xs text-gray-600 mb-2">
                              Product: <span className="font-medium text-gray-800">{r.Product.title}</span>
                            </div>
                          )}
                          
                          {r.comment && (
                            <div className="text-gray-700 text-sm bg-gray-50 rounded-lg p-3">
                              "{r.comment}"
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-gray-100/50">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <FaUsers className="text-purple-600 text-xl" />
                </div>
                <div className="text-2xl font-bold text-gray-800">{stats.totalCustomers}</div>
                <div className="text-sm text-gray-600">Unique Customers</div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-gray-100/50">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <FaRupeeSign className="text-orange-600 text-xl" />
                </div>
                <div className="text-2xl font-bold text-gray-800">₹{stats.avgOrderValue.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Average Order Value</div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-gray-100/50">
                <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <FaWallet className="text-cyan-600 text-xl" />
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  {series.length > 0 ? series[series.length - 1]?.orders || 0 : 0}
                </div>
                <div className="text-sm text-gray-600">Orders This Month</div>
              </div>
            </div>
          </div>
        )}
      </div>
    
  );
}