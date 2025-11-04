const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

function getUserAuthHeader() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function registerUserPushToken(token) {
  const res = await fetch(`${BASE_URL}/api/users/push-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getUserAuthHeader() },
    body: JSON.stringify({ token, platform: 'web' }),
  });
  if (!res.ok) throw new Error('Failed to register user token');
}

export async function unregisterUserPushToken(token) {
  const res = await fetch(`${BASE_URL}/api/users/push-token`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...getUserAuthHeader() },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) throw new Error('Failed to unregister user token');
}
