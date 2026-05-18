"use client";

import dynamic from "next/dynamic";
import VoiceInput from "@/components/VoiceInput";
import AssistantUI from "@/components/AssistantUI";
import LocationTracker from "@/components/LocationTracker";
import PlacesPanel from "@/components/PlacesPanel";
import AddPlacePanel from "@/components/AddPlacePanel";
import HandGestureControl from "@/components/HandGestureControl";
import AIPanel from "@/components/AIPanel";
import AssistantView from "@/components/AssistantView";
import { useAppStore } from "@/store/useAppStore";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

// 🌍 3D Rotating Earth Background
const Globe3D = dynamic(
  () => import("@/components/Globe3D"),
  { ssr: false }
);

// 🗺 Main interactive map
const MapView = dynamic(
  () => import("@/components/MapView"),
  { ssr: false }
);

export default function Home() {
  const { showAIPanel, setShowAIPanel, showMap, showAssistantView, setShowAssistantView } = useAppStore();
  const router = useRouter();

  return (
    <main className="h-screen w-screen relative overflow-hidden bg-black">

      {/* 📍 Track user location */}
      <LocationTracker />

      {/* 🌍 Live 3D Earth Background (Visible when 2D map is hidden) */}
      {!showMap && <Globe3D />}

      {/* 🎙 Voice + Assistant UI */}
      <div className="relative z-10">
        <VoiceInput />
        <AssistantUI />
        <HandGestureControl />
      </div>

      {/* ➕ Add place UI (always visible) */}
      <AddPlacePanel />

      {/* 📍 Popup for nearby places */}
      <PlacesPanel />

      {/* 🗺 Actual map */}
      <MapView />

      {/* 🤖 AI Assistant Button — top-left on desktop, bottom-center on mobile */}
      <div
        className="fixed z-40 bottom-6 left-1/2 -translate-x-1/2 md:bottom-auto md:top-6 md:left-6 md:translate-x-0"
        style={{ perspective: "1000px" }}
      >
        <motion.button
          onClick={() => setShowAssistantView(true)}
          whileHover={{
            scale: 1.05,
            rotateX: 15,
            rotateY: -15,
            boxShadow: "0px 15px 30px rgba(59, 130, 246, 0.4)"
          }}
          whileTap={{ scale: 0.95, rotateX: 0, rotateY: 0 }}
          style={{ transformStyle: "preserve-3d" }}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 px-6 rounded-2xl shadow-xl flex items-center gap-3 border border-white/20 transition-colors whitespace-nowrap"
        >
          <span className="text-xl">✨</span>
          <span>AI Assistant</span>
        </motion.button>
      </div>

      {/* 🤖 Chat UI Panel */}
      <AIPanel />

      {/* 🌟 Assistant Full View Overlay */}
      <AnimatePresence>
        {showAssistantView && <AssistantView />}
      </AnimatePresence>

    </main>
  );
}