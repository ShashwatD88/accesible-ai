"use client";

import { useAppStore } from "@/store/useAppStore";
import { getDistance, formatDistance } from "@/lib/distance";
import { motion, AnimatePresence } from "framer-motion";

export default function PlacesPanel() {
  const {
    places,
    userLocation,
    selectPlace,
    setShowMap,
    showPlacesPanel,
    setPlaces,
    setShowPlacesPanel: closePanel
  } = useAppStore();

  // 🔥 attach distance
  const placesWithDistance = userLocation 
    ? places.map((p) => ({
        ...p,
        distance: getDistance(
          userLocation[0],
          userLocation[1],
          p.lat,
          p.lng
        ),
      }))
    : places.map((p) => ({ ...p, distance: 0 }));

  // 🔥 sort nearest first
  placesWithDistance.sort((a, b) => a.distance - b.distance);

  const nearest = placesWithDistance[0];

  function deletePlace(index: number) {
    const updated = places.filter((_, i) => i !== index);
    setPlaces(updated);
  }

  return (
    <AnimatePresence>
      {showPlacesPanel && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 backdrop-blur-sm font-outfit"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="glass w-[360px] p-6 rounded-3xl text-white shadow-2xl relative border border-white/10"
          >
            <button 
              onClick={() => closePanel(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors w-7 h-7 flex items-center justify-center"
            >
              ✕
            </button>

            <h2 className="text-xl font-space-grotesk font-black tracking-wide mb-4 flex items-center gap-2">
              <span className="text-2xl">📍</span> Nearby Places
            </h2>

            {userLocation && (
              <p className="text-xs text-blue-300 mb-4 bg-blue-500/10 p-2 rounded-lg inline-block border border-blue-500/20">
                📍 {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}
              </p>
            )}

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {placesWithDistance.map((place, index) => {
                const isNearest = place === nearest && userLocation;

                return (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={index}
                    className={`p-3.5 rounded-xl flex justify-between items-center transition-all hover:bg-white/15 border ${
                      isNearest
                        ? "bg-green-500/10 border-green-500/40 shadow-[0_0_15px_rgba(34,197,94,0.15)]"
                        : "bg-white/5 border-white/5"
                    }`}
                  >
                    <div
                      onClick={() => {
                        selectPlace(place);
                        setShowMap(true);
                      }}
                      className="cursor-pointer flex-1"
                    >
                      <p className="font-semibold text-sm">
                        {place.name} {isNearest && "⭐"}
                      </p>

                      <p className="text-xs text-blue-300 mt-1">
                        {userLocation ? formatDistance(place.distance) : ""}
                      </p>

                      <p className="text-[10px] text-green-400 mt-1.5 uppercase tracking-wider font-bold">
                        ♿ Accessible ✔
                      </p>
                    </div>

                    {/* ❌ DELETE */}
                    <button
                      onClick={() => deletePlace(index)}
                      className="text-red-400/60 hover:text-red-400 text-sm hover:scale-110 p-2 transition-transform cursor-pointer"
                    >
                      ✕
                    </button>
                  </motion.div>
                );
              })}

              {places.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">
                  No places found. Ask the Assistant to search!
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}