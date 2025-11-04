const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

// USER SIDE
function userToken() { if (typeof window === 'undefined') return null; return localStorage.getItem('userToken'); }
export async function userCreateDispute({ orderId, orderItemId, reason, description, images = [] }) {
  const token = userToken(); if (!token) { const e = new Error('Unauthorized'); e.status = 401; throw e; }
  const form = new FormData();
  form.append('orderId', String(orderId));
  if (orderItemId) form.append('orderItemId', String(orderItemId));
  form.append('reason', reason);
  if (description) form.append('description', description);
  (images || []).forEach(f => form.append('images', f));
  const res = await fetch(`${BASE_URL}/api/disputes`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || 'Failed to create dispute');
  return data;
}
export async function userListDisputes() {
  const token = userToken(); if (!token) { const e = new Error('Unauthorized'); e.status = 401; throw e; }
  const res = await fetch(`${BASE_URL}/api/disputes`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Failed to fetch disputes');
  return await res.json();
}
export async function userGetDispute(id) {
  const token = userToken(); if (!token) { const e = new Error('Unauthorized'); e.status = 401; throw e; }
  const res = await fetch(`${BASE_URL}/api/disputes/${id}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Failed to fetch dispute');
  return await res.json();
}
export async function userPostDisputeMessage(id, { message, images = [] }) {
  const token = userToken(); if (!token) { const e = new Error('Unauthorized'); e.status = 401; throw e; }
  const form = new FormData(); if (message) form.append('message', message); (images || []).forEach(f => form.append('images', f));
  const res = await fetch(`${BASE_URL}/api/disputes/${id}/messages`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || 'Failed to send message');
  return data;
}

// PRODUCER SIDE
function producerToken() { if (typeof window === 'undefined') return null; return localStorage.getItem('token'); }
export async function producerListDisputes({ status = '', q = '' } = {}) {
  const token = producerToken(); if (!token) { const e = new Error('Unauthorized'); e.status = 401; throw e; }
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (q) params.set('q', q);
  const res = await fetch(`${BASE_URL}/api/producer/disputes${params.toString() ? `?${params.toString()}` : ''}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Failed to fetch disputes');
  return await res.json();
}
export async function producerGetDispute(id) {
  const token = producerToken(); if (!token) { const e = new Error('Unauthorized'); e.status = 401; throw e; }
  const res = await fetch(`${BASE_URL}/api/producer/disputes/${id}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Failed to fetch dispute');
  return await res.json();
}
export async function producerPostDisputeMessage(id, { message, images = [] }) {
  const token = producerToken(); if (!token) { const e = new Error('Unauthorized'); e.status = 401; throw e; }
  const form = new FormData(); if (message) form.append('message', message); (images || []).forEach(f => form.append('images', f));
  const res = await fetch(`${BASE_URL}/api/producer/disputes/${id}/messages`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || 'Failed to send message');
  return data;
}

// ADMIN SIDE
function adminToken() { if (typeof window === 'undefined') return null; return localStorage.getItem('adminToken'); }
export async function adminListDisputes({ status = '', q = '' } = {}) {
  const token = adminToken(); if (!token) { const e = new Error('Unauthorized'); e.status = 401; throw e; }
  const params = new URLSearchParams(); if (status) params.set('status', status); if (q) params.set('q', q);
  const res = await fetch(`${BASE_URL}/api/admin/disputes?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Failed to fetch disputes');
  return await res.json();
}
export async function adminGetDispute(id) {
  const token = adminToken(); if (!token) { const e = new Error('Unauthorized'); e.status = 401; throw e; }
  const res = await fetch(`${BASE_URL}/api/admin/disputes/${id}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Failed to fetch dispute');
  return await res.json();
}
export async function adminUpdateDisputeStatus(id, { status, resolution }) {
  const token = adminToken(); if (!token) { const e = new Error('Unauthorized'); e.status = 401; throw e; }
  const res = await fetch(`${BASE_URL}/api/admin/disputes/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ status, resolution }) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || 'Failed to update status');
  return data;
}
export async function adminAssignDispute(id, assignedAdminId) {
  const token = adminToken(); if (!token) { const e = new Error('Unauthorized'); e.status = 401; throw e; }
  const res = await fetch(`${BASE_URL}/api/admin/disputes/${id}/assign`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ assignedAdminId }) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || 'Failed to assign dispute');
  return data;
}
export async function adminPostDisputeMessage(id, { message, images = [] }) {
  const token = adminToken(); if (!token) { const e = new Error('Unauthorized'); e.status = 401; throw e; }
  const form = new FormData(); if (message) form.append('message', message); (images || []).forEach(f => form.append('images', f));
  const res = await fetch(`${BASE_URL}/api/admin/disputes/${id}/messages`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || 'Failed to send message');
  return data;
}
