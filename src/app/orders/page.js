"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMyOrders } from "@/lib/api/orders";
import Image from "next/image";
import { toast } from "react-toastify";
import { useTranslations } from 'next-intl';
import { userCreateDispute } from "@/lib/api/disputes";
import { 
  FiRefreshCw, 
  FiShoppingBag, 
  FiTruck, 
  FiPackage, 
  FiCheckCircle, 
  FiXCircle,
  FiClock,
  FiAlertTriangle,
  FiMapPin,
  FiCreditCard,
  FiFileText
} from "react-icons/fi";
import { FaBoxOpen, FaExclamationTriangle, FaShoppingBag } from "react-icons/fa";

const STAGE_ORDER = { pending: 0, packed: 1, shipped: 2, delivered: 3 };

function aggregateStatus(items = []) {
  const active = (Array.isArray(items) ? items : []).filter(
    (it) => String(it.status || "pending") !== "cancelled"
  );
  if (active.length === 0) {
    const anyItems = Array.isArray(items) && items.length > 0;
    return anyItems ? "cancelled" : "pending";
  }
  let minStage = Infinity;
  for (const it of active) {
    const s = String(it.status || "pending").toLowerCase();
    const stage = Object.prototype.hasOwnProperty.call(STAGE_ORDER, s) ? STAGE_ORDER[s] : 0;
    if (stage < minStage) minStage = stage;
  }
  const match = Object.entries(STAGE_ORDER).find(([, v]) => v === minStage);
  return match ? match[0] : "pending";
}

export default function MyOrdersPage() {
  const t = useTranslations();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDispute, setShowDispute] = useState(false);
  const [disputeOrderId, setDisputeOrderId] = useState(null);
  const [disputeItemId, setDisputeItemId] = useState(null);
  const [disputeForm, setDisputeForm] = useState({ reason: "", description: "", images: [] });
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);

  async function loadOrders() {
    setLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("userToken") : null;
      if (!token) {
        router.replace("/signin");
        return;
      }
      const data = await getMyOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      if (e?.status === 401 || e?.code === "UNAUTHORIZED") {
        router.replace("/signin");
        return;
      }
      toast.error("Failed to load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openDisputeModal = (orderId, itemId) => {
    setDisputeOrderId(orderId);
    setDisputeItemId(itemId);
    setShowDispute(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 py-4 sm:py-6 px-4">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="orders-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <rect x="0" y="0" width="20" height="20" fill="currentColor" opacity="0.1"/>
              <circle cx="50" cy="50" r="3" fill="currentColor" opacity="0.2"/>
              <circle cx="80" cy="20" r="2" fill="currentColor" opacity="0.3"/>
              <path d="M30 70 L70 70 L70 30 L30 30 Z" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#orders-pattern)" className="text-green-600"/>
        </svg>
      </div>

      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
              <FiPackage className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-green-800">{t('orders.title')}</h1>
              <p className="text-green-600 text-sm md:text-base">{t('orders.loading')}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push('/disputes')}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 transition-all shadow-sm hover:shadow-md"
            >
              <FiAlertTriangle className="text-lg" />
              <span className="hidden sm:inline font-medium">{t('orders.myDisputes')}</span>
            </button>
            <button
              onClick={loadOrders}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-green-200 text-green-700 hover:bg-green-50 transition-all shadow-sm hover:shadow-md"
            >
              <FiRefreshCw className={`text-lg ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline font-medium">{t('orders.refresh')}</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-green-700 font-medium">{t('orders.loading')}</p>
            </div>
          </div>
        ) : !orders.length ? (
          <div className="text-center bg-white rounded-3xl shadow-lg border border-green-100 p-12">
            <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaBoxOpen className="text-green-600 text-5xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">{t('orders.empty')}</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {t('orders.empty')}
            </p>
            <button
              onClick={() => router.push("/shop")}
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              <FiShoppingBag className="text-xl" />
              {t('orders.goToShop')}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const createdAt = order.createdAt ? new Date(order.createdAt) : null;
              const items = Array.isArray(order.OrderItems) ? order.OrderItems : [];
              const overallStatus = aggregateStatus(items);
              
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl shadow-lg border border-green-100 overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  {/* Order Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b border-green-50 bg-gradient-to-r from-green-50 to-emerald-50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl border border-green-200 flex items-center justify-center">
                        <FaShoppingBag className="text-green-600 text-lg" />
                      </div>
                      <div>
                        <div className="text-sm text-green-600 font-medium">{t('orders.orderId')}</div>
                        <div className="text-lg font-bold text-gray-800 font-mono">#{order.id}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <OverallStatusBadge status={overallStatus} />
                      <div className="text-right">
                        <div className="text-sm text-gray-500">{t('orders.refresh')}</div>
                        <div className="text-sm font-medium text-gray-700">
                          {createdAt ? createdAt.toLocaleDateString() : ''}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6">
                      {/* Order Items */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                          <FiPackage className="text-green-600" />
                          {t('orders.items')} ({items.length})
                        </h3>
                        
                        <div className="space-y-3">
                          {items.map((it) => (
                            <div
                              key={it.id ?? `${order.id}-${it.productId}`}
                              className="flex items-start gap-4 p-4 rounded-2xl border border-green-100 hover:bg-green-50 transition-colors"
                            >
                              <Image
                                src={it.Product?.images?.[0] || "/placeholder.png"}
                                alt={it.Product?.title || "Product"}
                                width={80}
                                height={80}
                                className="w-20 h-20 object-cover rounded-2xl border-2 border-green-200"
                              />
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 line-clamp-2 text-lg mb-1">
                                      {it.Product?.title || `Product #${it.productId}`}
                                    </h4>
                                    <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                                      <span className="flex items-center gap-1">
                                        <span className="font-medium">{t('cartPage.quantity')}:</span> {it.quantity}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <span className="font-medium">{t('cartPage.price')}:</span> 
                                        <span className="text-green-700 font-bold">₹{it.price}</span>
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-3">
                                    <StatusBadge status={it.status} />
                                    <button
                                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-red-300 text-red-700 hover:bg-red-50 transition-colors text-sm font-medium"
                                      onClick={() => openDisputeModal(order.id, it.id)}
                                    >
                                      <FiAlertTriangle className="text-sm" />
                                      {t('orders.openDispute')}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Order-level dispute button */}
                        <button
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 border-dashed border-red-300 text-red-700 hover:bg-red-50 transition-colors font-medium"
                          onClick={() => openDisputeModal(order.id, null)}
                        >
                          <FiAlertTriangle className="text-lg" />
                          {t('orders.openDisputeOrder')}
                        </button>
                      </div>

                      {/* Order Summary */}
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200 h-fit">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                          <FiFileText className="text-green-600" />
                          {t('cartPage.orderSummary')}
                        </h3>
                        
                        <div className="space-y-4">
                          {/* Delivery Address */}
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FiMapPin className="text-green-600 text-sm" />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-700 mb-1">{t('orders.address')}</div>
                              <div className="text-sm text-gray-600 leading-relaxed">
                                {order.Address ? (
                                  <>
                                    <div className="font-medium text-gray-800 mb-1">
                                      {order.Address.label ? `${order.Address.label} - ` : ''}{order.Address.contactName}
                                    </div>
                                    <div className="text-sm">
                                      {order.Address.addressLine1}
                                      {order.Address.addressLine2 ? `, ${order.Address.addressLine2}` : ''}
                                      , {order.Address.city}, {order.Address.state} {order.Address.postalCode}, {order.Address.country}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      Phone: {order.Address.contactPhone}
                                    </div>
                                  </>
                                ) : "Address not available"}
                              </div>
                            </div>
                          </div>

                          {/* Payment Method */}
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FiCreditCard className="text-green-600 text-sm" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-700">{t('orders.payment')}</div>
                              <div className="text-sm text-gray-600">
                                {order.paymentMethod === 'PREPAID' ? t('cartPage.prepaid') : t('cartPage.cod')}
                              </div>
                              {overallStatus === 'cancelled' && order.paymentMethod === 'PREPAID' && (
                                <div className="mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
                                  Order cancelled. Your prepaid amount will be refunded in a few days.
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Order Total */}
                          <div className="border-t border-green-200 pt-4">
                            <div className="flex justify-between items-center text-lg font-bold">
                              <span className="text-gray-800">{t('cartPage.totalAmount')}</span>
                              <span className="text-green-700 flex items-center text-xl">
                                ₹{order.total}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Dispute Modal */}
        {showDispute && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-green-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                    <FiAlertTriangle className="text-red-600 text-lg" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-red-700">Open Dispute</h3>
                    <p className="text-sm text-gray-600">
                      Order ID: <span className="font-mono">#{disputeOrderId}</span>
                      {disputeItemId ? ` • Item #${disputeItemId}` : ''}
                    </p>
                  </div>
                </div>
                <button 
                  className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-2xl font-semibold text-gray-400 hover:text-red-600"
                  onClick={() => setShowDispute(false)}
                >
                  &times;
                </button>
              </div>
              
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  setDisputeSubmitting(true);
                  try {
                    await userCreateDispute({ 
                      orderId: disputeOrderId, 
                      orderItemId: disputeItemId || undefined, 
                      reason: disputeForm.reason, 
                      description: disputeForm.description, 
                      images: disputeForm.images 
                    });
                    setShowDispute(false);
                    setDisputeForm({ reason: '', description: '', images: [] });
                    toast.success('Dispute submitted successfully');
                  } catch (err) { 
                    toast.error('Failed to submit dispute'); 
                  } finally { 
                    setDisputeSubmitting(false); 
                  }
                }} 
                className="p-6 space-y-4 max-h-[60vh] overflow-y-auto"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason *
                  </label>
                  <input 
                    value={disputeForm.reason} 
                    onChange={(e) => setDisputeForm(f => ({ ...f, reason: e.target.value }))} 
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all" 
                    placeholder="e.g., Wrong item, Damaged product, Missing item" 
                    required 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea 
                    value={disputeForm.description} 
                    onChange={(e) => setDisputeForm(f => ({ ...f, description: e.target.value }))} 
                    rows={4}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all resize-none" 
                    placeholder="Please describe the issue in detail..." 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supporting Photos (up to 5)
                  </label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    onChange={(e) => setDisputeForm(f => ({ ...f, images: Array.from(e.target.files || []).slice(0, 5) }))} 
                    className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 transition-colors" 
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setShowDispute(false)} 
                    className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={disputeSubmitting}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium transition-all ${
                      disputeSubmitting 
                        ? 'bg-red-400 cursor-not-allowed' 
                        : 'bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {disputeSubmitting && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {disputeSubmitting ? 'Submitting...' : 'Submit Dispute'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const s = String(status || "pending").toLowerCase();
  const config = {
    pending: { color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: FiClock },
    packed: { color: "bg-blue-100 text-blue-700 border-blue-200", icon: FiPackage },
    shipped: { color: "bg-indigo-100 text-indigo-700 border-indigo-200", icon: FiTruck },
    delivered: { color: "bg-green-100 text-green-700 border-green-200", icon: FiCheckCircle },
    cancelled: { color: "bg-red-100 text-red-700 border-red-200", icon: FiXCircle },
  };
  
  const { color, icon: Icon } = config[s] || { color: "bg-gray-100 text-gray-700 border-gray-200", icon: FiClock };
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${color}`}>
      <Icon className="text-xs" />
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  );
}

function OverallStatusBadge({ status }) {
  const s = String(status || "pending").toLowerCase();
  const config = {
    pending: { color: "bg-yellow-500 text-white", icon: FiClock },
    packed: { color: "bg-blue-500 text-white", icon: FiPackage },
    shipped: { color: "bg-indigo-500 text-white", icon: FiTruck },
    delivered: { color: "bg-green-500 text-white", icon: FiCheckCircle },
    cancelled: { color: "bg-red-500 text-white", icon: FiXCircle },
  };
  
  const { color, icon: Icon } = config[s] || { color: "bg-gray-500 text-white", icon: FiClock };
  
  return (
    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold ${color} shadow-md`}>
      <Icon className="text-sm" />
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  );
}