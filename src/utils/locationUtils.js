/**
 * Get user's location coordinates
 * Priority: 1. Default address (if logged in), 2. Browser location from localStorage
 * @returns {Promise<{latitude: number, longitude: number} | null>}
 */
export async function getUserLocation() {
  const token = localStorage.getItem("token");
  
  // If user is logged in, try to get default address location
  if (token) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/location`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.location) {
          return data.location;
        }
      }
    } catch (error) {
      console.error("Error fetching user location from default address:", error);
    }
  }
  
  // Fallback to browser location from localStorage
  const storedLocation = localStorage.getItem("userLocation");
  if (storedLocation) {
    try {
      const location = JSON.parse(storedLocation);
      return {
        latitude: location.latitude,
        longitude: location.longitude,
      };
    } catch (error) {
      console.error("Error parsing stored location:", error);
    }
  }
  
  return null;
}

/**
 * Build query string with location parameters
 * @param {object} baseParams - Base query parameters
 * @returns {Promise<string>} Query string with location if available
 */
export async function buildQueryWithLocation(baseParams = {}) {
  const location = await getUserLocation();
  
  const params = { ...baseParams };
  if (location) {
    params.lat = location.latitude;
    params.lon = location.longitude;
  }
  
  return new URLSearchParams(params).toString();
}
