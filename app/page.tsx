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
import Header from "@/components/Header";
import { useAppStore } from "@/store/useAppStore";
import { AnimatePresence } from "framer-motion";
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
  const { showMap, showAssistantView } = useAppStore();
  const router = useRouter();

  return (
    <main className="h-screen w-screen relative overflow-hidden bg-black pt-16 md:pt-20">

      {/* 🧭 Branding Header */}
      <Header />

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

      {/* 🤖 Chat UI Panel */}
      <AIPanel />

      {/* 🌟 Assistant Full View Overlay */}
      <AnimatePresence>
        {showAssistantView && <AssistantView />}
      </AnimatePresence>

    </main>
  );
}