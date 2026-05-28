"use client";

import { useAppStore } from "@/store/useAppStore";
import { motion } from "framer-motion";

export default function Header() {
  const { 
    setShowAssistantView, 
    showAssistantView,
    userLocation,
    showMap,
    setShowMap
  } = useAppStore();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 md:h-20 bg-gradient-to-r from-white via-blue-50 to-sky-100/90 backdrop-blur-md border-b border-blue-200/50 shadow-[0_4px_30px_rgba(59,130,246,0.08)] flex items-center justify-between px-4 md:px-10 transition-all duration-300">
      
      {/* 🚀 Brand Logo & Name */}
      <div className="flex items-center gap-3">
        <motion.div 
          className="w-9 h-9 md:w-11 md:h-11 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
        >
          <span className="text-white text-lg md:text-xl font-bold">✨</span>
        </motion.div>
        
        <div className="flex flex-col">
          <h1 className="text-lg md:text-2xl font-space-grotesk font-black text-black tracking-wider uppercase leading-none select-none flex items-center gap-1.5">
            accessible <span className="text-blue-600 font-extrabold">ai</span>
          </h1>
          <p className="text-[10px] md:text-xs font-outfit text-gray-500 font-semibold tracking-wide uppercase mt-0.5 md:mt-1">
            Smart Inclusive Navigation
          </p>
        </div>
      </div>

      {/* 🧭 Header Operations */}
      <div className="flex items-center gap-2 md:gap-4">
        
        {/* GPS Live Badge */}
        <div className="hidden sm:flex items-center gap-2 bg-black/5 hover:bg-black/10 px-3 py-1.5 rounded-full border border-black/5 transition-all text-xs font-outfit text-slate-800 font-medium">
          <span className={`w-2 h-2 rounded-full ${userLocation ? "bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-yellow-500 animate-pulse"}`} />
          <span>{userLocation ? "GPS Connected" : "Locating..."}</span>
        </div>

        {/* View Mode Toggle (Map vs Globe) */}
        <button
          onClick={() => setShowMap(!showMap)}
          className="text-xs font-outfit font-semibold px-3 py-1.5 md:px-4 md:py-2 rounded-xl border border-black/10 bg-white/60 hover:bg-white text-slate-900 shadow-sm transition-all hover:scale-105"
        >
          {showMap ? "🌍 3D Globe" : "🗺 2D Map"}
        </button>

        {/* AI Assistant Button */}
        <motion.button
          onClick={() => setShowAssistantView(true)}
          whileHover={{
            scale: 1.05,
            boxShadow: "0px 8px 20px rgba(59, 130, 246, 0.25)"
          }}
          whileTap={{ scale: 0.95 }}
          className="bg-black text-white font-outfit font-bold text-xs md:text-sm py-2 px-4 md:py-2.5 md:px-6 rounded-xl shadow-md border border-white/10 flex items-center gap-2 transition-all hover:bg-slate-900 cursor-pointer"
        >
          <span className="text-blue-400 text-sm">🤖</span>
          <span>Open AI</span>
        </motion.button>
      </div>

    </header>
  );
}
