"use client";

import dynamic from "next/dynamic";
import VoiceInput from "@/components/VoiceInput";
import AssistantUI from "@/components/AssistantUI";
import LocationTracker from "@/components/LocationTracker";
import PlacesPanel from "@/components/PlacesPanel";
import AddPlacePanel from "@/components/AddPlacePanel";
import HandGestureControl from "@/components/HandGestureControl";

// 🌍 Background rotating map
const BackgroundMap = dynamic(
  () => import("@/components/BackgroundMap"),
  { ssr: false }
);

// 🗺 Main interactive map
const MapView = dynamic(
  () => import("@/components/MapView"),
  { ssr: false }
);

export default function Home() {
  return (
    <main className="h-screen w-screen relative overflow-hidden bg-black">

      {/* 📍 Track user location */}
      <LocationTracker />

      {/* 🌍 Background visual */}
      <BackgroundMap />

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

    </main>
  );
}