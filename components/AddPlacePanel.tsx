"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";

export default function AddPlacePanel() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    selectedCoords,
    userLocation,
    places,
    setPlaces,
    setShowMap,
    setSelectedCoords,
    setShowPlacesPanel,
  } = useAppStore();

  const [name, setName] = useState("");

  if (!mounted) return null; // 🔥 prevents hydration mismatch

  function addPlace() {
    const coords = selectedCoords || userLocation;
    if (!coords || !name.trim()) return;

    const newPlace = {
      name,
      lat: coords[0],
      lng: coords[1],
      accessible: true,
    };

    setPlaces([...places, newPlace]);
    setName("");
    setSelectedCoords(null);
    setShowMap(true);
    setShowPlacesPanel(false);
  }

  function clearAll() {
    localStorage.removeItem("places");
    setPlaces([]);
  }

  return (
    <div className="fixed top-6 right-6 z-30 glass p-5 w-[300px] text-white shadow-xl">
      <h2 className="text-lg font-bold mb-3">
        ➕ Add Accessible Place
      </h2>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter place name"
        autoComplete="off"
        spellCheck={false}
        className="w-full p-2 rounded-lg bg-white/10 outline-none mb-3"
      />

      <button
        onClick={addPlace}
        className="w-full bg-green-500 hover:bg-green-600 p-2 rounded-lg"
      >
        Add Place
      </button>

      <button
        onClick={clearAll}
        className="w-full mt-2 bg-red-500 hover:bg-red-600 p-2 rounded-lg"
      >
        Clear All Places
      </button>

      <p className="text-xs text-gray-400 mt-2">
        Click map → then add
      </p>
    </div>
  );
}