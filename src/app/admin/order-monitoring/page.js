'use client';
import { useEffect, useRef, useState } from 'react';
import { fetchAdminOrders, adminUpdateOrderPaymentStatus } from '@/lib/api/admin';
import CircleSpinner from '@/components/CircleSpinner';

const statusBadge = (s) => {
  const map = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    refunded: 'bg-blue-100 text-blue-800',
    failed: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-200 text-gray-700',
  };
  return map[s] || 'bg-gray-100 text-gray-700';
};

export default function OrderMonitoring() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState({ q: '', paymentStatus: '', paymentMethod: '' });
  const loadMoreRef = useRef(null);
  const PAGE_SIZE = 12;

  useEffect(() => {
    // initial load
    resetAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // re-load when filters change
    const t = setTimeout(() => resetAndLoad(), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.q, filters.paymentStatus, filters.paymentMethod]);

  const resetAndLoad = async () => {
    setOrders([]);
    setPage(1);
    setHasMore(true);
    await loadNextPage(true);
  };

  const loadNextPage = async (initial = false) => {
    try {
      if (pageLoading || (!hasMore && !initial)) return;
      if (initial) setLoading(true);
      setPageLoading(true);
      const data = await fetchAdminOrders({ page: initial ? 1 : page, limit: PAGE_SIZE, ...filters });
      setOrders(prev => {
        const map = new Map((initial ? [] : prev).map(o => [o.id, o]));
        (data.items || []).forEach(o => map.set(o.id, o));
        return Array.from(map.values());
      });
      setPage(p => p + 1);
      setHasMore(!!data.hasMore);
    } catch (e) {
      if (initial) setOrders([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  };

  // IntersectionObserver
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first.isIntersecting && hasMore && !pageLoading) loadNextPage(false);
    }, { root: null, rootMargin: '200px', threshold: 0 });
    obs.observe(el);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, pageLoading, loadMoreRef]);

  const updatePaymentStatus = async (orderId, newStatus) => {
    try {
      await adminUpdateOrderPaymentStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, paymentStatus: newStatus } : o)));
    } catch (e) {
      alert(e.message || 'Failed to update');
    }
  };

  return (
    <main className="flex-1 p-2">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-green-700">Order Monitoring</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded shadow p-3 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Search by Order ID or User Email"
            className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 placeholder:text-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-green-600/20"
            value={filters.q}
            onChange={(e) => setFilters(f => ({ ...f, q: e.target.value }))}
          />
          <select
            className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-green-600/20"
            value={filters.paymentStatus}
            onChange={(e) => setFilters(f => ({ ...f, paymentStatus: e.target.value }))}
          >
            <option value="">All Payment Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="refunded">Refunded</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-green-600/20"
            value={filters.paymentMethod}
            onChange={(e) => setFilters(f => ({ ...f, paymentMethod: e.target.value }))}
          >
            <option value="">All Methods</option>
            <option value="COD">COD</option>
            <option value="PREPAID">Prepaid</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded shadow overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-2 px-3 py-2 text-xs font-semibold text-gray-600 border-b">
          <div className="col-span-2">Order</div>
          <div className="col-span-2">User</div>
          <div className="col-span-2">Total</div>
          <div className="col-span-2">Payment</div>
          <div className="col-span-2">Created</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><CircleSpinner size={40} /></div>
        ) : orders.length === 0 ? (
          <div className="text-center text-gray-500 py-10">No orders found.</div>
        ) : (
          orders.map((o) => (
            <div key={o.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 px-3 py-3 border-b items-center">
              <div className="md:col-span-2 text-sm">
                <div className="font-semibold text-gray-800">#{o.id}</div>
                <div className="text-xs text-gray-500">{(o.OrderItems?.length || 0)} items</div>
              </div>
              <div className="md:col-span-2 text-sm">
                <div className="font-medium text-gray-800">{o.User?.email || '—'}</div>
                <div className="text-xs text-gray-500">{o.User?.username || '—'}</div>
              </div>
              <div className="md:col-span-2 text-sm">
                <div className="font-semibold text-green-700">₹{o.total}</div>
              </div>
              <div className="md:col-span-2 text-sm">
                <div className="text-gray-700">{o.paymentMethod}</div>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${statusBadge(o.paymentStatus)}`}>{o.paymentStatus}</span>
              </div>
              <div className="md:col-span-2 text-xs text-gray-600">
                {new Date(o.createdAt).toLocaleString()}
              </div>
              <div className="md:col-span-2 flex md:justify-end gap-2">
                <select
                  className="border border-gray-300 rounded px-2 py-1 text-xs text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-green-600/20"
                  defaultValue={o.paymentStatus}
                  onChange={(e) => updatePaymentStatus(o.id, e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="refunded">Refunded</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              {/* Order items inline (mobile) */}
              <div className="md:col-span-12 text-xs text-gray-700 md:hidden">
                {(o.OrderItems || []).map((it, idx) => (
                  <div key={idx} className="flex justify-between py-1 border-t">
                    <div className="truncate pr-2">{it.Product?.title || `Product #${it.productId}`}</div>
                    <div className="whitespace-nowrap">x{it.quantity} • ₹{it.price}</div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
        {/* Sentinel */}
        <div ref={loadMoreRef} className="h-1" />
        {pageLoading && orders.length > 0 && (
          <div className="flex justify-center py-4"><CircleSpinner size={28} /></div>
        )}
      </div>
    </main>
  );
}
