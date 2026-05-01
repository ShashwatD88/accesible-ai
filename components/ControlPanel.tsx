"use client";

import { useAppStore } from "@/store/useAppStore";
import { speak } from "@/lib/speak"; // ✅ GLOBAL SPEECH

export default function ControlPanel() {
  const {
    setShowMap,
    setZoom,
    setIntent,
    setPanMode,
    userLocation,
    setPlaces,
  } = useAppStore();

  function addPlace() {
    if (!userLocation) {
      speak("Location not available");
      return;
    }

    const newPlace = {
      name: "Accessible Spot",
      lat: userLocation[0] + Math.random() * 0.002,
      lng: userLocation[1] + Math.random() * 0.002,
      accessible: true,
    };

    setPlaces([newPlace]);
    speak("Accessible place added");
  }

  return (
    <div className="fixed top-6 left-6 z-20 glass p-5 w-[260px] space-y-4 text-white shadow-xl">

      {/* Title */}
      <h2 className="text-lg font-bold gradient-text">
        🎛 Control Panel
      </h2>

      {/* Open Map */}
      <button
        onClick={() => {
          setShowMap(true);
          speak("Opening map");
        }}
        className="button bg-blue-500 w-full hover:shadow-lg"
      >
        🗺 Open Map
      </button>

      {/* Zoom */}
      <div className="flex gap-2">
        <button
          onClick={() =>
            setZoom((z: number) => Math.min(z + 1, 18))
          }
          className="button bg-green-500 flex-1 hover:scale-105"
        >
          🔍 +
        </button>

        <button
          onClick={() =>
            setZoom((z: number) => Math.max(z - 1, 5))
          }
          className="button bg-red-500 flex-1 hover:scale-105"
        >
          🔍 -
        </button>
      </div>

      {/* Pan */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            setPanMode("left");
            speak("Moving left");
          }}
          className="button bg-yellow-500 flex-1"
        >
          ⬅ Left
        </button>

        <button
          onClick={() => {
            setPanMode("right");
            speak("Moving right");
          }}
          className="button bg-yellow-500 flex-1"
        >
          Right ➡
        </button>
      </div>

      {/* Stop */}
      <button
        onClick={() => {
          setPanMode(null);
          speak("Stopped");
        }}
        className="button bg-gray-600 w-full"
      >
        ⛔ Stop
      </button>

      {/* Search */}
      <button
        onClick={() => {
          setIntent("find_accessible_places");
          speak("Searching accessible places");
        }}
        className="button bg-purple-500 w-full"
      >
        🍽 Find Places
      </button>

      {/* Add Place */}
      <button
        onClick={addPlace}
        className="button bg-pink-500 w-full pulse"
      >
        ➕ Add Accessible Place
      </button>
    </div>
  );
}