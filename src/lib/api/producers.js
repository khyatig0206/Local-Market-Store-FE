const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

// Centralized API request for producer
export async function apiRequestProducer(endpoint, { method = "GET", body = null, headers = {}, isFormData = false } = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
  const url = `${BASE_URL}${endpoint}`;
  const finalHeaders = { ...headers };
  if (token) {
    finalHeaders["Authorization"] = `Bearer ${token}`;
  }
  // Don't set Content-Type for FormData
  if (body && !isFormData && !(body instanceof FormData)) {
    finalHeaders["Content-Type"] = "application/json";
  }
  let res;
  try {
    res = await fetch(url, {
      method,
      headers: finalHeaders,
      body: isFormData ? body : (body && !(body instanceof FormData) ? JSON.stringify(body) : body),
    });
  } catch (e) {
    const err = new Error("Network error");
    err.cause = e;
    throw err;
  }
  if (res.status === 401) {
    const err = new Error("Unauthorized");
    err.status = 401;
    err.code = "UNAUTHORIZED";
    if (typeof window !== 'undefined') window.location.href = "/producer/signin";
    throw err;
  }
  return res;
}

export async function fetchCategories() {
  try {
    const res = await fetch(`${BASE_URL}/api/categories`);
    if (!res.ok) throw new Error("Failed to fetch categories");
    return await res.json();
  } catch (error) {
    console.error("Fetch categories error:", error);
    throw error;
  }
}

export async function signUpProducer(producerData) {
  try {
    const formData = new FormData();
    formData.append("email", producerData.email);
    formData.append("password", producerData.password);
    formData.append("businessName", producerData.businessName);
    formData.append("phoneNumber", producerData.phoneNumber);
    formData.append("description", producerData.description);
    formData.append("categories", JSON.stringify(producerData.categories)); // stringify categories

    // Business address fields
    formData.append("businessAddressLine1", producerData.businessAddressLine1 || "");
    formData.append("businessAddressLine2", producerData.businessAddressLine2 || "");
    formData.append("businessCity", producerData.businessCity || "");
    formData.append("businessState", producerData.businessState || "");
    formData.append("businessPostalCode", producerData.businessPostalCode || "");
    formData.append("businessCountry", producerData.businessCountry || "India");
    formData.append("businessSameAsPermanent", producerData.businessSameAsPermanent ? "true" : "false");

    if (producerData.location) {
      formData.append("location", producerData.location);
    }

    // Location coordinates
    if (producerData.latitude !== null && producerData.latitude !== undefined) {
      formData.append("latitude", producerData.latitude);
    }
    if (producerData.longitude !== null && producerData.longitude !== undefined) {
      formData.append("longitude", producerData.longitude);
    }

    if (producerData.businessLogo) {
      formData.append("businessLogo", producerData.businessLogo);
    }

    // Append multiple Aadhaar images (jpg/png)
    if (Array.isArray(producerData.aadharImages)) {
      for (const file of producerData.aadharImages) {
        if (file) formData.append("aadharImages", file);
      }
    }

    // Include KYC docs during signup (images only per UI)
    if (Array.isArray(producerData.idDocuments)) {
      for (const file of producerData.idDocuments) {
        if (file) formData.append("idDocuments", file);
      }
    }
    if (Array.isArray(producerData.addressProofs)) {
      for (const file of producerData.addressProofs) {
        if (file) formData.append("addressProofs", file);
      }
    }

    const res = await fetch(`${BASE_URL}/api/producer/signup`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Signup failed");
    return data;
  } catch (error) {
    console.error("Signup error:", error);
    throw error;
  }
}

export async function parseAadhaarAddress(file) {
  const formData = new FormData();
  formData.append('aadhaar', file);
  const res = await fetch(`${BASE_URL}/api/producer/parse-aadhaar`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Failed to parse Aadhaar');
  return data;
}

export async function signInProducer(credentials) {
  try {
    const res = await fetch(`${BASE_URL}/api/producer/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Signin failed");
    return data;
  } catch (error) {
    console.error("Signin error:", error);
    throw error;
  }
}

// Get current logged-in producer profile
export async function getProducerProfile() {
  try {
    const res = await apiRequestProducer("/api/producer/me");
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to fetch profile");
    return data.producer;
  } catch (error) {
    console.error("Get Profile Error:", error);
    throw error;
  }
}

// Update producer profile
export async function updateProducerProfile(profileData) {
  try {
    const formData = new FormData();
    formData.append("businessName", profileData.businessName);
    formData.append("email", profileData.email);
    formData.append("phoneNumber", profileData.phoneNumber || "");
    formData.append("description", profileData.description);

    // Business address fields (editable)
    formData.append("businessAddressLine1", profileData.businessAddressLine1 || "");
    formData.append("businessAddressLine2", profileData.businessAddressLine2 || "");
    formData.append("businessCity", profileData.businessCity || "");
    formData.append("businessState", profileData.businessState || "");
    formData.append("businessPostalCode", profileData.businessPostalCode || "");
    formData.append("businessCountry", profileData.businessCountry || "India");
    formData.append("businessSameAsPermanent", profileData.businessSameAsPermanent ? "true" : "false");

    // Location coordinates
    if (profileData.latitude !== null && profileData.latitude !== undefined) {
      formData.append("latitude", profileData.latitude);
    }
    if (profileData.longitude !== null && profileData.longitude !== undefined) {
      formData.append("longitude", profileData.longitude);
    }

    if (profileData.businessLogo) {
      formData.append("businessLogo", profileData.businessLogo);
    }

    if (profileData.categories) {
      formData.append("categories", JSON.stringify(profileData.categories));
    }
    if (profileData.password && profileData.password.trim() !== "") {
      formData.append("password", profileData.password);
    }

    const res = await apiRequestProducer("/api/producer/update", {
      method: "PUT",
      body: formData,
      isFormData: true,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update profile");
    return data.producer;
  } catch (error) {
    console.error("Update Profile Error:", error);
    throw error;
  }
}

export async function uploadKycDocuments(formData) {
  try {
    const res = await apiRequestProducer("/api/producer/uploadKYC", {
      method: "POST",
      body: formData,
      isFormData: true,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to upload KYC documents");
    return data;
  } catch (error) {
    console.error("Upload KYC Error:", error);
    throw error;
  }
}

// Get KYC status and docs for the current producer
export async function getKycStatusForProducer() {
  try {
    const res = await apiRequestProducer("/api/producer/kyc-status");
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to fetch KYC status");
    return data;
  } catch (error) {
    console.error("Get KYC Status Error:", error);
    throw error;
  }
}

export async function getWalletSummary() {
  const res = await apiRequestProducer("/api/producer/wallet/summary");
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch wallet summary");
  return data;
}

// Update Location Only
export async function updateProducerLocation(latitude, longitude) {
  const res = await apiRequestProducer('/api/producer/update-location', {
    method: 'POST',
    body: { latitude, longitude },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update location');
  return data;
}

export async function getWalletTransactions({ page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  const res = await apiRequestProducer(`/api/producer/wallet/transactions?${params.toString()}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch wallet transactions");
  return data;
}

export async function getProducerAnalytics() {
  const res = await apiRequestProducer(`/api/producer/analytics`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch analytics');
  return data;
}

// Change password for producer
export async function changeProducerPassword({ oldPassword, newPassword }) {
  const res = await apiRequestProducer(`/api/producer/change-password`, {
    method: 'POST',
    body: { oldPassword, newPassword },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Failed to change password');
  return data;
}

// Fetch featured producers for home page (public endpoint)
export async function fetchFeaturedProducers(limit = 6) {
  try {
    const res = await fetch(`${BASE_URL}/api/producer/featured?limit=${limit}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch featured producers');
    return data.producers || [];
  } catch (error) {
    console.error("Fetch featured producers error:", error);
    return [];
  }
}
