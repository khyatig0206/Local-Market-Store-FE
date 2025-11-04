export async function fetchCategoriesAPI() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/categories`, { cache: 'no-store' });
    if (!res.ok) throw new Error("Failed to fetch categories");
    return await res.json();
  } catch (err) {
    // Option 1: Return a fallback value (uncomment if you want to show empty instead of error)
    // return [];
    // Option 2: Throw a custom error for the component to catch
    throw new Error("Could not connect to backend. Please try again later.");
  }
}

export async function fetchCategoriesPaginaxted(page = 1, limit = 6) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/categories/paginated?page=${page}&limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch paginated categories");
  return await res.json();
}

export async function addCategoryAPI(formData) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/categories/add`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to add category');
  return data;
}

export async function updateCategoryAPI(id, formData) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/categories/${id}`, {
    method: "PUT",
    body: formData,
  });
  if (!res.ok) throw new Error((await res.json()).message);
  return await res.json();
}

export async function deleteCategoryAPI(id) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/categories/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error((await res.json()).message);
  return await res.json();
}

export async function getCategoryById(id) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/categories/${id}`);

    if (!res.ok) throw new Error("Failed to fetch category");

    return await res.json();
  } catch (error) {
    console.error("Error fetching category by ID:", error);
    throw error;
  }
}
