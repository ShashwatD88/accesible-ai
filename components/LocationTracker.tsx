"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";

export default function LocationTracker() {
  const setUserLocation = useAppStore((s) => s.setUserLocation);

  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [
          pos.coords.latitude,
          pos.coords.longitude,
        ];

        console.log("📍 Your location:", coords);
        setUserLocation(coords);
      },
      (err) => {
        console.error("Location error:", err);
      }
    );
  }, []);

  return null;
}