/**
 * Orders API (no payment gateway; logic-only checkout)
 */

function userToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('userToken');
}

function producerToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token'); // producer signin stores "token"
}

export async function placeOrder(addressOrPayload) {
  const token = userToken();
  if (!token) {
    const err = new Error('Unauthorized');
    err.status = 401;
    err.code = 'UNAUTHORIZED';
    throw err;
  }

  // Backward compatible: accept string (legacy freeform address) or structured object
  const body =
    typeof addressOrPayload === 'string'
      ? { address: addressOrPayload }
      : { ...(addressOrPayload || {}) };

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders/place`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });
  if (res.status === 401) {
    const err = new Error('Unauthorized');
    err.status = 401;
    err.code = 'UNAUTHORIZED';
    throw err;
  }
  if (!res.ok) {
    const err = new Error('Failed to place order');
    err.status = res.status;
    throw err;
  }
  return await res.json();
}

export async function placeDirectOrder(productId, quantity, addressOrPayload) {
  const token = userToken();
  if (!token) {
    const err = new Error('Unauthorized');
    err.status = 401;
    err.code = 'UNAUTHORIZED';
    throw err;
  }

  const addressPayload =
    typeof addressOrPayload === 'string'
      ? { address: addressOrPayload }
      : { ...(addressOrPayload || {}) };

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders/direct`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ productId, quantity, ...addressPayload })
  });
  if (res.status === 401) {
    const err = new Error('Unauthorized');
    err.status = 401;
    err.code = 'UNAUTHORIZED';
    throw err;
  }
  if (!res.ok) {
    const err = new Error('Failed to place direct order');
    err.status = res.status;
    throw err;
  }
  return await res.json();
}

export async function getMyOrders() {
  const token = userToken();
  if (!token) {
    const err = new Error('Unauthorized');
    err.status = 401;
    err.code = 'UNAUTHORIZED';
    throw err;
  }
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders/my`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (res.status === 401) {
    const err = new Error('Unauthorized');
    err.status = 401;
    err.code = 'UNAUTHORIZED';
    throw err;
  }
  if (!res.ok) {
    const err = new Error('Failed to fetch orders');
    err.status = res.status;
    throw err;
  }
  return await res.json();
}

export async function getProducerOrders(params = {}) {
  const token = producerToken();
  if (!token) {
    const err = new Error('Unauthorized');
    err.status = 401;
    err.code = 'UNAUTHORIZED';
    throw err;
  }
  
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  
  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders/producer${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (res.status === 401) {
    const err = new Error('Unauthorized');
    err.status = 401;
    err.code = 'UNAUTHORIZED';
    throw err;
  }
  if (!res.ok) {
    const err = new Error('Failed to fetch producer orders');
    err.status = res.status;
    throw err;
  }
  return await res.json();
}

export async function getProducerOrderStats() {
  const token = producerToken();
  if (!token) {
    const err = new Error('Unauthorized');
    err.status = 401;
    err.code = 'UNAUTHORIZED';
    throw err;
  }
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders/producer/stats`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (res.status === 401) {
    const err = new Error('Unauthorized');
    err.status = 401;
    err.code = 'UNAUTHORIZED';
    throw err;
  }
  if (!res.ok) {
    const err = new Error('Failed to fetch producer order stats');
    err.status = res.status;
    throw err;
  }
  return await res.json();
}

export async function updateOrderStatusProducer(orderId, status) {
  const token = producerToken();
  if (!token) {
    const err = new Error('Unauthorized');
    err.status = 401;
    err.code = 'UNAUTHORIZED';
    throw err;
  }
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  });
  if (res.status === 401) {
    const err = new Error('Unauthorized');
    err.status = 401;
    err.code = 'UNAUTHORIZED';
    throw err;
  }
  if (!res.ok) {
    const err = new Error('Failed to update order status');
    err.status = res.status;
    throw err;
  }
  return await res.json();
}

export async function updateOrderPaymentStatusProducer(orderId, paymentStatus) {
  const token = producerToken();
  if (!token) {
    const err = new Error('Unauthorized');
    err.status = 401;
    err.code = 'UNAUTHORIZED';
    throw err;
  }
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders/${orderId}/payment-status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ paymentStatus })
  });
  if (res.status === 401) {
    const err = new Error('Unauthorized');
    err.status = 401;
    err.code = 'UNAUTHORIZED';
    throw err;
  }
  if (!res.ok) {
    const err = new Error('Failed to update payment status');
    err.status = res.status;
    throw err;
  }
  return await res.json();
}
export async function updateOrderItemStatusProducer(itemId, status) {
  const token = producerToken();
  if (!token) {
    const err = new Error('Unauthorized');
    err.status = 401;
    err.code = 'UNAUTHORIZED';
    throw err;
  }
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders/item/${itemId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  });
  if (res.status === 401) {
    const err = new Error('Unauthorized');
    err.status = 401;
    err.code = 'UNAUTHORIZED';
    throw err;
  }
  if (!res.ok) {
    const err = new Error('Failed to update order item status');
    err.status = res.status;
    throw err;
  }
  return await res.json();
}
export async function initiatePayment() {
  const token = userToken();
  if (!token) {
    const err = new Error('Unauthorized');
    err.status = 401;
    err.code = 'UNAUTHORIZED';
    throw err;
  }
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders/initiate-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  if (res.status === 401) {
    const err = new Error('Unauthorized');
    err.status = 401;
    err.code = 'UNAUTHORIZED';
    throw err;
  }
  if (!res.ok) {
    const err = new Error('Failed to initiate payment');
    err.status = res.status;
    throw err;
  }
  return await res.json();
}

export async function initiateDirectPayment(productId, quantity) {
  const token = userToken();
  if (!token) {
    const err = new Error('Unauthorized');
    err.status = 401;
    err.code = 'UNAUTHORIZED';
    throw err;
  }
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders/initiate-direct-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ productId, quantity })
  });
  if (res.status === 401) {
    const err = new Error('Unauthorized');
    err.status = 401;
    err.code = 'UNAUTHORIZED';
    throw err;
  }
  if (!res.ok) {
    const err = new Error('Failed to initiate direct payment');
    err.status = res.status;
    throw err;
  }
  return await res.json();
}

export async function verifyPayment(payload) {
  const token = (typeof window !== 'undefined') ? localStorage.getItem('userToken') : null;
  if (!token) {
    const err = new Error('Unauthorized');
    err.status = 401;
    err.code = 'UNAUTHORIZED';
    throw err;
  }
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  if (res.status === 401) {
    const err = new Error('Unauthorized');
    err.status = 401;
    err.code = 'UNAUTHORIZED';
    throw err;
  }
  if (!res.ok) {
    const err = new Error('Failed to verify payment');
    err.status = res.status;
    throw err;
  }
  return await res.json();
}

export async function verifyDirectPayment(payload) {
  const token = userToken();
  if (!token) {
    const err = new Error('Unauthorized');
    err.status = 401;
    err.code = 'UNAUTHORIZED';
    throw err;
  }
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders/verify-direct`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  if (res.status === 401) {
    const err = new Error('Unauthorized');
    err.status = 401;
    err.code = 'UNAUTHORIZED';
    throw err;
  }
  if (!res.ok) {
    const err = new Error('Failed to verify direct payment');
    err.status = res.status;
    throw err;
  }
  return await res.json();
}