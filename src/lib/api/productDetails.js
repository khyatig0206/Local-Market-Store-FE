export async function fetchProductDetails(id) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/products/${id}`);
  if (!res.ok) throw new Error("Failed to fetch product details");
  return await res.json();
}
