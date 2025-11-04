import { apiRequestProducer } from "./producers";
import { buildQueryWithLocation } from "@/utils/locationUtils";

export async function uploadProduct(formData) {
  try {
    const res = await apiRequestProducer("/api/products", {
      method: "POST",
      body: formData,
      isFormData: true,
    });
    if (!res.ok) {
      throw new Error("Product upload failed");
    }
    return await res.json();
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}

export async function fetchProductsPaginated({ limit = 18, offset = 0, categoryId = "" } = {}) {
  const baseParams = { limit: String(limit), offset: String(offset) };
  if (categoryId) baseParams.categoryId = String(categoryId);
  
  const queryString = await buildQueryWithLocation(baseParams);
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/products?${queryString}`);
  if (!res.ok) throw new Error("Failed to fetch products");
  return await res.json();
}

export async function fetchProductsByCategory(categoryId, limit = 6) {
  const queryString = await buildQueryWithLocation({ 
    categoryId: String(categoryId), 
    limit: String(limit) 
  });
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/products?${queryString}`);
  if (!res.ok) throw new Error("Failed to fetch products by category");
  return await res.json();
}

// Get total product count (supports category and search)
export async function fetchProductsCount({ categoryId = "", q = "" } = {}) {
  // If searching, use Meilisearch count
  if (q && q.trim()) {
    const { getSearchCount } = await import('./search');
    return await getSearchCount(q, categoryId);
  }
  
  // Otherwise use PostgreSQL count
  const qsp = new URLSearchParams();
  if (categoryId) qsp.set("categoryId", String(categoryId));
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/products/count?${qsp.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch products count");
  const data = await res.json();
  return Number(data?.count || 0);
}

// Fetch products for the current producer (paginated)
export async function fetchMyProducts(page = 1, limit = 10, search = "", categoryId = "") {
  const q = new URLSearchParams();
  q.set("page", String(page));
  q.set("limit", String(limit));
  if (search) q.set("search", search);
  if (categoryId) q.set("categoryId", String(categoryId));
  const res = await apiRequestProducer(`/api/producer/my-products?${q.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch your products");
  return await res.json();
}

// Search products by title, producer, or category using Meilisearch
export async function searchProductsPaginated(query, { limit = 18, offset = 0 } = {}) {
  const page = Math.floor(offset / limit) + 1;
  const q = new URLSearchParams();
  q.set("q", query);
  q.set("limit", String(limit));
  q.set("page", String(page));
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/search?${q.toString()}`);
  if (!res.ok) throw new Error("Failed to search products");
  const data = await res.json();
  return data.hits || [];
}

// Fetch best sellers (products sorted by avg rating + review count)
export async function fetchBestSellers(limit = 6) {
  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/products/best-sellers?limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch best sellers");
  }
  return await res.json();
}


// Update product
export async function updateProduct(productId, formData) {
  try {
    const res = await apiRequestProducer(`/api/products/${productId}`, {
      method: "PUT",
      body: formData,
      isFormData: true,
    });
    if (!res.ok) {
      throw new Error("Product update failed");
    }
    return await res.json();
  } catch (error) {
    console.error("Update error:", error);
    throw error;
  }
}

// Delete product
export async function deleteProduct(productId) {
  try {
    const res = await apiRequestProducer(`/api/products/${productId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      throw new Error("Product deletion failed");
    }
    return await res.json();
  } catch (error) {
    console.error("Delete error:", error);
    throw error;
  }
}
