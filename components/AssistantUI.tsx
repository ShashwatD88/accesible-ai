"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { motion } from "framer-motion";

export default function AssistantUI() {
  const {
    intent,
    setShowMap,
    setPlaces,
    places,
    selectPlace,
    currentIndex,
    selectedPlace,
    setZoom,
    setPanMode,
    setShowPlacesPanel,
    userLocation,
    setSelectedCoords,
  } = useAppStore();

  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!intent) return;

    const data = intent.data;
    const action = data.action;

    console.log("🎯 ACTION:", action, data);

    // 🗺 MAP CONTROL
    if (action === "show_map") setShowMap(true);
    if (action === "hide_map") setShowMap(false);

    // 🔍 SEARCH WITH GEOCODING
    if (action === "search_place" && data.query) {
      setIsSearching(true);
      setShowPlacesPanel(true);
      
      // Use Nominatim OpenStreetMap API
      const searchUrl = new URL("https://nominatim.openstreetmap.org/search");
      searchUrl.searchParams.append("format", "json");
      searchUrl.searchParams.append("q", data.query);
      searchUrl.searchParams.append("limit", "5");
      
      // Prefer results near user if we have location
      if (userLocation) {
        searchUrl.searchParams.append("lat", userLocation[0].toString());
        searchUrl.searchParams.append("lon", userLocation[1].toString());
      }

      fetch(searchUrl.toString())
        .then(res => res.json())
        .then(results => {
          if (results && results.length > 0) {
            const newPlaces = results.map((r: any) => ({
              name: r.display_name.split(",")[0],
              lat: parseFloat(r.lat),
              lng: parseFloat(r.lon),
              accessible: true // Assume accessible for now or add toggle
            }));
            setPlaces([...places, ...newPlaces]);
            // Fly to the first result
            setSelectedCoords([parseFloat(results[0].lat), parseFloat(results[0].lon)]);
            setShowMap(true);
          }
        })
        .catch(err => console.error("Geocoding failed", err))
        .finally(() => setIsSearching(false));
    }

    // 🚀 FLY TO
    if (action === "fly_to" && data.lat !== undefined && data.lng !== undefined) {
      setSelectedCoords([data.lat, data.lng]);
      if (data.zoom) setZoom(data.zoom);
      setShowMap(true);
    }

    // 🔥 ZOOM
    if (action === "zoom_in") {
      setZoom((z) => Math.min(z + (data.zoom || 1), 18));
    }

    if (action === "zoom_out") {
      setZoom((z) => Math.max(z - (data.zoom || 1), 5));
    }

    // 🔥 PAN
    if (action === "pan") {
      if (data.panDirection) {
        setPanMode(data.panDirection);
      }
    }
    
    if (action === "stop_pan") setPanMode(null);

    // 📍 SELECT
    if (action === "select_place") {
      if (places.length > 0) {
        const place = places[currentIndex];
        selectPlace(place);
        setShowMap(true);
      }
    }
  }, [intent?.time]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="fixed bottom-6 right-6 z-20"
    >
      <div className="glass p-5 w-[280px] text-white shadow-2xl rounded-2xl border border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
          <h1 className="text-lg font-bold">🤖 Assistant</h1>
        </div>

        <p className="mt-2 text-sm text-gray-200">
          {intent ? intent.data.message || `Action: ${intent.data.action}` : "Listening..."}
        </p>

        {isSearching && (
          <p className="mt-2 text-xs text-blue-300 animate-pulse">
            🔍 Searching real-world data...
          </p>
        )}

        {selectedPlace && (
          <div className="mt-3 p-2 bg-white/10 rounded-lg">
            <p className="text-green-400 text-xs font-semibold">
              📍 {selectedPlace.name}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}