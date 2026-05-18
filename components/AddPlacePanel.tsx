"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";

export default function AddPlacePanel() {
  const [mounted, setMounted] = useState(false);
  const [added, setAdded] = useState(false);
  const [collapsed, setCollapsed] = useState(true); // Collapsed by default on mobile

  useEffect(() => {
    setMounted(true);
    // Auto-expand on desktop
    if (window.innerWidth >= 768) setCollapsed(false);
  }, []);

  const {
    selectedCoords,
    userLocation,
    places,
    setPlaces,
    setShowMap,
    setSelectedCoords,
  } = useAppStore();

  const [name, setName] = useState("");

  if (!mounted) return null;

  const coordsToUse = selectedCoords || userLocation;

  function addPlace() {
    if (!coordsToUse || !name.trim()) return;
    const newPlace = {
      name: name.trim(),
      lat: coordsToUse[0],
      lng: coordsToUse[1],
      accessible: true,
    };
    setPlaces([...places, newPlace]);
    setName("");
    setSelectedCoords(null);
    setShowMap(true);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function clearAll() {
    if (confirm("Clear all saved places?")) {
      localStorage.removeItem("places");
      setPlaces([]);
    }
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 md:left-6 z-30">
      {/* Toggle button (visible on mobile) */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="md:hidden mb-2 bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-lg"
      >
        {collapsed ? "➕ Add Place" : "✕ Close"}
      </button>

      {/* Full Panel */}
      {!collapsed && (
        <div className="glass p-4 md:p-5 w-[260px] md:w-[280px] text-white shadow-2xl rounded-2xl border border-white/10 backdrop-blur-md">
          <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
            ➕ Add Accessible Place
          </h2>

          <p className="text-xs text-gray-400 mb-2">
            {selectedCoords
              ? `📍 Map click: ${selectedCoords[0].toFixed(4)}, ${selectedCoords[1].toFixed(4)}`
              : userLocation
              ? `📡 Your location: ${userLocation[0].toFixed(4)}, ${userLocation[1].toFixed(4)}`
              : "⚠️ No location — click map first"}
          </p>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addPlace()}
            placeholder="Enter place name..."
            autoComplete="off"
            spellCheck={false}
            className="w-full p-2.5 rounded-xl bg-white/10 outline-none mb-3 border border-white/10 focus:border-pink-400 text-sm placeholder:text-gray-500 transition-colors"
          />

          <button
            onClick={addPlace}
            disabled={!coordsToUse || !name.trim()}
            className="w-full bg-pink-500 hover:bg-pink-600 disabled:opacity-40 disabled:cursor-not-allowed p-2.5 rounded-xl font-semibold text-sm transition-all"
          >
            {added ? "✅ Place Added!" : "Add Place"}
          </button>

          <button
            onClick={clearAll}
            className="w-full mt-2 bg-white/10 hover:bg-red-500/60 p-2 rounded-xl text-xs transition-all"
          >
            🗑 Clear All ({places.length})
          </button>
        </div>
      )}
    </div>
  );
}