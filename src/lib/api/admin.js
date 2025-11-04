const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

// Helper: Centralized API request without refresh; redirect on 401 like producer flow
async function adminApiRequest(url, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

  options.headers = options.headers || {};
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(url, options);
  } catch (e) {
    const err = new Error('Network error');
    err.cause = e;
    throw err;
  }

  if (res.status === 401) {
    try {
      localStorage.removeItem('adminToken');
    } catch {}
    if (typeof window !== 'undefined') window.location.href = '/admin/signin';
    const err = new Error('Unauthorized');
    err.status = 401;
    err.code = 'UNAUTHORIZED';
    throw err;
  }

  return res;
}

export async function signInAdmin({ email, password }) {
  try {
    const res = await fetch(`${BASE_URL}/api/admin/signin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to sign in");
    }

    return data;
  } catch (error) {
    console.error("Admin Sign-in Error:", error);
    throw error;
  }
}

export async function fetchProducersForVerification() {
  try {
    const res = await adminApiRequest(`${BASE_URL}/api/admin/getProducers`, {
      method: "GET"
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Failed to fetch producers for verification");
    }
    return data.data; // Just the array of producers
  } catch (error) {
    console.error("Failed to fetch KYC producers:", error);
    throw error;
  }
}

export async function fetchAllProducers() {
  try {
    const res = await adminApiRequest(`${BASE_URL}/api/admin/producers`, {
      method: "GET"
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Failed to fetch producers");
    }
    return data.data;
  } catch (error) {
    console.error("Failed to fetch all producers:", error);
    throw error;
  }
}

// Approve a producer (admin)
export async function approveProducerAdmin(id) {
  const res = await adminApiRequest(`${BASE_URL}/api/admin/producers/${id}/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to approve producer");
  return data;
}

// Reject a producer (admin)
export async function rejectProducerAdmin(id, remarks) {
  const res = await adminApiRequest(`${BASE_URL}/api/admin/producers/${id}/reject`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ remarks })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to reject producer");
  return data;
}

export { adminApiRequest };

// Dashboard stats (total orders, pending verifications, disputes, chart by category)
export async function fetchAdminDashboard() {
  const res = await adminApiRequest(`${BASE_URL}/api/admin/dashboard-stats`, {
    method: 'GET'
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || 'Failed to fetch dashboard');
  return data;
}

// Admin orders (paginated)
export async function fetchAdminOrders({ page = 1, limit = 20, paymentStatus = '', paymentMethod = '', q = '' } = {}) {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (paymentStatus) params.set('paymentStatus', paymentStatus);
  if (paymentMethod) params.set('paymentMethod', paymentMethod);
  if (q) params.set('q', q);
  const res = await adminApiRequest(`${BASE_URL}/api/admin/orders?${params.toString()}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || 'Failed to fetch orders');
  return data;
}

// Admin update order payment status
export async function adminUpdateOrderPaymentStatus(orderId, paymentStatus) {
  const res = await adminApiRequest(`${BASE_URL}/api/admin/orders/${orderId}/payment-status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentStatus })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || 'Failed to update payment status');
  return data;
}
