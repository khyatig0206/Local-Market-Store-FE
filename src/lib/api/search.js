const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

/**
 * Instant search for navbar autocomplete
 */
export async function instantSearch(query, limit = 5) {
  try {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const params = new URLSearchParams({
      q: query.trim(),
      limit: limit.toString(),
    });

    const res = await fetch(`${BASE_URL}/api/search/instant?${params}`);
    
    if (!res.ok) {
      console.error('Search failed:', res.statusText);
      return [];
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Instant search error:', error);
    return [];
  }
}

/**
 * Advanced search with filters and pagination
 */
export async function advancedSearch(options = {}) {
  try {
    const {
      query = '',
      categoryId,
      producerId,
      minPrice,
      maxPrice,
      inStockOnly = false,
      discountOnly = false,
      sortBy = 'relevance',
      page = 1,
      limit = 20,
    } = options;

    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (categoryId) params.append('categoryId', categoryId.toString());
    if (producerId) params.append('producerId', producerId.toString());
    if (minPrice) params.append('minPrice', minPrice.toString());
    if (maxPrice) params.append('maxPrice', maxPrice.toString());
    if (inStockOnly) params.append('inStockOnly', 'true');
    if (discountOnly) params.append('discountOnly', 'true');
    params.append('sortBy', sortBy);
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const res = await fetch(`${BASE_URL}/api/search?${params}`);
    
    if (!res.ok) {
      throw new Error(`Search failed: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error('Advanced search error:', error);
    throw error;
  }
}

/**
 * Get search count (for shop page total count)
 */
export async function getSearchCount(query, categoryId = '') {
  try {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (categoryId) params.append('categoryId', categoryId.toString());
    params.append('limit', '1');

    const res = await fetch(`${BASE_URL}/api/search?${params}`);
    
    if (!res.ok) {
      console.error('Search count failed:', res.statusText);
      return 0;
    }

    const data = await res.json();
    return data.totalHits || 0;
  } catch (error) {
    console.error('Search count error:', error);
    return 0;
  }
}

/**
 * Get search suggestions for autocomplete
 */
export async function getSearchSuggestions(query, limit = 5) {
  try {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const params = new URLSearchParams({
      q: query.trim(),
      limit: limit.toString(),
    });

    const res = await fetch(`${BASE_URL}/api/search/suggestions?${params}`);
    
    if (!res.ok) {
      console.error('Suggestions failed:', res.statusText);
      return [];
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Suggestions error:', error);
    return [];
  }
}
