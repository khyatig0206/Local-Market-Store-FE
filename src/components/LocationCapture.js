"use client";

import { useEffect } from "react";

export default function LocationCapture() {
  useEffect(() => {
    // Check if location is already captured
    const storedLocation = localStorage.getItem("userLocation");
    
    if (!storedLocation) {
      // Request geolocation from browser
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              timestamp: Date.now(),
            };
            localStorage.setItem("userLocation", JSON.stringify(location));
            console.log("User location captured:", location);
          },
          (error) => {
            console.warn("Geolocation error:", error.message);
            // Don't save anything if user denies or error occurs
          },
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 3600000, // 1 hour cache
          }
        );
      }
    }
  }, []);

  return null; // This component doesn't render anything
}
