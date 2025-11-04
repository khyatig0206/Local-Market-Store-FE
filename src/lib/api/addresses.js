const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

function userToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("userToken");
}

async function doFetch(path, { method = "GET", body } = {}) {
  const token = userToken();
  if (!token) {
    const err = new Error("Unauthorized");
    err.status = 401;
    err.code = "UNAUTHORIZED";
    throw err;
  }
  const headers = { "Authorization": `Bearer ${token}` };
  const hasBody = body && typeof body === "object";
  if (hasBody) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: hasBody ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    const err = new Error("Unauthorized");
    err.status = 401;
    err.code = "UNAUTHORIZED";
    throw err;
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err = new Error(data.message || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

/**
 * List saved addresses for the current user.
 */
export async function listAddresses() {
  return doFetch(`/api/addresses`, { method: "GET" });
}

/**
 * Create a new saved address for the current user.
 */
export async function createAddress(address) {
  return doFetch(`/api/addresses`, { method: "POST", body: address });
}

/**
 * Update an existing saved address.
 */
export async function updateAddress(id, partial) {
  return doFetch(`/api/addresses/${id}`, { method: "PUT", body: partial });
}

/**
 * Delete a saved address.
 */
export async function deleteAddress(id) {
  return doFetch(`/api/addresses/${id}`, { method: "DELETE" });
}

/**
 * Set a saved address as default.
 */
export async function setDefaultAddress(id) {
  return doFetch(`/api/addresses/${id}/default`, { method: "POST" });
}

/**
 * Get a single address by ID.
 */
export async function getAddressById(id) {
  return doFetch(`/api/addresses/${id}`, { method: "GET" });
}