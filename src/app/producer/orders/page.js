"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getProducerOrders, updateOrderStatusProducer, updateOrderPaymentStatusProducer, getProducerOrderStats } from "@/lib/api/orders";
import Image from "next/image";
import { toast } from "react-toastify";
import { 
  FaSearch, 
  FaSync, 
  FaBox, 
  FaShippingFast, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaClock,
  FaMoneyBillWave,
  FaMapMarkerAlt,
  FaUser,
  FaPhone,
  FaShoppingBag,
  FaRupeeSign,
  FaFilter
} from "react-icons/fa";

const STAGE_ORDER = { pending: 0, packed: 1, shipped: 2, delivered: 3 };

function aggregateStatus(items = []) {
  const active = (items || []).filter((it) => String(it.status || "pending") !== "cancelled");
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

export default function ProducerOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState({});
  const [orderStats, setOrderStats] = useState({ total: 0, pending: 0, packed: 0, shipped: 0, delivered: 0, cancelled: 0, revenue: 0 });

  const loadOrders = async (pageNum = 1, replace = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        router.replace("/producer/signin");
        return;
      }
      const data = await getProducerOrders({ page: pageNum, limit: 10 });
      
      if (data.items) {
        setOrders(prev => replace ? data.items : [...prev, ...data.items]);
        setHasMore(data.hasMore);
        setPage(pageNum);
      } else {
        setOrders(Array.isArray(data) ? data : []);
        setHasMore(false);
      }
      if (pageNum === 1) {
        try {
          const s = await getProducerOrderStats();
          setOrderStats({
            total: Number(s.total || 0),
            pending: Number(s.pending || 0),
            packed: Number(s.packed || 0),
            shipped: Number(s.shipped || 0),
            delivered: Number(s.delivered || 0),
            cancelled: Number(s.cancelled || 0),
            revenue: Number(s.revenue || 0)
          });
        } catch {}
      }
    } catch (e) {
      if (e?.status === 401 || e?.code === "UNAUTHORIZED") {
        router.replace("/producer/signin");
        return;
      }
      toast.error("Failed to load producer orders");
      if (pageNum === 1) setOrders([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadOrders(1, true);
  }, []);

  async function handleUpdateStatus(orderId, status) {
    const isItemLevel = ["pending", "packed", "shipped", "delivered", "cancelled"].includes(String(status));

    let snapshot = null;
    setOrders((prev) => {
      return prev.map((o) => {
        if (o.orderId !== orderId) return o;
        snapshot = {
          ...o,
          order: { ...(o.order || {}) },
          items: (o.items || []).map((it) => ({ ...it })),
        };
        let nextItems = o.items || [];
        if (isItemLevel) {
          nextItems = nextItems.map((it) => ({ ...it, status }));
        }
        return {
          ...o,
          order: { ...(o.order || {}) },
          items: nextItems,
        };
      });
    });
    setUpdating((prev) => ({ ...prev, [orderId]: true }));

    try {
      const resp = await updateOrderStatusProducer(orderId, status);
      const updatedItemIds = Array.isArray(resp?.updatedItemIds) ? resp.updatedItemIds : [];

      setOrders((prev) =>
        prev.map((o) => {
          if (o.orderId !== orderId) return o;
          let nextItems = o.items || [];
          if (isItemLevel && updatedItemIds.length > 0) {
            nextItems = nextItems.map((it) =>
              updatedItemIds.includes(it.id) ? { ...it, status } : it
            );
          }
          return {
            ...o,
            order: { ...(o.order || {}) },
            items: nextItems,
          };
        })
      );

      toast.success(`Order #${orderId} marked as ${status}`);
    } catch (e) {
      if (snapshot) {
        setOrders((prev) => prev.map((o) => (o.orderId === orderId ? snapshot : o)));
      }
      if (e?.status === 401 || e?.code === "UNAUTHORIZED") {
        router.replace("/producer/signin");
        return;
      }
      toast.error("Failed to update status");
    } finally {
      setUpdating((prev) => {
        const copy = { ...prev };
        delete copy[orderId];
        return copy;
      });
    }
  }

  async function handleUpdatePaymentStatus(orderId, paymentStatus) {
    let snapshot = null;
    setOrders((prev) => {
      return prev.map((o) => {
        if (o.orderId !== orderId) return o;
        snapshot = {
          ...o,
          order: { ...(o.order || {}) },
          items: (o.items || []).map((it) => ({ ...it })),
        };
        return {
          ...o,
          order: { ...(o.order || {}), paymentStatus },
          items: o.items || [],
        };
      });
    });
    setUpdating((prev) => ({ ...prev, [orderId]: true }));

    try {
      await updateOrderPaymentStatusProducer(orderId, paymentStatus);
      toast.success(`Order #${orderId} payment status updated to ${paymentStatus}`);
    } catch (e) {
      if (snapshot) {
        setOrders((prev) => prev.map((o) => (o.orderId === orderId ? snapshot : o)));
      }
      if (e?.status === 401 || e?.code === "UNAUTHORIZED") {
        router.replace("/producer/signin");
        return;
      }
      toast.error("Failed to update payment status");
    } finally {
      setUpdating((prev) => {
        const copy = { ...prev };
        delete copy[orderId];
        return copy;
      });
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      const currentStatus = aggregateStatus(o.items);
      const statusOk = statusFilter === "all" ? true : currentStatus === statusFilter;
      const textOk =
        !q ||
        String(o.orderId).includes(q) ||
        (o.items || []).some((it) =>
          (it.Product?.title || `Product #${it.productId}`).toLowerCase().includes(q)
        );
      return statusOk && textOk;
    });
  }, [orders, statusFilter, search]);

  // Server-side order statistics
  useEffect(() => {
    (async () => {
      try {
        const s = await getProducerOrderStats();
        setOrderStats({
          total: Number(s.total || 0),
          pending: Number(s.pending || 0),
          packed: Number(s.packed || 0),
          shipped: Number(s.shipped || 0),
          delivered: Number(s.delivered || 0),
          cancelled: Number(s.cancelled || 0),
          revenue: Number(s.revenue || 0)
        });
      } catch (_) {}
    })();
  }, []);

  return (
    <div className="">
      

      <div className="max-w-7xl mx-auto">
        
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                  <FaShoppingBag className="text-white text-xl" />
                </div>
                Order Management
              </h1>
              <p className="text-gray-600 mt-2">Manage and track your customer orders</p>
            </div>
            
            <button
              onClick={() => loadOrders(1, true)}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-green-200 text-green-700 rounded-xl hover:bg-green-50 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <FaSync className={`text-sm ${loading ? 'animate-spin' : ''}`} />
              Refresh Orders
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{orderStats.total}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FaShoppingBag className="text-blue-600 text-lg" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-1">{orderStats.pending}</p>
                </div>
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <FaClock className="text-yellow-600 text-lg" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Packed</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">{orderStats.packed}</p>
                </div>
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <FaBox className="text-orange-600 text-lg" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Shipped</p>
                  <p className="text-2xl font-bold text-indigo-600 mt-1">{orderStats.shipped}</p>
                </div>
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <FaShippingFast className="text-indigo-600 text-lg" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Delivered</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{orderStats.delivered}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <FaCheckCircle className="text-green-600 text-lg" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Cancelled</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{orderStats.cancelled}</p>
                </div>
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <FaTimesCircle className="text-red-600 text-lg" />
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search by order ID or product name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full border-0 bg-gray-50 px-4 py-3 rounded-xl pl-12 text-gray-700 focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
                />
                <FaSearch className="absolute top-3.5 left-4 text-gray-400" />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-gray-600">
                  <FaFilter className="text-sm" />
                  <span className="text-sm font-medium">Filter by:</span>
                </div>
                <select
                  className="border-0 bg-gray-50 px-4 py-3 rounded-xl text-gray-700 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Orders</option>
                  <option value="pending">Pending</option>
                  <option value="packed">Packed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <div className="flex justify-center mb-4">
              <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="text-gray-600">Loading your orders...</div>
          </div>
        ) : !filtered.length ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaShoppingBag className="text-gray-400 text-3xl" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No orders found</h3>
            <p className="text-gray-500 mb-6">
              {search || statusFilter !== "all" 
                ? "Try adjusting your search or filter criteria" 
                : "You don't have any orders yet"
              }
            </p>
            {(search || statusFilter !== "all") && (
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filtered.map((entry) => {
              const createdAt = entry.order?.createdAt ? new Date(entry.order.createdAt) : null;
              const items = Array.isArray(entry.items) ? entry.items : [];
              const agg = aggregateStatus(items);
              const busy = !!updating[entry.orderId];
              const totalOfThisProducer = items.reduce(
                (sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 0),
                0
              );

              return (
                <div
                  key={entry.orderId}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  {/* Order Header */}
                  <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500 font-medium">Order ID</span>
                          <span className="text-lg font-mono font-bold text-gray-800">#{entry.orderId}</span>
                        </div>
                        <div className="h-8 w-px bg-gray-200"></div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FaClock className="text-gray-400" />
                          {createdAt ? createdAt.toLocaleString() : ""}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={agg} />
                        <PaymentStatusBadge status={entry.order?.paymentStatus} />
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                      {/* Order Items - Scrollable Section */}
                      <div className="xl:col-span-2">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                          <FaBox className="text-green-600" />
                          Order Items ({items.length})
                        </h3>
                        <div className="max-h-[28rem] md:max-h-[35rem] lg:max-h-[35rem] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 transition-colors rounded-xl border border-gray-200">
                          <div className="space-y-3 p-4">
                            {items.map((it) => (
                              <div
                                key={it.id ?? `${entry.orderId}-${it.productId}`}
                                className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-green-300 transition-colors bg-white"
                              >
                                <div className="relative flex-shrink-0">
                                  <Image
                                    src={it.Product?.images?.[0] || "/placeholder.png"}
                                    alt={it.Product?.title || "Product"}
                                    width={64}
                                    height={64}
                                    className="w-16 h-16 object-cover rounded-lg border-2 border-gray-100"
                                  />
                                  <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                                    {it.quantity}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 line-clamp-2">
                                    {it.Product?.title || `Product #${it.productId}`}
                                  </div>
                                  <div className="text-sm text-gray-600 mt-1">
                                    ₹{it.price} × {it.quantity} = ₹{(Number(it.price) * Number(it.quantity)).toFixed(2)}
                                  </div>
                                  {it.Product?.category && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      Category: {it.Product.category}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Order Controls and Info */}
                      <div className="space-y-6">
                        {/* Status Progress */}
                        <div className="bg-gray-50 rounded-xl p-4">
                          <h4 className="font-semibold text-gray-800 mb-3">Order Progress</h4>
                          <div className="space-y-3">
                            <ProgressStep
                              label="Packed"
                              status={agg}
                              targetStatus="packed"
                              onUpdate={() => handleUpdateStatus(entry.orderId, "packed")}
                              disabled={agg !== "pending" || busy}
                              busy={busy}
                            />
                            <ProgressStep
                              label="Shipped"
                              status={agg}
                              targetStatus="shipped"
                              onUpdate={() => handleUpdateStatus(entry.orderId, "shipped")}
                              disabled={!(agg === "packed" || agg === "shipped") || busy}
                              busy={busy}
                            />
                            <ProgressStep
                              label="Delivered"
                              status={agg}
                              targetStatus="delivered"
                              onUpdate={() => handleUpdateStatus(entry.orderId, "delivered")}
                              disabled={agg !== "shipped" || busy}
                              busy={busy}
                            />
                            
                            {/* COD Payment Mark */}
                            {entry.order?.paymentMethod === "COD" && (
                              <div className="pt-3 border-t border-gray-200">
                                <ProgressStep
                                  label="Mark as Paid"
                                  status={entry.order?.paymentStatus}
                                  targetStatus="paid"
                                  onUpdate={() => handleUpdatePaymentStatus(entry.orderId, "paid")}
                                  disabled={agg !== "delivered" || entry.order?.paymentStatus === "paid" || busy}
                                  busy={busy}
                                  isPayment={true}
                                />
                              </div>
                            )}

                            {/* Cancel Order */}
                            {agg !== 'delivered' && agg !== 'cancelled' && (
                              <div className="pt-3 border-t border-gray-200">
                                <button
                                  onClick={async () => {
                                    try {
                                      await handleUpdateStatus(entry.orderId, 'cancelled');
                                      toast.info(entry.order?.paymentMethod === 'PREPAID'
                                        ? 'Order cancelled. Prepaid amount will be refunded in a few days.'
                                        : 'Order cancelled.');
                                    } catch {}
                                  }}
                                  className="w-full px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
                                  disabled={busy}
                                >
                                  Cancel Order
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Order Summary */}
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <FaRupeeSign className="text-green-600" />
                            Order Summary
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Items Total</span>
                              <span className="font-semibold text-gray-800">₹{totalOfThisProducer}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Payment Method</span>
                              <span className="font-semibold text-gray-800">
                                {entry.order?.paymentMethod || "COD"}
                              </span>
                            </div>
                            <div className="pt-2 border-t border-green-200">
                              <div className="flex justify-between text-base">
                                <span className="font-bold text-gray-800">Your Earnings</span>
                                <span className="font-bold text-green-700">₹{totalOfThisProducer}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Customer Info */}
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <FaUser className="text-blue-600" />
                            Customer Details
                          </h4>
                          <div className="space-y-2 text-sm">
                            {entry.order?.Address ? (
                              <>
                                <div className="flex items-center gap-2 text-gray-700">
                                  <FaUser className="text-blue-500 text-xs" />
                                  <span>{entry.order.Address.contactName}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-700">
                                  <FaPhone className="text-blue-500 text-xs" />
                                  <span>{entry.order.Address.contactPhone}</span>
                                </div>
                                <div className="flex items-start gap-2 text-gray-700 mt-2">
                                  <FaMapMarkerAlt className="text-blue-500 text-xs mt-1 flex-shrink-0" />
                                  <div className="text-xs leading-relaxed">
                                    {entry.order.Address.label && (
                                      <div className="font-medium text-gray-800 mb-1">
                                        {entry.order.Address.label} -
                                      </div>
                                    )}
                                    <div>
                                      {entry.order.Address.addressLine1}
                                      {entry.order.Address.addressLine2 ? `, ${entry.order.Address.addressLine2}` : ''}
                                      , {entry.order.Address.city}, {entry.order.Address.state} {entry.order.Address.postalCode}, {entry.order.Address.country}
                                    </div>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="text-gray-500">Address not available</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => loadOrders(page + 1, false)}
                  disabled={loadingMore}
                  className="bg-white border border-green-600 text-green-700 px-8 py-3 rounded-xl font-semibold hover:bg-green-50 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
                >
                  {loadingMore ? (
                    <>
                      <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                      Loading...
                    </>
                  ) : (
                    "Load More Orders"
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Progress Step Component
function ProgressStep({ label, status, targetStatus, onUpdate, disabled, busy, isPayment = false }) {
  const isCompleted = isPayment 
    ? status === targetStatus
    : ["packed", "shipped", "delivered"].indexOf(status) >= ["packed", "shipped", "delivered"].indexOf(targetStatus);
  
  const isCurrent = isPayment 
    ? status !== targetStatus && !disabled
    : status === targetStatus;

  const getIcon = () => {
    if (busy) return <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />;
    if (isCompleted) return <FaCheckCircle className="text-green-600 text-lg" />;
    return <div className={`w-4 h-4 rounded-full border-2 ${isCurrent ? 'border-green-600 bg-green-600' : 'border-gray-300'}`} />;
  };

  return (
    <div className="flex items-center gap-3">
      {getIcon()}
      <span className={`flex-1 text-sm font-medium ${
        isCompleted ? 'text-green-700' : isCurrent ? 'text-gray-800' : 'text-gray-500'
      }`}>
        {label}
      </span>
      {!isCompleted && !isPayment && (
        <button
          onClick={onUpdate}
          disabled={disabled || busy}
          className="px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Mark
        </button>
      )}
      {isPayment && !isCompleted && (
        <button
          onClick={onUpdate}
          disabled={disabled || busy}
          className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Paid
        </button>
      )}
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }) {
  const getConfig = (status) => {
    switch (status) {
      case "pending":
        return { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-200", icon: FaClock };
      case "packed":
        return { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-200", icon: FaBox };
      case "shipped":
        return { bg: "bg-indigo-100", text: "text-indigo-800", border: "border-indigo-200", icon: FaShippingFast };
      case "delivered":
        return { bg: "bg-green-100", text: "text-green-800", border: "border-green-200", icon: FaCheckCircle };
      case "cancelled":
        return { bg: "bg-red-100", text: "text-red-800", border: "border-red-200", icon: FaTimesCircle };
      default:
        return { bg: "bg-gray-100", text: "text-gray-800", border: "border-gray-200", icon: FaClock };
    }
  };

  const config = getConfig(status);
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full border ${config.bg} ${config.text} ${config.border}`}>
      <Icon className="text-sm" />
      <span className="text-sm font-medium capitalize">{status}</span>
    </div>
  );
}

// Payment Status Badge Component
function PaymentStatusBadge({ status }) {
  const s = String(status || "pending").toLowerCase();
  const getConfig = (status) => {
    switch (status) {
      case "paid":
        return { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200", icon: FaCheckCircle };
      case "refunded":
        return { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-200", icon: FaMoneyBillWave };
      case "failed":
      case "cancelled":
        return { bg: "bg-red-100", text: "text-red-800", border: "border-red-200", icon: FaTimesCircle };
      default:
        return { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-200", icon: FaClock };
    }
  };

  const config = getConfig(s);
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full border ${config.bg} ${config.text} ${config.border}`}>
      <Icon className="text-sm" />
      <span className="text-sm font-medium capitalize">{s}</span>
    </div>
  );
}