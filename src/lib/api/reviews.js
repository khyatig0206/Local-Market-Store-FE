const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

function userToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("userToken");
}

// Add a review for a product
export async function addReview(productId, rating, comment, images = []) {
  const token = userToken();
  if (!token) {
    const err = new Error("Unauthorized");
    err.status = 401;
    err.code = "UNAUTHORIZED";
    throw err;
  }

  const formData = new FormData();
  formData.append("productId", String(productId));
  formData.append("rating", String(rating));
  if (comment) formData.append("comment", comment);

  images.forEach((file) => {
    formData.append("images", file);
  });

  const res = await fetch(`${BASE_URL}/api/reviews`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (res.status === 401) {
    const err = new Error("Unauthorized");
    err.status = 401;
    err.code = "UNAUTHORIZED";
    throw err;
  }
  if (!res.ok) {
    let message = "Failed to add review";
    try {
      const data = await res.json();
      if (data?.message) message = data.message;
    } catch {}
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }

  return await res.json();
}

// Get reviews for a product
export async function getProductReviews(productId, { limit, offset } = {}) {
  try {
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit);
    if (offset) params.append("offset", offset);

    const url = `${BASE_URL}/api/reviews/product/${productId}${params.toString() ? `?${params.toString()}` : ""}`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error("Failed to fetch reviews");
    }

    return await res.json();
  } catch (error) {
    console.error("Get reviews error:", error);
    throw error;
  }
}
