export async function signupUser({ username, email, password }) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Signup failed");
  return data;
}

export async function signinUser({ email, password }) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Signin failed");
  return data;
}

function userToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('userToken');
}

function authHeaders(withJson = true) {
  const token = userToken();
  if (!token) {
    const err = new Error('Unauthorized');
    err.status = 401; err.code = 'UNAUTHORIZED';
    throw err;
  }
  const h = { 'Authorization': `Bearer ${token}` };
  if (withJson) h['Content-Type'] = 'application/json';
  return h;
}

export async function getCurrentUser() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/me`, {
    method: 'GET',
    headers: authHeaders(false),
  });
  if (res.status === 401) { const e = new Error('Unauthorized'); e.status=401; e.code='UNAUTHORIZED'; throw e; }
  if (!res.ok) { const e = new Error('Failed to load user'); e.status=res.status; throw e; }
  return res.json();
}

export async function updateUser(partial) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/me`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(partial || {}),
  });
  if (res.status === 401) { const e = new Error('Unauthorized'); e.status=401; e.code='UNAUTHORIZED'; throw e; }
  if (!res.ok) { const e = new Error('Failed to update user'); e.status=res.status; throw e; }
  return res.json();
}

export async function changeUserPassword({ oldPassword, newPassword }) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/change-password`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ oldPassword, newPassword }),
  });
  if (res.status === 401) { const e = new Error('Unauthorized'); e.status=401; e.code='UNAUTHORIZED'; throw e; }
  if (!res.ok) { const data = await res.json().catch(()=>({})); const e = new Error(data.message || 'Failed to change password'); e.status=res.status; throw e; }
  return res.json();
}
